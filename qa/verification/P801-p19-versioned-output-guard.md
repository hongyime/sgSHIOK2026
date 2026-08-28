# P801 P19 Versioned Output Guard

## Working Root

```text
PWD=C:\sgSHIOK2026
Prawn-E14
```

## Intent

```text
The standing goal requires refreshed inputs and evidence to be written as new numbered versions, never in place. P19 --measure already required owner confirmation and explicit non-historical paths before input/API reads; P801 adds a numeric-version path requirement for all four P19 measurement output/cache paths.
```

## Unversioned Output Probe

```text
{
  "errors": [
    "P19 measurement requires numeric-version --hdb-cache-output",
    "P19 measurement requires numeric-version --overpass-cache-output",
    "P19 measurement requires numeric-version --summary-output",
    "P19 measurement requires numeric-version --detail-output"
  ],
  "ok": false
}
exit_code=2
```

## Focused Tests

```text
...........................                                              [100%]
27 passed in 4.30s
exit_code=0
```

## Collect Only

```text
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs
tests/test_triage_onemap_outliers.py::test_triage_cli_refuses_existing_explicit_output_before_input_reads

627 tests collected in 10.57s
exit_code=0
```

## Repo Integrity

```text
repo_integrity=ok
exit_code=0
```

## Protected Diff Guard

```text
exit_code=0
```

## Diff Stat

```text
 scripts/analysis/p19_universe_gap_measurement.py |  6 +++
 tests/test_analysis_scripts.py                   | 53 ++++++++++++++++++++----
 2 files changed, 52 insertions(+), 7 deletions(-)
```

## FINDINGS

1. Before P801, an approved P19 measurement could write to arbitrary explicit new paths that were not numerically versioned, even though the standing input policy requires numbered versions.
2. P19 measurement now refuses unversioned output/cache paths before reading the postal universe or calling APIs.
3. The Python collected-test count increased from 626 to 627 because P801 adds one guard test.

## DISAGREEMENTS

1. None.
