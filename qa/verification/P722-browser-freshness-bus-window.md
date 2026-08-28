# P722 Browser Freshness Bus Window

## Scope

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

Zero pipeline-cost browser copy update. No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data write, deployment, or locked-weight change was performed.

## Freshness Report

```text
Source freshness from raw/manifest.json at 2026-08-28T10:27:23.719550+00:00...
Manifest-only check: no upstream URLs were probed.
[covered_linkway] Covered Linkway: STALE — last_modified age 175.1d exceeds 120d threshold by 55.1d (quarterly)
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: STALE — last_modified age 175.1d exceeds 120d threshold by 55.1d (quarterly)
[bus_stops] Bus Stops: freshness current — fetched_at age 28.3d within 30d threshold with 1.7d until stale (weekly)
[bus_services] Bus Services: freshness current — fetched_at age 28.3d within 30d threshold with 1.7d until stale (weekly)
[bus_routes] Bus Routes: freshness current — fetched_at age 28.3d within 30d threshold with 1.7d until stale (weekly)
[mrt_lrt_exits] MRT/LRT Station Exits: freshness current — last_modified age 40.3d within 120d threshold with 79.7d until stale (quarterly)
[train_station_codes] Train Station Codes and Chinese Names: freshness manual
[traffic_signals] Traffic Signals: STALE — last_modified age 175.1d exceeds 120d threshold by 55.1d (quarterly)
[lamp_posts] Lamp Posts: freshness current — last_modified age 52.3d within 120d threshold with 67.7d until stale (quarterly)
[building_points] HDB Existing Building: freshness current — last_modified age 68.3d within 120d threshold with 51.7d until stale (quarterly)
[sla_dwelling_information] SLA Dwelling Information: freshness current — last_modified age 59.3d within 120d threshold with 60.7d until stale (quarterly)
[ura_no_dwelling_units] URA No of Dwelling Units: freshness current — fetched_at age 26.5d within 120d threshold with 93.5d until stale (quarterly)
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE — last_modified age 266.3d exceeds 120d threshold by 146.3d (quarterly)
[leaf_area_index] NParks Leaf Area Index: STALE — last_modified age 120.1d exceeds 120d threshold by 0.1d (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 134.3d exceeds 120d threshold by 14.3d (quarterly)
[nparks_park_connector_loop] NParks Park Connector Loop: freshness current — last_modified age 44.3d within 120d threshold with 75.7d until stale (quarterly)
[nparks_tracks] NParks Tracks: STALE — last_modified age 246.3d exceeds 120d threshold by 126.3d (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 149.3d exceeds 120d threshold by 29.3d (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 208.3d exceeds 120d threshold by 88.3d (quarterly)
[osm_extract] Geofabrik Malaysia/Singapore/Brunei OSM: freshness manual
[overture_addresses_sg_candidate] Overture Maps Addresses — Singapore candidate: freshness unknown_age (monthly)
Freshness: current 9, stale 9, manual 2, unknown_policy 0, unknown_age 1
Oldest current source: building_points (HDB Existing Building, 68.3d of 120d threshold, 51.7d until stale)
Stale sources: covered_linkway (Covered Linkway), overhead_bridge_underpass (Pedestrian Overhead Bridge / Underpass), traffic_signals (Traffic Signals), planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), leaf_area_index (NParks Leaf Area Index), nparks_nature_ways (NParks Nature Ways), nparks_tracks (NParks Tracks), nparks_heritage_trees (NParks Heritage Trees), nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers)
Manual sources: train_station_codes (Train Station Codes and Chinese Names), osm_extract (Geofabrik Malaysia/Singapore/Brunei OSM)
Unknown-age sources: overture_addresses_sg_candidate (Overture Maps Addresses — Singapore candidate)
Stale freshness action: report and plan a versioned refresh; do not mutate frozen v1 in place.
```

## Web Test

### Focused Copy Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  18:29:11
   Duration  1.78s (transform 165ms, setup 0ms, import 195ms, tests 100ms, environment 0ms)
```

### Full Web Suite

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  18:30:04
   Duration  68.69s (transform 13.73s, setup 0ms, import 25.17s, tests 21.24s, environment 14ms)
```

## Repo Checks

```text
repo_integrity=ok
exit=0
```

```text
exit=0
```

```text
protected_diff_exit=0
```

## FINDINGS

1. The browser freshness line had the right 9-current/9-stale classification, but still named the earlier 08:05 UTC manifest-only check and older HDB freshness ages.
2. The latest manifest-only check shows all three bus score inputs are still current but only 1.7 days from stale, which is user-relevant because bus support is a visible locked-score component.

## DISAGREEMENTS

1. None.
