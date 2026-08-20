# P53 Score Coverage Breakdown Evidence

## Root Guard

```text
ROOT=C:\sgSHIOK2026
HOST=Prawn-E14
BRANCH=main
```

## Scope

```text
P53 changes the browser score-coverage disclosure to use manifest state_counts when complete: SCORED_PARTIAL, NO_TRANSIT_IN_RANGE, and NOT_YET_SCORED.
No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change is part of this change.
```

## Source Scan

```text
C:\sgSHIOK2026\web\lib\__tests__\score-coverage.test.ts:27:          SCORED_PARTIAL: 18983,
C:\sgSHIOK2026\web\lib\__tests__\score-coverage.test.ts:28:          NO_TRANSIT_IN_RANGE: 9827,
C:\sgSHIOK2026\web\lib\__tests__\score-coverage.test.ts:29:          NOT_YET_SCORED: 476,
C:\sgSHIOK2026\web\lib\__tests__\score-coverage.test.ts:33:      "Score coverage: 95,157 full scores out of 124,443; 29,286 records (roughly a quarter) are not full scores: 18,983 partial, 9,827 beyond current transit range, and 476 not yet scored."
C:\sgSHIOK2026\web\lib\__tests__\score-coverage.test.ts:41:          SCORED_PARTIAL: 80,
C:\sgSHIOK2026\web\lib\__tests__\score-coverage.test.ts:42:          NO_TRANSIT_IN_RANGE: 15,
C:\sgSHIOK2026\web\lib\__tests__\score-coverage.test.ts:43:          NOT_YET_SCORED: 5,
C:\sgSHIOK2026\web\lib\__tests__\score-coverage.test.ts:47:      "Score coverage: 900 full scores out of 1,000; 100 records (10%) are not full scores: 80 partial, 15 beyond current transit range, and 5 not yet scored."
C:\sgSHIOK2026\web\lib\__tests__\score-coverage.test.ts:53:      "Score coverage: 900 full scores out of 1,000; 100 records (10%) do not render a full score."
C:\sgSHIOK2026\web\lib\score-coverage.ts:17:function scoreCoverageBreakdown(stateCounts: unknown, notFull: number): string | null {
C:\sgSHIOK2026\web\lib\score-coverage.ts:18:  const partial = stateCount(stateCounts, "SCORED_PARTIAL");
C:\sgSHIOK2026\web\lib\score-coverage.ts:19:  const noTransit = stateCount(stateCounts, "NO_TRANSIT_IN_RANGE");
C:\sgSHIOK2026\web\lib\score-coverage.ts:20:  const notYet = stateCount(stateCounts, "NOT_YET_SCORED");
C:\sgSHIOK2026\web\lib\score-coverage.ts:49:  const breakdown = scoreCoverageBreakdown(provenance.state_counts, notFull);
C:\sgSHIOK2026\web\lib\score-coverage.ts:50:  const nonFullText = breakdown ? `are not full scores: ${breakdown}` : "do not render a full score";
```

## Focused Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-coverage.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  16:11:16
   Duration  3.03s (transform 725ms, setup 0ms, import 790ms, tests 191ms, environment 1ms)

EXIT_CODE=0
```

## TypeScript

```text
C:\sgSHIOK2026\web\node_modules\.bin\tsc.cmd --noEmit --project C:\sgSHIOK2026\web\tsconfig.json
EXIT_CODE=0
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  122 passed (122)
   Start at  16:12:06
   Duration  6.67s (transform 3.26s, setup 0ms, import 7.90s, tests 9.21s, environment 9ms)

EXIT_CODE=0
```

## Final Guards

```text
repo_integrity=ok
EXIT_CODE=0
```

```text
git diff --check
DIFF_CHECK_EXIT=0
```

```text
git diff -- pipeline/config/weights.yaml
WEIGHTS_DIFF_EXIT=0
```

## Findings

1. The old coverage line had the live manifest state counts available but hid them behind `do not render a full score`.
2. Web test count moved from 121 to 122 because P53 adds one formatter test covering the fallback for incomplete state counts.

## Disagreements

1. None.
