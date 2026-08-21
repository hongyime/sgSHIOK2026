# P361 Known P19 Miss Source Coverage

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Extend the P360 browser render test so the known P19 recent-source miss copy is covered for both source groups: HDB 2021-2026 geocoded rows and MCST 2021-2026 proxy rows.

No runtime behavior change, scoring, export, rescore, subset run, ingest, network build, public-data mutation, protected QA mutation, or locked-weights change was run or made.

## Verification

### npm --prefix web test -- --run lib/__tests__/accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  20 passed (20)
   Start at  14:40:44
   Duration  1.44s (transform 602ms, setup 0ms, import 800ms, tests 221ms, environment 0ms)
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

1. P360 made the browser copy source-aware for all eight cached P19 misses, but the focused render test exercised only the HDB source group; the MCST source-group label was unguarded.

## DISAGREEMENTS

1. None.
