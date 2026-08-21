# P321 planning-area rank helper evidence wording

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
npm notice run node scripts/test-web.mjs score-card-copy subscore-ranking

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  19 passed (19)
   Start at  11:59:26
   Duration  696ms (transform 188ms, setup 0ms, import 237ms, tests 112ms, environment 0ms)

WEB_TEST_EXIT=0
repo_integrity=ok
REPO_INTEGRITY_EXIT=0
WEIGHTS_DIFF_EXIT=0
```

## FINDINGS

1. After the rank menu moved to evidence-view labels, the open-panel helper
   still said `Planning-area component evidence view`. It now says
   `Planning-area evidence view`, matching the menu while leaving the locked
   score and rank fields unchanged.

## DISAGREEMENTS

1. None.
