# P503 UI freshness source names

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-22

## Change

The browser first-view data-freshness line now names the stale sources with their source display names, matching the manifest-only freshness report instead of using a lowercased shorthand list.

## Command output

```text
PS C:\sgSHIOK2026> npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  03:03:30
   Duration  766ms (transform 121ms, setup 0ms, import 149ms, tests 66ms, environment 0ms)
```

## FINDINGS

1. The first-view freshness line had the correct counts and unknown-age source, but its stale-source list used a lowercased shorthand instead of the source names shown by `run.py check --freshness-only`.
2. This is copy/test coverage only. It does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

## DISAGREEMENTS

1. None.
