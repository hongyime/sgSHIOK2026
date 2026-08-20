# P56 Rank Helper Copy Evidence

## Root Guard

```text
ROOT=C:\sgSHIOK2026
HOST=Prawn-E14
BRANCH=main
```

## Scope

```text
P56 changes the rank panel overall-view helper from `Authoritative composite order.` to `Locked score order.`.
No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change is part of this change.
```

## Source Scan

```text
C:\sgSHIOK2026\web\app\page.tsx:1316:                  ? "Locked score order."
C:\sgSHIOK2026\web\app\page.tsx:1317:                  : "Single sub-score view; SHIOK score is unchanged."}
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:246:    expect(html).toContain("Locked score order.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:247:    expect(html).not.toContain("Authoritative composite order.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:119:    expect(source).toContain("Locked score order.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:120:    expect(source).not.toContain("Authoritative composite order.");
```

## Focused Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  22 passed (22)
   Start at  16:24:01
   Duration  2.04s (transform 1.10s, setup 0ms, import 1.47s, tests 191ms, environment 1ms)

EXIT_CODE=0
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  122 passed (122)
   Start at  16:24:30
   Duration  6.37s (transform 4.93s, setup 0ms, import 6.04s, tests 8.16s, environment 15ms)

EXIT_CODE=0
```

## TypeScript

```text
C:\sgSHIOK2026\web\node_modules\.bin\tsc.cmd --noEmit --project C:\sgSHIOK2026\web\tsconfig.json
EXIT_CODE=0
```

## Repo Integrity

```text
repo_integrity=ok
EXIT_CODE=0
```

## Diff Check

```text
DIFF_CHECK_EXIT=0
```

## Weights Diff

```text
WEIGHTS_DIFF_EXIT=0
```

## Findings

1. The rank panel helper still described the overall ranking as an `Authoritative composite order.`, which was less consistent with the settled locked-score wording than the surrounding UI.

## Disagreements

1. None.
