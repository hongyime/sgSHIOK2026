# P868 Subscore Ranking Label Test

## Startup

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
690603a341b3fa3244e8c5e7910a790abc8fdf7a
690603a341b3fa3244e8c5e7910a790abc8fdf7a	refs/heads/main
```

## Change

`web/lib/__tests__/subscore-ranking.test.ts` still expected pre-P865/P867 planning-area labels. The implementation had already moved to `Locked score order`, `Bus service support`, `Heat estimate`, and `Crossing friction`; this updates the direct unit test to assert the current product copy.

## Evidence Path Ignore Check

```text
exit_code=1
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs subscore-ranking.test.ts score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  67 passed (67)
   Start at  12:44:54
   Duration  8.74s (transform 2.42s, setup 0ms, import 3.21s, tests 1.99s, environment 2ms)
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
 web/lib/__tests__/subscore-ranking.test.ts | 10 +++++-----
 1 file changed, 5 insertions(+), 5 deletions(-)
 M web/lib/__tests__/subscore-ranking.test.ts
?? qa/verification/P868-subscore-ranking-label-test.md
```

## FINDINGS

1. `web/lib/__tests__/subscore-ranking.test.ts` had stale expected labels from before the planning-area copy cleanup. It had not been included in the P867 focused test command, so the stale assertion survived even though the implementation and source-copy tests had moved on.
2. No protected paths were modified, and no pipeline, export, rescore, subset, ingest, network, dependency install, public-data write, or deployment command was run.

## DISAGREEMENTS

1. None for this scoped continuation.
