# P317 partial locked-score term wording

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
   Start at  11:43:18
   Duration  2.11s (transform 1.08s, setup 0ms, import 1.42s, tests 372ms, environment 1ms)

> python scripts/check_repo_integrity.py; Write-Output "REPO_INTEGRITY_EXIT=$LASTEXITCODE"
repo_integrity=ok
REPO_INTEGRITY_EXIT=0

> git diff -- pipeline/config/weights.yaml; Write-Output "WEIGHTS_DIFF_EXIT=$LASTEXITCODE"
WEIGHTS_DIFF_EXIT=0
```

## FINDINGS

1. The partial locked-score note still said `one or more component scores are
   unavailable`, even though the behavior is missing locked-weight terms counted
   as zero. The note now says `one or more locked terms are unavailable`.

## DISAGREEMENTS

1. None.
