# P726 score run confirmation

## root

```text
cwd=C:\sgSHIOK2026
host=PRAWN-E14
```

## objective

```text
First action of every continuation must assert working root exactly C:\sgSHIOK2026.
No scoring/export/rescore/subset/ingest/network without explicit approval.
```

## git before change

```text
52f81df84bf6cb435ea901e0217a81c2e33a2c4c
52f81df84bf6cb435ea901e0217a81c2e33a2c4c	refs/heads/main
?? qa/p10_network_provenance_20260813/
?? qa/p11/d_calibration_w2_0050/
?? qa/p11/d_full_w2_1200/
?? qa/p11/d_pilot_w2_0200_final/
?? qa/p11/d_pilot_w2_0200_retry3/
?? qa/p11/d_pilot_w2_0200_retry4/
?? qa/p11/diffs/
?? qa/p11/subset_0050_ready.parquet
?? qa/p11/subset_0200_ready.parquet
?? qa/p11/wip-worktree.diff
?? qa/p12/
?? qa/p125/
?? qa/p13/
?? qa/p16/
?? qa/p19/
?? qa/p21/
?? qa/p379/
?? qa/p567_baseline/
?? qa/p572_post_refresh/
?? qa/p575_compare/p575_build_delta_report.py
?? qa/p575_compare/p575_delta_report.json
?? qa/p575_compare/p575_partitions/
?? qa/p575_compare/p575_subset_first50_universe.parquet
?? qa/p575_compare/p575_subset_universe.parquet
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
```

## evidence path ignore check

```text
exit_code=1
```

## focused tests

```text
........................................................................ [ 79%]
...................                                                      [100%]
91 passed in 13.95s
```

## direct run.py score refusal

```text
{
  "error": "scoring requires --confirm-score-run after owner approval; do not score to repair frozen-v1 hash mismatches",
  "ok": false
}
exit_code=1
```

## direct module refusal

```text
{
  "error": "scoring requires --confirm-score-run after owner approval; do not score to repair frozen-v1 hash mismatches",
  "ok": false
}
exit_code=1
```

## collect only

```text
517 tests collected in 32.24s
```

## repo integrity

```text
repo_integrity=ok
exit_code=0
```

## diff check

```text
exit_code=0
```

## protected path diff check

```text
exit_code=0
```

## changed files

```text
 M pipeline/scoring_integration.py
 M run.py
 M tests/test_run.py
 M tests/test_scoring_integration.py
?? qa/p10_network_provenance_20260813/
?? qa/p11/d_calibration_w2_0050/
?? qa/p11/d_full_w2_1200/
?? qa/p11/d_pilot_w2_0200_final/
?? qa/p11/d_pilot_w2_0200_retry3/
?? qa/p11/d_pilot_w2_0200_retry4/
?? qa/p11/diffs/
?? qa/p11/subset_0050_ready.parquet
?? qa/p11/subset_0200_ready.parquet
?? qa/p11/wip-worktree.diff
?? qa/p12/
?? qa/p125/
?? qa/p13/
?? qa/p16/
?? qa/p19/
?? qa/p21/
?? qa/p379/
?? qa/p567_baseline/
?? qa/p572_post_refresh/
?? qa/p575_compare/p575_build_delta_report.py
?? qa/p575_compare/p575_delta_report.json
?? qa/p575_compare/p575_partitions/
?? qa/p575_compare/p575_subset_first50_universe.parquet
?? qa/p575_compare/p575_subset_universe.parquet
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
```

## FINDINGS

1. `run.py score` and `python -m pipeline.scoring_integration` previously ran routed scoring at the default five-record limit without any owner-confirmation flag; they now fail closed unless `--confirm-score-run` is present.
2. The output-exists preflight remains earlier than the score confirmation gate, so an accidental command pointed at an existing output still refuses before any scoring or overwrite path.
3. Test collection increased from 513 to 517 because this change adds four score-run guard tests.

## DISAGREEMENTS

1. None.
