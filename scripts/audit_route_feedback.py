from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from scripts.analysis.report_io import write_new_text_report

DEFAULT_NETWORK = PROJECT_ROOT / "processed" / "network_island.parquet"


def existing_output_errors(paths: list[Path | None]) -> list[str]:
    return [
        f"refusing to overwrite existing analysis output: {path}"
        for path in paths
        if path is not None and path.exists()
    ]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Audit user-drawn route feedback against the current pedestrian network."
    )
    parser.add_argument("feedback", type=Path)
    parser.add_argument("--network", type=Path, default=DEFAULT_NETWORK)
    parser.add_argument("--search-m", type=float, default=20.0)
    parser.add_argument("--output", type=Path, default=None)
    parser.add_argument("--geojson", type=Path, default=None)
    parser.add_argument("--candidates-geojson", type=Path, default=None)
    args = parser.parse_args()

    errors = existing_output_errors([args.output, args.geojson, args.candidates_geojson])
    if errors:
        print(json.dumps({"errors": errors, "ok": False}, indent=2, sort_keys=True))
        return 2

    from pipeline.route_feedback import (
        audit_geojson,
        audit_report,
        classify_feedback_segments,
        component_gap_candidate_geojson,
        feedback_segments,
        load_feedback_routes,
        load_network_edges,
    )

    routes = load_feedback_routes(args.feedback)
    segments = feedback_segments(routes)
    network = load_network_edges(args.network)
    audited = classify_feedback_segments(segments, network, search_m=args.search_m)
    report = audit_report(audited)
    report["feedback"] = str(args.feedback)
    report["network"] = str(args.network)
    report["search_m"] = args.search_m

    if args.output:
        write_new_text_report(args.output, json.dumps(report, indent=2, sort_keys=True))
    if args.geojson:
        write_new_text_report(
            args.geojson,
            json.dumps(audit_geojson(audited), indent=2, sort_keys=True),
        )
    if args.candidates_geojson:
        write_new_text_report(
            args.candidates_geojson,
            json.dumps(component_gap_candidate_geojson(audited), indent=2, sort_keys=True),
        )

    print(
        json.dumps(
            {
                "ok": report["ok"],
                "route_count": report["route_count"],
                "segment_count": report["segment_count"],
                "classification_counts": report["classification_counts"],
                "output": str(args.output) if args.output else None,
                "geojson": str(args.geojson) if args.geojson else None,
                "candidates_geojson": (
                    str(args.candidates_geojson) if args.candidates_geojson else None
                ),
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
