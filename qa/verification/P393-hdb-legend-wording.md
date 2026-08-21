# P393 HDB Legend Wording

## Working Root Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Scope

```text
Changed the inline map legend label from "HDB inferred" to "HDB void-deck shelter" and pinned the rendered copy in the accessibility render test.

No scoring, export, rescore, subset run, ingest, network build, public-data write, protected QA evidence mutation, or locked weights change.
```

## FINDINGS

1. The visible map legend still exposed the implementation-facing phrase "HDB inferred" even though the source evidence names the real-world evidence as HDB void-deck shelter/inference.
2. The copy fix is user-visible and free-tier: it changes browser text only and does not alter score values, geometry, manifests, public data, or locked weights.

## DISAGREEMENTS

1. None.
