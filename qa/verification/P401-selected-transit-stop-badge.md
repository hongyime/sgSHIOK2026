# P401 Selected Transit Stop Badge

## Working Root Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Scope

```text
Changed selected-stop badge copy:
- "Viewing selected stop" -> "Viewing selected transit stop"

No scoring, export, rescore, subset run, ingest, network build, public-data write, protected QA evidence mutation, or locked weights change.
```

## FINDINGS

1. The selected-stop badge used the vague label `Viewing selected stop` even though the selected item is a transit target for the walk comparison.
2. `Viewing selected transit stop` makes the interaction clearer without changing candidate selection, route geometry, scoring, public data, or weights.

## DISAGREEMENTS

1. None.
