# P698 bus connector diagnostic output guard

## Working root

```text
C:\sgSHIOK2026
```

## Existing default outputs

```text
present 569919 C:\sgSHIOK2026\qa\onemap_outlier_triage_queues_20260802.json
absent C:\sgSHIOK2026\qa\onemap_outlier_replay_20260802.json
present 165731388 C:\sgSHIOK2026\qa\island_debug.geojson
present 56891 C:\sgSHIOK2026\qa\partial_resnap_rescore_sample.json
present 27869 C:\sgSHIOK2026\qa\bus_connector_diagnostics_priority_20260802.json
present 82366 C:\sgSHIOK2026\qa\current_bundle_state_report.json
```

```text
qa/bus_connector_diagnostics_priority_20260802.json
qa/current_bundle_state_report.json
qa/onemap_outlier_triage_queues_20260802.json
qa/partial_resnap_rescore_sample.json
```

## CLI no-argument guard

```text
{
  "errors": [
    "bus connector diagnostics requires explicit --output",
    "bus connector diagnostics requires explicit --geojson-output"
  ]
}
exit=2
```

## Focused tests

```text
...........                                                              [100%]
11 passed in 14.41s
```

## Test collection

```text
467 tests collected in 20.82s
```

## Repository integrity

```text
repo_integrity=ok
exit=0
```

## Diff hygiene

```text
exit=0
```

## Protected-path guard

```text
exit=0
```

## Evidence ignore check

```text
exit=1
```

## FINDINGS

1. `scripts/diagnose_bus_connectors.py` defaulted to existing tracked QA outputs and did not fail before loading pipeline inputs. A no-argument run now exits with explicit output errors before diagnostic work begins.
2. Direct file-path execution of `scripts/diagnose_bus_connectors.py` could not import `pipeline` before this change. The script now inserts `PROJECT_ROOT` before project imports, matching the way older analysis scripts are commonly run.

## DISAGREEMENTS

1. None.
