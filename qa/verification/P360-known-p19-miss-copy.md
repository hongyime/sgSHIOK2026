# P360 Known P19 Miss Copy

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Make the outside-bundle browser copy postal-aware for the eight cached P19 recent-source misses while preserving the generic aggregate recent-source caveat for other postals and no-results states.

No scoring, export, rescore, subset run, ingest, network build, public-data mutation, protected QA mutation, or locked-weights change was run or made.

## Verification

### npm --prefix web test -- --run lib/__tests__/accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  20 passed (20)
   Start at  14:37:24
   Duration  1.39s (transform 600ms, setup 0ms, import 796ms, tests 204ms, environment 0ms)
```

### npm --prefix web test -- --run lib/__tests__/score-card-copy.test.ts

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  14:37:40
   Duration  430ms (transform 63ms, setup 0ms, import 79ms, tests 31ms, environment 0ms)
```

### python scripts/check_repo_integrity.py

```text
repo_integrity=ok
EXIT=0
```

### git diff -- pipeline/config/weights.yaml

```text
EXIT=0
```

## FINDINGS

1. The browser already disclosed the aggregate P19 recent-source gap, but when a user selected one of the eight known cached misses it still presented that postal as only a generic outside-bundle case.

## DISAGREEMENTS

1. None.
