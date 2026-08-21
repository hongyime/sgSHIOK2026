# P322 planning-area rank select accessibility label

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
npm notice run node scripts/test-web.mjs score-card-copy accessibility-render subscore-ranking

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  38 passed (38)
   Start at  12:02:29
   Duration  1.97s (transform 1.04s, setup 0ms, import 1.54s, tests 392ms, environment 1ms)

WEB_TEST_EXIT=0
repo_integrity=ok
REPO_INTEGRITY_EXIT=0
WEIGHTS_DIFF_EXIT=0
```

## FINDINGS

1. The planning-area dropdown's screen-reader label still said `Rank records by`
   after the visible panel moved to evidence-view framing. It now says
   `Choose planning-area evidence view`, matching the visible purpose while
   preserving the same rank fields.

## DISAGREEMENTS

1. None.
