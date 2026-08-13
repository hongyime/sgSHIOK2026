"""Read-only P10 coordinate identity analysis for the active bundle."""

from __future__ import annotations

import json
import math
import re
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

import geopandas as gpd
import pandas as pd
from pyproj import Transformer
from shapely.geometry import Point

from pipeline.export import slugify_area
from pipeline.onemap_validation import decode_polyline
from pipeline.scoring_integration import raw_file_from_manifest

ACTIVE_BUNDLE = PROJECT_ROOT / "web" / "public" / "data" / "generated_20260805_prefer_scored_routed"
SCORE_DIR = ACTIVE_BUNDLE / "scores"
GEOM_DIR = ACTIVE_BUNDLE / "geom"
SUBJECT_PARTITION_DIR = (
    PROJECT_ROOT / "processed" / "score_batches" / "full_rescore_20260804_205430" / "partitions"
)
COMBINED_UNIVERSE = (
    PROJECT_ROOT / "processed" / "postal_universe_candidate_full_registered_geocoded.parquet"
)
OLD_SPLIT_GLOB = "postal_universe_candidate_full_registered_geocoded_part*_of04.parquet"
ROUTE_START_TOLERANCE_M = 2.0
MATERIAL_ROUTE_START_ERROR_M = 20.0
LARGE_OLD_DELTA_M = 77.0


def area_from_shard(path: Path) -> str:
    return re.sub(r"_PART_\d+$", "", path.stem)


def load_score_records() -> (
    tuple[dict[str, dict[str, Any]], dict[str, str], Counter[str], Counter[str], int]
):
    records: dict[str, dict[str, Any]] = {}
    area_by_postal: dict[str, str] = {}
    citation_counts: Counter[str] = Counter()
    state_counts: Counter[str] = Counter()
    score_files = [
        path
        for path in sorted(SCORE_DIR.glob("*.json"))
        if path.name not in {"index.json", "prefix-index.json"}
    ]
    for path in score_files:
        area = area_from_shard(path)
        data = json.loads(path.read_text(encoding="utf-8"))
        for record in data:
            postal = str(record["postal"])
            records[postal] = record
            area_by_postal[postal] = area
            state_counts[str(record.get("state"))] += 1
            provenance = record.get("provenance")
            if isinstance(provenance, dict):
                citation_counts[str(provenance.get("postal_universe"))] += 1
            else:
                citation_counts["<missing>"] += 1
    return records, area_by_postal, citation_counts, state_counts, len(score_files)


def load_partitions(paths: list[Path]) -> tuple[pd.DataFrame, list[dict[str, Any]]]:
    frames: list[pd.DataFrame] = []
    summaries: list[dict[str, Any]] = []
    for path in paths:
        df = pd.read_parquet(path)
        frames.append(df)
        stat = path.stat()
        summaries.append(
            {
                "path": str(path.relative_to(PROJECT_ROOT)),
                "rows": int(len(df)),
                "unique_postals": int(df["postal_code"].astype(str).nunique()),
                "bytes": int(stat.st_size),
                "mtime": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "status": {
                    str(key): int(value)
                    for key, value in df["status"].value_counts(dropna=False).sort_index().items()
                },
            }
        )
    combined = pd.concat(frames, ignore_index=True)
    combined["postal_code"] = combined["postal_code"].astype(str)
    return combined.set_index("postal_code", drop=False), summaries


def values_differ(left: pd.Series, right: pd.Series) -> pd.Series:
    return ~((left == right) | (pd.isna(left) & pd.isna(right)))


def coordinate_diff_mask(left: pd.DataFrame, right: pd.DataFrame, suffix: str) -> pd.Series:
    merged = left[["lat", "lon", "x", "y"]].join(
        right[["lat", "lon", "x", "y"]], lsuffix="_left", rsuffix=suffix, how="inner"
    )
    return (
        values_differ(merged["lat_left"], merged[f"lat{suffix}"])
        | values_differ(merged["lon_left"], merged[f"lon{suffix}"])
        | values_differ(merged["x_left"], merged[f"x{suffix}"])
        | values_differ(merged["y_left"], merged[f"y{suffix}"])
    )


def load_geom_index() -> tuple[dict[str, str], dict[str, list[dict[str, Any]]]]:
    postal_index = json.loads((GEOM_DIR / "postal-index.json").read_text(encoding="utf-8"))
    return postal_index, {}


def geom_for_postal(
    postal: str, postal_index: dict[str, str], geom_cache: dict[str, list[dict[str, Any]]]
) -> dict[str, Any] | None:
    shard = postal_index.get(postal)
    if not shard:
        return None
    if shard not in geom_cache:
        path = GEOM_DIR / "h3" / f"{shard}.json"
        geom_cache[shard] = json.loads(path.read_text(encoding="utf-8")) if path.is_file() else []
    for item in geom_cache[shard]:
        if str(item.get("postal")) == postal:
            return item
    return None


def route_start_xy(
    record: dict[str, Any],
    postal_index: dict[str, str],
    geom_cache: dict[str, list[dict[str, Any]]],
    transformer: Transformer,
) -> tuple[float, float] | None:
    geom = geom_for_postal(str(record["postal"]), postal_index, geom_cache)
    if not geom:
        return None
    paths = record.get("paths")
    route_type = paths.get("routing_type") if isinstance(paths, dict) else None
    selected = "shortest" if route_type == "shortest_due_to_detour" else "sheltered"
    for key in (selected, "sheltered", "shortest"):
        route_segments = geom.get("route_segments")
        segments = route_segments.get(key) if isinstance(route_segments, dict) else None
        if isinstance(segments, list):
            for segment in segments:
                if not isinstance(segment, dict):
                    continue
                encoded = segment.get("geom")
                if isinstance(encoded, str) and encoded:
                    points = decode_polyline(encoded)
                    if points:
                        lat, lon = points[0]
                        return transformer.transform(lon, lat)
        encoded = geom.get(key)
        if isinstance(encoded, str) and encoded:
            points = decode_polyline(encoded)
            if points:
                lat, lon = points[0]
                return transformer.transform(lon, lat)
    return None


def candidate_distance(row: pd.Series, xy: tuple[float, float] | None) -> float:
    if xy is None or pd.isna(row.get("x")) or pd.isna(row.get("y")):
        return math.inf
    return math.hypot(float(row["x"]) - xy[0], float(row["y"]) - xy[1])


def describe_distances(values: pd.Series) -> dict[str, float | int]:
    clean = values.dropna().sort_values()
    if clean.empty:
        return {"count": 0}
    return {
        "count": int(len(clean)),
        "median": round(float(clean.quantile(0.5, interpolation="nearest")), 3),
        "p90": round(float(clean.quantile(0.9, interpolation="nearest")), 3),
        "p95": round(float(clean.quantile(0.95, interpolation="nearest")), 3),
        "p99": round(float(clean.quantile(0.99, interpolation="nearest")), 3),
        "max": round(float(clean.iloc[-1]), 3),
    }


def main() -> None:
    records, area_by_postal, citation_counts, state_counts, score_file_count = load_score_records()
    subject_paths = sorted(SUBJECT_PARTITION_DIR.glob("part*.parquet"))
    old_paths = sorted((PROJECT_ROOT / "processed").glob(OLD_SPLIT_GLOB))
    subject, subject_summaries = load_partitions(subject_paths)
    old, old_summaries = load_partitions(old_paths)
    combined = pd.read_parquet(COMBINED_UNIVERSE)
    combined["postal_code"] = combined["postal_code"].astype(str)
    combined = combined.set_index("postal_code", drop=False)

    print(f"active_score_files={score_file_count} active_records={len(records)}")
    print("active_state_counts=" + json.dumps(dict(sorted(state_counts.items())), sort_keys=True))
    print("partition_citation_counts=")
    for key, value in sorted(citation_counts.items()):
        print(f"{key} {value}")
    print("current_subject_partition_files=")
    for summary in subject_summaries:
        print(json.dumps(summary, sort_keys=True))
    print(f"subject_rows_total={len(subject)} subject_unique={subject.index.nunique()}")
    print(f"combined_rows={len(combined)} combined_unique={combined.index.nunique()}")
    print(f"old_split_rows_total={len(old)} old_split_unique={old.index.nunique()}")
    subject_set = set(subject.index)
    combined_set = set(combined.index)
    old_set = set(old.index)
    print(
        "subject_vs_combined_sets="
        + json.dumps(
            {
                "common": len(subject_set & combined_set),
                "subject_only": len(subject_set - combined_set),
                "combined_only": len(combined_set - subject_set),
            },
            sort_keys=True,
        )
    )
    subject_combined_merged = subject[["lat", "lon", "x", "y", "status", "coordinate_source"]].join(
        combined[["lat", "lon", "x", "y", "status", "coordinate_source"]],
        lsuffix="_subject",
        rsuffix="_combined",
        how="inner",
    )
    subject_combined_coord_diff = (
        values_differ(
            subject_combined_merged["lat_subject"], subject_combined_merged["lat_combined"]
        )
        | values_differ(
            subject_combined_merged["lon_subject"], subject_combined_merged["lon_combined"]
        )
        | values_differ(subject_combined_merged["x_subject"], subject_combined_merged["x_combined"])
        | values_differ(subject_combined_merged["y_subject"], subject_combined_merged["y_combined"])
    )
    print(f"subject_vs_combined_coord_diff={int(subject_combined_coord_diff.sum())}")
    print(
        f"subject_vs_combined_status_diff={int((subject_combined_merged['status_subject'] != subject_combined_merged['status_combined']).sum())}"
    )
    subject_old_merged = subject[["lat", "lon", "x", "y", "status", "coordinate_source"]].join(
        old[["lat", "lon", "x", "y", "status", "coordinate_source"]],
        lsuffix="_subject",
        rsuffix="_old",
        how="inner",
    )
    subject_old_coord_diff = (
        values_differ(subject_old_merged["lat_subject"], subject_old_merged["lat_old"])
        | values_differ(subject_old_merged["lon_subject"], subject_old_merged["lon_old"])
        | values_differ(subject_old_merged["x_subject"], subject_old_merged["x_old"])
        | values_differ(subject_old_merged["y_subject"], subject_old_merged["y_old"])
    )
    subject_old_merged["delta_m"] = (
        (
            pd.to_numeric(subject_old_merged["x_subject"], errors="coerce")
            - pd.to_numeric(subject_old_merged["x_old"], errors="coerce")
        )
        ** 2
        + (
            pd.to_numeric(subject_old_merged["y_subject"], errors="coerce")
            - pd.to_numeric(subject_old_merged["y_old"], errors="coerce")
        )
        ** 2
    ) ** 0.5
    print(
        f"subject_vs_old_sets={json.dumps({'common': len(subject_set & old_set), 'subject_only': len(subject_set - old_set), 'old_only': len(old_set - subject_set)}, sort_keys=True)}"
    )
    print(f"subject_vs_old_coord_diff={int(subject_old_coord_diff.sum())}")
    print(
        "subject_vs_old_delta_m="
        + json.dumps(
            describe_distances(subject_old_merged.loc[subject_old_coord_diff, "delta_m"]),
            sort_keys=True,
        )
    )

    postal_index, geom_cache = load_geom_index()
    transformer = Transformer.from_crs("EPSG:4326", "EPSG:3414", always_xy=True)
    match_counts: Counter[str] = Counter()
    large_counts: Counter[str] = Counter()
    wrong_current: list[tuple[float, str, str, str]] = []
    top_large: list[tuple[float, str, str, float, float, float, str, str, str]] = []
    checked = 0
    checked_large = 0
    for postal, record in records.items():
        if postal not in subject.index:
            continue
        xy = route_start_xy(record, postal_index, geom_cache, transformer)
        if xy is None:
            continue
        subject_distance = candidate_distance(subject.loc[postal], xy)
        combined_distance = (
            candidate_distance(combined.loc[postal], xy) if postal in combined.index else math.inf
        )
        old_distance = candidate_distance(old.loc[postal], xy) if postal in old.index else math.inf
        subject_match = subject_distance <= ROUTE_START_TOLERANCE_M
        combined_match = combined_distance <= ROUTE_START_TOLERANCE_M
        old_match = old_distance <= ROUTE_START_TOLERANCE_M
        if subject_match and combined_match:
            bucket = "partition_and_combined"
        elif subject_match:
            bucket = "partition_only"
        elif combined_match:
            bucket = "combined_only"
        elif old_match:
            bucket = "old_split_only"
        else:
            bucket = "neither"
        match_counts[bucket] += 1
        checked += 1
        if subject_distance > MATERIAL_ROUTE_START_ERROR_M:
            wrong_current.append(
                (
                    round(subject_distance, 3),
                    postal,
                    area_by_postal.get(postal, "UNKNOWN"),
                    str(record.get("state")),
                )
            )
        if postal in old.index:
            delta = candidate_distance(
                old.loc[postal], (float(subject.loc[postal]["x"]), float(subject.loc[postal]["y"]))
            )
            if math.isfinite(delta) and delta >= LARGE_OLD_DELTA_M:
                large_counts[bucket] += 1
                checked_large += 1
                top_large.append(
                    (
                        delta,
                        postal,
                        area_by_postal.get(postal, "UNKNOWN"),
                        subject_distance,
                        combined_distance,
                        old_distance,
                        str(record.get("state")),
                        str(subject.loc[postal].get("coordinate_source")),
                        str(old.loc[postal].get("coordinate_source")),
                    )
                )
    print(f"route_start_discriminator_checked={checked} tolerance_m={ROUTE_START_TOLERANCE_M}")
    print(
        "route_start_match_counts=" + json.dumps(dict(sorted(match_counts.items())), sort_keys=True)
    )
    print(f"route_start_large_delta_ge_{int(LARGE_OLD_DELTA_M)}m_checked={checked_large}")
    print(
        "route_start_large_delta_match_counts="
        + json.dumps(dict(sorted(large_counts.items())), sort_keys=True)
    )
    print(
        f"route_start_distance_to_current_partition_gt_{int(MATERIAL_ROUTE_START_ERROR_M)}m_count={len(wrong_current)}"
    )
    print("top_subject_vs_old_delta_cases=")
    for row in sorted(top_large, reverse=True)[:10]:
        print(
            "postal={} area={} old_delta_m={:.3f} dist_to_current_partition_start_m={:.3f} "
            "dist_to_combined_start_m={:.3f} dist_to_old_split_start_m={:.3f} state={} "
            "current_source={} old_source={}".format(
                row[1], row[2], row[0], row[3], row[4], row[5], row[6], row[7], row[8]
            )
        )
    print("worst_route_start_distance_to_current_partition=")
    for row in sorted(wrong_current, reverse=True)[:10]:
        print(row)

    boundary_path = raw_file_from_manifest(
        "planning_area_boundary", "planning_area_boundary.geojson"
    )
    if boundary_path is None:
        print("planning_area_boundary_path=MISSING")
    else:
        point_rows = []
        for postal in records:
            if postal not in subject.index:
                continue
            row = subject.loc[postal]
            if pd.isna(row.get("x")) or pd.isna(row.get("y")):
                continue
            point_rows.append(
                {
                    "postal": postal,
                    "shard_area": area_by_postal.get(postal, "UNKNOWN"),
                    "geometry": Point(float(row["x"]), float(row["y"])),
                }
            )
        points = gpd.GeoDataFrame(point_rows, crs="EPSG:3414")
        boundaries = gpd.read_file(boundary_path).to_crs("EPSG:3414")[["PLN_AREA_N", "geometry"]]
        joined = gpd.sjoin(points, boundaries, how="left", predicate="within")
        mismatches = []
        for _, row in joined.iterrows():
            actual_area = slugify_area(row.get("PLN_AREA_N"))
            if actual_area != row["shard_area"]:
                mismatches.append((str(row["postal"]), str(row["shard_area"]), actual_area))
        print(f"planning_area_boundary_path={boundary_path}")
        print(f"planning_area_checked={len(points)} mismatches={len(mismatches)}")
        print("planning_area_mismatch_top10=" + json.dumps(mismatches[:10]))


if __name__ == "__main__":
    main()
