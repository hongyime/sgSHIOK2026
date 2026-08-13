from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from scripts.production_readiness import build_readiness_report

BUNDLE = ROOT / "web" / "public" / "data" / "generated_20260805_prefer_scored_routed"


def main() -> None:
    _ok, report = build_readiness_report(bundle_dir=BUNDLE)
    summary = report["release_gate_summary"]
    onemap = summary["onemap_validation"]
    fields = {
        "release_gate_status": report.get("release_gate_status"),
        "release_gate_passed": report.get("release_gate_passed"),
        "active_bundle": summary.get("active_bundle"),
        "onemap_validation.state": onemap.get("state"),
        "onemap_validation.bundle": onemap.get("bundle"),
        "onemap_validation.bundle_matches_active": onemap.get("bundle_matches_active"),
        "onemap_validation.fresh_for_active_bundle": onemap.get("fresh_for_active_bundle"),
        "onemap_validation.sample_size": onemap.get("sample_size"),
        "onemap_validation.cached_results": onemap.get("cached_results"),
        "onemap_validation.missing_cache_results": onemap.get("missing_cache_results"),
        "onemap_validation.invalid_cache_results": onemap.get("invalid_cache_results"),
        "onemap_validation.median_abs_pct_delta": onemap.get("median_abs_pct_delta"),
        "onemap_validation.p95_abs_pct_delta": onemap.get("p95_abs_pct_delta"),
        "onemap_validation.report_path": onemap.get("report_path"),
        "onemap_validation.summary": onemap.get("summary"),
        "unresolved_warnings": summary.get("unresolved_warnings"),
    }
    for key, value in fields.items():
        if isinstance(value, (dict, list)):
            print(f"{key}={json.dumps(value, sort_keys=True)}")
        else:
            print(f"{key}={str(value).lower() if isinstance(value, bool) else value}")


if __name__ == "__main__":
    main()
