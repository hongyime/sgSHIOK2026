# P732 freshness source coverage

## Root and host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Manifest source coverage before patch

```text
config_count 21
manifest_count 23
manifest_only ['acra_registered_entities', 'other_uen_registered_entities', 'postal_universe_onemap_2020']
config_only ['overture_addresses_sg_candidate']
```

## Manifest source coverage after patch

```text
config_count 24
manifest_count 23
manifest_only []
config_only ['overture_addresses_sg_candidate']
```

## Freshness-only check

```text
Source freshness from raw/manifest.json at 2026-08-28T12:02:15.586336+00:00...
Manifest-only check: no upstream URLs were probed.
[covered_linkway] Covered Linkway: STALE - last_modified age 175.2d exceeds 120d threshold by 55.2d (quarterly)
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: STALE - last_modified age 175.2d exceeds 120d threshold by 55.2d (quarterly)
[bus_stops] Bus Stops: freshness current - fetched_at age 28.3d within 30d threshold with 1.7d until stale (weekly)
[bus_services] Bus Services: freshness current - fetched_at age 28.3d within 30d threshold with 1.7d until stale (weekly)
[bus_routes] Bus Routes: freshness current - fetched_at age 28.3d within 30d threshold with 1.7d until stale (weekly)
[mrt_lrt_exits] MRT/LRT Station Exits: freshness current - last_modified age 40.4d within 120d threshold with 79.6d until stale (quarterly)
[train_station_codes] Train Station Codes and Chinese Names: freshness manual
[traffic_signals] Traffic Signals: STALE - last_modified age 175.2d exceeds 120d threshold by 55.2d (quarterly)
[lamp_posts] Lamp Posts: freshness current - last_modified age 52.4d within 120d threshold with 67.6d until stale (quarterly)
[building_points] HDB Existing Building: freshness current - last_modified age 68.4d within 120d threshold with 51.6d until stale (quarterly)
[acra_registered_entities] Entities Registered with ACRA: freshness current - fetched_at age 31.9d within 120d threshold with 88.1d until stale (quarterly)
[other_uen_registered_entities] Entities Registered with Other UEN Issuance Agencies: freshness current - fetched_at age 27.7d within 120d threshold with 92.3d until stale (quarterly)
[sla_dwelling_information] SLA Dwelling Information: freshness current - last_modified age 59.4d within 120d threshold with 60.6d until stale (quarterly)
[ura_no_dwelling_units] URA No of Dwelling Units: freshness current - fetched_at age 26.6d within 120d threshold with 93.4d until stale (quarterly)
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE - last_modified age 266.4d exceeds 120d threshold by 146.4d (quarterly)
[leaf_area_index] NParks Leaf Area Index: STALE - last_modified age 120.2d exceeds 120d threshold by 0.2d (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE - last_modified age 134.4d exceeds 120d threshold by 14.4d (quarterly)
[nparks_park_connector_loop] NParks Park Connector Loop: freshness current - last_modified age 44.4d within 120d threshold with 75.6d until stale (quarterly)
[nparks_tracks] NParks Tracks: STALE - last_modified age 246.4d exceeds 120d threshold by 126.4d (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE - last_modified age 149.4d exceeds 120d threshold by 29.4d (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE - last_modified age 208.4d exceeds 120d threshold by 88.4d (quarterly)
[osm_extract] Geofabrik Malaysia/Singapore/Brunei OSM: freshness manual
[postal_universe_onemap_2020] OneMap-derived Singapore postal dump, accessed 10 Jun 2020 by xuancong84: freshness manual
[overture_addresses_sg_candidate] Overture Maps Addresses - Singapore candidate: freshness unknown_age (monthly)
Freshness: current 11, stale 9, manual 3, unknown_policy 0, unknown_age 1
Oldest current source: building_points (HDB Existing Building, 68.4d of 120d threshold, 51.6d until stale)
Stale sources: covered_linkway (Covered Linkway), overhead_bridge_underpass (Pedestrian Overhead Bridge / Underpass), traffic_signals (Traffic Signals), planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), leaf_area_index (NParks Leaf Area Index), nparks_nature_ways (NParks Nature Ways), nparks_tracks (NParks Tracks), nparks_heritage_trees (NParks Heritage Trees), nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers)
Manual sources: train_station_codes (Train Station Codes and Chinese Names), osm_extract (Geofabrik Malaysia/Singapore/Brunei OSM), postal_universe_onemap_2020 (OneMap-derived Singapore postal dump, accessed 10 Jun 2020 by xuancong84)
Unknown-age sources: overture_addresses_sg_candidate (Overture Maps Addresses - Singapore candidate)
Stale freshness action: report and plan a versioned refresh; do not mutate frozen v1 in place.
exit_code=0
```

## Focused tests

```text
............................                                             [100%]
28 passed in 8.63s
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  20:00:55
   Duration  1.80s (transform 327ms, setup 0ms, import 383ms, tests 233ms, environment 0ms)
```

## Collection and integrity

```text
531 tests collected in 24.70s
```

```text
repo_integrity=ok
exit_code=0
```

## Diff checks

```text
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

```text
exit_code=0
```

## Evidence path ignore check

```text
exit_code=1
```

## FINDINGS

1. The freshness policy did not cover three sources already recorded in `raw/manifest.json`: `acra_registered_entities`, `other_uen_registered_entities`, and `postal_universe_onemap_2020`.
2. After adding those three policies, every source in `raw/manifest.json` is covered by `pipeline/config/sources.yaml`; `overture_addresses_sg_candidate` remains config-only and unknown-age because it has not been promoted into the frozen-v1 manifest.
3. The user-facing freshness copy now reflects the measured 28 Aug 2026 manifest-only result: 11 current, 9 stale, 3 manual, and 1 unknown-age candidate source.

## DISAGREEMENTS

1. None.
