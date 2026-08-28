#!/usr/bin/env python3
"""S.H.I.O.K. task runner (cross-platform replacement for make).

Usage: uv run python run.py <task> [options]

Safe reports:
  check --freshness-only | check --geospatial-discovery-only | universe-status | p19-gap-status | p19-mcst-locations | p125-osm-status | network-qa | network-preflight | readiness | readiness --gate-summary | batch-plan | validate
  check --freshness-only reads raw/manifest.json only; it probes no upstream URLs, writes no manifest, groups action summaries with source names, and says stale sources require a versioned refresh.
  check --geospatial-discovery-only probes DataMall discovery metadata only; it downloads no payloads, writes no manifest, and treats changed discovery URLs as new-version inputs.
  p19-gap-status reads cached P19 v2 28 Aug 2026 public-source sample status, evidence split, missing rows, P19 v2 Overpass coverage, MCST proxy probe and cache ages only; it calls no APIs and writes no files.
  p19-mcst-locations reads existing P379 status for unvalidated P19 MCST proxy rows only; it calls no APIs and writes no files.
  p125-osm-status reads older cached P125 20 Aug 2026 Overpass addr:postcode coverage cross-check and frozen v1 universe only, reporting OSM as geometry evidence rather than the address registry; it calls no APIs and writes no files.
  universe-status consolidates the cached P19 v2 postal-universe and Overpass measurements without APIs or writes; P125 remains a separate historical safe report. It is evidence for sizing v1 gaps, not approval to build or promote v2.
  network-qa validates existing conflation QA/debug artifacts and writes no repo files.
  network-preflight reads/hashes existing manifest, raw, processed and QA artifacts, may inspect geometry, and writes no repo files or network artifacts.
  readiness validates the published shelter-map bundle and release gates without scoring or deploying.
  readiness --gate-summary prints the same release gate verdict and warnings without the full nested report.
  batch-plan dry-runs one-attempt full-batch prerequisites and policy status without scoring; execution still requires owner approval and bounded OneMap controls.
  validate reads and validates an existing static bundle without writing, scoring, exporting or deploying.

Gated pipeline tasks:
  ingest | lamp-overlay | network | network-debug | score | score-batch | export | export-transit | refresh-provenance | publish | onemap-probe | onemap-validation collect | onemap-outlier-replay | onemap-outlier-triage | overture-addresses | compare-targeted | geocode-universe
  ingest mutates raw/ and raw/manifest.json; through run.py it requires --confirm-input-refresh, and any refresh must write a new numbered input version rather than repair frozen v1.
  lamp-overlay writes a compact lamp-post artifact directory from existing raw data; it requires explicit --output and --confirm-lamp-overlay.
  network writes processed network artifacts and QA outputs; it requires --confirm-network-build after owner approval.
  network-debug writes compact network debug GeoJSON; it requires explicit --output and --confirm-network-debug.
  score runs routed scoring even at its default limit; it requires --confirm-score-run after owner approval.
  score-batch runs routed scoring for non-dry limited batches; it requires --confirm-score-batch-run unless --full-batch uses --confirm-full-batch.
  export can re-export --records-dir without scoring; every export requires --confirm-export and live scoring export also requires --confirm-live-score-export.
  export-transit writes transit POI artifacts; it requires explicit --output and --confirm-export.
  refresh-provenance is fail-closed; it requires explicit --output and --confirm-refresh-provenance.
  onemap-probe is a network-heavy OneMap rate probe; it requires explicit --output and --confirm-onemap-probe.
  onemap-validation collect calls OneMap; it requires explicit --output and --confirm-onemap-collection.
  onemap-outlier-replay writes a replay report after local outlier scoring; it requires explicit --output and --confirm-outlier-replay.
  onemap-outlier-triage writes QA queues; it requires explicit output paths and --confirm-outlier-triage.
  overture-addresses can read remote Overture data and write candidate evidence; it requires --confirm-overture-addresses.
  compare-targeted writes targeted score comparison reports; it requires explicit --output and --confirm-compare-targeted.
  postal-universe writes a new postal-universe parquet and summary, and --download-missing can fetch source inputs; it requires --confirm-postal-universe.
  geocode-universe can call OneMap and write a bounded geocode-fill parquet, summary, and cache; non-dry runs require --confirm-bounded-geocode, fresh numeric-version outputs, and an explicitly versioned geocode cache.
  publish deploys the static bundle; it requires --confirm-publish after owner approval.

`publish` ALWAYS runs `validate` first — this gate is hard-coded and must never be removed.
"""

import argparse
import os
import subprocess
import sys

from dotenv import load_dotenv

load_dotenv()

SAFE_CHECK_FLAGS = {"--freshness-only", "--geospatial-discovery-only"}
INPUT_REFRESH_CONFIRM_FLAG = "--confirm-input-refresh"
LAMP_OVERLAY_CONFIRM_FLAG = "--confirm-lamp-overlay"
NETWORK_BUILD_CONFIRM_FLAG = "--confirm-network-build"
SCORE_RUN_CONFIRM_FLAG = "--confirm-score-run"
SCORE_BATCH_CONFIRM_FLAG = "--confirm-score-batch-run"
FULL_BATCH_CONFIRM_FLAG = "--confirm-full-batch"
EXPORT_CONFIRM_FLAG = "--confirm-export"
REFRESH_PROVENANCE_CONFIRM_FLAG = "--confirm-refresh-provenance"
PUBLISH_CONFIRM_FLAG = "--confirm-publish"
ONEMAP_PROBE_CONFIRM_FLAG = "--confirm-onemap-probe"
BOUNDED_GEOCODE_CONFIRM_FLAG = "--confirm-bounded-geocode"
BUS_ARRIVALS_CONFIRM_FLAG = "--confirm-bus-arrivals"
BUS_CONNECTOR_DIAGNOSTICS_CONFIRM_FLAG = "--confirm-bus-connector-diagnostics"
CANDIDATE_AUDIT_CONFIRM_FLAG = "--confirm-candidate-audit"
POSTAL_UNIVERSE_CONFIRM_FLAG = "--confirm-postal-universe"
NETWORK_DEBUG_CONFIRM_FLAG = "--confirm-network-debug"
ONEMAP_COLLECTION_CONFIRM_FLAG = "--confirm-onemap-collection"
OUTLIER_REPLAY_CONFIRM_FLAG = "--confirm-outlier-replay"
OUTLIER_TRIAGE_CONFIRM_FLAG = "--confirm-outlier-triage"
OVERTURE_ADDRESSES_CONFIRM_FLAG = "--confirm-overture-addresses"
COMPARE_TARGETED_CONFIRM_FLAG = "--confirm-compare-targeted"

STUBS = {
    "check": "refuses bare upstream checks; use --freshness-only or --geospatial-discovery-only for zero-mutation reports",
    "ingest": "download changed sources to raw/ (T0.3); run.py requires --confirm-input-refresh",
    "lamp-overlay": "build compact lamp-post overlay artifact from existing raw source; requires explicit --output and --confirm-lamp-overlay",
    "network": "build conflated graph + QA report (T1.1); requires --confirm-network-build",
    "network-debug": "rebuild compact network debug GeoJSON from QA JSON; requires --confirm-network-debug",
    "network-preflight": "verify network build inputs without building graph",
    "network-qa": "validate conflation QA report acceptance gates",
    "onemap-validation": "plan/evaluate OneMap validation reports; collect requires --confirm-onemap-collection",
    "onemap-probe": "network-heavy OneMap rate probe; requires explicit --output and --confirm-onemap-probe",
    "onemap-outlier-replay": "replay OneMap validation outliers through current local scoring; requires --confirm-outlier-replay",
    "onemap-outlier-triage": "build QA queues from profiled OneMap outlier replays; requires --confirm-outlier-triage",
    "overture-addresses": "probe Overture Addresses SG as candidate-only postal-universe evidence; requires --confirm-overture-addresses",
    "p19-gap-status": "read-only status, evidence split, missing rows, P19 v2 Overpass coverage, MCST proxy probe and cache ages for cached P19 v2 28 Aug 2026 public-source sample",
    "p19-mcst-locations": "read-only status for the cached P379 OneMap location probe of unvalidated P19 MCST proxy rows",
    "p125-osm-status": "read-only status for older cached P125 20 Aug 2026 Overpass addr:postcode coverage cross-check and registry policy",
    "universe-status": "read-only consolidated status for cached P19 v2 postal-universe and Overpass measurements; P125 is historical",
    "readiness": "fast production-readiness report without scoring or deploying; use --gate-summary for concise release-gate output",
    "refresh-provenance": "fail-closed manifest provenance refresh; requires explicit --output and --confirm-refresh-provenance",
    "score": "apply pipeline/config/weights.yaml (T1.4); requires --confirm-score-run",
    "score-batch": "resumable postal scoring batch runner; non-dry limited runs require explicit --output-dir and --confirm-score-batch-run",
    "bus-arrivals": "collect local LTA bus-arrival snapshots for future reliability scoring; requires explicit --output and --confirm-bus-arrivals",
    "bus-connector-diagnostics": "diagnose priority OneMap missing-bus connector cases; requires --confirm-bus-connector-diagnostics",
    "candidate-audit": "audit ranked MRT/LRT and bus candidates for selected postals; requires --confirm-candidate-audit",
    "compare-targeted": "compare a targeted score report against the published shelter-map bundle; requires --confirm-compare-targeted",
    "batch-plan": "dry-run one-attempt full postal geocode/scoring batch plan; execution still requires owner approval and bounded OneMap controls",
    "postal-universe": "build deterministic postal-code universe candidates; requires --confirm-postal-universe",
    "geocode-universe": "bounded OneMap geocode fill for source-derived postal gaps; non-dry runs require fresh numeric-version outputs and an explicitly versioned geocode cache",
    "export": "scores/{area}.json + geom/h3/{cell}.json + manifest (T1.5); requires --confirm-export, and live scoring requires --confirm-live-score-export",
    "export-transit": "refresh transit POIs without rescoring; requires explicit --output and --confirm-export",
    "validate": "read-only static bundle validation; blocks publish (T1.7)",
    "publish": "vercel deploy --prod --archive=tgz (only deploy path); requires --confirm-publish",
    "test": "pytest (T0.1)",
    "shell": "not needed on native Windows; use your activated venv",
}


def subprocess_env() -> dict[str, str]:
    env = os.environ.copy()
    env["PYTHONHASHSEED"] = "0"
    return env


def wants_help(extra: list[str]) -> bool:
    return "-h" in extra or "--help" in extra


def require_runner_flag(
    *,
    extra: list[str],
    flag: str,
    message: str,
) -> bool:
    if wants_help(extra) or flag in extra:
        return True
    print(message, file=sys.stderr)
    return False


def run_task(name: str, extra: list[str]) -> int:
    def run_module(
        module: str,
        module_args: list[str] | None = None,
        extra_args: list[str] | None = None,
    ) -> int:
        forwarded_extra = extra if extra_args is None else extra_args
        cmd = [sys.executable, "-m", module] + (module_args or []) + forwarded_extra
        return subprocess.run(cmd, check=False, env=subprocess_env()).returncode

    if name == "batch-plan":
        return run_module("pipeline.batch_plan")
    if name == "test":
        return run_module("pytest")
    if name == "check":
        if "-h" in extra or "--help" in extra:
            return run_module("pipeline.fetch", [name])
        safe_flags = [flag for flag in extra if flag in SAFE_CHECK_FLAGS]
        if len(safe_flags) != 1:
            print(
                "run.py check requires exactly one safe report flag: "
                "--freshness-only or --geospatial-discovery-only. "
                "Bare check probes upstream URLs and is not a zero-mutation report; "
                "invoke `uv run python -m pipeline.fetch check` directly only when an "
                "explicit network/hash probe is intended.",
                file=sys.stderr,
            )
            return 2
        return run_module("pipeline.fetch", [name])
    if name == "ingest":
        if INPUT_REFRESH_CONFIRM_FLAG not in extra:
            print(
                "run.py ingest mutates raw/ and raw/manifest.json; pass "
                "--confirm-input-refresh only after approval to create a new numbered "
                "input version. Do not use ingest to repair frozen-v1 hash mismatches.",
                file=sys.stderr,
            )
            return 2
        return run_module("pipeline.fetch", [name])
    if name == "lamp-overlay":
        if LAMP_OVERLAY_CONFIRM_FLAG not in extra:
            print(
                "run.py lamp-overlay writes a compact lamp-post artifact directory; pass "
                "--confirm-lamp-overlay only after approval to create a new versioned "
                "lamp overlay output. Do not overwrite existing public-data artifacts.",
                file=sys.stderr,
            )
            return 2
        return run_module("pipeline.lamp_overlay")
    if name == "network":
        if not require_runner_flag(
            extra=extra,
            flag=NETWORK_BUILD_CONFIRM_FLAG,
            message=(
                "run.py network builds processed network artifacts and QA outputs; pass "
                "--confirm-network-build only after owner approval."
            ),
        ):
            return 2
        return run_module("pipeline.network")
    if name == "network-debug":
        if not require_runner_flag(
            extra=extra,
            flag=NETWORK_DEBUG_CONFIRM_FLAG,
            message=(
                "run.py network-debug writes compact network debug GeoJSON; pass "
                "--confirm-network-debug only after approval and with explicit --output."
            ),
        ):
            return 2
        return run_module("scripts.rebuild_network_debug")
    if name == "network-preflight":
        return run_module("pipeline.network_preflight")
    if name == "network-qa":
        return run_module("pipeline.network_qa")
    if name == "onemap-validation":
        if extra and extra[0] == "collect" and not require_runner_flag(
            extra=extra,
            flag=ONEMAP_COLLECTION_CONFIRM_FLAG,
            message=(
                "run.py onemap-validation collect calls OneMap; pass "
                "--confirm-onemap-collection only after approval and with explicit --output."
            ),
        ):
            return 2
        return run_module("pipeline.onemap_validation")
    if name == "onemap-probe":
        if not require_runner_flag(
            extra=extra,
            flag=ONEMAP_PROBE_CONFIRM_FLAG,
            message=(
                "run.py onemap-probe calls the OneMap API; pass --confirm-onemap-probe "
                "only after approval and with an explicit --output."
            ),
        ):
            return 2
        return run_module("pipeline.probe_onemap")
    if name == "onemap-outlier-replay":
        if not require_runner_flag(
            extra=extra,
            flag=OUTLIER_REPLAY_CONFIRM_FLAG,
            message=(
                "run.py onemap-outlier-replay writes a replay report after local outlier "
                "scoring; pass --confirm-outlier-replay only after approval and with explicit --output."
            ),
        ):
            return 2
        return run_module("scripts.replay_onemap_outliers")
    if name == "onemap-outlier-triage":
        if not require_runner_flag(
            extra=extra,
            flag=OUTLIER_TRIAGE_CONFIRM_FLAG,
            message=(
                "run.py onemap-outlier-triage writes QA queues; pass "
                "--confirm-outlier-triage only after approval and with explicit output paths."
            ),
        ):
            return 2
        forwarded = [arg for arg in extra if arg != OUTLIER_TRIAGE_CONFIRM_FLAG]
        return run_module("scripts.triage_onemap_outliers", extra_args=forwarded)
    if name == "overture-addresses":
        if not require_runner_flag(
            extra=extra,
            flag=OVERTURE_ADDRESSES_CONFIRM_FLAG,
            message=(
                "run.py overture-addresses can read remote Overture data and write "
                "candidate evidence; pass --confirm-overture-addresses only after approval."
            ),
        ):
            return 2
        return run_module("pipeline.overture_addresses")
    if name == "p19-gap-status":
        return run_module("scripts.analysis.p19_universe_gap_measurement", ["--cache-status-only"])
    if name == "p19-mcst-locations":
        return run_module("scripts.analysis.p19_mcst_missing_locations", ["--cache-status-only"])
    if name == "p125-osm-status":
        return run_module("scripts.analysis.p125_osm_postcode_status")
    if name == "universe-status":
        return run_module("scripts.analysis.universe_measurement_status")
    if name == "readiness":
        return run_module("scripts.production_readiness")
    if name == "refresh-provenance":
        if not require_runner_flag(
            extra=extra,
            flag=REFRESH_PROVENANCE_CONFIRM_FLAG,
            message=(
                "run.py refresh-provenance mutates bundle provenance metadata; pass "
                "--confirm-refresh-provenance only after owner approval and with explicit --output."
            ),
        ):
            return 2
        return run_module("pipeline.export", ["refresh-provenance"])
    if name == "score":
        if not require_runner_flag(
            extra=extra,
            flag=SCORE_RUN_CONFIRM_FLAG,
            message=(
                "run.py score runs routed scoring even at default limits; pass "
                "--confirm-score-run only after owner approval."
            ),
        ):
            return 2
        return run_module("pipeline.scoring_integration")
    if name == "score-batch":
        if not wants_help(extra) and "--dry-run" not in extra:
            required_flag = FULL_BATCH_CONFIRM_FLAG if "--full-batch" in extra else SCORE_BATCH_CONFIRM_FLAG
            if required_flag not in extra:
                print(
                    "run.py score-batch runs routed scoring for non-dry batches; pass "
                    "--confirm-score-batch-run for limited batches or --confirm-full-batch "
                    "for full batches only after owner approval.",
                    file=sys.stderr,
                )
                return 2
        return run_module("pipeline.score_batch")
    if name == "bus-arrivals":
        if not require_runner_flag(
            extra=extra,
            flag=BUS_ARRIVALS_CONFIRM_FLAG,
            message=(
                "run.py bus-arrivals calls DataMall and appends local snapshot output; pass "
                "--confirm-bus-arrivals only after owner approval and with explicit --output."
            ),
        ):
            return 2
        return run_module("pipeline.bus_arrivals")
    if name == "bus-connector-diagnostics":
        if not require_runner_flag(
            extra=extra,
            flag=BUS_CONNECTOR_DIAGNOSTICS_CONFIRM_FLAG,
            message=(
                "run.py bus-connector-diagnostics writes diagnostic reports; pass "
                "--confirm-bus-connector-diagnostics only after owner approval."
            ),
        ):
            return 2
        return run_module("scripts.diagnose_bus_connectors")
    if name == "candidate-audit":
        if not require_runner_flag(
            extra=extra,
            flag=CANDIDATE_AUDIT_CONFIRM_FLAG,
            message=(
                "run.py candidate-audit writes candidate audit reports; pass "
                "--confirm-candidate-audit only after owner approval."
            ),
        ):
            return 2
        return run_module("scripts.audit_postal_candidates")
    if name == "compare-targeted":
        if not require_runner_flag(
            extra=extra,
            flag=COMPARE_TARGETED_CONFIRM_FLAG,
            message=(
                "run.py compare-targeted writes targeted score comparison reports; pass "
                "--confirm-compare-targeted only after approval and with explicit --output."
            ),
        ):
            return 2
        forwarded = [arg for arg in extra if arg != COMPARE_TARGETED_CONFIRM_FLAG]
        return run_module("scripts.compare_targeted_scores", extra_args=forwarded)
    if name == "postal-universe":
        if not require_runner_flag(
            extra=extra,
            flag=POSTAL_UNIVERSE_CONFIRM_FLAG,
            message=(
                "run.py postal-universe writes postal-universe parquet and summary "
                "artifacts; pass --confirm-postal-universe only after owner approval "
                "to create a new numeric-version universe."
            ),
        ):
            return 2
        forwarded = [arg for arg in extra if arg != POSTAL_UNIVERSE_CONFIRM_FLAG]
        return run_module("pipeline.postal_universe", extra_args=forwarded)
    if name == "geocode-universe":
        if not wants_help(extra) and "--dry-run" not in extra:
            if BOUNDED_GEOCODE_CONFIRM_FLAG not in extra:
                print(
                    "run.py geocode-universe can call OneMap and write bounded geocode "
                    "artifacts; pass --confirm-bounded-geocode only after owner approval.",
                    file=sys.stderr,
                )
                return 2
        return run_module("pipeline.geocode_universe", extra_args=extra)
    if name == "export":
        if not require_runner_flag(
            extra=extra,
            flag=EXPORT_CONFIRM_FLAG,
            message=(
                "run.py export writes a bundle directory; pass --confirm-export only "
                "after owner approval and with explicit --output."
            ),
        ):
            return 2
        return run_module("pipeline.export", ["export"])
    if name == "export-transit":
        if not require_runner_flag(
            extra=extra,
            flag=EXPORT_CONFIRM_FLAG,
            message=(
                "run.py export-transit writes transit artifacts; pass --confirm-export "
                "only after owner approval and with explicit --output."
            ),
        ):
            return 2
        return run_module("pipeline.export", ["export-transit"])
    if name == "validate":
        return run_module("pipeline.export", ["validate"])
    if name == "publish":
        if not require_runner_flag(
            extra=extra,
            flag=PUBLISH_CONFIRM_FLAG,
            message=(
                "run.py publish deploys the static bundle; pass --confirm-publish only "
                "after owner approval."
            ),
        ):
            return 2
        forwarded = [arg for arg in extra if arg != PUBLISH_CONFIRM_FLAG]
        return run_module("pipeline.publish", extra_args=forwarded)
    if name == "shell":
        print(f"not implemented: {name} — {STUBS[name]}")
        return 0

    print(f"not implemented: {name} — {STUBS[name]}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="run.py",
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("task", choices=sorted(STUBS), metavar="task")
    return parser


def main() -> int:
    parser = build_parser()
    args, extra = parser.parse_known_args()
    return run_task(args.task, extra)


if __name__ == "__main__":
    raise SystemExit(main())
