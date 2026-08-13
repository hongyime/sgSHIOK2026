from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from pipeline.export import export_static_artifacts

OUT = Path("qa/p10_network_provenance_20260813/unresolved_network_probe")


def main() -> int:
    record = {
        "postal": "999999",
        "planning_area": "TEST",
        "state": "SCORED",
        "score": {"total": 50.0},
        "subscores": {
            "access": 50.0,
            "bus": 50.0,
            "crossing": 50.0,
            "heat": 50.0,
            "rain": 50.0,
        },
        "provenance": {
            "scoring_fingerprints": {"pipeline/scoring.py": "0" * 64},
            "network_digest": "missingnetworkdigest001",
        },
        "paths": {
            "best": {
                "geometry_id": "g-test",
                "node_id": "n-test",
                "name": "Test Stop",
                "routing_type": "sheltered",
            }
        },
        "geometry": {
            "geometry_id": "g-test",
            "line": [[103.8, 1.3], [103.801, 1.301]],
        },
    }

    try:
        export_static_artifacts([record], output_dir=OUT)
    except ValueError as exc:
        print(f"raised={type(exc).__name__}")
        print(f"message={exc}")
        return 0

    print("raised=None")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
