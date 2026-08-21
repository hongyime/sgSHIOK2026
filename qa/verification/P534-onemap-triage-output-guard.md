# P534 OneMap Triage Output Guard

## Scope

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

Guarded command surface: `scripts/triage_onemap_outliers.py`.

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
ef86a8d02619a0b1b0a98d794cc0da8a1eef4a49
ef86a8d02619a0b1b0a98d794cc0da8a1eef4a49	refs/heads/main
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
uv run pytest tests/test_triage_onemap_outliers.py tests/test_run.py -q
```

Output:

```text
......................................                                   [100%]
38 passed in 1.96s
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
git check-ignore -v qa/verification/P534-onemap-triage-output-guard.md; Write-Output "exit_code=$LASTEXITCODE"
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
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

435 tests collected in 9.69s
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

### whitespace

Command:

```text
git diff --check; Write-Output "exit_code=$LASTEXITCODE"
```

Output:

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

## FINDINGS

1. `scripts.triage_onemap_outliers` is report-only, but a bare CLI invocation could write five historical QA artifact paths under `qa/`.
2. The command now requires explicit paths for `--output`, `--geojson-output`, `--missing-bus-priority-geojson-output`, `--overpermissive-priority-geojson-output`, and `--validation-subset-priority-geojson-output` before reading inputs or writing generated artifacts.

## DISAGREEMENTS

1. None.
