# P873 Exposure Gap Aria Typecheck

## Startup

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
a8b49999d1e5098c9e38b7cee35581f17d2c9cbc
a8b49999d1e5098c9e38b7cee35581f17d2c9cbc	refs/heads/main
```

## Full Web Suite Failure Before Fix

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 > lib/__tests__/typescript-contract.test.ts (1 test | 1 failed) 5346ms
     x type-checks rank payload projections 5340ms

------- Failed Tests 1 -------

 FAIL  lib/__tests__/typescript-contract.test.ts > typescript contracts > type-checks rank payload projections
AssertionError: expected [Function] to not throw an error but 'Error: Command failed: C:\Program Fil...' was thrown

- Expected:
undefined

+ Received:
"Error: Command failed: C:\\Program Files\\nodejs\\node.exe C:\\sgSHIOK2026\\web\\node_modules\\typescript\\bin\\tsc --noEmit --pretty false"

 > lib/__tests__/typescript-contract.test.ts:15:11
     13|         stdio: "pipe",
     14|       })
     15|     ).not.toThrow();
       |           ^
     16|   }, 300000);
     17| });

------- [1/1] -------


 Test Files  1 failed | 23 passed (24)
      Tests  1 failed | 174 passed (175)
   Start at  12:58:51
   Duration  76.40s (transform 4.51s, setup 0ms, import 14.10s, tests 15.43s, environment 33ms)
```

## TypeScript Diagnostics Before Fix

```text
app/page.tsx(1855,69): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
app/page.tsx(1900,73): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
exit_code=1
```

## Change

Exposure-gap map buttons now pass a non-null `actionLocation` into `exposureGapMapActionLabel()`. The fallback coordinate is derived from the already validated `focusTarget` when TypeScript cannot narrow the separately formatted display location.

## TypeScript After Fix

```text
exit_code=0
```

## Full Web Suite After Fix

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  175 passed (175)
   Start at  13:03:46
   Duration  36.26s (transform 2.36s, setup 0ms, import 4.94s, tests 8.48s, environment 16ms)
```

## Evidence Path Ignore Check

```text
exit_code=1
```

## Diff Check

```text
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

## Protected Path Guard

```text
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
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
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
 web/app/page.tsx                          | 6 ++++--
 web/lib/__tests__/score-card-copy.test.ts | 4 +++-
 2 files changed, 7 insertions(+), 3 deletions(-)
 M web/app/page.tsx
 M web/lib/__tests__/score-card-copy.test.ts
?? qa/verification/P873-exposure-gap-aria-typecheck.md
```

## FINDINGS

1. The full web suite was failing before this change because `ScoreCard` passed `location: string | null` into `exposureGapMapActionLabel()`, which requires `string`.
2. Focused copy tests had missed this because the failure lives behind the `typescript-contract.test.ts` full-suite check.
3. No protected paths were modified, and no pipeline, export, rescore, subset, ingest, network, dependency install, public-data write, or deployment command was run.

## DISAGREEMENTS

1. None for this scoped continuation.
