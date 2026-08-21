# P327 missing locked-term copy

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
   Start at  12:22:24
   Duration  3.54s (transform 1.70s, setup 0ms, import 2.25s, tests 485ms, environment 2ms)

WEB_TEST_EXIT=0
repo_integrity=ok
REPO_INTEGRITY_EXIT=0
WEIGHTS_DIFF_EXIT=0
```

## FINDINGS

1. Missing shelter/access display-row values still rendered as generic
   "Not scored" rows with "No shelter score" / "No access score" metadata.
   They now render as unavailable evidence or unavailable locked terms while
   still guarding that nulls are not displayed as zero.

## DISAGREEMENTS

1. None.
