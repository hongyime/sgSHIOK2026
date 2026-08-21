# P328 outside-bundle empty-state name

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Free-tier web copy and focused tests only. No scoring, export, rescore, subset
run, ingest, network build, upstream API probe, public-data mutation,
deployment, or locked-weight change was run.

## Verification commands

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render score-card-copy

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  34 passed (34)
   Start at  12:25:44
   Duration  1.35s (transform 675ms, setup 0ms, import 903ms, tests 227ms, environment 0ms)

WEB_TEST_EXIT=0
repo_integrity=ok
REPO_INTEGRITY_EXIT=0
WEIGHTS_DIFF_EXIT=0
```

## FINDINGS

1. The outside-bundle visible empty state still said "the current bundle" even
   though the surrounding UI and live announcement frame it as the shelter-map
   bundle tied to the frozen June 2020 address universe. The visible empty
   state now says "this shelter-map bundle" and keeps the 8-of-976 caveat.

## DISAGREEMENTS

1. None.
