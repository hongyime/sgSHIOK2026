#!/usr/bin/env python3
"""S.H.I.O.K. task runner (cross-platform replacement for make).

Usage: uv run python run.py <task> [options]

Safe reports:
  check --freshness-only | check --geospatial-discovery-only | universe-status | p19-gap-status | p19-mcst-locations | p125-osm-status | readiness | readiness --gate-summary | batch-plan
  check --freshness-only reads raw/manifest.json only; it probes no upstream URLs, writes no manifest, groups action summaries with source names, and says stale sources require a versioned refresh.
  check --geospatial-discovery-only probes DataMall discovery metadata only; it downloads no payloads, writes no manifest, and treats changed discovery URLs as new-version inputs.
  p19-gap-status reads cached P19 16 Aug 2026 public-source sample status, evidence split, missing rows, MCST proxy probe and cache ages only; it calls no APIs and writes no files.
  p19-mcst-locations reads existing P379 status for unvalidated P19 MCST proxy rows only; it calls no APIs and writes no files.
  p125-osm-status reads cached P125 20 Aug 2026 Overpass addr:postcode coverage cross-check and frozen v1 universe only, reporting OSM as geometry evidence rather than the address registry; it calls no APIs and writes no files.
  universe-status consolidates the cached P19 and P125 postal-universe measurements without APIs or writes; it is evidence for sizing v1 gaps, not approval to build or promote v2.
  readiness validates the published shelter-map bundle and release gates without scoring or deploying.
  readiness --gate-summary prints the same release gate verdict and warnings without the full nested report.
  batch-plan dry-runs one-attempt full-batch prerequisites and policy status without scoring; execution still requires owner approval and bounded OneMap controls.

Gated pipeline tasks:
  ingest | lamp-overlay | network | score | score-batch | export | export-transit | refresh-provenance | validate | publish | onemap-probe
  ingest mutates raw/ and raw/manifest.json; through run.py it requires --confirm-input-refresh, and any refresh must write a new numbered input version rather than repair frozen v1.
  network writes processed network artifacts and QA outputs; it requires --confirm-network-build after owner approval.
  score runs routed scoring even at its default limit; it requires --confirm-score-run after owner approval.
  score-batch runs routed scoring for non-dry limited batches; it requires --confirm-score-batch-run unless --full-batch uses --confirm-full-batch.
  export can re-export --records-dir without scoring; live scoring export requires --confirm-live-score-export.
  refresh-provenance is fail-closed; direct pipeline.export invocation must name --output explicitly.
  onemap-probe is a network-heavy OneMap rate probe; it requires explicit --output and --confirm-onemap-probe.

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

STUBS = {
    "check": "refuses bare upstream checks; use --freshness-only or --geospatial-discovery-only for zero-mutation reports",
    "ingest": "download changed sources to raw/ (T0.3); run.py requires --confirm-input-refresh",
    "lamp-overlay": "build compact lamp-post overlay artifact from existing raw source",
    "network": "build conflated graph + QA report (T1.1); requires --confirm-network-build",
    "network-debug": "rebuild compact network debug GeoJSON from QA JSON",
    "network-preflight": "verify network build inputs without building graph",
    "network-qa": "validate conflation QA report acceptance gates",
    "onemap-validation": "plan/evaluate OneMap walk-routing launch validation gate",
    "onemap-probe": "network-heavy OneMap rate probe; requires explicit --output and --confirm-onemap-probe",
    "onemap-outlier-replay": "replay OneMap validation outliers through current local scoring",
    "onemap-outlier-triage": "build QA queues from profiled OneMap outlier replays",
    "overture-addresses": "probe Overture Addresses SG as candidate-only postal-universe evidence, not scoring or registry approval",
    "p19-gap-status": "read-only status, evidence split, missing rows, MCST proxy probe and cache ages for cached P19 16 Aug 2026 public-source sample",
    "p19-mcst-locations": "read-only status for the cached P379 OneMap location probe of unvalidated P19 MCST proxy rows",
    "p125-osm-status": "read-only status for cached P125 20 Aug 2026 Overpass addr:postcode coverage cross-check and registry policy",
    "universe-status": "read-only consolidated status for cached P19 and P125 postal-universe measurements",
    "readiness": "fast production-readiness report without scoring or deploying; use --gate-summary for concise release-gate output",
    "refresh-provenance": "fail-closed manifest provenance refresh; direct pipeline.export invocation must name --output explicitly",
    "score": "apply pipeline/config/weights.yaml (T1.4); requires --confirm-score-run",
    "score-batch": "resumable postal scoring batch runner; non-dry limited runs require explicit --output-dir and --confirm-score-batch-run",
    "bus-arrivals": "collect local LTA bus-arrival snapshots for future reliability scoring; requires explicit --output",
    "bus-connector-diagnostics": "diagnose priority OneMap missing-bus connector cases",
    "candidate-audit": "audit ranked MRT/LRT and bus candidates for selected postals",
    "compare-targeted": "compare a targeted score report against the published shelter-map bundle",
    "batch-plan": "dry-run one-attempt full postal geocode/scoring batch plan; execution still requires owner approval and bounded OneMap controls",
    "postal-universe": "build deterministic postal-code universe candidates",
    "geocode-universe": "bounded OneMap geocode fill for source-derived postal gaps; non-dry runs require fresh numeric-version outputs",
    "export": "scores/{area}.json + geom/h3/{cell}.json + manifest (T1.5); live scoring requires --confirm-live-score-export",
    "export-transit": "refresh transit POIs without rescoring",
    "validate": "golden set + OneMap comparison; blocks publish (T1.7)",
    "publish": "vercel deploy --prod --archive=tgz (only deploy path)",
    "test": "pytest (T0.1)",
    "shell": "not needed on native Windows; use your activated venv",
}


def subprocess_env() -> dict[str, str]:
    env = os.environ.copy()
    env["PYTHONHASHSEED"] = "0"
    return env


def run_task(name: str, extra: list[str]) -> int:
    def run_module(
        module: str,
        module_args: list[str] | None = None,
        extra_args: list[str] | None = None,
    ) -> int:
        cmd = [sys.executable, "-m", module] + (module_args or []) + (extra_args or extra)
        return subprocess.run(cmd, check=False, env=subprocess_env()).returncode

    if name == "batch-plan":
        return run_module("pipeline.batch_plan")
    if name == "publish":
        return run_module("pipeline.publish")
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
        forwarded = [arg for arg in extra if arg != INPUT_REFRESH_CONFIRM_FLAG]
        return run_module("pipeline.fetch", [name], forwarded)
    if name == "lamp-overlay":
        return run_module("pipeline.lamp_overlay")
    if name == "network":
        return run_module("pipeline.network")
    if name == "network-debug":
        return run_module("scripts.rebuild_network_debug")
    if name == "network-preflight":
        return run_module("pipeline.network_preflight")
    if name == "network-qa":
        return run_module("pipeline.network_qa")
    if name == "onemap-validation":
        return run_module("pipeline.onemap_validation")
    if name == "onemap-probe":
        return run_module("pipeline.probe_onemap")
    if name == "onemap-outlier-replay":
        return run_module("scripts.replay_onemap_outliers")
    if name == "onemap-outlier-triage":
        return run_module("scripts.triage_onemap_outliers")
    if name == "overture-addresses":
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
        return run_module("pipeline.export", ["refresh-provenance"])
    if name == "score":
        return run_module("pipeline.scoring_integration")
    if name == "score-batch":
        return run_module("pipeline.score_batch")
    if name == "bus-arrivals":
        return run_module("pipeline.bus_arrivals")
    if name == "bus-connector-diagnostics":
        return run_module("scripts.diagnose_bus_connectors")
    if name == "candidate-audit":
        return run_module("scripts.audit_postal_candidates")
    if name == "compare-targeted":
        return run_module("scripts.compare_targeted_scores")
    if name == "postal-universe":
        return run_module("pipeline.postal_universe")
    if name == "geocode-universe":
        return run_module("pipeline.geocode_universe")
    if name == "export":
        return run_module("pipeline.export", ["export"])
    if name == "export-transit":
        return run_module("pipeline.export", ["export-transit"])
    if name == "validate":
        return run_module("pipeline.export", ["validate"])
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
