# P479 freshness UTC copy

Date: 2026-08-22
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Free-tier browser copy precision only.

No scoring, export, rescore, subset run, ingest, network build, deployment, input rebuild, public-data mutation, protected QA mutation, or weights.yaml edit was performed.

## Evidence commands

```text
PS C:\sgSHIOK2026> uv run python run.py check --freshness-only | Select-String -- 'Source freshness|Freshness:|Oldest current|Stale sources|Unknown-age'

Source freshness from raw/manifest.json at 2026-08-21T16:47:08.896536+00:00...
Freshness: current 12, stale 6, manual 2, unknown_policy 0, unknown_age 1
Oldest current source: leaf_area_index (NParks Leaf Area Index, 113.4d of 120d threshold)
Stale sources: traffic_signals, planning_area_boundary, nparks_nature_ways, nparks_tracks, nparks_heritage_trees, nparks_heritage_road_green_buffers
Unknown-age sources: overture_addresses_sg_candidate
```

```text
PS C:\sgSHIOK2026> npm --prefix web test -- --runTestsByPath web/lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --runTestsByPath web/lib/__tests__/score-card-copy.test.ts
file:///C:/sgSHIOK2026/web/node_modules/vitest/dist/chunks/cac.DdICfEr1.js:406
          throw new CACError(`Unknown option \`${name.length > 1 ? `--${name}` : `-${name}`}\``);
                ^

CACError: Unknown option `--runTestsByPath`
    at Command.checkUnknownOptions (file:///C:/sgSHIOK2026/web/node_modules/vitest/dist/chunks/cac.DdICfEr1.js:406:17)
    at CAC.runMatchedCommand (file:///C:/sgSHIOK2026/web/node_modules/vitest/dist/chunks/cac.DdICfEr1.js:606:13)
    at CAC.parse (file:///C:/sgSHIOK2026/web/node_modules/vitest/dist/chunks/cac.DdICfEr1.js:547:12)
    at file:///C:/sgSHIOK2026/web/node_modules/vitest/dist/cli.js:11:13
    at ModuleJob.run (node:internal/modules/esm/module_job:569:25)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)

Node.js v26.5.0
```

```text
PS C:\sgSHIOK2026> npm --prefix web test -- web/lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs web/lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

No test files found, exiting with code 1

filter: web/lib/__tests__/score-card-copy.test.ts
include: **/*.{test,spec}.?(c|m)[jt]s?(x)
exclude:  **/node_modules/**, **/.git/**
```

```text
PS C:\sgSHIOK2026> npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  00:48:18
   Duration  2.15s (transform 272ms, setup 0ms, import 330ms, tests 108ms, environment 1ms)
```

```text
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "EXIT=$LASTEXITCODE"
repo_integrity=ok
EXIT=0
```

```text
PS C:\sgSHIOK2026> git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4 qa/releases
```

## FINDINGS

1. `run.py check --freshness-only` reports the checked timestamp as UTC. On this machine the current freshness check printed `2026-08-21T16:47:08.896536+00:00`, which is 22 Aug Singapore time. The browser freshness line now says `21 Aug 2026 UTC manifest-only check` so the fixed date is not mistaken for a Singapore-local date.

## DISAGREEMENTS

1. None.
