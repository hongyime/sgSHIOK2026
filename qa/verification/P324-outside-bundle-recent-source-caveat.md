# P324 outside-bundle recent-source caveat

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
   Start at  12:10:48
   Duration  4.29s (transform 2.10s, setup 0ms, import 2.76s, tests 814ms, environment 2ms)

WEB_TEST_EXIT=0
repo_integrity=ok
REPO_INTEGRITY_EXIT=0
WEIGHTS_DIFF_EXIT=0
```

## FINDINGS

1. The outside-bundle empty state named the frozen June 2020 address universe
   but did not mention the measured recent-source gap shown elsewhere. It now
   includes the 8-of-976 public-source check caveat without asserting the
   selected postal is one of those known misses.

## DISAGREEMENTS

1. None.
