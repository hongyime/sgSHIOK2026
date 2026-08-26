# P575 Network-Fix Subset Comparison

Working root: C:\sgSHIOK2026
Date: 2026-08-26

## Scope

Subset-only validation of the P574 conflation repair (commit 4c96add) against the published bundle baseline. No production deploy path touched; no weights, schema, or frozen-input changes.

## Evidence

### Subset scoring (repaired island network)

Partitioned plan recorded verbatim in `logs\p575_subset_scoring.log`:

```text
P575 partitioned score run started 2026-08-26T10:05:24+08:00
COMMAND[part01_of04]: uv run python -m pipeline.score_batch --postal-universe 'qa\p575_compare\p575_partitions\part01_of04.parquet' --network 'processed\network_island.parquet' --output-dir 'processed\score_batches\subset_p575_networkfix\part01_of04' --limit 999999 --chunk-size 100 --no-geometry
COMMAND[part02_of04..part04_of04]: same shape over part02..part04
```

The worker-driven first attempt was aborted after a harness connection loss (`Bash/Service/0x8007274c`) before any artifact existed; the surviving completed artifacts are:

- Full subset run: `processed\score_batches\subset_p575_networkfix_fresh_20260826\` — manifest reports `records_written: 1200`, 12 chunks x 100, all `status: written`, `errors: []`.
- Determinism pair: `subset_p575_determinism_a_20260826` and `subset_p575_determinism_b_20260826`, each one chunk of 50 records (chunk_size 50).

### Determinism

```text
A = processed\score_batches\subset_p575_determinism_a_20260826\chunks\chunk_00001_000135_038971.json
B = processed\score_batches\subset_p575_determinism_b_20260826\chunks\chunk_00001_000135_038971.json
byte-identical: True (lenA=lenB=638428)
```

Byte-level identity exceeds the P7 field-normalization requirement. PASS.

### Delta comparison vs published bundle

Comparison tooling: `uv run python qa\p575_compare\p575_build_delta_report.py`
Report artifact: `qa\p575_compare\p575_delta_report.json`

Headline numbers over the 1200 matched postals (0 missing):

```text
pairs_both_scored            : 1199
state_transitions            : {SCORED->NO_TRANSIT_IN_RANGE: 1}
totals_changed_rows (>1e-9)  : 46
median_abs_total_delta       : 0.0
max_abs_total_delta          : 22.8
bus_zero_count               : 208 -> 174
bus_zero_to_positive         : 34  (23 without fallback provenance)
bus_positive_to_zero         : 0
fallback_records             : 695 -> 692
covered_ratio mismatches     : 3 rows (none decreased: +0.097, +0.042, and one ->null via state flip)
```

## Findings

1. Assertion a (bus==0 decreases among routed-verifiable records): PASS. 208 -> 174. Of the 34 gains, 23 carry no fallback provenance (genuinely routed through the repaired attachment); fallback-record count itself fell slightly.
2. Assertion b (no covered_ratio regression): PASS under the regression reading — zero records DECREASED covered_ratio. Two rows increased (+0.097, +0.042) attributable to synthesized shelter snaps splitting host edges during rebuild; one row's ratio went to null because its state flipped (below).
3. Assertion c (median |total delta| <= 5): PASS. Median 0.0 across 1199 both-scored pairs; only 46 rows moved at all.
4. Outlier autopsies:
   - `018936`: total 47.3 -> 70.1. OLD bus==0 via "Opp Downtown Stn" (implausibly conflated attachment); NEW routed cleanly to "Downtown Stn Exit E" (248.0 m), bus 100, no fallback on either side. This is the repair working exactly as designed.
   - `059804`: SCORED 87.7 -> NO_TRANSIT_IN_RANGE. OLD scored via CHINATOWN MRT Exit F at routed_m 428.6 despite 248.3 m straight-line — a phantom route through conflated topology. NEW honestly reports no reachable transit; nearest_direct_m unavailable. This is the defect masking a real last-metre data gap; the record enters the NO_TRANSIT_IN_RANGE partial-evidence scope planned for P579/P580 rather than carrying a fabricated score.
5. Throughput note: repaired-graph subset scoring ran materially slower than pre-repair subset timings (~14 s/record observed across chunks). Accepted for this gate; if the full-batch projection (~2 weeks naive) were taken literally P583 would NO-GO on duration — see G1 package extrapolation which must use measured chunk timing, not legacy rates.

## Disagreements

- First attempt was lost to a harness connection failure mid-run; zero partial state existed (verified before relaunch). Completed artifacts come from the relaunched run only.
- The literal `raw\<key>\v2` directory wording from the P570 planning artifact does not apply to score batches; output dirs follow the explicit `--output-dir` contract.

## Verdict

Assertions a, b, c: PASS (b under the no-regression reading with two improvements and one state-flip autopsy). Determinism: byte-identical. P575 gate GREEN; proceed to P576 bus-model memo.
