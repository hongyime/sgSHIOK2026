# P611 Browser Freshness Copy

## Root guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

Free-tier browser copy and test coverage only.

No scoring, export, rescore, subset run, ingest, network build, upstream payload download, input mutation, public-data writes, protected QA mutation, deployment, or locked-weight changes were performed.

## Manifest-only freshness check

```text
Source freshness from raw/manifest.json at 2026-08-27T23:50:51.650081+00:00...
Manifest-only check: no upstream URLs were probed.
[covered_linkway] Covered Linkway: STALE — last_modified age 174.6d exceeds 120d threshold by 54.6d (quarterly)
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: STALE — last_modified age 174.6d exceeds 120d threshold by 54.6d (quarterly)
[bus_stops] Bus Stops: freshness current — fetched_at age 27.8d within 30d threshold with 2.2d until stale (weekly)
[bus_services] Bus Services: freshness current — fetched_at age 27.8d within 30d threshold with 2.2d until stale (weekly)
[bus_routes] Bus Routes: freshness current — fetched_at age 27.8d within 30d threshold with 2.2d until stale (weekly)
[mrt_lrt_exits] MRT/LRT Station Exits: freshness current — last_modified age 39.9d within 120d threshold with 80.1d until stale (quarterly)
[train_station_codes] Train Station Codes and Chinese Names: freshness manual
[traffic_signals] Traffic Signals: STALE — last_modified age 174.6d exceeds 120d threshold by 54.6d (quarterly)
[lamp_posts] Lamp Posts: freshness current — last_modified age 51.9d within 120d threshold with 68.1d until stale (quarterly)
[building_points] HDB Existing Building: freshness current — last_modified age 67.9d within 120d threshold with 52.1d until stale (quarterly)
[sla_dwelling_information] SLA Dwelling Information: freshness current — last_modified age 58.9d within 120d threshold with 61.1d until stale (quarterly)
[ura_no_dwelling_units] URA No of Dwelling Units: freshness current — fetched_at age 26.1d within 120d threshold with 93.9d until stale (quarterly)
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE — last_modified age 265.9d exceeds 120d threshold by 145.9d (quarterly)
[leaf_area_index] NParks Leaf Area Index: freshness current — last_modified age 119.7d within 120d threshold with 0.3d until stale (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 133.9d exceeds 120d threshold by 13.9d (quarterly)
[nparks_park_connector_loop] NParks Park Connector Loop: freshness current — last_modified age 43.9d within 120d threshold with 76.1d until stale (quarterly)
[nparks_tracks] NParks Tracks: STALE — last_modified age 245.9d exceeds 120d threshold by 125.9d (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 148.9d exceeds 120d threshold by 28.9d (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 207.9d exceeds 120d threshold by 87.9d (quarterly)
[osm_extract] Geofabrik Malaysia/Singapore/Brunei OSM: freshness manual
[overture_addresses_sg_candidate] Overture Maps Addresses — Singapore candidate: freshness unknown_age (monthly)
Freshness: current 10, stale 8, manual 2, unknown_policy 0, unknown_age 1
Oldest current source: leaf_area_index (NParks Leaf Area Index, 119.7d of 120d threshold, 0.3d until stale)
Stale sources: covered_linkway (Covered Linkway), overhead_bridge_underpass (Pedestrian Overhead Bridge / Underpass), traffic_signals (Traffic Signals), planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), nparks_nature_ways (NParks Nature Ways), nparks_tracks (NParks Tracks), nparks_heritage_trees (NParks Heritage Trees), nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers)
Manual sources: train_station_codes (Train Station Codes and Chinese Names), osm_extract (Geofabrik Malaysia/Singapore/Brunei OSM)
Unknown-age sources: overture_addresses_sg_candidate (Overture Maps Addresses — Singapore candidate)
Stale freshness action: report and plan a versioned refresh; do not mutate frozen v1 in place.
```

## Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  46 passed (46)
   Start at  07:56:52
   Duration  10.41s (transform 3.01s, setup 0ms, import 3.74s, tests 2.00s, environment 16ms)
```

## Full web test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  157 passed (157)
   Start at  07:56:51
   Duration  98.30s (transform 4.01s, setup 0ms, import 6.71s, tests 62.69s, environment 19ms)
```

## Python collect-only

```text
457 tests collected in 54.59s
```

## Repository integrity

```text
repo_integrity=ok
exit=0
```

## Evidence path check-ignore

```text
exit=1
```

## Protected-path diff

```text
exit=0
```

## FINDINGS

1. The browser first-view freshness copy was stale: it still showed the 21 Aug 2026 manifest-only snapshot with 12 current and 6 stale sources, while the 27 Aug 2026 manifest-only check showed 10 current and 8 stale sources.
2. Covered Linkway and Pedestrian Overhead Bridge / Underpass have crossed the 120-day freshness threshold, so the previous phrase `current Covered Linkway` was no longer honest in user-facing copy.
3. The browser now states the current manifest-only stale-source list, including Covered Linkway and Pedestrian Overhead Bridge / Underpass, and keeps the versioned-refresh rule visible.
4. The no-result and outside-bundle copy now mirrors the P609/P610 split between 0.61% confirmed missing rows and 0.82% including source-quality warnings.

## DISAGREEMENTS

1. None.
