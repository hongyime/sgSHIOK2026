"""Read-only consolidated status for cached postal-universe measurements."""

from __future__ import annotations

import argparse
import json
from typing import Any

from scripts.analysis import p19_universe_gap_measurement as p19
from scripts.analysis import p125_osm_postcode_status as p125


def status_report() -> dict[str, Any]:
    p19_status = p19.cache_status_report()
    p125_status = p125.status_report()
    p19_policy = p19_status.get("release_policy")
    p19_split = p19_status.get("evidence_split")
    p125_coverage = p125_status.get("coverage")
    if not isinstance(p19_policy, dict):
        p19_policy = {}
    if not isinstance(p19_split, dict):
        p19_split = {}
    if not isinstance(p125_coverage, dict):
        p125_coverage = {}
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
                "cache_status_command": "uv run python run.py p19-gap-status",
                "will_call_apis": p19_status.get("will_call_apis") is True,
                "will_write_files": p19_status.get("will_write_files") is True,
            },
            "osm_addr_postcode_coverage": {
                "measurement": p125_status.get("measurement"),
                "osm_valid_distinct_postcodes": p125_coverage.get(
                    "osm_valid_distinct_postcodes"
                ),
                "osm_valid_in_v1": p125_coverage.get("osm_valid_in_v1"),
                "osm_valid_not_in_v1": p125_coverage.get("osm_valid_not_in_v1"),
                "v1_distinct_postals": p125_coverage.get("v1_distinct_postals"),
                "osm_coverage_of_v1_pct": p125_coverage.get("osm_coverage_of_v1_pct"),
                "source_role": p125_coverage.get("source_role"),
                "registry_policy": p125_coverage.get("registry_policy"),
                "verdict": p125_coverage.get("verdict"),
                "cache_status_command": "uv run python run.py p125-osm-status",
                "will_call_apis": p125_status.get("will_call_apis") is True,
                "will_write_files": p125_status.get("will_write_files") is True,
            },
        },
        "decision_boundary": (
            "Use these cached measurements to size the frozen-v1 address-universe gap before "
            "building postal-universe v2. They do not approve a v2 promotion, scoring, export, "
            "or input mutation."
        ),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)
    print(json.dumps(status_report(), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
