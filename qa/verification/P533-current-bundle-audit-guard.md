# P533 Current Bundle Audit Guard

## Scope

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

Guarded command surface: `scripts/audit_current_bundle.py`.

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
75dd3bd9348d345fe33fda04cf7845db84141b29
75dd3bd9348d345fe33fda04cf7845db84141b29	refs/heads/main
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
uv run pytest tests/test_audit_current_bundle.py tests/test_run.py -q
```

Output:

```text
.......................                                                  [100%]
23 passed in 15.11s
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
git check-ignore -v qa/verification/P533-current-bundle-audit-guard.md; Write-Output "exit_code=$LASTEXITCODE"
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

433 tests collected in 15.11s
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

1. `scripts/audit_current_bundle.py` had two modes under one CLI: `--state-only` is read-only, but the default path can load scoring context for sampled replay diagnostics and write `qa/current_bundle_state_report.json`.
2. The read-only `--state-only` mode remains available without output or confirmation.
3. Non-state audits now require explicit `--output`, and replay audits require `--confirm-replay-audit` before active-bundle lookup, scoring-context loading, or report writes.

## DISAGREEMENTS

1. None.
