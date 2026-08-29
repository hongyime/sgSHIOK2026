# P1023 Browser Source-Age Snapshot

Date: 2026-08-30
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

Zero-mutation source-age reporting and browser honesty copy.
No scoring, export, rescore, subset run, ingest, network build, deployment, dependency install, upstream probe, manifest write, or protected data mutation.

## Freshness Command

```text
Source freshness from raw/manifest.json and pipeline/config/sources.yaml at 2026-08-29T17:23:22.780137+00:00...
Manifest-only check: no upstream URLs were probed.
[covered_linkway] Covered Linkway: STALE — last_modified age 176.4d exceeds 120d threshold by 56.4d (quarterly)
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: STALE — last_modified age 176.4d exceeds 120d threshold by 56.4d (quarterly)
[bus_stops] Bus Stops: freshness current — fetched_at age 29.6d within 30d threshold with 0.4d until stale (weekly)
[bus_services] Bus Services: freshness current — fetched_at age 29.6d within 30d threshold with 0.4d until stale (weekly)
[bus_routes] Bus Routes: freshness current — fetched_at age 29.6d within 30d threshold with 0.4d until stale (weekly)
[mrt_lrt_exits] MRT/LRT Station Exits: freshness current — last_modified age 41.6d within 120d threshold with 78.4d until stale (quarterly)
[train_station_codes] Train Station Codes and Chinese Names: freshness manual
[traffic_signals] Traffic Signals: STALE — last_modified age 176.4d exceeds 120d threshold by 56.4d (quarterly)
[lamp_posts] Lamp Posts: freshness current — last_modified age 53.6d within 120d threshold with 66.4d until stale (quarterly)
[building_points] HDB Existing Building: freshness current — last_modified age 69.6d within 120d threshold with 50.4d until stale (quarterly)
[acra_registered_entities] Entities Registered with ACRA: freshness current — fetched_at age 33.1d within 120d threshold with 86.9d until stale (quarterly)
[other_uen_registered_entities] Entities Registered with Other UEN Issuance Agencies: freshness current — fetched_at age 28.9d within 120d threshold with 91.1d until stale (quarterly)
[sla_dwelling_information] SLA Dwelling Information: freshness current — last_modified age 60.6d within 120d threshold with 59.4d until stale (quarterly)
[ura_no_dwelling_units] URA No of Dwelling Units: freshness current — fetched_at age 27.8d within 120d threshold with 92.2d until stale (quarterly)
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE — last_modified age 267.6d exceeds 120d threshold by 147.6d (quarterly)
[leaf_area_index] NParks Leaf Area Index: STALE — last_modified age 121.4d exceeds 120d threshold by 1.4d (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 135.6d exceeds 120d threshold by 15.6d (quarterly)
[nparks_park_connector_loop] NParks Park Connector Loop: freshness current — last_modified age 45.6d within 120d threshold with 74.4d until stale (quarterly)
[nparks_tracks] NParks Tracks: STALE — last_modified age 247.6d exceeds 120d threshold by 127.6d (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 150.6d exceeds 120d threshold by 30.6d (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 209.6d exceeds 120d threshold by 89.6d (quarterly)
[osm_extract] Geofabrik Malaysia/Singapore/Brunei OSM: freshness manual
[postal_universe_onemap_2020] OneMap-derived Singapore postal dump, accessed 10 Jun 2020 by xuancong84: freshness manual
[overture_addresses_sg_candidate] Overture Maps Addresses — Singapore candidate: freshness unknown_age (monthly)
Freshness: current 11, stale 9, manual 3, unknown_policy 0, unknown_age 1
Oldest current source: building_points (HDB Existing Building, 69.6d of 120d threshold, 50.4d until stale)
Stale sources: planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), nparks_tracks (NParks Tracks), nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers), traffic_signals (Traffic Signals), overhead_bridge_underpass (Pedestrian Overhead Bridge / Underpass), covered_linkway (Covered Linkway), nparks_heritage_trees (NParks Heritage Trees), nparks_nature_ways (NParks Nature Ways), leaf_area_index (NParks Leaf Area Index)
Manual sources: train_station_codes (Train Station Codes and Chinese Names), osm_extract (Geofabrik Malaysia/Singapore/Brunei OSM), postal_universe_onemap_2020 (OneMap-derived Singapore postal dump, accessed 10 Jun 2020 by xuancong84)
Unknown-age sources: overture_addresses_sg_candidate (Overture Maps Addresses — Singapore candidate)
Stale freshness action: report and plan a versioned refresh; do not mutate frozen v1 in place.
```

## Test Output

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  01:25:09
   Duration  38.27s (transform 20.93s, setup 0ms, import 26.34s, tests 5.35s, environment 4ms)
```

## FINDINGS

1. The latest zero-mutation freshness report still has the same user-relevant classification as the prior browser snapshot: 11 current, 9 stale, 3 manual, and 1 unknown-age source.
2. Bus Stops, Bus Services, and Bus Routes are now only 0.4 days from their stale threshold. They are still current in the manifest-only report, but the next stale transition is close.
3. The browser disclosure now names the newer 29 Aug 2026 17:23 UTC source-age check instead of the older 09:38 UTC snapshot.

## DISAGREEMENTS

1. None.
