# P1042 smooth Vercel deploys

Date: 2026-08-30
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Problem

Manual raw Vercel CLI deployment was slow and brittle:

- deploying from `web/` uploaded the right files but failed because Vercel project Root Directory is `web`, so the build looked for `web/web`;
- deploying from repo root preserved that root but uploaded `raw/`, `processed/`, and `qa/`, then failed with ENOSPC;
- clean staging containing only `web/` plus the active data bundle succeeded.

## Fix

Pin the supported production deploy path:

- `scripts/deploy-production.ps1` plan output now names the staged deploy path and Vercel target;
- `pipeline.publish.deploy_command()` passes `--scope theprawnvercel --project sgshiok --archive=tgz`;
- `VERCEL_SCOPE` and `VERCEL_PROJECT` remain explicit override points;
- tests assert the staging source excludes historical data bundles and root payloads.

## plan-only deploy command

```text
plan_only=true
deploy=not_started
reason=confirm_production_not_set
deploy_path=staged_web_plus_selected_bundle
vercel_scope=theprawnvercel
vercel_project=sgshiok
commands:
.\scripts\deploy-production.bat -DataBundle generated_20260805_prefer_scored_routed -ConfirmProduction
PLAN_EXIT=0
```

## focused tests

```text
....                                                                    [100%]
5 passed in 16.79s
PYTEST_EXIT=0
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  30 passed (30)
   Start at  13:33:18
   Duration  4.10s (transform 315ms, setup 0ms, import 379ms, tests 289ms, environment 0ms)

WEB_TEST_EXIT=0
```

## Findings

1. Production deploys should use `.\scripts\deploy-production.bat -ConfirmProduction`, not raw `vercel deploy`.
2. The deploy target is now explicit: `theprawnvercel/sgshiok`, with env overrides only for intentional retargeting.
3. The deploy source remains staged `web/` plus the selected active data bundle, which avoids uploading `raw/`, `processed/`, `qa/`, and historical public-data bundles.

## Disagreements

1. None.
