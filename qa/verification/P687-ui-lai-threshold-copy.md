# P687 UI LAI Threshold Copy

## Working Root Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Manifest-Only Freshness Check

```text
PS C:\sgSHIOK2026> Get-Date -Format o; uv run python run.py check --freshness-only; Write-Output "exit=$LASTEXITCODE"
2026-08-28T15:15:59.0720623+08:00
Source freshness from raw/manifest.json at 2026-08-28T07:16:18.248246+00:00...
Manifest-only check: no upstream URLs were probed.
[covered_linkway] Covered Linkway: STALE - last_modified age 175.0d exceeds 120d threshold by 55.0d (quarterly)
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: STALE - last_modified age 175.0d exceeds 120d threshold by 55.0d (quarterly)
[bus_stops] Bus Stops: freshness current - fetched_at age 28.1d within 30d threshold with 1.9d until stale (weekly)
[bus_services] Bus Services: freshness current - fetched_at age 28.1d within 30d threshold with 1.9d until stale (weekly)
[bus_routes] Bus Routes: freshness current - fetched_at age 28.1d within 30d threshold with 1.9d until stale (weekly)
[mrt_lrt_exits] MRT/LRT Station Exits: freshness current - last_modified age 40.2d within 120d threshold with 79.8d until stale (quarterly)
[train_station_codes] Train Station Codes and Chinese Names: freshness manual
[traffic_signals] Traffic Signals: STALE - last_modified age 175.0d exceeds 120d threshold by 55.0d (quarterly)
[lamp_posts] Lamp Posts: freshness current - last_modified age 52.2d within 120d threshold with 67.8d until stale (quarterly)
[building_points] HDB Existing Building: freshness current - last_modified age 68.2d within 120d threshold with 51.8d until stale (quarterly)
[sla_dwelling_information] SLA Dwelling Information: freshness current - last_modified age 59.2d within 120d threshold with 60.8d until stale (quarterly)
[ura_no_dwelling_units] URA No of Dwelling Units: freshness current - fetched_at age 26.4d within 120d threshold with 93.6d until stale (quarterly)
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE - last_modified age 266.2d exceeds 120d threshold by 146.2d (quarterly)
[leaf_area_index] NParks Leaf Area Index: freshness current - last_modified age 120.0d within 120d threshold with 0.0d until stale (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE - last_modified age 134.2d exceeds 120d threshold by 14.2d (quarterly)
[nparks_park_connector_loop] NParks Park Connector Loop: freshness current - last_modified age 44.2d within 120d threshold with 75.8d until stale (quarterly)
[nparks_tracks] NParks Tracks: STALE - last_modified age 246.2d exceeds 120d threshold by 126.2d (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE - last_modified age 149.2d exceeds 120d threshold by 29.2d (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE - last_modified age 208.2d exceeds 120d threshold by 88.2d (quarterly)
[osm_extract] Geofabrik Malaysia/Singapore/Brunei OSM: freshness manual
[overture_addresses_sg_candidate] Overture Maps Addresses - Singapore candidate: freshness unknown_age (monthly)
Freshness: current 10, stale 8, manual 2, unknown_policy 0, unknown_age 1
Oldest current source: leaf_area_index (NParks Leaf Area Index, 120.0d of 120d threshold, 0.0d until stale)
Stale sources: covered_linkway (Covered Linkway), overhead_bridge_underpass (Pedestrian Overhead Bridge / Underpass), traffic_signals (Traffic Signals), planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), nparks_nature_ways (NParks Nature Ways), nparks_tracks (NParks Tracks), nparks_heritage_trees (NParks Heritage Trees), nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers)
Manual sources: train_station_codes (Train Station Codes and Chinese Names), osm_extract (Geofabrik Malaysia/Singapore/Brunei OSM)
Unknown-age sources: overture_addresses_sg_candidate (Overture Maps Addresses - Singapore candidate)
Stale freshness action: report and plan a versioned refresh; do not mutate frozen v1 in place.
exit=0
```

## Initial Focused Test Command

```text
PS C:\sgSHIOK2026> npm --prefix web test -- web/lib/__tests__/score-card-copy.test.ts; Write-Output "exit=$LASTEXITCODE"
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs web/lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

No test files found, exiting with code 1

filter: web/lib/__tests__/score-card-copy.test.ts
include: **/*.{test,spec}.?(c|m)[jt]s?(x)
exclude:  **/node_modules/**, **/.git/**

exit=1
```

## Corrected Focused Test Before Fix

```text
PS C:\sgSHIOK2026> npm --prefix web test -- lib/__tests__/score-card-copy.test.ts; Write-Output "exit=$LASTEXITCODE"
Test Files  1 failed (1)
Tests  1 failed | 15 passed (16)
Failure: expected source to contain '0.1 days from its 120-day threshold'
exit=1
```

## Corrected Focused Test After Fix

```text
PS C:\sgSHIOK2026> npm --prefix web test -- lib/__tests__/score-card-copy.test.ts; Write-Output "exit=$LASTEXITCODE"
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  15:17:40
   Duration  1.42s (transform 271ms, setup 0ms, import 323ms, tests 160ms, environment 1ms)

exit=0
```

## Full Web Test

```text
PS C:\sgSHIOK2026> npm --prefix web test; Write-Output "exit=$LASTEXITCODE"
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  15:18:53
   Duration  111.58s (transform 4.06s, setup 0ms, import 7.54s, tests 57.10s, environment 17ms)

exit=0
```

## FINDINGS

1. The 28 Aug 2026 manifest-only freshness report still has 10 current, 8 stale, 2 manual, and 1 unknown-age source, but NParks Leaf Area Index has reached the rounded display boundary: 120.0d of 120d threshold, 0.0d until stale.
2. The previous visible first-view copy said LAI was 0.1 days from its 120-day threshold; the browser copy now matches the current report by saying it is at the 120-day threshold with 0.0 days until stale.
3. The first focused test command used a repo-root path after `npm --prefix web`; the web runner expects a path relative to `web/`. The corrected path exposed and then verified the stale assertion update.

## DISAGREEMENTS

1. None for this step.
