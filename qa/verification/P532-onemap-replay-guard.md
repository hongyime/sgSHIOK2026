# P532 OneMap Replay Guard

## Scope

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

Guarded command surface: `scripts/replay_onemap_outliers.py`.

Hard limits observed:
- No scoring, export, rescore, subset run, ingest, network build, or deployment was run.
- `pipeline/config/weights.yaml` was not modified.
- Existing protected QA evidence, `web/public/data/`, `qa/releases/`, and `checksums.json` were not modified.
- Existing `qa/verification/` evidence was not rewritten.

## Command Output

### startup

```text
C:\sgSHIOK2026
Prawn-E14
323dbd32b156fc67d308770c17c837ac14955d78
323dbd32b156fc67d308770c17c837ac14955d78	refs/heads/main
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

### focused tests

Command:

```text
uv run pytest tests/test_replay_onemap_outliers.py tests/test_run.py -q
```

Output:

```text
..........................                                               [100%]
26 passed in 4.45s
```

### protected diff guard

Command:

```text
git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases qa/p11
```

Output:

```text
```

### check-ignore

Command:

```text
git check-ignore -v qa/verification/P532-onemap-replay-guard.md; Write-Output "exit_code=$LASTEXITCODE"
```

Output:

```text
exit_code=1
```

### collect-only count

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 5
```

Output:

```text
tests/test_triage_onemap_outliers.py::test_validation_subset_rows_supports_plausible_distance_transit_slices
tests/test_triage_onemap_outliers.py::test_routed_vs_validation_direct_sanity
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields

430 tests collected in 8.93s
```

### repository integrity

Command:

```text
python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
exit_code=0
```

## FINDINGS

1. `scripts/replay_onemap_outliers.py` was not report-only: the CLI loaded scoring context, called `score_postal_gdf()`, and wrote the historical default `qa/onemap_outlier_replay_20260802.json` from a bare command.
2. The guarded command now requires `--confirm-outlier-replay` and explicit `--output` before any replay scoring or report write can happen.

## DISAGREEMENTS

1. None.
