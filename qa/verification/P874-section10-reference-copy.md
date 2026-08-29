# P874 Section 10 Reference Copy

## Guard

```text
Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Protected operations: no scoring, export, rescore, subset run, ingest, network build, deployment, dependency install, public-data write, or protected evidence/data mutation.
```

## Change

```text
Aligned the tracked Section 10 presentation reference with the browser-visible terminology already used by the shipped UI: "published shelter-map data" instead of "published shelter-map bundle".
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run web/lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

No test files found, exiting with code 1

filter: web/lib/__tests__/score-card-copy.test.ts
include: **/*.{test,spec}.?(c|m)[jt]s?(x)
exclude:  **/node_modules/**, **/.git/**
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  22 passed (22)
   Start at  13:12:07
   Duration  4.29s (transform 372ms, setup 0ms, import 460ms, tests 255ms, environment 0ms)
```

```text
repo_integrity=ok
repo_integrity_exit=0
```

## FINDINGS

1. The implemented UI already used "published shelter-map data"; the stale "published shelter-map bundle" phrase remained in the Section 10 reference document and its copy-pinning test.
2. This is documentation/test alignment only. It does not alter scoring, exports, inputs, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
