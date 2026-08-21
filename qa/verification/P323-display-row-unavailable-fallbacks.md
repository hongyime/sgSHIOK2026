# P323 display-row unavailable fallback wording

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
npm notice run node scripts/test-web.mjs score-card-copy accessibility-render

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  34 passed (34)
   Start at  12:06:27
   Duration  1.94s (transform 1.03s, setup 0ms, import 1.32s, tests 334ms, environment 1ms)

WEB_TEST_EXIT=0
repo_integrity=ok
REPO_INTEGRITY_EXIT=0
WEIGHTS_DIFF_EXIT=0
```

## FINDINGS

1. The four-row display fallback metadata still used generic score labels:
   `No bus score` and `No locked score`. These now say `Bus evidence
   unavailable` and `No full locked score`, keeping missing evidence separate
   from the secondary locked score.

## DISAGREEMENTS

1. None.
