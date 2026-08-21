# P344 Freshness Threshold Copy

## Commands

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

```text
uv run python "C:\sgSHIOK2026\run.py" check --freshness-only; $code=$LASTEXITCODE; Write-Output "EXIT_CODE=$code"; exit $code
Source freshness from raw/manifest.json at 2026-08-21T05:23:33.405359+00:00...
Manifest-only check: no upstream URLs were probed.
[covered_linkway] Covered Linkway: freshness current — last_modified age 26.0d within 120d threshold (quarterly)
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: freshness current — last_modified age 26.0d within 120d threshold (quarterly)
[bus_stops] Bus Stops: freshness current — fetched_at age 21.1d within 30d threshold (weekly)
[bus_services] Bus Services: freshness current — fetched_at age 21.1d within 30d threshold (weekly)
[bus_routes] Bus Routes: freshness current — fetched_at age 21.1d within 30d threshold (weekly)
[mrt_lrt_exits] MRT/LRT Station Exits: freshness current — last_modified age 33.1d within 120d threshold (quarterly)
[train_station_codes] Train Station Codes and Chinese Names: freshness manual
[traffic_signals] Traffic Signals: STALE — last_modified age 167.9d exceeds 120d threshold (quarterly)
[lamp_posts] Lamp Posts: freshness current — last_modified age 45.1d within 120d threshold (quarterly)
[building_points] HDB Existing Building: freshness current — last_modified age 61.1d within 120d threshold (quarterly)
[sla_dwelling_information] SLA Dwelling Information: freshness current — last_modified age 52.1d within 120d threshold (quarterly)
[ura_no_dwelling_units] URA No of Dwelling Units: freshness current — fetched_at age 19.3d within 120d threshold (quarterly)
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE — last_modified age 259.1d exceeds 120d threshold (quarterly)
[leaf_area_index] NParks Leaf Area Index: freshness current — last_modified age 112.9d within 120d threshold (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 127.1d exceeds 120d threshold (quarterly)
[nparks_park_connector_loop] NParks Park Connector Loop: freshness current — last_modified age 37.1d within 120d threshold (quarterly)
[nparks_tracks] NParks Tracks: STALE — last_modified age 239.1d exceeds 120d threshold (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 142.1d exceeds 120d threshold (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 201.1d exceeds 120d threshold (quarterly)
[osm_extract] Geofabrik Malaysia/Singapore/Brunei OSM: freshness manual
[overture_addresses_sg_candidate] Overture Maps Addresses — Singapore candidate: freshness unknown_age (monthly)
Freshness: current 12, stale 6, manual 2, unknown_policy 0, unknown_age 1
Oldest current source: leaf_area_index (NParks Leaf Area Index, 112.9d of 120d threshold)
Stale sources: traffic_signals, planning_area_boundary, nparks_nature_ways, nparks_tracks, nparks_heritage_trees, nparks_heritage_road_green_buffers
Unknown-age sources: overture_addresses_sg_candidate
EXIT_CODE=0
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --runInBand lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  13:24:26
   Duration  474ms (transform 67ms, setup 0ms, import 84ms, tests 34ms, environment 0ms)
```

```text
repo_integrity=ok
EXIT_CODE=0
```

```text
WEIGHTS_DIFF_EXIT=0
```

## Findings

1. The manifest-only freshness result remains substantively unchanged: 12 current sources, 6 stale sources, 2 manual sources, and 1 unknown-age candidate source.
2. The exact decimal age in the prior browser copy had already drifted from 112.6 to 112.9 days, so the UI should disclose the threshold relationship rather than a fragile decimal.

## Disagreements

1. None.
