# P688 Freshness Subdecimal Window

## Working Root Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Narrow Python Regression

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_fetch.py::test_source_freshness_line_does_not_round_positive_window_to_zero -q -p no:cacheprovider; Write-Output "exit=$LASTEXITCODE"
.                                                                        [100%]
1 passed in 14.26s
exit=0
```

## Focused Web Copy Test

```text
PS C:\sgSHIOK2026> npm --prefix web test -- lib/__tests__/score-card-copy.test.ts; Write-Output "exit=$LASTEXITCODE"
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  15:32:50
   Duration  3.37s (transform 647ms, setup 0ms, import 706ms, tests 263ms, environment 1ms)

exit=0
```

## Broader Focused Python Tests

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_fetch.py tests/test_production_readiness.py -q -p no:cacheprovider; Write-Output "exit=$LASTEXITCODE"
.................................................                        [100%]
49 passed in 296.14s (0:04:56)
exit=0
```

## Real Freshness Output

```text
PS C:\sgSHIOK2026> uv run python run.py check --freshness-only; Write-Output "exit=$LASTEXITCODE"
Source freshness from raw/manifest.json at 2026-08-28T07:38:32.746311+00:00...
Manifest-only check: no upstream URLs were probed.
[covered_linkway] Covered Linkway: STALE — last_modified age 175.0d exceeds 120d threshold by 55.0d (quarterly)
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: STALE — last_modified age 175.0d exceeds 120d threshold by 55.0d (quarterly)
[bus_stops] Bus Stops: freshness current — fetched_at age 28.2d within 30d threshold with 1.8d until stale (weekly)
[bus_services] Bus Services: freshness current — fetched_at age 28.2d within 30d threshold with 1.8d until stale (weekly)
[bus_routes] Bus Routes: freshness current — fetched_at age 28.2d within 30d threshold with 1.8d until stale (weekly)
[mrt_lrt_exits] MRT/LRT Station Exits: freshness current — last_modified age 40.2d within 120d threshold with 79.8d until stale (quarterly)
[train_station_codes] Train Station Codes and Chinese Names: freshness manual
[traffic_signals] Traffic Signals: STALE — last_modified age 175.0d exceeds 120d threshold by 55.0d (quarterly)
[lamp_posts] Lamp Posts: freshness current — last_modified age 52.2d within 120d threshold with 67.8d until stale (quarterly)
[building_points] HDB Existing Building: freshness current — last_modified age 68.2d within 120d threshold with 51.8d until stale (quarterly)
[sla_dwelling_information] SLA Dwelling Information: freshness current — last_modified age 59.2d within 120d threshold with 60.8d until stale (quarterly)
[ura_no_dwelling_units] URA No of Dwelling Units: freshness current — fetched_at age 26.4d within 120d threshold with 93.6d until stale (quarterly)
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE — last_modified age 266.2d exceeds 120d threshold by 146.2d (quarterly)
[leaf_area_index] NParks Leaf Area Index: freshness current — last_modified age 120.0d within 120d threshold with <0.1d until stale (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 134.2d exceeds 120d threshold by 14.2d (quarterly)
[nparks_park_connector_loop] NParks Park Connector Loop: freshness current — last_modified age 44.2d within 120d threshold with 75.8d until stale (quarterly)
[nparks_tracks] NParks Tracks: STALE — last_modified age 246.2d exceeds 120d threshold by 126.2d (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 149.2d exceeds 120d threshold by 29.2d (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 208.2d exceeds 120d threshold by 88.2d (quarterly)
[osm_extract] Geofabrik Malaysia/Singapore/Brunei OSM: freshness manual
[overture_addresses_sg_candidate] Overture Maps Addresses — Singapore candidate: freshness unknown_age (monthly)
Freshness: current 10, stale 8, manual 2, unknown_policy 0, unknown_age 1
Oldest current source: leaf_area_index (NParks Leaf Area Index, 120.0d of 120d threshold, <0.1d until stale)
Stale sources: covered_linkway (Covered Linkway), overhead_bridge_underpass (Pedestrian Overhead Bridge / Underpass), traffic_signals (Traffic Signals), planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), nparks_nature_ways (NParks Nature Ways), nparks_tracks (NParks Tracks), nparks_heritage_trees (NParks Heritage Trees), nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers)
Manual sources: train_station_codes (Train Station Codes and Chinese Names), osm_extract (Geofabrik Malaysia/Singapore/Brunei OSM)
Unknown-age sources: overture_addresses_sg_candidate (Overture Maps Addresses — Singapore candidate)
Stale freshness action: report and plan a versioned refresh; do not mutate frozen v1 in place.
exit=0
```

## Final Validation

```text
PS C:\sgSHIOK2026> npm --prefix web test; Write-Output "exit=$LASTEXITCODE"
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  15:40:35
   Duration  118.91s (transform 4.80s, setup 0ms, import 10.82s, tests 40.54s, environment 51ms)

exit=0
```

```text
PS C:\sgSHIOK2026> uv run pytest -q --collect-only | Select-Object -Last 1; Write-Output "exit=$LASTEXITCODE"
458 tests collected in 29.71s
exit=0
```

```text
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

```text
PS C:\sgSHIOK2026> git diff --exit-code -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases raw processed; Write-Output "exit=$LASTEXITCODE"
exit=0
```

## FINDINGS

1. The freshness CLI previously rounded a positive sub-0.05-day current-source window to `0.0d until stale`, which made a current source read as if no time remained.
2. `source_freshness_line` and `oldest_current_freshness_summary` now print `<0.1d until stale` for positive sub-0.05-day windows, preserving the underlying current/stale classification while avoiding rounded-zero wording.
3. The browser first-view copy now matches that operator convention with `less than 0.1 days until stale`.
4. Python collection moved from 457 to 458 because this change adds one `tests/test_fetch.py` regression test for the rounded-zero freshness window.

## DISAGREEMENTS

1. None for this step.
