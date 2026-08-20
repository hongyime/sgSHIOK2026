# P194 Component Score Ranking Test Name

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Scope

Renamed stale test descriptions from "sub-score" to "component-score" in `web/lib/__tests__/subscore-ranking.test.ts`.

The `subscore-ranking` module name and `subscores` data field remain unchanged because they are internal compatibility/schema names.

## FINDINGS

1. A remaining non-runtime test description still used "sub-score" for component-score ranking after the app copy had moved to component-score language.
2. The remaining `route evidence` and `Route display` scan hits outside historical evidence were negative test guards or legacy compatibility strings, so I left them intact.

## DISAGREEMENTS

1. None.
