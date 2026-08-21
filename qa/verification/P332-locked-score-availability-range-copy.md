# P332 locked-score availability range copy

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
npm notice run node scripts/test-web.mjs locked-score-availability score-card-copy accessibility-render

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  38 passed (38)
   Start at  12:39:41
   Duration  1.79s (transform 1.08s, setup 0ms, import 1.41s, tests 384ms, environment 1ms)

WEB_TEST_EXIT=0
repo_integrity=ok
REPO_INTEGRITY_EXIT=0
WEIGHTS_DIFF_EXIT=0
```

## FINDINGS

1. The first-view locked-score availability disclosure still said records were
   "beyond current transit range". It now says "beyond locked transit range",
   matching the selected-card NO_TRANSIT_IN_RANGE copy while preserving the
   same manifest-derived counts.

## DISAGREEMENTS

1. None.
