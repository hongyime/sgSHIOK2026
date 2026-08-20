# P202 UI Freshness Age Disclosure

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

The title-card data freshness line now names the oldest current source and its age, instead of reporting only the count of current sources. This keeps the UI aligned with the stronger manifest-only freshness report from P201.

## Measured Source

```text
[leaf_area_index] NParks Leaf Area Index: freshness current — last_modified age 112.5d within 120d threshold (quarterly)
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  02:57:56
   Duration  7.43s (transform 635ms, setup 0ms, import 745ms, tests 225ms, environment 4ms)
```

## FINDINGS

1. The UI now exposes one concrete freshness-age boundary: the oldest current source is NParks Leaf Area Index at 112.5 days old against a 120-day quarterly threshold.
2. This is a zero-pipeline-cost product copy change; it does not fetch, ingest, score, export, or mutate any input artifact.
3. The copied age is static copy and should be refreshed when the manifest freshness audit changes.

## DISAGREEMENTS

1. None.
