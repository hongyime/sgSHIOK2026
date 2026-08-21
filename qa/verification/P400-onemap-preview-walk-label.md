# P400 OneMap Preview Walk Label

## Working Root Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Scope

```text
Changed clicked-stop live preview metric labels:
- "Preview walk" -> "OneMap preview walk"

The preview remains outside the published shelter-map bundle and locked score.

No scoring, export, rescore, subset run, ingest, network build, public-data write, protected QA evidence mutation, or locked weights change.
```

## FINDINGS

1. The clicked-stop preview metric used a generic `Preview walk` label even though the preview path is a OneMap live walking preview outside the published bundle.
2. `OneMap preview walk` makes the evidence source clearer without changing preview routing, scoring, public data, or weights.

## DISAGREEMENTS

1. None.
