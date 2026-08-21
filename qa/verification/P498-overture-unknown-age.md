# P498 Overture Unknown-Age Freshness

## Working Root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Change

README and browser first-view freshness copy now name the unknown-age source as `Overture Maps Addresses - Singapore candidate` instead of saying only `1 candidate address source with unknown age`.

The source is named by the zero-mutation freshness report from `raw/manifest.json`; no upstream URLs were probed and no manifests or inputs were mutated.

## Freshness Report

```text
Source freshness from raw/manifest.json at 2026-08-21T18:35:41.117008+00:00...
Manifest-only check: no upstream URLs were probed.
[covered_linkway] Covered Linkway: freshness current — last_modified age 26.6d within 120d threshold (quarterly)
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: freshness current — last_modified age 26.6d within 120d threshold (quarterly)
[bus_stops] Bus Stops: freshness current — fetched_at age 21.6d within 30d threshold (weekly)
[bus_services] Bus Services: freshness current — fetched_at age 21.6d within 30d threshold (weekly)
[bus_routes] Bus Routes: freshness current — fetched_at age 21.6d within 30d threshold (weekly)
[mrt_lrt_exits] MRT/LRT Station Exits: freshness current — last_modified age 33.7d within 120d threshold (quarterly)
[train_station_codes] Train Station Codes and Chinese Names: freshness manual
[traffic_signals] Traffic Signals: STALE — last_modified age 168.4d exceeds 120d threshold (quarterly)
[lamp_posts] Lamp Posts: freshness current — last_modified age 45.7d within 120d threshold (quarterly)
[building_points] HDB Existing Building: freshness current — last_modified age 61.7d within 120d threshold (quarterly)
[sla_dwelling_information] SLA Dwelling Information: freshness current — last_modified age 52.7d within 120d threshold (quarterly)
[ura_no_dwelling_units] URA No of Dwelling Units: freshness current — fetched_at age 19.9d within 120d threshold (quarterly)
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE — last_modified age 259.7d exceeds 120d threshold (quarterly)
[leaf_area_index] NParks Leaf Area Index: freshness current — last_modified age 113.4d within 120d threshold (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 127.7d exceeds 120d threshold (quarterly)
[nparks_park_connector_loop] NParks Park Connector Loop: freshness current — last_modified age 37.7d within 120d threshold (quarterly)
[nparks_tracks] NParks Tracks: STALE — last_modified age 239.7d exceeds 120d threshold (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 142.7d exceeds 120d threshold (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 201.7d exceeds 120d threshold (quarterly)
[osm_extract] Geofabrik Malaysia/Singapore/Brunei OSM: freshness manual
[overture_addresses_sg_candidate] Overture Maps Addresses — Singapore candidate: freshness unknown_age (monthly)
Freshness: current 12, stale 6, manual 2, unknown_policy 0, unknown_age 1
Oldest current source: leaf_area_index (NParks Leaf Area Index, 113.4d of 120d threshold)
Stale sources: traffic_signals, planning_area_boundary, nparks_nature_ways, nparks_tracks, nparks_heritage_trees, nparks_heritage_road_green_buffers
Manual sources: train_station_codes, osm_extract
Unknown-age sources: overture_addresses_sg_candidate
```

## Tests

```text
....                                                                     [100%]
4 passed in 1.01s
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  02:36:25
   Duration  744ms (transform 109ms, setup 0ms, import 139ms, tests 72ms, environment 0ms)
```

## FINDINGS

1. The freshness report already named the unknown-age source as `overture_addresses_sg_candidate`, but browser copy collapsed it to an unnamed `1 candidate address source with unknown age`.
2. Naming Overture is a better user-facing caveat because Overture is a candidate universe source, not part of the frozen v1 address registry or route evidence.

## DISAGREEMENTS

1. None.
