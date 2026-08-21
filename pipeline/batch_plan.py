from __future__ import annotations

import argparse
import json
import os
from collections.abc import Mapping
from pathlib import Path
from typing import Any

import pyarrow as pa
import pyarrow.parquet as pq
import yaml
from dotenv import load_dotenv

from pipeline.network_qa import validate_network_qa

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PROCESSED_DIR = PROJECT_ROOT / "processed"
QA_DIR = PROJECT_ROOT / "qa"
PARAMS_PATH = PROJECT_ROOT / "pipeline" / "config" / "params.yaml"
UNIVERSE_MODES = ("official_current", "candidate_full_registered", "candidate_full_all")
DEFAULT_ONEMAP_DELAY_SEC = 2.0
THIRD_PARTY_ONEMAP_WARNING = "third-party OneMap-derived 2020 dump"
FROZEN_V1_POLICY = (
    "frozen v1 remains the 124443-record June 2020 OneMap-derived universe"
)
POSTAL_UNIVERSE_V2_POLICY = (
    "candidate-source-first current free sources, then bounded OneMap Search validation "
    "under explicit token controls, 72-hour token refresh, and current documented "
    "token-authenticated call-limit cap unless SLA approves a higher limit"
)
ONEMAP_SEARCH_CONTROLS = {
    "token_required": True,
    "token_refresh_hours": 72,
    "documented_token_authenticated_call_limit_cap": 250,
    "higher_limit_requires_sla_case_by_case_approval": True,
}
OSM_ADDR_POSTCODE_COVERAGE = {
    "measurement": "P125 live Overpass addr:postcode coverage",
    "valid_distinct_postcodes": 25879,
    "overlap_frozen_v1_postals": 25873,
    "frozen_v1_postals": 124443,
    "coverage_pct": 20.791045,
    "verdict": "not sufficient as primary registry",
}
RECENT_PUBLIC_SOURCE_GAP_SAMPLE = {
    "measurement": "P19 recent public-source gap sample",
    "source_rows_with_postals": 976,
    "missing_rows": 8,
    "missing_pct": 0.819672,
    "source_window": "2021-2026",
    "sources": ["HDB completion", "BCA MCST proxy"],
    "verdict": "small current-source gap in frozen v1; candidate-source-first v2 remains required",
}
DATAMALL_GEOSPATIAL_DISCOVERY_POLICY = {
    "measurement": "P262/P264 DataMall geospatial discovery-only probe",
    "command": "uv run python run.py check --geospatial-discovery-only",
    "payload_downloads": False,
    "manifest_writes": False,
    "changed_sources": ["covered_linkway", "overhead_bridge_underpass"],
    "matched_sources": ["traffic_signals"],
    "verdict": "changed discovery URLs require a new numbered input version, not an in-place repair",
}
NON_SCORE_REFERENCE_SOURCE_POLICY = {
    "leaf_area_index": {
        "role": "source freshness reference table only",
        "reason": "species/generic LAI table; not route-level geometry or shade-proxy geometry",
        "score_provenance": "excluded from score source hashes",
        "promotion_requires": "separate species-located canopy inventory and approved model design",
    }
}
FULL_BATCH_RELEASE_SCOPE = {
    "status": "approved_in_principle_not_approved_to_run",
    "owner_approval_required_before_execution": True,
    "one_attempt_only": True,
    "must_prove_each_change_on_1200_subset_first": True,
    "bundled_changes": [
        "bus remodel",
        "NO_TRANSIT_IN_RANGE partial-score fix",
        "network conflation repair",
        "promoted postal universe v2 if approved",
    ],
    "prohibited_without_explicit_owner_approval": [
        "full rescore",
        "piecemeal full-bundle rerun",
        "production deploy",
        "live-site repoint",
    ],
    "required_prerequisite_evidence": [
        {
            "change": "bus remodel",
            "required_before_full_batch": "1200-record subset proof with bus-score movement and failure-mode accounting",
        },
        {
            "change": "NO_TRANSIT_IN_RANGE partial-score fix",
            "required_before_full_batch": "1200-record subset proof of state transitions and locked-weight zero-contribution behavior",
            "locked_score_policy": (
                "missing or NO_TRANSIT_IN_RANGE component terms remain zero-contribution "
                "under the locked weights; do not renormalize to a four-of-five score "
                "without a new explicit display state"
            ),
        },
        {
            "change": "network conflation repair",
            "required_before_full_batch": "island network QA plus 1200-record subset proof of route/value impact",
        },
        {
            "change": "promoted postal universe v2 if approved",
            "required_before_full_batch": "candidate-source diff, bounded OneMap validation report, and owner approval",
        },
    ],
}


def load_json(path: Path) -> dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        payload: Any = json.load(f)
    if not isinstance(payload, dict):
        raise TypeError(f"expected JSON object: {path}")
    return payload


def load_onemap_delay(params_path: Path = PARAMS_PATH) -> tuple[float, list[str]]:
    warnings: list[str] = []
    if not params_path.is_file():
        warnings.append(f"missing params file; using {DEFAULT_ONEMAP_DELAY_SEC:.1f}s OneMap delay")
        return DEFAULT_ONEMAP_DELAY_SEC, warnings

    with open(params_path, "r", encoding="utf-8") as f:
        params = yaml.safe_load(f) or {}

    value = params.get("onemap", {}).get("client_delay_sec") if isinstance(params, dict) else None
    if isinstance(value, (int, float)) and not isinstance(value, bool) and value > 0:
        return float(value), warnings

    warnings.append(f"invalid onemap.client_delay_sec; using {DEFAULT_ONEMAP_DELAY_SEC:.1f}s delay")
    return DEFAULT_ONEMAP_DELAY_SEC, warnings


def api_environment_readiness(environment: Mapping[str, str] | None = None) -> dict[str, Any]:
    env = os.environ if environment is None else environment
    lta_present = bool(env.get("LTA_DATAMALL_ACCOUNT_KEY"))
    onemap_email_present = bool(env.get("ONEMAP_EMAIL"))
    onemap_password_present = bool(env.get("ONEMAP_PASSWORD"))
    missing = []
    if not lta_present:
        missing.append("LTA_DATAMALL_ACCOUNT_KEY")
    if not onemap_email_present:
        missing.append("ONEMAP_EMAIL")
    if not onemap_password_present:
        missing.append("ONEMAP_PASSWORD")

    warnings: list[str] = []
    if not lta_present:
        warnings.append(
            "LTA_DATAMALL_ACCOUNT_KEY missing; DataMall-backed source refreshes cannot run"
        )
    if not (onemap_email_present and onemap_password_present):
        warnings.append(
            "ONEMAP_EMAIL/ONEMAP_PASSWORD missing; OneMap token-backed validation cannot run"
        )

    return {
        "ready_for_api_collection": not missing,
        "lta_datamall_account_key_present": lta_present,
        "onemap_email_present": onemap_email_present,
        "onemap_password_present": onemap_password_present,
        "onemap_credentials_present": onemap_email_present and onemap_password_present,
        "missing": missing,
        "warnings": warnings,
    }


def format_duration(seconds: float) -> str:
    total_seconds = round(seconds)
    days, remainder = divmod(total_seconds, 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes, secs = divmod(remainder, 60)
    parts: list[str] = []
    if days:
        parts.append(f"{days}d")
    if hours:
        parts.append(f"{hours}h")
    if minutes:
        parts.append(f"{minutes}m")
    if secs or not parts:
        parts.append(f"{secs}s")
    return " ".join(parts)


def compact_source_stats(summary: dict[str, Any]) -> list[dict[str, Any]]:
    compact: list[dict[str, Any]] = []
    for source in summary.get("source_stats", []):
        if not isinstance(source, dict):
            continue
        compact.append(
            {
                "source_key": source.get("source_key"),
                "raw_records": source.get("raw_records"),
                "valid_unique_postals": source.get("valid_unique_postals"),
                "records_with_coordinates": source.get("records_with_coordinates"),
                "sha256": source.get("sha256"),
                "path": source.get("path"),
                "url": source.get("url"),
            }
        )
    return compact


def parquet_row_count(path: Path) -> int:
    return int(pq.read_metadata(path).num_rows)


def default_universe_paths(
    mode: str,
    processed_dir: Path = PROCESSED_DIR,
) -> tuple[Path, Path]:
    base_summary = processed_dir / f"postal_universe_{mode}_summary.json"
    base_universe = processed_dir / f"postal_universe_{mode}.parquet"
    geocoded_summary = processed_dir / f"postal_universe_{mode}_geocoded_summary.json"
    geocoded_universe = processed_dir / f"postal_universe_{mode}_geocoded.parquet"
    if geocoded_summary.is_file() and geocoded_universe.is_file():
        return geocoded_summary, geocoded_universe
    return base_summary, base_universe


def build_batch_plan(
    *,
    mode: str,
    summary_path: Path | None = None,
    universe_path: Path | None = None,
    params_path: Path = PARAMS_PATH,
    qa_path: Path | None = None,
    debug_path: Path | None = None,
    onemap_delay_sec: float | None = None,
    environment: Mapping[str, str] | None = None,
) -> tuple[bool, dict[str, Any]]:
    default_summary_path, default_universe_path = default_universe_paths(mode)
    summary_path = summary_path or default_summary_path
    universe_path = universe_path or default_universe_path
    qa_path = qa_path or QA_DIR / "conflation_qa_island.json"
    debug_path = debug_path or QA_DIR / "island_debug.geojson"

    errors: list[str] = []
    warnings: list[str] = []
    summary: dict[str, Any] = {}

    if not summary_path.is_file():
        errors.append(f"missing postal universe summary: {summary_path}")
    else:
        try:
            summary = load_json(summary_path)
        except (OSError, TypeError, ValueError, json.JSONDecodeError) as exc:
            errors.append(f"could not read postal universe summary: {exc}")

    universe_rows = None
    if not universe_path.is_file():
        errors.append(f"missing postal universe parquet: {universe_path}")
    else:
        try:
            universe_rows = parquet_row_count(universe_path)
        except (OSError, pa.ArrowException) as exc:
            errors.append(f"could not read postal universe parquet metadata: {exc}")

    summary_total = summary.get("total_unique_postals")
    if universe_rows is not None and summary_total is not None and universe_rows != summary_total:
        errors.append(
            f"postal universe row mismatch: parquet has {universe_rows}, summary has {summary_total}"
        )

    if onemap_delay_sec is None:
        onemap_delay_sec, delay_warnings = load_onemap_delay(params_path)
        warnings.extend(delay_warnings)
    elif onemap_delay_sec <= 0:
        errors.append(f"onemap delay must be positive, got {onemap_delay_sec!r}")

    needs_geocode = int(summary.get("needs_geocode") or 0)
    ready_to_score = int(summary.get("ready_to_score") or 0)
    geocode_fill = summary.get("geocode_fill") if isinstance(summary, dict) else None
    geocode_fill_complete = (
        isinstance(geocode_fill, dict)
        and geocode_fill.get("ok") is True
        and int(geocode_fill.get("queued_postals") or 0)
        == int(geocode_fill.get("http_requests") or 0)
        + int(geocode_fill.get("cache_successes") or 0)
        + int(geocode_fill.get("cache_failures") or 0)
    )
    remaining_geocode_requests = 0 if geocode_fill_complete else needs_geocode
    wall_clock_seconds = float(remaining_geocode_requests) * float(onemap_delay_sec)

    island_ok, island_summary = validate_network_qa(qa_path, debug_path, require_debug=False)
    summary_warnings = [str(item) for item in summary.get("warnings", []) if isinstance(item, str)]
    requires_universe_approval = any(
        THIRD_PARTY_ONEMAP_WARNING in warning for warning in summary_warnings
    )

    blockers: list[str] = [
        "human approval required before full geocode/scoring batch",
        "human approval required before production deploy or mock-to-real frontend cutover",
    ]
    if not island_ok:
        blockers.append("island-wide network QA is not green")
    if requires_universe_approval:
        blockers.append(
            "postal universe uses frozen v1 third-party OneMap-derived 2020 source; "
            "v2 requires candidate-source-first approval before full-batch use"
        )
    if geocode_fill_complete and needs_geocode:
        warnings.append(
            f"{needs_geocode} source-derived postals remain unresolved after bounded OneMap geocode"
        )
    api_environment = api_environment_readiness(environment)
    warnings.extend(api_environment["warnings"])

    full_batch_allowed_now = False

    report: dict[str, Any] = {
        "ok": not errors,
        "mode": mode,
        "paths": {
            "summary": str(summary_path),
            "universe": str(universe_path),
            "params": str(params_path),
            "island_qa": str(qa_path),
            "island_debug": str(debug_path),
        },
        "postal_universe": {
            "generated_at": summary.get("generated_at"),
            "mode": summary.get("mode"),
            "total_unique_postals": summary_total,
            "ready_to_score": ready_to_score,
            "needs_geocode": needs_geocode,
            "parquet_rows": universe_rows,
            "source_stats": compact_source_stats(summary),
            "source_only_counts": summary.get("source_only_counts", {}),
            "warnings": summary_warnings,
        },
        "source_policy": {
            "frozen_v1": FROZEN_V1_POLICY,
            "v2": POSTAL_UNIVERSE_V2_POLICY,
            "recent_public_source_gap_sample": RECENT_PUBLIC_SOURCE_GAP_SAMPLE,
            "osm_addr_postcode_registry": OSM_ADDR_POSTCODE_COVERAGE,
            "datamall_geospatial_discovery": DATAMALL_GEOSPATIAL_DISCOVERY_POLICY,
            "non_score_reference_sources": NON_SCORE_REFERENCE_SOURCE_POLICY,
            "onemap_search_role": "candidate validation/geocoding, not national enumeration",
            "onemap_search_controls": ONEMAP_SEARCH_CONTROLS,
            "requires_human_approval_for_universe": requires_universe_approval,
        },
        "api_environment": api_environment,
        "bounded_geocoding": {
            "consumer": "OneMap search API",
            "scope": (
                "completed bounded fill; remaining NEEDS_GEOCODE rows stay NOT_YET_SCORED"
                if geocode_fill_complete
                else "source-derived postals with NEEDS_GEOCODE only"
            ),
            "will_bruteforce": False,
            "delay_seconds": float(onemap_delay_sec),
            "requests": remaining_geocode_requests,
            "minimum_wall_clock_seconds": wall_clock_seconds,
            "minimum_wall_clock_human": format_duration(wall_clock_seconds),
            "completed_fill": geocode_fill if geocode_fill_complete else None,
            "unresolved_after_bounded_geocode": needs_geocode if geocode_fill_complete else None,
        },
        "scoring_batch": {
            "would_score_without_geocoding": ready_to_score,
            "would_score_after_bounded_geocoding": (
                ready_to_score if geocode_fill_complete else ready_to_score + needs_geocode
            ),
            "would_emit_records": universe_rows,
            "would_emit_not_yet_scored": (
                needs_geocode
                if geocode_fill_complete
                else max((universe_rows or 0) - ready_to_score, 0)
            ),
            "uses_python_igraph": True,
            "uses_project_conflated_graph": True,
            "epsg_internal": "EPSG:3414",
        },
        "full_batch_release_scope": FULL_BATCH_RELEASE_SCOPE,
        "checkpoint_gates": {
            "island_network_qa_ok": island_ok,
            "island_network_debug_required_for_plan": False,
            "island_network_debug_required_for_full_batch_execution": True,
            "requires_human_approval_for_universe": requires_universe_approval,
            "full_geocode_scoring_batch_requires_human_approval": True,
            "production_deploy_requires_human_approval": True,
            "full_batch_allowed_now": full_batch_allowed_now,
            "blockers": blockers,
        },
        "island_network_qa": island_summary,
        "warnings": warnings,
        "errors": errors,
    }
    return not errors, report


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Plan the full postal geocode/scoring batch without running it."
    )
    parser.add_argument("--mode", choices=UNIVERSE_MODES, default="candidate_full_registered")
    parser.add_argument("--summary", type=Path, help="Override postal universe summary JSON.")
    parser.add_argument("--universe", type=Path, help="Override postal universe parquet.")
    parser.add_argument("--params", type=Path, default=PARAMS_PATH)
    parser.add_argument("--qa", type=Path, help="Override island network QA JSON.")
    parser.add_argument("--debug", type=Path, help="Override island debug GeoJSON.")
    parser.add_argument(
        "--onemap-delay-sec", type=float, help="Override OneMap delay for planning."
    )
    args = parser.parse_args()

    ok, report = build_batch_plan(
        mode=args.mode,
        summary_path=args.summary,
        universe_path=args.universe,
        params_path=args.params,
        qa_path=args.qa,
        debug_path=args.debug,
        onemap_delay_sec=args.onemap_delay_sec,
    )
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
