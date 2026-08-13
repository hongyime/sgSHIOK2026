from __future__ import annotations

import json
from pathlib import Path
from typing import Any

BASE = Path("qa/p9_input_provenance_20260813/bundle")
NEW = Path("qa/p10_network_provenance_20260813/exported_bundle")

VALUE_KEYS = (
    "postal",
    "planning_area",
    "state",
    "score",
    "subscores",
    "score_state",
    "paths",
    "exposure_gaps",
    "candidates",
    "route_options",
)


def load_scores(root: Path) -> dict[str, dict[str, Any]]:
    records: dict[str, dict[str, Any]] = {}
    for path in sorted((root / "scores").glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(payload, list):
            continue
        for record in payload:
            if not isinstance(record, dict) or "postal" not in record:
                continue
            records[str(record["postal"])] = record
    return records


def strip_provenance(record: dict[str, Any]) -> dict[str, Any]:
    return {key: record.get(key) for key in VALUE_KEYS if key in record}


def file_hash(path: Path) -> str:
    import hashlib

    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    base_records = load_scores(BASE)
    new_records = load_scores(NEW)
    common = sorted(set(base_records) & set(new_records))
    base_only = sorted(set(base_records) - set(new_records))
    new_only = sorted(set(new_records) - set(base_records))

    value_moved = []
    provenance_changed = []
    for postal in common:
        if strip_provenance(base_records[postal]) != strip_provenance(new_records[postal]):
            value_moved.append(postal)
        if base_records[postal].get("provenance") != new_records[postal].get("provenance"):
            provenance_changed.append(postal)

    geom_files = sorted((NEW / "geom").glob("*.json"))
    geom_diffs = []
    for new_path in geom_files:
        old_path = BASE / "geom" / new_path.name
        if not old_path.exists() or file_hash(old_path) != file_hash(new_path):
            geom_diffs.append(new_path.name)

    transit_files = sorted((NEW / "transit").glob("*.json"))
    transit_diffs = []
    for new_path in transit_files:
        old_path = BASE / "transit" / new_path.name
        if not old_path.exists() or file_hash(old_path) != file_hash(new_path):
            transit_diffs.append(new_path.name)

    print(f"base={BASE.as_posix()}")
    print(f"new={NEW.as_posix()}")
    print(f"base_records={len(base_records)}")
    print(f"new_records={len(new_records)}")
    print(f"common_records={len(common)}")
    print(f"base_only={len(base_only)}")
    print(f"new_only={len(new_only)}")
    print(f"value_fields_changed={len(value_moved)}")
    print(f"provenance_changed={len(provenance_changed)}")
    print(f"geom_files_changed={len(geom_diffs)}")
    print(f"transit_files_changed={len(transit_diffs)}")
    print("value_changed_postals=" + json.dumps(value_moved[:20]))
    print("geom_diffs=" + json.dumps(geom_diffs[:20]))
    print("transit_diffs=" + json.dumps(transit_diffs[:20]))


if __name__ == "__main__":
    main()
