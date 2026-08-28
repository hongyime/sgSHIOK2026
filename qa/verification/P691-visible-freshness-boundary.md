# P691 Visible Freshness Boundary

## Startup

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Current Manifest-only Freshness Probe

```text
[leaf_area_index] NParks Leaf Area Index: STALE - last_modified age 120.0d exceeds 120d threshold by <0.1d (quarterly)
Freshness: current 9, stale 9, manual 2, unknown_policy 0, unknown_age 1
Oldest current source: building_points (HDB Existing Building, 68.2d of 120d threshold, 51.8d until stale)
Stale sources: covered_linkway (Covered Linkway), overhead_bridge_underpass (Pedestrian Overhead Bridge / Underpass), traffic_signals (Traffic Signals), planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), leaf_area_index (NParks Leaf Area Index), nparks_nature_ways (NParks Nature Ways), nparks_tracks (NParks Tracks), nparks_heritage_trees (NParks Heritage Trees), nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers)
Stale freshness action: report and plan a versioned refresh; do not mutate frozen v1 in place.
exit=0
```

## Verification

```text
npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
Test Files  1 passed (1)
Tests  16 passed (16)
```

```text
npm --prefix web test
Test Files  24 passed (24)
Tests  166 passed (166)
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
459 tests collected in 24.21s
```

```text
python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

```text
git diff --check; Write-Output "exit=$LASTEXITCODE"
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit=0
```

```text
git diff --exit-code -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases raw processed; Write-Output "exit=$LASTEXITCODE"
exit=0
```

## FINDINGS

1. The static first-view freshness line had drifted after the 28 Aug UTC manifest-only report crossed the LAI boundary: LAI is now stale, so the correct count is 9 current and 9 stale, not 10 current and 8 stale.
2. The browser copy now names HDB Existing Building as the oldest current source and includes NParks Leaf Area Index in the stale source list.

## DISAGREEMENTS

1. None.
