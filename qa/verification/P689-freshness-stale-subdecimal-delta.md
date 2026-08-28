# P689 Freshness Stale Subdecimal Delta

## Working Root Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Narrow Regression Tests

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_fetch.py::test_source_freshness_line_does_not_round_stale_delta_to_zero tests/test_fetch.py::test_source_freshness_line_does_not_round_positive_window_to_zero -q -p no:cacheprovider; Write-Output "exit=$LASTEXITCODE"
..                                                                       [100%]
2 passed in 14.92s
exit=0
```

## Fetch Tests

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_fetch.py -q -p no:cacheprovider; Write-Output "exit=$LASTEXITCODE"
........................                                                 [100%]
24 passed in 12.45s
exit=0
```

## Real Freshness Output

```text
PS C:\sgSHIOK2026> uv run python run.py check --freshness-only; Write-Output "exit=$LASTEXITCODE"
Source freshness from raw/manifest.json at 2026-08-28T07:48:04.536060+00:00...
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

## FINDINGS

1. The same rounded-zero ambiguity fixed for current-source `days_until_stale` also existed for stale-source `days_past_stale`.
2. `source_freshness_line` now uses the same `<0.1d` convention for stale over-threshold deltas and current until-stale windows.
3. The real 2026-08-28 manifest-only freshness output is unchanged in classification and still reports 10 current, 8 stale, 2 manual, and 1 unknown-age source; the change is formatter-only for sub-0.05-day deltas.

## DISAGREEMENTS

1. None for this step.
