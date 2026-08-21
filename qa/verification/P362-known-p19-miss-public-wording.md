# P362 Known P19 Miss Public Wording

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Remove cache implementation wording from the browser's known P19 missing-postal copy. The user-facing message now states that the selected postal is one of the 8 recent public-source postals missing from frozen v1, with the source group still named.

No scoring, export, rescore, subset run, ingest, network build, public-data mutation, protected QA mutation, or locked-weights change was run or made.

## Verification

### npm --prefix web test -- --run lib/__tests__/accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  20 passed (20)
   Start at  14:44:17
   Duration  2.57s (transform 1.09s, setup 0ms, import 1.45s, tests 359ms, environment 0ms)
```

### npm --prefix web test -- --run lib/__tests__/score-card-copy.test.ts

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  14:44:17
   Duration  1.13s (transform 182ms, setup 0ms, import 223ms, tests 81ms, environment 0ms)
```

### python scripts/check_repo_integrity.py

```text
repo_integrity=ok
EXIT=0
```

### git diff -- pipeline/config/weights.yaml

```text
WEIGHTS_DIFF_EXIT=0
```

## FINDINGS

1. P360 correctly made known P19 misses postal-aware, but it exposed internal `cached` wording in the browser instead of describing the public frozen-v1 limitation.

## DISAGREEMENTS

1. None.
