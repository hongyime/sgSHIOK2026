# P235 Freshness Snapshot Age

## Working root and host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Freshness-only measurement

```text
Source freshness from raw/manifest.json...
[covered_linkway] Covered Linkway: freshness current — last_modified age 25.7d within 120d threshold (quarterly)
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: freshness current — last_modified age 25.7d within 120d threshold (quarterly)
[bus_stops] Bus Stops: freshness current — fetched_at age 20.8d within 30d threshold (weekly)
[bus_services] Bus Services: freshness current — fetched_at age 20.8d within 30d threshold (weekly)
[bus_routes] Bus Routes: freshness current — fetched_at age 20.8d within 30d threshold (weekly)
[mrt_lrt_exits] MRT/LRT Station Exits: freshness current — last_modified age 32.8d within 120d threshold (quarterly)
[train_station_codes] Train Station Codes and Chinese Names: freshness manual
[traffic_signals] Traffic Signals: STALE — last_modified age 167.6d exceeds 120d threshold (quarterly)
[lamp_posts] Lamp Posts: freshness current — last_modified age 44.8d within 120d threshold (quarterly)
[building_points] HDB Existing Building: freshness current — last_modified age 60.8d within 120d threshold (quarterly)
[sla_dwelling_information] SLA Dwelling Information: freshness current — last_modified age 51.8d within 120d threshold (quarterly)
[ura_no_dwelling_units] URA No of Dwelling Units: freshness current — fetched_at age 19.0d within 120d threshold (quarterly)
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE — last_modified age 258.8d exceeds 120d threshold (quarterly)
[leaf_area_index] NParks Leaf Area Index: freshness current — last_modified age 112.6d within 120d threshold (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 126.8d exceeds 120d threshold (quarterly)
[nparks_park_connector_loop] NParks Park Connector Loop: freshness current — last_modified age 36.8d within 120d threshold (quarterly)
[nparks_tracks] NParks Tracks: STALE — last_modified age 238.8d exceeds 120d threshold (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 141.8d exceeds 120d threshold (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 200.8d exceeds 120d threshold (quarterly)
[osm_extract] Geofabrik Malaysia/Singapore/Brunei OSM: freshness manual
[overture_addresses_sg_candidate] Overture Maps Addresses — Singapore candidate: freshness unknown_age (monthly)
Freshness: current 12, stale 6, manual 2, unknown_policy 0, unknown_age 1
Oldest current source: leaf_area_index (NParks Leaf Area Index, 112.6d of 120d threshold)
Stale sources: traffic_signals, planning_area_boundary, nparks_nature_ways, nparks_tracks, nparks_heritage_trees, nparks_heritage_road_green_buffers
Unknown-age sources: overture_addresses_sg_candidate
exit=0
```

## Post-check status

```text
?? qa/p10_network_provenance_20260813/
?? qa/p11/d_calibration_w2_0050/
?? qa/p11/d_full_w2_1200/
?? qa/p11/d_pilot_w2_0200_final/
?? qa/p11/d_pilot_w2_0200_retry3/
?? qa/p11/d_pilot_w2_0200_retry4/
?? qa/p11/diffs/
?? qa/p11/subset_0050_ready.parquet
?? qa/p11/subset_0200_ready.parquet
?? qa/p11/wip-worktree.diff
?? qa/p12/
?? qa/p125/
?? qa/p13/
?? qa/p16/
?? qa/p19/
?? qa/p21/
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
```

## Evidence path ignore check

```text
exit=1
```

## Focused web copy test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  06:03:20
   Duration  4.09s (transform 240ms, setup 0ms, import 305ms, tests 79ms, environment 0ms)
```

## Repo integrity

```text
repo_integrity=ok
exit=0
```

## Locked weights diff

```text
```

## FINDINGS

1. The manifest-only freshness classification did not change: 12 current, 6 stale, 2 manual, and 1 unknown-age source.
2. The oldest current source is still NParks Leaf Area Index, now measured at 112.6d of a 120d threshold.

## DISAGREEMENTS

1. None.
