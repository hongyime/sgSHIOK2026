# P325 outside-bundle live-region caveat

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Free-tier web accessibility copy and focused tests only. No scoring, export,
rescore, subset run, ingest, network build, upstream API probe,
public-data mutation, deployment, or locked-weight change was run.

## Verification commands

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render score-card-copy

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  34 passed (34)
   Start at  12:13:55
   Duration  1.41s (transform 751ms, setup 0ms, import 969ms, tests 222ms, environment 1ms)

WEB_TEST_EXIT=0
repo_integrity=ok
REPO_INTEGRITY_EXIT=0
WEIGHTS_DIFF_EXIT=0
```

## FINDINGS

1. P324 updated the visible outside-bundle empty state, but the screen-reader
   live-region announcement still only said the postal was not in the current
   shelter-map bundle. The live region now carries the same frozen-universe and
   8-of-976 recent-source caveat.

## DISAGREEMENTS

1. None.
