# P319 bus rank option service-evidence wording

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
   Start at  11:51:57
   Duration  633ms (transform 182ms, setup 0ms, import 229ms, tests 90ms, environment 1ms)

WEB_TEST_EXIT=0
repo_integrity=ok
REPO_INTEGRITY_EXIT=0
WEIGHTS_DIFF_EXIT=0
```

## FINDINGS

1. The planning-area rank dropdown still labeled the bus metric `Bus
   connectivity`, while the shelter panel now frames bus as service evidence.
   The option now says `Bus-service evidence`; the ranking field is unchanged.

## DISAGREEMENTS

1. None.
