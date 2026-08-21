# P320 planning-area rank labels as evidence views

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
npm notice run node scripts/test-web.mjs subscore-ranking score-card-copy

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  19 passed (19)
   Start at  11:56:14
   Duration  2.38s (transform 424ms, setup 0ms, import 737ms, tests 357ms, environment 2ms)

WEB_TEST_EXIT=0
repo_integrity=ok
REPO_INTEGRITY_EXIT=0
WEIGHTS_DIFF_EXIT=0
```

## FINDINGS

1. The planning-area rank menu had only the bus option evidence-framed; the
   neighboring rain, access, heat, and crossing options still read as raw
   component names. The menu now consistently frames non-overall rank modes as
   evidence views while preserving the same underlying rank fields.

## DISAGREEMENTS

1. None.
