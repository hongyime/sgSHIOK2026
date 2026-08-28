# P807 Source Policy P19 v2 Overpass

## Working Root

```text
PWD=C:\sgSHIOK2026
Prawn-E14
```

## Intent

```text
Align batch-plan and production-readiness source-policy reporting with the freshest committed P19 v2 Overpass addr:postcode coverage cross-check. This is reporting/test/evidence work only; it does not call APIs, score, export, rescore, ingest, build network inputs, deploy, or modify protected payloads.
```

## P19 v2 Source Values

```text
{
  "intersection": 25899,
  "missing_from_v1": 20,
  "unique_postcodes": 25919,
  "v1_missing_from_overpass": 98544
}
coverage_pct = 25899 / 124443 * 100 = 20.811938
```

## Focused Tests

```text
uv run pytest tests/test_batch_plan.py tests/test_production_readiness.py -q
....................................                                     [100%]
36 passed in 96.61s (0:01:36)
```

## Collect Only

```text
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs
tests/test_triage_onemap_outliers.py::test_triage_cli_refuses_existing_explicit_output_before_input_reads

629 tests collected in 23.31s
exit_code=0
```

## Repo Integrity

```text
repo_integrity=ok
exit_code=0
```

## Protected Diff Guard

```text
protected_diff_exit_code=0
```

## FINDINGS

1. `pipeline.batch_plan.OSM_ADDR_POSTCODE_COVERAGE` still reported the older P125 20 Aug 2026 Overpass coverage numbers after P19 v2 produced fresher 28 Aug 2026 Overpass coverage numbers.
2. The stale structured policy propagated into production-readiness reporting, so operators could see older OSM registry-policy evidence even though the browser already showed the refreshed P19 v2 counts.
3. The policy conclusion is unchanged: OSM `addr:postcode` remains geometry evidence and a coverage cross-check, not the Singapore address registry.

## DISAGREEMENTS

1. None.
