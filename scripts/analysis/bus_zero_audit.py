"""Audit SCORED records with zero bus subscore in the published SHIOK bundle.

This is an analysis-only script. It reads the static published bundle, discovers
all score shards from the bundle manifest, and reports how many SCORED records
have bus == 0 while carrying direct-bus fallback provenance.
"""

from __future__ import annotations

import argparse
import json
import math
import statistics
import sys
import urllib.request
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

from scripts.analysis.report_io import write_new_text_report

BUNDLE_NAME = "generated_20260805_prefer_scored_routed"
LOCAL_BUNDLE = PROJECT_ROOT / "web" / "public" / "data" / BUNDLE_NAME
REMOTE_BUNDLE_URL = f"https://sgshiok.vercel.app/data/{BUNDLE_NAME}/"
DEFAULT_OUTPUT = PROJECT_ROOT / "qa" / "verification" / "bus_zero_audit_20260812.txt"

BUS_FULL_CREDIT_WAIT_MIN = 2.0
BUS_ZERO_CREDIT_WAIT_MIN = 15.0
BUS_WEIGHT = 0.20


@dataclass(frozen=True)
class BundleSource:
    label: str
    base: Path | str
    is_remote: bool


def load_json_from_source(source: BundleSource, relative_path: str) -> Any:
    if source.is_remote:
        url = str(source.base).rstrip("/") + "/" + relative_path.replace("\\", "/")
        with urllib.request.urlopen(url, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))

    path = Path(source.base) / relative_path
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def choose_bundle_source(force_remote: bool) -> BundleSource:
    if not force_remote and (LOCAL_BUNDLE / "manifest.json").exists():
        return BundleSource(f"local:{LOCAL_BUNDLE}", LOCAL_BUNDLE, False)
    return BundleSource(f"remote:{REMOTE_BUNDLE_URL}", REMOTE_BUNDLE_URL, True)


def score_bus_connectivity(expected_wait_min: float | None) -> float | None:
    if expected_wait_min is None:
        return None
    if expected_wait_min <= BUS_FULL_CREDIT_WAIT_MIN:
        return 100.0
    if expected_wait_min >= BUS_ZERO_CREDIT_WAIT_MIN:
        return 0.0
    ratio = (expected_wait_min - BUS_FULL_CREDIT_WAIT_MIN) / (
        BUS_ZERO_CREDIT_WAIT_MIN - BUS_FULL_CREDIT_WAIT_MIN
    )
    return max(0.0, min(100.0, 100.0 - ratio * 100.0))


def planning_area_from_shard(shard_id: str) -> str:
    marker = "_PART_"
    if marker in shard_id:
        return shard_id.split(marker, 1)[0]
    return shard_id


def as_number(value: Any) -> float | None:
    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, int | float):
        if math.isfinite(float(value)):
            return float(value)
    return None


def pct(numerator: int, denominator: int) -> str:
    if denominator == 0:
        return "n/a"
    return f"{(numerator / denominator) * 100:.3f}%"


def percentile(values: list[float], percentile_value: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    if len(ordered) == 1:
        return ordered[0]
    position = (len(ordered) - 1) * percentile_value
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return ordered[int(position)]
    lower_value = ordered[lower]
    upper_value = ordered[upper]
    return lower_value + (upper_value - lower_value) * (position - lower)


def format_number(value: float | None) -> str:
    if value is None:
        return "n/a"
    return f"{value:.3f}".rstrip("0").rstrip(".")


def summarize_values(values: list[float]) -> list[str]:
    if not values:
        return ["count=0"]
    return [
        f"count={len(values)}",
        f"min={format_number(min(values))}",
        f"p25={format_number(percentile(values, 0.25))}",
        f"median={format_number(statistics.median(values))}",
        f"p75={format_number(percentile(values, 0.75))}",
        f"p90={format_number(percentile(values, 0.90))}",
        f"p95={format_number(percentile(values, 0.95))}",
        f"max={format_number(max(values))}",
    ]


def histogram(values: list[float], buckets: list[tuple[str, float | None, float | None]]) -> Counter[str]:
    counts: Counter[str] = Counter()
    for value in values:
        matched = False
        for label, lower, upper in buckets:
            if lower is not None and value < lower:
                continue
            if upper is not None and value >= upper:
                continue
            counts[label] += 1
            matched = True
            break
        if not matched:
            counts["unbucketed"] += 1
    return counts


def sorted_counter_lines(counter: Counter[str], denominator: int | None = None) -> list[str]:
    lines = []
    for key, count in sorted(counter.items(), key=lambda item: (-item[1], item[0])):
        suffix = f" ({pct(count, denominator)})" if denominator is not None else ""
        lines.append(f"- {key}: {count}{suffix}")
    return lines or ["- none: 0"]


def audit_bundle(source: BundleSource) -> str:
    manifest = load_json_from_source(source, "manifest.json")
    shards = manifest.get("scores", {}).get("shards")
    if not isinstance(shards, list) or not shards:
        raise ValueError("manifest.scores.shards is missing or empty")

    manifest_record_count = manifest.get("provenance", {}).get("record_count")
    manifest_state_counts = manifest.get("provenance", {}).get("state_counts")

    state_counts: Counter[str] = Counter()
    scored_count = 0
    scored_bus_zero_count = 0
    fallback_wait_count = 0
    processed_records = 0

    wait_values: list[float] = []
    restored_points: list[float] = []
    nearest_direct_values: list[float] = []
    reason_counts: Counter[str] = Counter()
    planning_area_stats: dict[str, Counter[str]] = defaultdict(Counter)

    for index, shard_id in enumerate(shards, start=1):
        shard_path = f"scores/{shard_id}.json"
        records = load_json_from_source(source, shard_path)
        if not isinstance(records, list):
            raise ValueError(f"{shard_path} did not contain a JSON array")

        shard_area = planning_area_from_shard(str(shard_id))
        for record in records:
            if not isinstance(record, dict):
                continue
            processed_records += 1
            state = str(record.get("state") or "UNKNOWN")
            state_counts[state] += 1

            area = str(record.get("planning_area") or shard_area or "UNKNOWN")
            planning_area_stats[area]["total"] += 1
            planning_area_stats[area][f"state:{state}"] += 1

            if state != "SCORED":
                continue

            scored_count += 1
            planning_area_stats[area]["scored"] += 1
            subscores = record.get("subscores")
            bus_score = as_number(subscores.get("bus") if isinstance(subscores, dict) else None)
            if bus_score != 0.0:
                continue

            scored_bus_zero_count += 1
            planning_area_stats[area]["scored_bus_zero"] += 1

            provenance = record.get("provenance")
            fallback = (
                provenance.get("direct_bus_fallback")
                if isinstance(provenance, dict) and isinstance(provenance.get("direct_bus_fallback"), dict)
                else None
            )
            if not fallback:
                continue

            reason = str(fallback.get("reason") or "UNKNOWN")
            reason_counts[reason] += 1
            nearest_direct_m = as_number(fallback.get("nearest_direct_m"))
            if nearest_direct_m is not None:
                nearest_direct_values.append(nearest_direct_m)

            wait = as_number(fallback.get("best_expected_wait_min"))
            if wait is None:
                continue

            fallback_wait_count += 1
            planning_area_stats[area]["scored_bus_zero_fallback_wait"] += 1
            wait_values.append(wait)
            replacement_bus_score = score_bus_connectivity(wait)
            if replacement_bus_score is not None:
                restored_points.append(replacement_bus_score * BUS_WEIGHT)

        print(f"processed shard {index}/{len(shards)}: {shard_id}", file=sys.stderr)

    if manifest_record_count != processed_records:
        raise ValueError(
            f"processed {processed_records} records but manifest record_count is {manifest_record_count}"
        )

    wait_buckets = [
        ("[0,2)", 0.0, 2.0),
        ("[2,5)", 2.0, 5.0),
        ("[5,10)", 5.0, 10.0),
        ("[10,15)", 10.0, 15.0),
        ("[15,+inf)", 15.0, None),
    ]
    restored_buckets = [
        ("0", 0.0, 0.0000001),
        ("(0,5)", 0.0000001, 5.0),
        ("[5,10)", 5.0, 10.0),
        ("[10,15)", 10.0, 15.0),
        ("[15,20]", 15.0, 20.0000001),
    ]
    nearest_buckets = [
        ("[0,50)", 0.0, 50.0),
        ("[50,100)", 50.0, 100.0),
        ("[100,150)", 100.0, 150.0),
        ("[150,200)", 150.0, 200.0),
        ("[200,250)", 200.0, 250.0),
        ("[250,305]", 250.0, 305.0000001),
        ("(305,+inf)", 305.0000001, None),
    ]

    lines: list[str] = []
    lines.append("Bus-zero audit for generated_20260805_prefer_scored_routed")
    lines.append(f"bundle_source: {source.label}")
    lines.append(f"manifest_record_count: {manifest_record_count}")
    lines.append(f"processed_record_count: {processed_records}")
    lines.append(f"score_shard_count: {len(shards)}")
    lines.append(f"manifest_state_counts: {json.dumps(manifest_state_counts, sort_keys=True)}")
    lines.append("")
    lines.append(
        "normal_bus_curve: score=100 when wait<=2 min, score=0 when wait>=15 min, "
        "linear interpolation between; bus weight=0.20"
    )
    lines.append("")

    lines.append("A1 total records by state")
    lines.extend(sorted_counter_lines(state_counts, processed_records))
    lines.append("")

    lines.append("A2 count/% of SCORED with bus == 0")
    lines.append(f"- SCORED records: {scored_count}")
    lines.append(
        f"- SCORED with bus == 0: {scored_bus_zero_count} ({pct(scored_bus_zero_count, scored_count)})"
    )
    lines.append("")

    lines.append("A3 among SCORED bus == 0, direct_bus_fallback.best_expected_wait_min present")
    lines.append(
        f"- present: {fallback_wait_count} ({pct(fallback_wait_count, scored_bus_zero_count)})"
    )
    lines.append("- wait_min summary: " + ", ".join(summarize_values(wait_values)))
    lines.append("- wait_min buckets:")
    lines.extend(sorted_counter_lines(histogram(wait_values, wait_buckets), fallback_wait_count))
    lines.append("")

    lines.append("A4 composite points restored if fallback wait were scored through normal bus curve")
    lines.append("- restored_points summary: " + ", ".join(summarize_values(restored_points)))
    lines.append("- restored_points buckets:")
    lines.extend(sorted_counter_lines(histogram(restored_points, restored_buckets), len(restored_points)))
    lines.append("")

    lines.append("A5 per-planning-area hit-rate table sorted by SCORED bus-zero hit rate")
    lines.append(
        "planning_area,total,scored,scored_bus_zero,scored_bus_zero_pct,"
        "fallback_wait_present,fallback_wait_present_pct_of_scored_bus_zero"
    )
    area_rows = []
    for area, counts in planning_area_stats.items():
        scored = counts["scored"]
        bus_zero = counts["scored_bus_zero"]
        fallback_wait = counts["scored_bus_zero_fallback_wait"]
        hit_rate = (bus_zero / scored) if scored else -1.0
        area_rows.append((hit_rate, area, counts["total"], scored, bus_zero, fallback_wait))
    for _hit_rate, area, total, scored, bus_zero, fallback_wait in sorted(
        area_rows, key=lambda row: (-row[0], row[1])
    ):
        lines.append(
            f"{area},{total},{scored},{bus_zero},{pct(bus_zero, scored)},"
            f"{fallback_wait},{pct(fallback_wait, bus_zero)}"
        )
    lines.append("")

    reason_total = sum(reason_counts.values())
    lines.append("A6 direct_bus_fallback.reason distribution for SCORED bus == 0 records with fallback provenance")
    lines.extend(sorted_counter_lines(reason_counts, reason_total))
    lines.append("")

    lines.append("A7 nearest_direct_m distribution for affected records")
    lines.append("- nearest_direct_m summary: " + ", ".join(summarize_values(nearest_direct_values)))
    lines.append("- nearest_direct_m buckets:")
    lines.extend(sorted_counter_lines(histogram(nearest_direct_values, nearest_buckets), len(nearest_direct_values)))
    lines.append("")

    return "\n".join(lines) + "\n"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--force-remote",
        action="store_true",
        help="Read from https://sgshiok.vercel.app even if the matching local bundle exists.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Report path. Default: {DEFAULT_OUTPUT}",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source = choose_bundle_source(force_remote=bool(args.force_remote))
    report = audit_bundle(source)
    write_new_text_report(args.output, report)
    print(report, end="")
    print(f"wrote_report: {args.output}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
