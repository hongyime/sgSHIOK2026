# P475 check safe boundary

Date: 2026-08-22
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Free-tier task-runner safety hardening only.

No scoring, export, rescore, subset run, ingest, network build, deployment, input rebuild, public-data mutation, protected QA mutation, or weights.yaml edit was performed.

## Evidence commands

```text
PS C:\sgSHIOK2026> $PWD.Path; hostname; git rev-parse HEAD; git status --short
C:\sgSHIOK2026
Prawn-E14
d3031da141703fc7f82446d8e79d2b223ee13fe6
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
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
```

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_run.py -q -p no:cacheprovider
..............                                                           [100%]
14 passed in 3.78s
```

```text
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "EXIT=$LASTEXITCODE"
repo_integrity=ok
EXIT=0
```

```text
PS C:\sgSHIOK2026> git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4 qa/releases
```

## FINDINGS

1. `run.py check` was still allowed to dispatch the network/hash upstream probe even though the task-runner safe-report list only names `check --freshness-only` and `check --geospatial-discovery-only` as zero-mutation reports. The wrapper now fails closed unless exactly one safe report flag is present; maintainers who intentionally want the low-level upstream probe can still invoke `uv run python -m pipeline.fetch check` directly.

## DISAGREEMENTS

1. None.
