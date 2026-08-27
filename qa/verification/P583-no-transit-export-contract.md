# P583 no-transit export contract

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

P580 introduced path-bearing `NO_TRANSIT_IN_RANGE` records, P581 made the browser render them, and P582 pinned static export preservation. P583 updates the exported bundle contract so a future manifest states that `NO_TRANSIT_IN_RANGE` records may carry walk evidence while remaining scoreless. It also tightens validation: any score record with `paths` now requires a matching geometry shard, even if `total` and `subscores` are null.

## Focused export contract tests

Command:

```text
uv run pytest tests/test_export.py::test_export_static_artifacts_preserves_no_transit_walk_evidence tests/test_export.py::test_validate_requires_geometry_for_no_transit_walk_evidence tests/test_export.py::test_export_static_artifacts_writes_candidates_into_score_and_geom_shards -q
```

Output:

```text
...                                                                      [100%]
3 passed in 47.90s
```

## Export test file

Command:

```text
uv run pytest tests/test_export.py -q
```

Output:

```text
........................................                                 [100%]
40 passed in 300.77s (0:05:00)
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

441 tests collected in 107.72s (0:01:47)
```

The count moved from 440 to 441 because P583 adds one export-validator regression test.

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
git check-ignore -v C:\sgSHIOK2026\qa\verification\P583-no-transit-export-contract.md; Write-Output "check_ignore_exit=$LASTEXITCODE"
git diff --name-only -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\releases C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11; Write-Output "protected_diff_exit=$LASTEXITCODE"
```

Output:

```text
check_ignore_exit=1
protected_diff_exit=0
```

## FINDINGS

1. The export manifest previously documented required and optional score-record fields but did not state the P580 `NO_TRANSIT_IN_RANGE` semantics: score fields remain null, while walk evidence may be present beyond the locked range.
2. `validate_static_artifacts()` previously required geometry only for `SCORED` and `SCORED_PARTIAL` records. That was too narrow after P580 because a scoreless no-transit record with non-null `paths` also needs a geometry shard for browser inspection.
3. Validation now follows the evidence shape: any score record with `paths` requires geometry, regardless of score state.

## DISAGREEMENTS

1. None.
