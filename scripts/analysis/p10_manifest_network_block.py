from __future__ import annotations

import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BEFORE = PROJECT_ROOT / "qa" / "p9_input_provenance_20260813" / "bundle" / "manifest.json"
AFTER = (
    PROJECT_ROOT
    / "qa"
    / "p10_network_provenance_20260813"
    / "exported_bundle"
    / "manifest.json"
)

FIELDS = [
    "network_algorithm",
    "network_digest",
    "network_digest_counts",
    "networks_by_digest",
    "network_digests_missing_maps",
    "network_changed_during_run",
    "mixed_network_digests",
    "records_missing_network_digest",
    "network_provenance_complete",
]


def block(path: Path) -> dict[str, object]:
    manifest = json.loads(path.read_text(encoding="utf-8"))
    provenance = manifest.get("provenance", {})
    return {field: provenance.get(field) for field in FIELDS if field in provenance}


def main() -> None:
    before = BEFORE
    after = AFTER
    print("before=" + before.as_posix())
    print(json.dumps(block(before), indent=2, sort_keys=True))
    print("after=" + after.as_posix())
    print(json.dumps(block(after), indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
