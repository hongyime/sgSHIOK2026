# P59 Source Freshness Snapshot Evidence

## Root Guard

```text
ROOT=C:\sgSHIOK2026
HOST=Prawn-E14
BRANCH=main
```

## Scope

```text
P59 records a manifest-only source freshness snapshot using `run.py check --freshness-only`.
This reads raw/manifest.json and pipeline/config/sources.yaml only. It does not probe upstream URLs, ingest, export, score, rescore, rebuild inputs, deploy, write public data, or touch locked weights.
```

## Raw Manifest Identity

```text
Algorithm : SHA256
Hash      : 9413E328228E9B79F577665783303509BB1A60CF414CB8D886D20580CF4190BE
Path      : C:\sgSHIOK2026\raw\manifest.json

FullName         : C:\sgSHIOK2026\raw\manifest.json
Length           : 10955
LastWriteTimeUtc : 1/8/2026 9:49:22 pm
```

## Full Freshness Snapshot

```text
Source freshness from raw/manifest.json...
[covered_linkway] Covered Linkway: freshness current (quarterly)
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: freshness current (quarterly)
[bus_stops] Bus Stops: freshness current (weekly)
[bus_services] Bus Services: freshness current (weekly)
[bus_routes] Bus Routes: freshness current (weekly)
[mrt_lrt_exits] MRT/LRT Station Exits: freshness current (quarterly)
[train_station_codes] Train Station Codes and Chinese Names: freshness manual
[traffic_signals] Traffic Signals: STALE — last_modified age 167.0d exceeds 120d threshold (quarterly)
[lamp_posts] Lamp Posts: freshness current (quarterly)
[building_points] HDB Existing Building: freshness current (quarterly)
[sla_dwelling_information] SLA Dwelling Information: freshness current (quarterly)
[ura_no_dwelling_units] URA No of Dwelling Units: freshness current (quarterly)
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE — last_modified age 258.3d exceeds 120d threshold (quarterly)
[leaf_area_index] NParks Leaf Area Index: freshness current (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 126.3d exceeds 120d threshold (quarterly)
[nparks_park_connector_loop] NParks Park Connector Loop: freshness current (quarterly)
[nparks_tracks] NParks Tracks: STALE — last_modified age 238.3d exceeds 120d threshold (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 141.3d exceeds 120d threshold (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 200.3d exceeds 120d threshold (quarterly)
[osm_extract] Geofabrik Malaysia/Singapore/Brunei OSM: freshness manual
[overture_addresses_sg_candidate] Overture Maps Addresses — Singapore candidate: freshness unknown_age (monthly)
Freshness: current 12, stale 6, manual 2, unknown_policy 0, unknown_age 1
EXIT_CODE=0
```

## Core Delivery Sources

```text
Source freshness from raw/manifest.json...
[covered_linkway] Covered Linkway: freshness current (quarterly)
[lamp_posts] Lamp Posts: freshness current (quarterly)
[bus_stops] Bus Stops: freshness current (weekly)
Freshness: current 3, stale 0, manual 0, unknown_policy 0, unknown_age 0
EXIT_CODE=0
```

## Findings

1. The manifest-only snapshot reports 6 stale sources and 1 source with unknown age: traffic_signals, planning_area_boundary, nparks_nature_ways, nparks_tracks, nparks_heritage_trees, nparks_heritage_road_green_buffers, and overture_addresses_sg_candidate.
2. The current headline delivery sources checked here — covered_linkway, lamp_posts, and bus_stops — are current under the configured freshness policy.

## Disagreements

1. None.
