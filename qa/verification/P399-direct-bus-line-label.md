# P399 Direct-Bus Line Label

## Working Root Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Scope

```text
Changed visible direct-bus fallback labels:
- "Direct bus estimate" -> "Direct bus line estimate"

Updated browser smoke checks to look for the new label.

The existing shelter-map-walk-pending and locked-bus-term caveats remain unchanged.

No scoring, export, rescore, subset run, ingest, network build, public-data write, protected QA evidence mutation, or locked weights change.
```

## FINDINGS

1. The direct-bus fallback label did not say that the estimate is a line estimate rather than a verified shelter-map walk.
2. `Direct bus line estimate` better matches the existing caveat that shelter-map walk access is not verified and the locked bus term remains 0.

## DISAGREEMENTS

1. None.
