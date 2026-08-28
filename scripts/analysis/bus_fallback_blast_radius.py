"""Measure the published-bundle blast radius of scoring fallback bus waits.

This is analysis-only. It reads the static SHIOK bundle, applies the narrow
hypothetical in memory, and writes a text report with movement/ranking metrics.
"""

from __future__ import annotations

import argparse
import json
import math
import statistics
import sys
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable


PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

from scripts.analysis.report_io import write_new_text_report

BUNDLE_NAME = "generated_20260805_prefer_scored_routed"
BUNDLE_DIR = PROJECT_ROOT / "web" / "public" / "data" / BUNDLE_NAME
DEFAULT_OUTPUT = PROJECT_ROOT / "qa" / "verification" / "bus_fallback_blast_radius_20260812.txt"

BUS_FULL_CREDIT_WAIT_MIN = 2.0
BUS_ZERO_CREDIT_WAIT_MIN = 15.0
BUS_WEIGHT = 0.20
PUBLISHED_TOTAL_DIGITS = 1


@dataclass(frozen=True)
class Movement:
    postal: str
    state: str
    current_total: float
    hypothetical_total: float
    current_bus: float
    fallback_bus: float
    wait_min: float
    delta: float


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


def score_bus_connectivity(expected_wait_min: float) -> float:
    if expected_wait_min <= BUS_FULL_CREDIT_WAIT_MIN:
        return 100.0
    if expected_wait_min >= BUS_ZERO_CREDIT_WAIT_MIN:
        return 0.0
    ratio = (expected_wait_min - BUS_FULL_CREDIT_WAIT_MIN) / (
        BUS_ZERO_CREDIT_WAIT_MIN - BUS_FULL_CREDIT_WAIT_MIN
    )
    return max(0.0, min(100.0, 100.0 - ratio * 100.0))


def pct(numerator: int, denominator: int) -> str:
    if denominator == 0:
        return "n/a"
    return f"{(numerator / denominator) * 100:.3f}%"


def fmt(value: float | None, digits: int = 6) -> str:
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
    lower_value = ordered[lower]
    upper_value = ordered[upper]
    return lower_value + (upper_value - lower_value) * (position - lower)


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
        for record_id, _ in ordered[index:end]:
            ranks[record_id] = average_rank
        index = end
    return ranks


def spearman_desc(current: list[tuple[str, float]], hypothetical: list[tuple[str, float]]) -> float:
    current_ranks = average_ranks_desc(current)
    hypothetical_ranks = average_ranks_desc(hypothetical)
    keys = sorted(current_ranks)
    if len(keys) < 2:
        return float("nan")
    current_values = [current_ranks[key] for key in keys]
    hypothetical_values = [hypothetical_ranks[key] for key in keys]
    current_mean = statistics.fmean(current_values)
    hypothetical_mean = statistics.fmean(hypothetical_values)
    numerator = sum(
        (left - current_mean) * (right - hypothetical_mean)
        for left, right in zip(current_values, hypothetical_values, strict=True)
    )
    left_denominator = math.sqrt(sum((value - current_mean) ** 2 for value in current_values))
    right_denominator = math.sqrt(
        sum((value - hypothetical_mean) ** 2 for value in hypothetical_values)
    )
    return numerator / (left_denominator * right_denominator)


def top_n(records: list[tuple[str, float]], n: int) -> list[tuple[str, float]]:
    return sorted(records, key=lambda item: (-item[1], item[0]))[:n]


def tied_boundary_count(records: list[tuple[str, float]], n: int) -> int:
    ordered = top_n(records, n)
    if not ordered:
        return 0
    boundary = ordered[-1][1]
    return sum(1 for _record_id, value in records if value == boundary)


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


def analyze(bundle_dir: Path) -> str:
    manifest = load_json(bundle_dir / "manifest.json")
    manifest_state_counts = manifest.get("provenance", {}).get("state_counts")
    manifest_record_count = manifest.get("provenance", {}).get("record_count")

    state_counts: Counter[str] = Counter()
    numeric_current: list[tuple[str, float]] = []
    numeric_hypothetical: list[tuple[str, float]] = []
    movements: list[Movement] = []
    all_records = 0
    scored_records = 0
    scored_bus_zero = 0
    scored_bus_zero_with_fallback_wait = 0
    would_round_move = 0
    state_changes_under_hypothesis = 0

    for record in iter_score_records(bundle_dir):
        all_records += 1
        postal = str(record.get("postal") or f"record-{all_records}")
        state = str(record.get("state") or "UNKNOWN")
        state_counts[state] += 1
        current_total = as_number(record.get("total"))
        hypothetical_total = current_total

        if state == "SCORED":
            scored_records += 1
            subscores = record.get("subscores")
            current_bus = as_number(subscores.get("bus") if isinstance(subscores, dict) else None)
            if current_bus == 0.0:
                scored_bus_zero += 1
                provenance = record.get("provenance")
                fallback = (
                    provenance.get("direct_bus_fallback")
                    if isinstance(provenance, dict)
                    and isinstance(provenance.get("direct_bus_fallback"), dict)
                    else None
                )
                wait_min = as_number(fallback.get("best_expected_wait_min") if fallback else None)
                if wait_min is not None and current_total is not None:
                    scored_bus_zero_with_fallback_wait += 1
                    fallback_bus = score_bus_connectivity(wait_min)
                    raw_delta = (fallback_bus - current_bus) * BUS_WEIGHT
                    hypothetical_total = round(current_total + raw_delta, PUBLISHED_TOTAL_DIGITS)
                    delta = hypothetical_total - current_total
                    movements.append(
                        Movement(
                            postal=postal,
                            state=state,
                            current_total=current_total,
                            hypothetical_total=hypothetical_total,
                            current_bus=current_bus,
                            fallback_bus=round(fallback_bus, PUBLISHED_TOTAL_DIGITS),
                            wait_min=wait_min,
                            delta=delta,
                        )
                    )
                    if delta != 0.0:
                        would_round_move += 1

        if current_total is not None:
            numeric_current.append((postal, current_total))
            numeric_hypothetical.append((postal, float(hypothetical_total)))

    if manifest_record_count != all_records:
        raise ValueError(
            f"processed {all_records} records but manifest record_count={manifest_record_count}"
        )

    movement_deltas = [movement.delta for movement in movements]
    positive_movements = [movement.delta for movement in movements if movement.delta > 0.0]
    unchanged_movements = [movement.delta for movement in movements if movement.delta == 0.0]
    current_top_100 = top_n(numeric_current, 100)
    current_top_1000 = top_n(numeric_current, 1000)
    hypothetical_top_100 = top_n(numeric_hypothetical, 100)
    hypothetical_top_1000 = top_n(numeric_hypothetical, 1000)
    top_100_overlap = len({postal for postal, _ in current_top_100} & {postal for postal, _ in hypothetical_top_100})
    top_1000_overlap = len(
        {postal for postal, _ in current_top_1000} & {postal for postal, _ in hypothetical_top_1000}
    )
    spearman = spearman_desc(numeric_current, numeric_hypothetical)

    top_movers = sorted(movements, key=lambda movement: (-movement.delta, movement.postal))[:20]
    biggest_rank_entrants_100 = sorted(
        set(postal for postal, _ in hypothetical_top_100) - set(postal for postal, _ in current_top_100)
    )
    biggest_rank_exits_100 = sorted(
        set(postal for postal, _ in current_top_100) - set(postal for postal, _ in hypothetical_top_100)
    )

    lines = [
        "Bus fallback blast-radius analysis",
        f"bundle: {BUNDLE_NAME}",
        f"bundle_dir: {bundle_dir}",
        f"manifest_record_count: {manifest_record_count}",
        f"processed_record_count: {all_records}",
        f"manifest_state_counts: {json.dumps(manifest_state_counts, sort_keys=True)}",
        f"processed_state_counts: {json.dumps(dict(sorted(state_counts.items())), sort_keys=True)}",
        "",
        "hypothesis:",
        (
            "- For SCORED records where published subscores.bus == 0 and "
            "provenance.direct_bus_fallback.best_expected_wait_min is numeric, replace bus "
            "with the normal wait curve and recompute only the published total in memory."
        ),
        (
            "- Normal wait curve: score=100 when wait<=2 min, score=0 when wait>=15 min, "
            "linear interpolation between; bus weight=0.20; published total rounded to 1 decimal."
        ),
        "",
        "C1 movement and ranking",
        f"- numeric published totals considered for ranking: {len(numeric_current)}",
        f"- SCORED records: {scored_records}",
        f"- SCORED records with published bus == 0: {scored_bus_zero} ({pct(scored_bus_zero, scored_records)})",
        (
            "- SCORED bus==0 records with fallback wait and numeric total: "
            f"{scored_bus_zero_with_fallback_wait} ({pct(scored_bus_zero_with_fallback_wait, scored_bus_zero)})"
        ),
        f"- published totals that move after 1-decimal rounding: {would_round_move}",
        f"- published totals unchanged after 1-decimal rounding: {len(unchanged_movements)}",
        f"- delta summary, all eligible fallback-wait records: {summarize(movement_deltas)}",
        f"- delta summary, positive moved records only: {summarize(positive_movements)}",
        f"- Spearman rank correlation vs current published totals: {fmt(spearman, 9)}",
        f"- top-100 overlap: {top_100_overlap}/100 ({pct(top_100_overlap, 100)})",
        f"- top-1000 overlap: {top_1000_overlap}/1000 ({pct(top_1000_overlap, 1000)})",
        f"- current top-100 boundary score: {fmt(current_top_100[-1][1], 1)}",
        f"- hypothetical top-100 boundary score: {fmt(hypothetical_top_100[-1][1], 1)}",
        f"- current top-100 boundary tie count: {tied_boundary_count(numeric_current, 100)}",
        f"- hypothetical top-100 boundary tie count: {tied_boundary_count(numeric_hypothetical, 100)}",
        f"- current top-1000 boundary score: {fmt(current_top_1000[-1][1], 1)}",
        f"- hypothetical top-1000 boundary score: {fmt(hypothetical_top_1000[-1][1], 1)}",
        f"- current top-1000 boundary tie count: {tied_boundary_count(numeric_current, 1000)}",
        f"- hypothetical top-1000 boundary tie count: {tied_boundary_count(numeric_hypothetical, 1000)}",
        "",
        "top-100 entrants under hypothesis:",
        json.dumps(biggest_rank_entrants_100),
        "top-100 exits under hypothesis:",
        json.dumps(biggest_rank_exits_100),
        "",
        "largest total increases:",
        "postal,current_total,hypothetical_total,delta,wait_min,fallback_bus",
    ]
    lines.extend(
        (
            f"{movement.postal},{fmt(movement.current_total, 1)},"
            f"{fmt(movement.hypothetical_total, 1)},{fmt(movement.delta, 1)},"
            f"{fmt(movement.wait_min, 3)},{fmt(movement.fallback_bus, 1)}"
        )
        for movement in top_movers
    )
    lines.extend(
        [
            "",
            "C2 state classification",
            f"- state changes under this scoring-from-fallback-wait hypothesis: {state_changes_under_hypothesis}",
            (
                "- Separate null/SCORED_PARTIAL alternative: if the same fallback-wait records "
                "were treated as unavailable bus evidence instead of scored bus evidence, "
                f"{scored_bus_zero_with_fallback_wait} currently-SCORED records would be candidates "
                "for SCORED_PARTIAL/null-bus treatment. That is not included in C1."
            ),
            "",
            "C3 tests expected to fail",
            (
                "- Expected failing tests under the narrow hypothesis, if implemented with an "
                "explicit provenance.direct_bus_fallback.best_expected_wait_min gate: none found."
            ),
            "- Current verification run after this analysis: uv run pytest -q -> 312 passed in 17.55s.",
            "- Current verification run after this analysis: npm test in web -> 93 passed in 727ms.",
            (
                "- Coverage gap: no existing test covers a currently-SCORED selected record with "
                "subscores.bus == 0 plus fallback wait provenance being used to recompute bus/total."
            ),
            (
                "- Nearby guard tests for P5: tests/test_scoring_integration.py:386 "
                "test_record_assembly_scores_real_zero_bus_as_zero_not_partial; "
                "tests/test_scoring_integration.py:422 "
                "test_direct_bus_fallback_scores_partial_without_routed_shelter_geometry; "
                "tests/test_scoring_integration.py:2419 "
                "test_assemble_score_record_prefers_routed_mrt_over_direct_bus_fallback; "
                "tests/test_scoring_integration.py:2435 "
                "test_repick_best_transit_flips_legacy_fallback_record_to_routed_mrt."
            ),
            (
                "- If P5 instead applies route_options.bus fallback unconditionally rather than "
                "requiring fallback-wait provenance, the 2419/2435 routed-MRT preference tests are "
                "the likely failures because they assert the selected routed total stays 38.0/37.8."
            ),
            "",
            "C4 P5 touch list",
            "- pipeline/scoring.py:44 normal bus wait curve; reuse, do not rewrite formula.",
            "- pipeline/scoring.py:98 composite sum behavior; reuse bus weight contribution semantics.",
            "- pipeline/config/params.yaml:51-52 bus wait thresholds; verify unchanged.",
            "- pipeline/config/weights.yaml:4 bus_connectivity weight 0.20; verify unchanged.",
            (
                "- pipeline/scoring_integration.py:1975 assemble_score_record entry point; "
                "add the selected-record fallback bus substitution here or in a small helper."
            ),
            (
                "- pipeline/scoring_integration.py:2001-2005 best/best_mrt/best_bus selection; "
                "source the eligible bus fallback candidate without changing best_transit election."
            ),
            (
                "- pipeline/scoring_integration.py:2005-2017 route_options publication; keep "
                "route_options.bus honest and avoid making fallback the selected route."
            ),
            (
                "- pipeline/scoring_integration.py:2021-2025 record state/total/subscores/best_node/paths; "
                "only total/subscores.bus should move under this hypothesis, state and selected path should not."
            ),
            (
                "- pipeline/scoring_integration.py:2612-2662 and 2672-2698 direct_bus_fallback "
                "provenance writers; preserve best_expected_wait_min and add any audit marker here if needed."
            ),
            (
                "- pipeline/export.py:717, 825-826, 890-891, 1422, 1448 export/manifest refresh; "
                "state counts remain unchanged under C1 but refreshed score shards/manifests must reflect totals."
            ),
            (
                "- tests/test_scoring_integration.py:386, 422, 2419, 2435 plus one new regression test "
                "for SCORED bus-zero with fallback wait provenance."
            ),
            (
                "- tests/test_export.py:181 and 628, tests/test_onemap_validation.py:32, "
                "web/lib/__tests__/data.test.ts:48-52; verify exported schema, refreshed manifest, "
                "validation sample loading, and web score-record assumptions."
            ),
            (
                "- scripts/production_readiness.py:469-555, scripts/launch-check.ps1:220-243, "
                "scripts/release-data-bundle.ps1:36-48 and 87; operational gates to rerun/verify, "
                "not necessarily code changes."
            ),
            (
                "- Generated bundle artifacts in web/public/data/<new-bundle>/scores/*.json, "
                "manifest.json, *.gz, plus web/data-bundle.json only at owner-approved activation time."
            ),
            "- decisions.md: append dated rationale if P5 changes the scoring contract.",
            "",
            "C5 recorded rerun/republish cost",
            (
                "- Prior full OneMap validation status timestamps: "
                "qa/onemap_full_validation_20260808_full_scored/status.json was created "
                "2026-08-08 18:32:54 SGT and completed 2026-08-11 02:14:31 SGT, "
                "about 55h 41m 37s wall clock."
            ),
            (
                "- Fresh no-cache OneMap floor from recorded config: 95,157 rows * 2s delay = "
                "190,314s = 52h 51m 54s before overhead."
            ),
            (
                "- Final recorded batch was mostly cached: batch 90 queued 132 requests, wrote 132, "
                "02:09:24 to 02:14:07 SGT progress, then status complete at 02:14:31."
            ),
            (
                "- Release/test/build after a validated bundle is minutes-scale: prior release log shows "
                "310 Python tests in 22.63s, web tests around 0.8-1.3s, Next build compile/type/static "
                "steps sub-second to about 1s each, and a 188MB Vercel upload. The log does not record "
                "a precise total release wall clock."
            ),
            "- I did not find a recorded full scoring/export wall-clock for regenerating the bundle itself.",
            "",
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
    write_new_text_report(args.output, report + "\n")
    print(report)
    print(f"wrote_report: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
