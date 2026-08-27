# P584 no-transit score-batch load preservation

Date: 2026-08-28
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

No scoring, export, rescore, subset run, ingest, network build, upstream probe, public-data write, protected QA mutation, deployment, or locked-weight change was performed.

## Startup guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

P580-P583 pinned assembly, browser rendering, export preservation, and manifest/validation semantics for `NO_TRANSIT_IN_RANGE` records that carry walk evidence. P584 pins the score-batch re-export loading path: `load_score_batch_records()` calls `repick_best_transit_from_route_options()` on every chunk record, so a path-bearing no-transit chunk must remain unchanged when loaded for a future `--records-dir` export.

The helper already returned no-transit records unchanged; P584 adds regression coverage for the richer P580 shape and the actual loader path.

## Focused loader tests

Command:

```text
uv run pytest tests/test_export.py::test_load_score_batch_records_preserves_no_transit_walk_evidence tests/test_export.py::test_load_score_batch_records_roundtrips_records_without_candidates tests/test_export.py::test_load_score_batch_records_reads_chunks_in_order_and_rejects_duplicates -q
```

Output:

```text
...                                                                      [100%]
3 passed in 25.82s
```

## Export test file

Command:

```text
uv run pytest tests/test_export.py -q
```

Output:

```text
.........................................                                [100%]
41 passed in 310.56s (0:05:10)
```

## Python collection

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 5
```

Output:

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

442 tests collected in 113.32s (0:01:53)
```

The count moved from 441 to 442 because P584 adds one score-batch loader regression test.

## Repository integrity

Command:

```text
python C:\sgSHIOK2026\scripts\check_repo_integrity.py; Write-Output "repo_integrity_exit=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
repo_integrity_exit=0
```

## Evidence ignore and protected path checks

Command:

```text
git check-ignore -v C:\sgSHIOK2026\qa\verification\P584-no-transit-score-batch-load.md; Write-Output "check_ignore_exit=$LASTEXITCODE"
git diff --name-only -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\releases C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11; Write-Output "protected_diff_exit=$LASTEXITCODE"
```

Output:

```text
check_ignore_exit=1
protected_diff_exit=0
```

## FINDINGS

1. `load_score_batch_records()` already preserves P580-style path-bearing `NO_TRANSIT_IN_RANGE` chunks because the repick shim returns no-transit records unchanged.
2. Before P584, the loader path was only covered for legacy chunks without candidates and for scored/partial repick cases, not for scoreless no-transit records with walk evidence.
3. The new regression proves the loader preserves null locked score fields, `best_node`, `paths`, `route_options.best_transit`, and the no-transit provenance reason.

## DISAGREEMENTS

1. None.
