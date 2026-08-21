# P480 Leaf Area Index Freshness Framing

Date: 2026-08-22
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Free-tier browser copy precision only.

No scoring, export, rescore, subset run, ingest, network build, deployment, input rebuild, public-data mutation, protected QA mutation, or weights.yaml edit was performed.

## Evidence commands

```text
PS C:\sgSHIOK2026> uv run python run.py check --freshness-only | Select-String -- 'Source freshness|Freshness:|Oldest current|Stale sources|Unknown-age'

Source freshness from raw/manifest.json at 2026-08-21T16:52:35.868441+00:00...
Freshness: current 12, stale 6, manual 2, unknown_policy 0, unknown_age 1
Oldest current source: leaf_area_index (NParks Leaf Area Index, 113.4d of 120d threshold)
Stale sources: traffic_signals, planning_area_boundary, nparks_nature_ways, nparks_tracks, nparks_heritage_trees, nparks_heritage_road_green_buffers
Unknown-age sources: overture_addresses_sg_candidate
```

```text
PS C:\sgSHIOK2026> npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  00:53:30
   Duration  2.87s (transform 534ms, setup 0ms, import 622ms, tests 208ms, environment 1ms)
```

```text
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "EXIT=$LASTEXITCODE"
repo_integrity=ok
EXIT=0
```

```text
PS C:\sgSHIOK2026> git check-ignore -v qa/verification/P480-lai-freshness-framing.md; Write-Output "EXIT=$LASTEXITCODE"
EXIT=1
```

```text
PS C:\sgSHIOK2026> git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4 qa/releases
```

## FINDINGS

1. The manifest-only report legitimately names `leaf_area_index` as the oldest current source, but Leaf Area Index is a freshness-only reference table rather than route geometry, shade-proxy geometry, or score evidence. Browser copy now preserves the measured freshness counts while naming LAI only in that reference-table role.

## DISAGREEMENTS

1. None.
