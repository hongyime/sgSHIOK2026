"""Read-only consolidated status for cached postal-universe measurements."""

from __future__ import annotations

import argparse
import json
from typing import Any

from scripts.analysis import p19_universe_gap_measurement as p19


def _percent(numerator: Any, denominator: Any) -> float | None:
    if numerator is None or denominator in (None, 0):
        return None
    return round(float(numerator) / float(denominator) * 100.0, 6)


def _scaled_count(numerator: Any, denominator: Any, scale: Any) -> int | None:
    if numerator is None or denominator in (None, 0) or scale is None:
        return None
    return int(round(float(numerator) / float(denominator) * float(scale)))


def status_report() -> dict[str, Any]:
    p19_status = p19.cache_status_report()
    p19_policy = p19_status.get("release_policy")
    p19_currentness = p19_status.get("currentness")
    p19_split = p19_status.get("evidence_split")
    p19_files = p19_status.get("files")
    p19_missing_detail = p19_status.get("missing_row_detail")
    if not isinstance(p19_policy, dict):
        p19_policy = {}
    if not isinstance(p19_currentness, dict):
        p19_currentness = {}
    if not isinstance(p19_split, dict):
        p19_split = {}
    if not isinstance(p19_files, dict):
        p19_files = {}
    if not isinstance(p19_missing_detail, dict):
        p19_missing_detail = {}
    p19_summary = p19_files.get("summary")
    if not isinstance(p19_summary, dict):
        p19_summary = {}
    p19_signal = p19_summary.get("combined_recent_completion_signal")
    if not isinstance(p19_signal, dict):
        p19_signal = {}
    p19_overpass = p19_summary.get("overpass_addr_postcode")
    if not isinstance(p19_overpass, dict):
        p19_overpass = {}
    p19_v1_universe = p19_summary.get("v1_universe")
    if not isinstance(p19_v1_universe, dict):
        p19_v1_universe = {}
    p19_rows_with_postal = p19_signal.get("rows_with_postal")
    confirmed_missing = p19_split.get("confirmed_missing_address_rows")
    source_quality_warnings = p19_split.get("source_quality_warning_rows")
    total_missing_or_warning = None
    if confirmed_missing is not None and source_quality_warnings is not None:
        total_missing_or_warning = int(confirmed_missing) + int(source_quality_warnings)
    v1_distinct_postals = p19_v1_universe.get("unique_postals") or p19_v1_universe.get("rows")
    osm_valid_not_in_v1 = p19_overpass.get("missing_from_v1")
    osm_valid_in_v1 = p19_overpass.get("intersection")
    return {
        "mode": "universe_measurement_status",
        "will_call_apis": False,
        "will_write_files": False,
        "measurements": {
            "recent_public_source_gap_sample": {
                "measurement": p19_policy.get(
                    "measurement_label", "16 Aug 2026 public-source sample"
                ),
                "status": p19_policy.get("status"),
                "confirmed_missing_address_rows": p19_split.get(
                    "confirmed_missing_address_rows"
                ),
                "source_quality_warning_rows": p19_split.get("source_quality_warning_rows"),
                "summary": p19_policy.get("summary"),
                "currentness": p19_currentness,
                "cache_status_command": "uv run python run.py p19-gap-status",
                "will_call_apis": p19_status.get("will_call_apis") is True,
                "will_write_files": p19_status.get("will_write_files") is True,
                "sample_rows_with_postal": p19_rows_with_postal,
                "sample_missing_unique_postals": p19_missing_detail.get(
                    "missing_unique_postals"
                ),
                "sample_missing_postals": p19_missing_detail.get("missing_postals"),
                "sample_missing_development_clusters": p19_missing_detail.get(
                    "missing_development_clusters"
                ),
                "confirmed_missing_address_row_rate_pct": _percent(
                    confirmed_missing, p19_rows_with_postal
                ),
                "missing_or_source_quality_warning_row_rate_pct": _percent(
                    total_missing_or_warning, p19_rows_with_postal
                ),
                "directional_if_sample_rate_applied_to_v1_distinct_postals": {
                    "basis": (
                        "Directional scale only: applies recent-completion sample row rates "
                        "to the frozen-v1 distinct postal count; it is not a measured full-universe gap."
                    ),
                    "v1_distinct_postals": v1_distinct_postals,
                    "confirmed_missing_address_rows_estimate": _scaled_count(
                        confirmed_missing, p19_rows_with_postal, v1_distinct_postals
                    ),
                    "missing_or_source_quality_warning_rows_estimate": _scaled_count(
                        total_missing_or_warning, p19_rows_with_postal, v1_distinct_postals
                    ),
                },
            },
            "osm_addr_postcode_coverage": {
                "measurement": "P19 v2 28 Aug 2026 Overpass addr:postcode coverage cross-check",
                "osm_valid_distinct_postcodes": p19_overpass.get("unique_postcodes"),
                "osm_valid_in_v1": osm_valid_in_v1,
                "osm_valid_not_in_v1": osm_valid_not_in_v1,
                "v1_distinct_postals": v1_distinct_postals,
                "osm_coverage_of_v1_pct": _percent(osm_valid_in_v1, v1_distinct_postals),
                "osm_valid_not_in_v1_as_share_of_v1_pct": _percent(
                    osm_valid_not_in_v1, v1_distinct_postals
                ),
                "source_role": "geometry evidence and coverage cross-check",
                "registry_policy": "not the address registry",
                "verdict": "not sufficient as primary Singapore address registry",
                "cache_status_command": "uv run python run.py p19-gap-status",
                "will_call_apis": p19_status.get("will_call_apis") is True,
                "will_write_files": p19_status.get("will_write_files") is True,
            },
        },
        "decision_boundary": (
            "Use the cached P19 v2 measurements to size the frozen-v1 address-universe gap "
            "before building postal-universe v2. The older P125 OSM-only status remains a "
            "historical report, not the current source-policy surface. These measurements do "
            "not approve a v2 promotion, scoring, export, or input mutation."
        ),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)
    print(json.dumps(status_report(), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
