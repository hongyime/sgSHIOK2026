# P869 Preview Score Source Copy

## Startup

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
c798362c84090bffb0f1556f450ad2c05f5536d2
c798362c84090bffb0f1556f450ad2c05f5536d2	refs/heads/main
```

## Change

The clicked-transit preview warning now says published locked scores come from the published shelter-map data rather than from the shelter-map bundle. The preview-only and non-authoritative-score warnings remain intact.

## Evidence Path Ignore Check

```text
exit_code=1
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs live-route-scoring.test.ts route-evidence-map-interaction.test.ts score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  36 passed (36)
   Start at  12:47:34
   Duration  3.33s (transform 844ms, setup 0ms, import 538ms, tests 785ms, environment 1ms)
```

## Diff Check

```text
exit_code=0
```

## Protected Path Guard

```text
exit_code=1
```

`rg` returned 1 because no protected modified paths matched.

## Repository Integrity

```text
repo_integrity=ok
exit_code=0
```

## Diff Stat Before Commit

```text
 web/lib/__tests__/live-route-scoring.test.ts             | 2 +-
 web/lib/__tests__/route-evidence-map-interaction.test.ts | 6 ++++--
 web/lib/live-route-scoring.ts                            | 4 ++--
 3 files changed, 7 insertions(+), 5 deletions(-)
 M web/lib/__tests__/live-route-scoring.test.ts
 M web/lib/__tests__/route-evidence-map-interaction.test.ts
 M web/lib/live-route-scoring.ts
?? qa/verification/P869-preview-score-source-copy.md
```

## FINDINGS

1. The clicked-transit preview warning still used `shelter-map bundle` for a browser-visible provenance reason. It now uses `published shelter-map data`, matching the product-facing language used elsewhere.
2. No protected paths were modified, and no pipeline, export, rescore, subset, ingest, network, dependency install, public-data write, or deployment command was run.

## DISAGREEMENTS

1. None for this scoped continuation.
