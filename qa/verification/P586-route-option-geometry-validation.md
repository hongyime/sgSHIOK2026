# P586 route-option geometry validation

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

P583-P585 made top-level path-bearing score records require geometry and coherent no-transit walk evidence. P586 closes the analogous switchable route-option gap: if `route_options.mrt_lrt` or `route_options.bus` advertises `paths`, the geometry shard must also carry a matching `route_options` entry. `route_options.best_transit` is excluded because it can use the top-level geometry.

## Focused route-option validation tests

Command:

```text
uv run pytest tests/test_export.py::test_validate_requires_geometry_for_switchable_route_options tests/test_export.py::test_export_static_artifacts_preserves_no_transit_walk_evidence tests/test_export.py::test_export_static_artifacts_writes_candidates_into_score_and_geom_shards -q
```

Output:

```text
...                                                                      [100%]
3 passed in 63.89s (0:01:03)
```

## Export test file

Command:

```text
uv run pytest tests/test_export.py -q
```

Output:

```text
...........................................                              [100%]
43 passed in 312.42s (0:05:12)
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

444 tests collected in 112.73s (0:01:52)
```

The count moved from 443 to 444 because P586 adds one route-option validation regression test.

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
git check-ignore -v C:\sgSHIOK2026\qa\verification\P586-route-option-geometry-validation.md; Write-Output "check_ignore_exit=$LASTEXITCODE"
git diff --name-only -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\releases C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11; Write-Output "protected_diff_exit=$LASTEXITCODE"
```

Output:

```text
check_ignore_exit=1
protected_diff_exit=0
```

## FINDINGS

1. Static validation already required top-level geometry for records with `paths`, but did not require matching geometry for switchable `route_options` that also carried `paths`.
2. That could let a score shard advertise a switchable MRT/LRT or bus walk that the geometry shard could not draw.
3. Validation now compares score-shard route options with geometry-shard route options and fails when non-best route options carry `paths` without matching geometry.

## DISAGREEMENTS

1. None.
