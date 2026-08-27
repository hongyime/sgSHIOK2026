# P585 no-transit record-shape validation

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

P583 made geometry mandatory for exported score records with `paths`. P585 tightens the score-record shape itself: a path-bearing `NO_TRANSIT_IN_RANGE` record must also carry `best_node` and `exposure_gaps`. That keeps the P580/P581 contract coherent for browser inspection while preserving scoreless records with no paths.

## Focused validation tests

Command:

```text
uv run pytest tests/test_export.py::test_export_static_artifacts_preserves_no_transit_walk_evidence tests/test_export.py::test_validate_requires_geometry_for_no_transit_walk_evidence tests/test_export.py::test_validate_rejects_incomplete_no_transit_walk_evidence_records -q
```

Output:

```text
...                                                                      [100%]
3 passed in 45.48s
```

## Export test file

Command:

```text
uv run pytest tests/test_export.py -q
```

Output:

```text
..........................................                               [100%]
42 passed in 353.60s (0:05:53)
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

443 tests collected in 59.90s
```

The count moved from 442 to 443 because P585 adds one export validation regression test.

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
git check-ignore -v C:\sgSHIOK2026\qa\verification\P585-no-transit-record-shape-validation.md; Write-Output "check_ignore_exit=$LASTEXITCODE"
git diff --name-only -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\releases C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11; Write-Output "protected_diff_exit=$LASTEXITCODE"
```

Output:

```text
check_ignore_exit=1
protected_diff_exit=0
```

## FINDINGS

1. After P583, validation required geometry when `paths` was present, but still allowed path-bearing `NO_TRANSIT_IN_RANGE` records with missing `best_node` or missing `exposure_gaps`.
2. A path-bearing no-transit record is only browser-inspectable if it carries the selected transit node and exposure-gap payload alongside the path metrics.
3. `validate_score_record()` now rejects incomplete path-bearing no-transit records while leaving all-null scoreless no-transit records available for disconnected/no-candidate cases.

## DISAGREEMENTS

1. None.
