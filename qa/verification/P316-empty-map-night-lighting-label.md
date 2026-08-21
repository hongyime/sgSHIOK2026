# P316 empty map night-lighting label

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Free-tier accessibility copy and focused tests only. No scoring, export,
rescore, subset run, ingest, network build, upstream API probe, public-data
mutation, deployment, lamp-tile generation, or locked-weight change was run.

## Verification commands

```text
> npm --prefix web test -- route-evidence-map-interaction
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs route-evidence-map-interaction

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  11:40:05
   Duration  966ms (transform 355ms, setup 0ms, import 110ms, tests 355ms, environment 0ms)

> python scripts/check_repo_integrity.py; Write-Output "REPO_INTEGRITY_EXIT=$LASTEXITCODE"
repo_integrity=ok
REPO_INTEGRITY_EXIT=0

> git diff -- pipeline/config/weights.yaml; Write-Output "WEIGHTS_DIFF_EXIT=$LASTEXITCODE"
WEIGHTS_DIFF_EXIT=0
```

## FINDINGS

1. The map's no-route aria label named only MRT stations, LRT stations, and bus
   stops, even though the product now treats night lighting as the second map
   evidence layer. The empty map label now names night-lighting evidence too.

## DISAGREEMENTS

1. None.
