# P502 freshness summary source names

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-22

## Change

`run.py check --freshness-only` now includes source display names in grouped freshness summaries, so stale/manual/unknown-age action lists can be read without cross-referencing `pipeline/config/sources.yaml`.

## Command output

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_fetch.py -q
....................                                                     [100%]
20 passed in 7.18s
```

```text
PS C:\sgSHIOK2026> uv run python run.py check --freshness-only
Source freshness from raw/manifest.json at 2026-08-21T18:59:41.493288+00:00...
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
[leaf_area_index] NParks Leaf Area Index: freshness current — last_modified age 113.5d within 120d threshold (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 127.7d exceeds 120d threshold (quarterly)
[nparks_park_connector_loop] NParks Park Connector Loop: freshness current — last_modified age 37.7d within 120d threshold (quarterly)
[nparks_tracks] NParks Tracks: STALE — last_modified age 239.7d exceeds 120d threshold (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 142.7d exceeds 120d threshold (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 201.7d exceeds 120d threshold (quarterly)
[osm_extract] Geofabrik Malaysia/Singapore/Brunei OSM: freshness manual
[overture_addresses_sg_candidate] Overture Maps Addresses — Singapore candidate: freshness unknown_age (monthly)
Freshness: current 12, stale 6, manual 2, unknown_policy 0, unknown_age 1
Oldest current source: leaf_area_index (NParks Leaf Area Index, 113.5d of 120d threshold)
Stale sources: traffic_signals (Traffic Signals), planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), nparks_nature_ways (NParks Nature Ways), nparks_tracks (NParks Tracks), nparks_heritage_trees (NParks Heritage Trees), nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers)
Manual sources: train_station_codes (Train Station Codes and Chinese Names), osm_extract (Geofabrik Malaysia/Singapore/Brunei OSM)
Unknown-age sources: overture_addresses_sg_candidate (Overture Maps Addresses — Singapore candidate)
```

## FINDINGS

1. The freshness report already had per-source names on individual lines, but grouped action summaries listed only source keys. That made the safe operator report less useful than the readiness warning format.
2. Current manifest-only freshness status remains unchanged: 12 current, 6 stale, 2 manual, 0 unknown-policy, and 1 unknown-age source.

## DISAGREEMENTS

1. None.
