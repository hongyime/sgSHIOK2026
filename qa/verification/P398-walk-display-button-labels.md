# P398 Walk Display Button Labels

## Working Root Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Scope

```text
Changed walk display segmented-control labels:
- "Sheltered" -> "Sheltered walk"
- "Both" -> "Both walks"

"Shortest walk" was already landed in P397 and remains unchanged.

No scoring, export, rescore, subset run, ingest, network build, public-data write, protected QA evidence mutation, or locked weights change.
```

## FINDINGS

1. The walk display control had one explicit walk label, `Shortest walk`, beside two shorthand labels, `Sheltered` and `Both`.
2. Parallel labels make the control read as a walk comparison rather than an abstract route-mode selector.

## DISAGREEMENTS

1. None.
