from __future__ import annotations

import copy
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BUNDLE = PROJECT_ROOT / "web" / "public" / "data" / "generated_20260805_prefer_scored_routed"
SHARD = BUNDLE / "scores" / "ANG_MO_KIO_PART_001.json"
TOTAL_RECORDS = 124_443


def compact_bytes(value: object) -> int:
    return len(
        json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    )


def main() -> None:
    records = json.loads(SHARD.read_text(encoding="utf-8"))
    shard_bytes = SHARD.stat().st_size
    scoring_fingerprints_bytes = sum(
        compact_bytes(record.get("provenance", {}).get("scoring_fingerprints", {}))
        for record in records
    )
    routing_network_path_bytes = sum(
        compact_bytes(record.get("provenance", {}).get("routing", {}).get("network"))
        for record in records
    )

    digest_records = []
    for record in records:
        cloned = copy.deepcopy(record)
        cloned.setdefault("provenance", {})["network_digest"] = "e459daf2085fc291773765c1"
        digest_records.append(cloned)

    active_payload_bytes = compact_bytes(records)
    digest_payload_bytes = compact_bytes(digest_records)
    added_bytes = digest_payload_bytes - active_payload_bytes
    per_record = added_bytes / len(records)
    projected = per_record * TOTAL_RECORDS

    print(f"shard={SHARD.as_posix()}")
    print(f"records={len(records)}")
    print(f"shard_file_bytes={shard_bytes}")
    print(f"compact_json_bytes={active_payload_bytes}")
    print(f"scoring_fingerprints_bytes={scoring_fingerprints_bytes}")
    print(f"scoring_fingerprints_bytes_per_record={scoring_fingerprints_bytes / len(records):.3f}")
    print(f"routing_network_path_bytes={routing_network_path_bytes}")
    print(f"routing_network_path_bytes_per_record={routing_network_path_bytes / len(records):.3f}")
    print(f"network_digest_added_bytes={added_bytes}")
    print(f"network_digest_added_bytes_per_record={per_record:.3f}")
    print(f"projected_network_digest_added_bytes_for_{TOTAL_RECORDS}={projected:.0f}")
    print(f"projected_network_digest_added_mib_for_{TOTAL_RECORDS}={projected / (1024 * 1024):.3f}")


if __name__ == "__main__":
    main()
