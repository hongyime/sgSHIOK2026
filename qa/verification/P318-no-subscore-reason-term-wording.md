# P318 no-subscore reason term wording

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Free-tier web copy and focused tests only. No scoring, export, rescore, subset
run, ingest, network build, upstream API probe, public-data mutation,
deployment, or locked-weight change was run.

## Verification commands

```text
> npm --prefix web test -- score-card-copy
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  11:46:30
   Duration  1.66s (transform 269ms, setup 0ms, import 340ms, tests 127ms, environment 1ms)

> python scripts/check_repo_integrity.py; Write-Output "REPO_INTEGRITY_EXIT=$LASTEXITCODE"
repo_integrity=ok
REPO_INTEGRITY_EXIT=0

> git diff -- pipeline/config/weights.yaml; Write-Output "WEIGHTS_DIFF_EXIT=$LASTEXITCODE"
WEIGHTS_DIFF_EXIT=0
```

## FINDINGS

1. The no-subscore reason chip still said `Locked score incomplete`, while the
   product now distinguishes shelter-map evidence from unavailable locked-weight
   terms. It now says `Locked terms unavailable`.

## DISAGREEMENTS

1. None.
