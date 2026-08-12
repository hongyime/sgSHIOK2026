"""P4 Strand 3 bus saturation analysis for the published SHIOK bundle.

Analysis-only: reads the local static bundle and writes a verification report.
It does not regenerate, publish, deploy, or modify scoring/export logic.
"""

from __future__ import annotations

import argparse
import json
import math
import statistics
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Iterable


PROJECT_ROOT = Path(__file__).resolve().parents[2]
BUNDLE_NAME = "generated_20260805_prefer_scored_routed"
BUNDLE_DIR = PROJECT_ROOT / "web" / "public" / "data" / BUNDLE_NAME
DEFAULT_OUTPUT = PROJECT_ROOT / "qa" / "verification" / "P4-strand3-bus-saturation-analysis.txt"

WEIGHTS = {
    "access": 0.35,
    "bus": 0.20,
    "rain": 0.25,
    "heat": 0.15,
    "crossing": 0.05,
}
NON_BUS_WEIGHT = 1.0 - WEIGHTS["bus"]
BUS_FULL_CREDIT_WAIT_MIN = 2.0
BUS_ZERO_CREDIT_WAIT_MIN = 15.0
PUBLISHED_TOTAL_DIGITS = 1


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def as_number(value: Any) -> float | None:
    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, int | float):
        numeric = float(value)
        if math.isfinite(numeric):
            return numeric
    return None


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


def iter_score_records(bundle_dir: Path) -> Iterable[dict[str, Any]]:
    manifest = load_json(bundle_dir / "manifest.json")
    shards = manifest.get("scores", {}).get("shards")
    if not isinstance(shards, list) or not shards:
        raise ValueError("manifest.scores.shards missing or empty")
    for shard_id in shards:
        records = load_json(bundle_dir / "scores" / f"{shard_id}.json")
        if not isinstance(records, list):
            raise ValueError(f"scores/{shard_id}.json is not a JSON array")
        yield from (record for record in records if isinstance(record, dict))


def pct(numerator: int | float, denominator: int | float) -> str:
    if denominator == 0:
        return "n/a"
    return f"{(float(numerator) / float(denominator)) * 100:.3f}%"


def fmt(value: float | None, digits: int = 3) -> str:
    if value is None:
        return "n/a"
    return f"{value:.{digits}f}".rstrip("0").rstrip(".")


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
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (position - lower)


def summarize(values: list[float], digits: int = 3) -> str:
    if not values:
        return "count=0"
    return ", ".join(
        [
            f"count={len(values)}",
            f"min={fmt(min(values), digits)}",
            f"p25={fmt(percentile(values, 0.25), digits)}",
            f"median={fmt(statistics.median(values), digits)}",
            f"p75={fmt(percentile(values, 0.75), digits)}",
            f"p90={fmt(percentile(values, 0.90), digits)}",
            f"p95={fmt(percentile(values, 0.95), digits)}",
            f"p99={fmt(percentile(values, 0.99), digits)}",
            f"max={fmt(max(values), digits)}",
        ]
    )


def histogram(values: list[float], buckets: list[tuple[str, float | None, float | None]]) -> Counter[str]:
    counter: Counter[str] = Counter()
    for value in values:
        for label, lower, upper in buckets:
            if lower is not None and value < lower:
                continue
            if upper is not None and value >= upper:
                continue
            counter[label] += 1
            break
        else:
            counter["unbucketed"] += 1
    return counter


def sorted_counter_lines(counter: Counter[str], denominator: int | None = None) -> list[str]:
    lines: list[str] = []
    for key, count in sorted(counter.items(), key=lambda item: (-item[1], item[0])):
        suffix = f" ({pct(count, denominator)})" if denominator is not None else ""
        lines.append(f"- {key}: {count}{suffix}")
    return lines or ["- none: 0"]


def average_ranks_desc(records: list[tuple[str, float]]) -> dict[str, float]:
    ordered = sorted(records, key=lambda item: (-item[1], item[0]))
    ranks: dict[str, float] = {}
    index = 0
    while index < len(ordered):
        value = ordered[index][1]
        end = index + 1
        while end < len(ordered) and ordered[end][1] == value:
            end += 1
        average_rank = ((index + 1) + end) / 2.0
        for record_id, _value in ordered[index:end]:
            ranks[record_id] = average_rank
        index = end
    return ranks


def spearman_desc(left: list[tuple[str, float]], right: list[tuple[str, float]]) -> float:
    left_ranks = average_ranks_desc(left)
    right_ranks = average_ranks_desc(right)
    keys = sorted(set(left_ranks) & set(right_ranks))
    if len(keys) < 2:
        return float("nan")
    left_values = [left_ranks[key] for key in keys]
    right_values = [right_ranks[key] for key in keys]
    left_mean = statistics.fmean(left_values)
    right_mean = statistics.fmean(right_values)
    numerator = sum(
        (left_value - left_mean) * (right_value - right_mean)
        for left_value, right_value in zip(left_values, right_values, strict=True)
    )
    left_denominator = math.sqrt(sum((value - left_mean) ** 2 for value in left_values))
    right_denominator = math.sqrt(sum((value - right_mean) ** 2 for value in right_values))
    return numerator / (left_denominator * right_denominator)


def recompute_total(subscores: dict[str, Any], bus_override: float | None = None) -> float | None:
    total = 0.0
    for key, weight in WEIGHTS.items():
        value = bus_override if key == "bus" and bus_override is not None else as_number(subscores.get(key))
        if value is None:
            return None
        total += value * weight
    return round(total, PUBLISHED_TOTAL_DIGITS)


def drop_bus_total(subscores: dict[str, Any]) -> float | None:
    total = 0.0
    for key, weight in WEIGHTS.items():
        if key == "bus":
            continue
        value = as_number(subscores.get(key))
        if value is None:
            return None
        total += value * (weight / NON_BUS_WEIGHT)
    return round(total, PUBLISHED_TOTAL_DIGITS)


def service_bucket(service_count: int) -> str:
    if service_count <= 0:
        return "0"
    if service_count == 1:
        return "1"
    if service_count == 2:
        return "2"
    if service_count == 3:
        return "3"
    if service_count == 4:
        return "4"
    if service_count == 5:
        return "5"
    if 6 <= service_count <= 9:
        return "6-9"
    if 10 <= service_count <= 14:
        return "10-14"
    return "15+"


def analyze(bundle_dir: Path) -> str:
    manifest = load_json(bundle_dir / "manifest.json")
    manifest_record_count = manifest.get("provenance", {}).get("record_count")
    manifest_state_counts = manifest.get("provenance", {}).get("state_counts")
    shard_count = len(manifest.get("scores", {}).get("shards", []))

    state_counts: Counter[str] = Counter()
    processed_records = 0
    numeric_total_records = 0
    scored_records = 0

    bus_positive_values: list[float] = []
    wait_for_bus_positive: list[float] = []
    wait_all_numeric: list[float] = []
    bus_positive_exact_100 = 0
    bus_exact_100_all_numeric_subscores = 0
    numeric_bus_records = 0
    scored_bus_exact_100_current = 0
    scored_bus_zero = 0
    scored_promoted_to_100 = 0
    scored_promoted_eligible = 0
    corrected_mislabel_count = 0
    affected_nearest_direct_count = 0

    service_waits: dict[int, list[float]] = defaultdict(list)
    service_bucket_waits: dict[str, list[float]] = defaultdict(list)
    joint_bucket_counts: Counter[str] = Counter()
    service_counts_for_wait: list[float] = []
    waits_with_service_count: list[float] = []

    current_rank_all: list[tuple[str, float]] = []
    current_drop_rank_all: list[tuple[str, float]] = []
    fixed_rank_all: list[tuple[str, float]] = []
    fixed_drop_rank_all: list[tuple[str, float]] = []
    current_rank_scored: list[tuple[str, float]] = []
    current_drop_rank_scored: list[tuple[str, float]] = []
    fixed_rank_scored: list[tuple[str, float]] = []
    fixed_drop_rank_scored: list[tuple[str, float]] = []

    published_vs_recomputed_delta: list[float] = []

    for record_index, record in enumerate(iter_score_records(bundle_dir), start=1):
        processed_records += 1
        postal = str(record.get("postal") or f"record-{record_index}")
        state = str(record.get("state") or "UNKNOWN")
        state_counts[state] += 1

        total = as_number(record.get("total"))
        subscores_raw = record.get("subscores")
        subscores = subscores_raw if isinstance(subscores_raw, dict) else None
        provenance = record.get("provenance") if isinstance(record.get("provenance"), dict) else {}
        bus_provenance = (
            provenance.get("bus_connectivity")
            if isinstance(provenance.get("bus_connectivity"), dict)
            else {}
        )
        fallback = (
            provenance.get("direct_bus_fallback")
            if isinstance(provenance.get("direct_bus_fallback"), dict)
            else {}
        )

        bus = as_number(subscores.get("bus") if subscores else None)
        expected_wait = as_number(bus_provenance.get("expected_wait_min"))
        service_count_number = as_number(bus_provenance.get("service_count"))

        if expected_wait is not None:
            wait_all_numeric.append(expected_wait)
            if service_count_number is not None:
                service_count = int(service_count_number)
                service_waits[service_count].append(expected_wait)
                service_bucket_waits[service_bucket(service_count)].append(expected_wait)
                service_counts_for_wait.append(float(service_count))
                waits_with_service_count.append(expected_wait)
                wait_bucket = next(
                    label
                    for label, lower, upper in [
                        ("[0,0.5)", 0.0, 0.5),
                        ("[0.5,1)", 0.5, 1.0),
                        ("[1,2)", 1.0, 2.0),
                        ("[2,5)", 2.0, 5.0),
                        ("[5,10)", 5.0, 10.0),
                        ("[10,15)", 10.0, 15.0),
                        ("[15,+inf)", 15.0, None),
                    ]
                    if (lower is None or expected_wait >= lower)
                    and (upper is None or expected_wait < upper)
                )
                joint_bucket_counts[f"{service_bucket(service_count)} | {wait_bucket}"] += 1

        if bus is not None:
            numeric_bus_records += 1
            if bus == 100.0:
                bus_exact_100_all_numeric_subscores += 1
            if bus > 0.0:
                bus_positive_values.append(bus)
                if expected_wait is not None:
                    wait_for_bus_positive.append(expected_wait)
                if bus == 100.0:
                    bus_positive_exact_100 += 1

        if total is not None:
            numeric_total_records += 1

        if state == "SCORED":
            scored_records += 1
            if bus == 100.0:
                scored_bus_exact_100_current += 1
            if bus == 0.0:
                scored_bus_zero += 1
                fallback_wait = as_number(fallback.get("best_expected_wait_min"))
                fallback_bus = score_bus_connectivity(fallback_wait)
                if fallback_bus is not None:
                    scored_promoted_eligible += 1
                    if fallback_bus == 100.0:
                        scored_promoted_to_100 += 1
                    nearest_direct_m = as_number(fallback.get("nearest_direct_m"))
                    if nearest_direct_m is not None:
                        affected_nearest_direct_count += 1
                        if 250.0 <= nearest_direct_m <= 305.0:
                            corrected_mislabel_count += 1

        if total is None or not subscores:
            continue
        dropped = drop_bus_total(subscores)
        if dropped is None:
            continue

        record_id = f"{postal}-{record_index}"
        current_rank_all.append((record_id, total))
        current_drop_rank_all.append((record_id, dropped))

        if state == "SCORED":
            current_rank_scored.append((record_id, total))
            current_drop_rank_scored.append((record_id, dropped))

        fixed_bus = bus
        if state == "SCORED" and bus == 0.0:
            fallback_wait = as_number(fallback.get("best_expected_wait_min"))
            fallback_bus = score_bus_connectivity(fallback_wait)
            if fallback_bus is not None:
                fixed_bus = fallback_bus

        fixed_total = recompute_total(subscores, fixed_bus)
        if fixed_total is None:
            continue
        fixed_rank_all.append((record_id, fixed_total))
        fixed_drop_rank_all.append((record_id, dropped))
        recomputed_current = recompute_total(subscores)
        if recomputed_current is not None:
            published_vs_recomputed_delta.append(total - recomputed_current)
        if state == "SCORED":
            fixed_rank_scored.append((record_id, fixed_total))
            fixed_drop_rank_scored.append((record_id, dropped))

    if manifest_record_count != processed_records:
        raise ValueError(
            f"processed {processed_records} records but manifest record_count={manifest_record_count}"
        )

    bus_score_buckets = [
        ("(0,20)", 0.0000001, 20.0),
        ("[20,40)", 20.0, 40.0),
        ("[40,60)", 40.0, 60.0),
        ("[60,80)", 60.0, 80.0),
        ("[80,100)", 80.0, 100.0),
        ("100", 100.0, 100.0000001),
    ]
    wait_buckets = [
        ("[0,0.5)", 0.0, 0.5),
        ("[0.5,1)", 0.5, 1.0),
        ("[1,2)", 1.0, 2.0),
        ("[2,5)", 2.0, 5.0),
        ("[5,10)", 5.0, 10.0),
        ("[10,15)", 10.0, 15.0),
        ("[15,+inf)", 15.0, None),
    ]

    current_scored_100_after_fix = scored_bus_exact_100_current + scored_promoted_to_100
    service_exact_lines = []
    for service_count in sorted(service_waits):
        waits = service_waits[service_count]
        service_exact_lines.append(
            (
                f"{service_count},{len(waits)},{fmt(statistics.median(waits), 3)},"
                f"{fmt(statistics.fmean(waits), 3)},{fmt(percentile(waits, 0.90), 3)},"
                f"{fmt(min(waits), 3)},{fmt(max(waits), 3)}"
            )
        )

    bucket_order = ["0", "1", "2", "3", "4", "5", "6-9", "10-14", "15+"]
    service_bucket_lines = []
    for bucket in bucket_order:
        waits = service_bucket_waits.get(bucket, [])
        if not waits:
            continue
        service_bucket_lines.append(
            (
                f"{bucket},{len(waits)},{fmt(statistics.median(waits), 3)},"
                f"{fmt(statistics.fmean(waits), 3)},{fmt(percentile(waits, 0.90), 3)},"
                f"{fmt(percentile(waits, 0.95), 3)}"
            )
        )

    service_count_wait_spearman = spearman_desc(
        [(str(index), service_count) for index, service_count in enumerate(service_counts_for_wait)],
        [(str(index), -wait) for index, wait in enumerate(waits_with_service_count)],
    )

    lines = [
        "P4 Strand 3 bus saturation analysis",
        f"bundle: {BUNDLE_NAME}",
        f"bundle_dir: {bundle_dir}",
        f"manifest_record_count: {manifest_record_count}",
        f"processed_record_count: {processed_records}",
        f"score_shard_count: {shard_count}",
        f"manifest_state_counts: {json.dumps(manifest_state_counts, sort_keys=True)}",
        f"processed_state_counts: {json.dumps(dict(sorted(state_counts.items())), sort_keys=True)}",
        "weights_used_for_counterfactuals: access=0.35,bus=0.20,rain=0.25,heat=0.15,crossing=0.05",
        "bus_curve: score=100 when wait<=2 min, score=0 when wait>=15 min, linear between",
        "",
        "3.1 bus>0 distribution",
        f"- records with numeric subscores.bus: {numeric_bus_records}",
        f"- records with subscores.bus > 0: {len(bus_positive_values)} ({pct(len(bus_positive_values), numeric_bus_records)})",
        f"- bus>0 score summary: {summarize(bus_positive_values)}",
        "- bus>0 score buckets:",
    ]
    lines.extend(sorted_counter_lines(histogram(bus_positive_values, bus_score_buckets), len(bus_positive_values)))
    lines.extend(
        [
            f"- bus exactly 100 among bus>0 records: {bus_positive_exact_100}/{len(bus_positive_values)} ({pct(bus_positive_exact_100, len(bus_positive_values))})",
            f"- bus exactly 100 among all numeric bus records: {bus_exact_100_all_numeric_subscores}/{numeric_bus_records} ({pct(bus_exact_100_all_numeric_subscores, numeric_bus_records)})",
            f"- bus exactly 100 among SCORED records currently: {scored_bus_exact_100_current}/{scored_records} ({pct(scored_bus_exact_100_current, scored_records)})",
            f"- expected_wait_min summary among bus>0 records with numeric wait: {summarize(wait_for_bus_positive)}",
            "- expected_wait_min buckets among bus>0 records:",
        ]
    )
    lines.extend(sorted_counter_lines(histogram(wait_for_bus_positive, wait_buckets), len(wait_for_bus_positive)))
    lines.extend(
        [
            f"- expected_wait_min summary among all records with numeric wait: {summarize(wait_all_numeric)}",
            "",
            "3.2 joint service_count and expected_wait_min",
            f"- records with numeric expected_wait_min and service_count: {len(service_counts_for_wait)}",
            f"- Spearman(service_count, lower expected_wait_min): {fmt(service_count_wait_spearman, 9)}",
            "- bucketed service_count medians:",
            "service_count_bucket,count,median_wait_min,mean_wait_min,p90_wait_min,p95_wait_min",
        ]
    )
    lines.extend(service_bucket_lines)
    lines.extend(
        [
            "- exact service_count medians:",
            "service_count,count,median_wait_min,mean_wait_min,p90_wait_min,min_wait_min,max_wait_min",
        ]
    )
    lines.extend(service_exact_lines)
    lines.extend(["- joint distribution service_count_bucket | wait_bucket:"])
    lines.extend(sorted_counter_lines(joint_bucket_counts, len(service_counts_for_wait)))
    lines.extend(
        [
            "",
            "3.3 P3 C1 fallback-wait promotion and bus==100 saturation",
            f"- SCORED records: {scored_records}",
            f"- SCORED with published bus == 0: {scored_bus_zero} ({pct(scored_bus_zero, scored_records)})",
            f"- eligible SCORED bus==0 records with fallback wait: {scored_promoted_eligible} ({pct(scored_promoted_eligible, scored_records)} of SCORED)",
            f"- eligible fallback records promoted to bus==100: {scored_promoted_to_100} ({pct(scored_promoted_to_100, scored_promoted_eligible)} of eligible)",
            f"- current SCORED bus==100: {scored_bus_exact_100_current} ({pct(scored_bus_exact_100_current, scored_records)})",
            f"- hypothetical-fixed SCORED bus==100: {current_scored_100_after_fix} ({pct(current_scored_100_after_fix, scored_records)})",
            "",
            "3.4 ranking value of bus term",
            f"- records with numeric published totals in full bundle: {numeric_total_records}",
            f"- fully non-null score vectors available for drop-bus computation on full bundle: {len(current_drop_rank_all)}",
            "- note: SCORED_PARTIAL records can have numeric totals but null rain/heat/crossing, so locked-weight drop-bus renormalisation is undefined for them; rank correlations below use fully non-null vectors.",
            f"- SCORED records with fully non-null score vectors: {len(current_rank_scored)}",
            f"- Spearman(current published totals, current drop-bus renormalised totals), full non-null bundle: {fmt(spearman_desc(current_rank_all, current_drop_rank_all), 9)}",
            f"- Spearman(hypothetical-fixed totals, fixed drop-bus renormalised totals), full non-null bundle: {fmt(spearman_desc(fixed_rank_all, fixed_drop_rank_all), 9)}",
            f"- Spearman(current published totals, current drop-bus renormalised totals), SCORED subset: {fmt(spearman_desc(current_rank_scored, current_drop_rank_scored), 9)}",
            f"- Spearman(hypothetical-fixed totals, fixed drop-bus renormalised totals), SCORED subset: {fmt(spearman_desc(fixed_rank_scored, fixed_drop_rank_scored), 9)}",
            f"- published-vs-recomputed-current-total delta summary over full non-null vectors: {summarize(published_vs_recomputed_delta, 6)}",
            "",
            "3.5 alternative bus formulations",
            "- distinct destinations/interchanges reachable: score number/diversity of distinct downstream town centres, MRT interchanges, or key destination clusters reachable within one-seat/low-transfer bus options; needs bus route sequences mapped to stops plus destination taxonomy. Current bus_services/bus_routes ingestion likely has enough route-stop sequence data for service terminal/interchange proxies, but not enough for true passenger destination demand without an added destination taxonomy.",
            "- service-count saturating curve: score unique services near the address with diminishing returns, for example 1 service gives some credit, 3-5 services approaches high credit, and further services add little. Current ingestion has enough unique service counts per stop/radius. It would be easy to implement but risks rewarding many overlapping services on the same corridor.",
            "- wait to single best service rather than pooled wait: score the best individual service headway instead of combined pooled wait across all services. Current ingestion has enough per-service headway values. This avoids automatic saturation from many services, but it measures the best available bus rather than network breadth.",
            "- independent corridors: group reachable services by non-overlapping first-hop direction/corridor and score the count/quality of independent corridors. Current bus_routes may be enough for an approximate first-several-stops corridor grouping, but robust corridor independence likely needs stop geometry/route shape processing beyond the current simple service/headway aggregation.",
            "",
            "3.6 judgement",
            "- P5 should not proceed as a blind fallback-wait promotion if the product goal is ranking discrimination from bus connectivity: the published bus term is already highly saturated, and the P3 C1 promotion would push the SCORED bus==100 fraction even higher.",
            "- A narrow fallback-wait promotion can still be justified as an honesty correction for affected SCORED records where bus evidence exists but published bus is zero; that is a tactical fix, not a durable bus-quality model.",
            "- A durable P5 should be an owner decision to remodel the bus sub-score. That touches the locked scoring contract/weights and should not be bundled into a fallback provenance correction.",
            "",
            "P3 correction note",
            f"- affected fallback-wait records with nearest_direct_m in [250,305]: {corrected_mislabel_count}/{affected_nearest_direct_count} ({pct(corrected_mislabel_count, affected_nearest_direct_count)})",
            "- Because routed_max_m is 250 by construction, those [250,305] records are outside the routed bus scoring radius. The reason string implausible_graph_route_to_datamall_bus_stop_within_direct_radius is a mislabel for them, not evidence of a routing failure. This analysis does not change reason strings.",
        ]
    )
    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle-dir", type=Path, default=BUNDLE_DIR)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    report = analyze(args.bundle_dir)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(report + "\n", encoding="utf-8")
    print(report)
    print(f"wrote_report: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
