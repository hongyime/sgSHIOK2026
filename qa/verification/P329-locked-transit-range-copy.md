# P329 locked transit range copy

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
   Start at  12:29:08
   Duration  3.69s (transform 1.84s, setup 0ms, import 2.45s, tests 576ms, environment 2ms)

WEB_TEST_EXIT=0
repo_integrity=ok
REPO_INTEGRITY_EXIT=0
WEIGHTS_DIFF_EXIT=0
```

## FINDINGS

1. NO_TRANSIT_IN_RANGE copy still described the 1.2 km constraint as the
   "current scoring range". It now describes the same threshold as the locked
   transit range, matching the fixed release boundary without changing behavior.

## DISAGREEMENTS

1. None.
