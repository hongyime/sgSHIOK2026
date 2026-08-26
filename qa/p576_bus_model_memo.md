# P576 Bus Model Decision Memo

Working root: C:\sgSHIOK2026
Date: 2026-08-26
Status: DECIDED (conservative branch confirmed by P575 evidence)

## Decision

Adopt **routed-or-null** semantics for `subscores.bus` in all future scoring runs (subset gates onward, then the one full batch):

1. **Routed case**: where scoring verifies a graph route from the origin to a DataMall bus stop under the post-P574 repaired stop attachment, publish the computed routed bus subscore.
2. **Null case**: otherwise publish explicit `null` for `subscores.bus`. No fabricated or substituted value. The composite omits the bus term and records the omitted-weight mass in `provenance.subscore_status` so consumers can distinguish "bus unavailable" from "bus scored 0".
3. **Fallback stays evidence-only**: `provenance.direct_bus_fallback` continues to describe rejected candidates only. It must never be promoted into a positive bus subscore (decisions.md P3/P6 thread; Section 10 non-goal).
4. **Weights untouched**: locked `pipeline/config/weights.yaml` keeps bus at 0.20. This decision changes bus *semantics*, not the composite weighting.

## Evidence basis (P575)

- Subset (frozen sorted-first 1200) vs published bundle: bus==0 count fell **208 -> 174**.
- 34 records gained positive bus; **23 of them carry no fallback provenance** (genuinely routed through the repaired attachment); 11 gained positive bus while retaining fallback provenance documenting other rejected candidates.
- Zero records regressed positive-bus -> zero. Median |total delta| 0.0; max 22.8 concentrated in defect-fix rows (autopsy `018936`: phantom "Opp Downtown Stn" attachment replaced by real route to "Downtown Stn Exit E", bus 0 -> 100).
- One honesty improvement: `059804` flipped SCORED(87.7, phantom MRT route) -> NO_TRANSIT_IN_RANGE; enters the Wave 4 partial-evidence scope rather than carrying a fabricated score.
- Determinism: 50-record slice scored twice, outputs byte-identical (normalized SHA256 equal across runs A/B).
- Cross-validation: two independent delta computations (worker-produced `p575_delta_summary_fresh_20260826.json` and orchestrator's `p575_delta_report.json`) agree on every headline metric.

## Consequences

- Full-universe bus==0 population should shrink materially below the documented 39,786/95,157 (P3); exact movement measured at G1 from the full batch.
- Records that previously scored via phantom routes may flip to NO_TRANSIT_IN_RANGE (P573 subset showed 1/1200); these enter Wave 4 partial-evidence handling instead of inflating scores.
- Measured repaired-graph throughput (~14 s/record subset observation) makes the legacy full-batch duration extrapolation obsolete; the G1 package must project from measured chunk timings honestly.

## Reversibility

Semantics live behind the scoring integration surface touched by P574/P577; reverting requires only a code revert plus rebuild-free rescoring. Weights and schema remain untouched.
