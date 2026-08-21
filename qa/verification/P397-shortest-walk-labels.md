# P397 Shortest-Walk Labels

## Working Root Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Scope

```text
Changed visible shortest-route copy:
- Walk display button: "Shortest" -> "Shortest walk"
- Map legend: "Shortest" -> "Shortest walk"
- Same-route map legend: "Shortest (same)" -> "Shortest walk (same)"

No scoring, export, rescore, subset run, ingest, network build, public-data write, protected QA evidence mutation, or locked weights change.
```

## FINDINGS

1. The walk comparison UI still used bare "Shortest", which is less clear than "Shortest walk" in a shelter-first tool for choosing walks to transit.
2. The change keeps comparison semantics unchanged and only clarifies visible labels.

## DISAGREEMENTS

1. None.
