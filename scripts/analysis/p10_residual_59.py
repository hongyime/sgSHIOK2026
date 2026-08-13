"""Characterise P9's exact-coordinate residual moved totals."""

from __future__ import annotations

import json
import math
from collections import Counter
from pathlib import Path
from typing import Any

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[2]
ACTIVE_SCORE_DIR = (
    PROJECT_ROOT / "web" / "public" / "data" / "generated_20260805_prefer_scored_routed" / "scores"
)
SCRATCH_SCORE_DIR = (
    PROJECT_ROOT / "qa" / "p6_rerun_cost_20260812_102712" / "exported_bundle" / "scores"
)
CURRENT_PARTITION_DIR = (
    PROJECT_ROOT / "processed" / "score_batches" / "full_rescore_20260804_205430" / "partitions"
)
OLD_SPLIT_GLOB = "postal_universe_candidate_full_registered_geocoded_part*_of04.parquet"


def load_records(root: Path) -> dict[str, dict[str, Any]]:
    records: dict[str, dict[str, Any]] = {}
    for path in sorted(root.glob("*.json")):
        if path.name in {"index.json", "prefix-index.json"}:
            continue
        for record in json.loads(path.read_text(encoding="utf-8")):
            records[str(record["postal"])] = record
    return records


def load_universe(paths: list[Path]) -> pd.DataFrame:
    df = pd.concat((pd.read_parquet(path) for path in paths), ignore_index=True)
    df["postal_code"] = df["postal_code"].astype(str)
    return df.set_index("postal_code", drop=False)


def same_coord(left: pd.Series, right: pd.Series) -> bool:
    for key in ("lat", "lon", "x", "y"):
        a = left.get(key)
        b = right.get(key)
        if pd.isna(a) and pd.isna(b):
            continue
        if a != b:
            return False
    return True


def coord_delta_m(left: pd.Series, right: pd.Series) -> float:
    if (
        pd.isna(left.get("x"))
        and pd.isna(right.get("x"))
        and pd.isna(left.get("y"))
        and pd.isna(right.get("y"))
    ):
        return math.nan
    if (
        pd.isna(left.get("x"))
        or pd.isna(right.get("x"))
        or pd.isna(left.get("y"))
        or pd.isna(right.get("y"))
    ):
        return math.inf
    return math.hypot(float(left["x"]) - float(right["x"]), float(left["y"]) - float(right["y"]))


def candidate_signature(record: dict[str, Any]) -> tuple[Any, ...]:
    best = record.get("best_node") if isinstance(record.get("best_node"), dict) else {}
    paths = record.get("paths") if isinstance(record.get("paths"), dict) else {}
    candidate_ids = []
    for candidate in record.get("candidates") or []:
        if not isinstance(candidate, dict):
            continue
        candidate_ids.append(
            (
                candidate.get("node_id"),
                candidate.get("node_type"),
                candidate.get("state"),
                candidate.get("route_trust"),
                candidate.get("routing_type"),
            )
        )
    return (
        record.get("state"),
        record.get("total"),
        best.get("type"),
        best.get("name"),
        best.get("routed_m"),
        paths.get("routing_type"),
        tuple(candidate_ids),
    )


def best_candidate(record: dict[str, Any]) -> dict[str, Any] | None:
    best = record.get("best_node")
    if not isinstance(best, dict):
        return None
    best_type = best.get("type")
    best_name = best.get("name")
    for candidate in record.get("candidates") or []:
        if not isinstance(candidate, dict):
            continue
        if candidate.get("node_type") == best_type and candidate.get("node_name") == best_name:
            return candidate
    return None


def main() -> None:
    active = load_records(ACTIVE_SCORE_DIR)
    scratch = load_records(SCRATCH_SCORE_DIR)
    current = load_universe(sorted(CURRENT_PARTITION_DIR.glob("part*.parquet")))
    old = load_universe(sorted((PROJECT_ROOT / "processed").glob(OLD_SPLIT_GLOB)))
    moved = []
    moved_xy_same = []
    moved_with_delta: list[tuple[str, float]] = []
    for postal, active_record in active.items():
        scratch_record = scratch.get(postal)
        if not scratch_record:
            continue
        if active_record.get("total") == scratch_record.get("total"):
            continue
        if postal not in current.index or postal not in old.index:
            continue
        delta = coord_delta_m(current.loc[postal], old.loc[postal])
        moved_with_delta.append((postal, delta))
        if same_coord(current.loc[postal], old.loc[postal]):
            moved.append(postal)
        if math.isnan(delta) or delta <= 1e-6:
            moved_xy_same.append(postal)
    print(f"moved_with_both_inputs={len(moved_with_delta)}")
    for threshold in (0.0, 1e-6, 0.01, 0.1, 0.5, 1.0):
        count = sum(
            1
            for _postal, delta in moved_with_delta
            if (math.isnan(delta) and threshold == 0.0) or delta <= threshold
        )
        print(f"moved_coord_delta_le_{threshold:g}m={count}")
    print(f"residual_exact_all_coordinate_fields_moved_count={len(moved)}")
    print(f"residual_xy_delta_le_1e-6m_moved_count={len(moved_xy_same)}")
    lat_lon_diff_inside_xy_same = sum(
        1 for postal in moved_xy_same if not same_coord(current.loc[postal], old.loc[postal])
    )
    print(f"lat_lon_field_diff_inside_xy_same_residual={lat_lon_diff_inside_xy_same}")
    moved = moved_xy_same
    state_pairs = Counter(
        (str(active[postal].get("state")), str(scratch[postal].get("state"))) for postal in moved
    )
    print(
        "state_pairs_active_to_scratch="
        + json.dumps({str(k): v for k, v in sorted(state_pairs.items())})
    )
    signature_changed = sum(
        1
        for postal in moved
        if candidate_signature(active[postal]) != candidate_signature(scratch[postal])
    )
    best_changed = sum(
        1
        for postal in moved
        if (active[postal].get("best_node") or {}) != (scratch[postal].get("best_node") or {})
    )
    print(f"candidate_signature_changed={signature_changed}")
    print(f"best_node_changed={best_changed}")
    best_type_pairs = Counter()
    routing_pairs = Counter()
    total_deltas = []
    routed_over_fallback_like = 0
    scored_mrt_to_scored_bus = 0
    for postal in moved:
        a = active[postal]
        s = scratch[postal]
        ab = a.get("best_node") if isinstance(a.get("best_node"), dict) else {}
        sb = s.get("best_node") if isinstance(s.get("best_node"), dict) else {}
        ap = a.get("paths") if isinstance(a.get("paths"), dict) else {}
        sp = s.get("paths") if isinstance(s.get("paths"), dict) else {}
        best_type_pairs[(str(ab.get("type")), str(sb.get("type")))] += 1
        routing_pairs[(str(ap.get("routing_type")), str(sp.get("routing_type")))] += 1
        total_deltas.append(round(float(a.get("total") or 0) - float(s.get("total") or 0), 3))
        scratch_best = best_candidate(s)
        active_best = best_candidate(a)
        if (
            a.get("state") == "SCORED_PARTIAL"
            and s.get("state") == "SCORED"
            and isinstance(active_best, dict)
            and active_best.get("state") == "SCORED_PARTIAL"
            and isinstance(scratch_best, dict)
            and scratch_best.get("state") == "SCORED"
        ):
            routed_over_fallback_like += 1
        if ab.get("type") == "mrt_lrt_exit" and sb.get("type") == "bus_stop":
            scored_mrt_to_scored_bus += 1
    total_deltas_sorted = sorted(total_deltas)
    if total_deltas_sorted:
        p50 = total_deltas_sorted[len(total_deltas_sorted) // 2]
        p90 = total_deltas_sorted[int((len(total_deltas_sorted) - 1) * 0.9)]
        print(
            "total_delta_active_minus_scratch="
            + json.dumps(
                {
                    "min": total_deltas_sorted[0],
                    "median": p50,
                    "p90": p90,
                    "max": total_deltas_sorted[-1],
                },
                sort_keys=True,
            )
        )
    print(
        "best_type_pairs_active_to_scratch="
        + json.dumps({str(k): v for k, v in sorted(best_type_pairs.items())})
    )
    print(
        "routing_type_pairs_active_to_scratch="
        + json.dumps({str(k): v for k, v in sorted(routing_pairs.items())})
    )
    print(f"routed_over_fallback_like_active_partial_to_scratch_scored={routed_over_fallback_like}")
    print(f"scored_mrt_to_scored_bus={scored_mrt_to_scored_bus}")
    print("examples=")
    for postal in moved[:20]:
        a = active[postal]
        s = scratch[postal]
        ab = a.get("best_node") if isinstance(a.get("best_node"), dict) else {}
        sb = s.get("best_node") if isinstance(s.get("best_node"), dict) else {}
        ap = a.get("paths") if isinstance(a.get("paths"), dict) else {}
        sp = s.get("paths") if isinstance(s.get("paths"), dict) else {}
        print(
            "postal={} active_state={} scratch_state={} active_total={} scratch_total={} "
            "active_best='{}:{}' scratch_best='{}:{}' active_route={} scratch_route={}".format(
                postal,
                a.get("state"),
                s.get("state"),
                a.get("total"),
                s.get("total"),
                ab.get("type"),
                ab.get("name"),
                sb.get("type"),
                sb.get("name"),
                ap.get("routing_type"),
                sp.get("routing_type"),
            )
        )


if __name__ == "__main__":
    main()
