# P313 shelter-panel component wording

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Free-tier web copy and focused tests only. No scoring, export, rescore, subset
run, ingest, network build, upstream API probe, public-data mutation,
deployment, or locked-weight change was run.

## Verification commands

```text
> npm --prefix web test -- score-card-copy accessibility-render
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy accessibility-render

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  34 passed (34)
   Start at  11:30:13
   Duration  2.16s (transform 1.23s, setup 0ms, import 1.56s, tests 384ms, environment 1ms)

> python scripts/check_repo_integrity.py; Write-Output "REPO_INTEGRITY_EXIT=$LASTEXITCODE"
repo_integrity=ok
REPO_INTEGRITY_EXIT=0

> git diff -- pipeline/config/weights.yaml; Write-Output "WEIGHTS_DIFF_EXIT=$LASTEXITCODE"
WEIGHTS_DIFF_EXIT=0
```

## FINDINGS

1. The shelter panel still had two visible phrases that framed secondary rows as
   component scores after P18 moved the product to shelter evidence first: the
   planning-area alternate rank message said `component-score view`, and the bus
   fallback caveat said `this component score remains 0`. They now say
   `component evidence view` and `the locked bus term remains 0`.

## DISAGREEMENTS

1. None.
