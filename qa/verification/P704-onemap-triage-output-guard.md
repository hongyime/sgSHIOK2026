# P704 OneMap outlier triage output guard

## Working root

```text
C:\sgSHIOK2026
```

## Existing tracked default outputs

```text
present 569919 C:\sgSHIOK2026\qa\onemap_outlier_triage_queues_20260802.json
present 611190 C:\sgSHIOK2026\qa\onemap_outlier_triage_queues_20260802.geojson
present 41211 C:\sgSHIOK2026\qa\onemap_missing_bus_connector_priority_20260802.geojson
qa/onemap_missing_bus_connector_priority_20260802.geojson
qa/onemap_outlier_triage_queues_20260802.geojson
qa/onemap_outlier_triage_queues_20260802.json
exit=1
```

## Existing-output guard probe

```text
{
  "errors": [
    "refusing to overwrite existing analysis output: qa\\onemap_outlier_triage_queues_20260802.json"
  ],
  "ok": false
}
exit=1
```

## Focused tests

```text
........................                                                 [100%]
24 passed in 1.04s
```

## Test collection

```text
477 tests collected in 5.02s
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

1. `scripts/triage_onemap_outliers.py` already required explicit output paths before input reads, but an existing explicit path could still be overwritten later in the triage run.
2. The CLI now refuses existing required and optional output paths before reading replay or validation inputs, and all triage JSON/GeoJSON writes use the shared non-overwriting writer.

## DISAGREEMENTS

1. None.
