# P402 Transit-Target Availability Labels

## Working Root Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Scope

```text
Changed transit target availability labels:
- selected walk -> current walk
- shelter-map walk -> published walk
- no shelter-map walk -> no published walk

No scoring, export, rescore, subset run, ingest, network build, public-data write, protected QA evidence mutation, or locked weights change.
```

## FINDINGS

1. The transit target picker used compact availability labels that did not clearly distinguish the current target from other published walk options.
2. The new labels make the published-bundle boundary explicit while preserving the underlying target selection behavior.

## DISAGREEMENTS

1. None.
