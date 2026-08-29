# P830 Freshness Manifest Policy Gaps

## Startup

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
HEAD=2c85a6a7af1a7481ba88b0d483551af8645fc74d
origin/main=2c85a6a7af1a7481ba88b0d483551af8645fc74d
```

## Evidence Path Ignore Check

```text
exit=1
```

## Manifest Versus Config Source Keys

```text
config_count 24
manifest_count 23
manifest_minus_config []
config_minus_manifest ['overture_addresses_sg_candidate']
```

## Current Freshness Output

```text
Source freshness from raw/manifest.json at 2026-08-29T01:02:25.875262+00:00...
Manifest-only check: no upstream URLs were probed.
[covered_linkway] Covered Linkway: STALE — last_modified age 175.7d exceeds 120d threshold by 55.7d (quarterly)
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: STALE — last_modified age 175.7d exceeds 120d threshold by 55.7d (quarterly)
[bus_stops] Bus Stops: freshness current — fetched_at age 28.9d within 30d threshold with 1.1d until stale (weekly)
[bus_services] Bus Services: freshness current — fetched_at age 28.9d within 30d threshold with 1.1d until stale (weekly)
[bus_routes] Bus Routes: freshness current — fetched_at age 28.9d within 30d threshold with 1.1d until stale (weekly)
[mrt_lrt_exits] MRT/LRT Station Exits: freshness current — last_modified age 41.0d within 120d threshold with 79.0d until stale (quarterly)
[train_station_codes] Train Station Codes and Chinese Names: freshness manual
[traffic_signals] Traffic Signals: STALE — last_modified age 175.7d exceeds 120d threshold by 55.7d (quarterly)
[lamp_posts] Lamp Posts: freshness current — last_modified age 53.0d within 120d threshold with 67.0d until stale (quarterly)
[building_points] HDB Existing Building: freshness current — last_modified age 69.0d within 120d threshold with 51.0d until stale (quarterly)
[acra_registered_entities] Entities Registered with ACRA: freshness current — fetched_at age 32.5d within 120d threshold with 87.5d until stale (quarterly)
[other_uen_registered_entities] Entities Registered with Other UEN Issuance Agencies: freshness current — fetched_at age 28.2d within 120d threshold with 91.8d until stale (quarterly)
[sla_dwelling_information] SLA Dwelling Information: freshness current — last_modified age 60.0d within 120d threshold with 60.0d until stale (quarterly)
[ura_no_dwelling_units] URA No of Dwelling Units: freshness current — fetched_at age 27.1d within 120d threshold with 92.9d until stale (quarterly)
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE — last_modified age 267.0d exceeds 120d threshold by 147.0d (quarterly)
[leaf_area_index] NParks Leaf Area Index: STALE — last_modified age 120.7d exceeds 120d threshold by 0.7d (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 135.0d exceeds 120d threshold by 15.0d (quarterly)
[nparks_park_connector_loop] NParks Park Connector Loop: freshness current — last_modified age 45.0d within 120d threshold with 75.0d until stale (quarterly)
[nparks_tracks] NParks Tracks: STALE — last_modified age 247.0d exceeds 120d threshold by 127.0d (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 150.0d exceeds 120d threshold by 30.0d (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 209.0d exceeds 120d threshold by 89.0d (quarterly)
[osm_extract] Geofabrik Malaysia/Singapore/Brunei OSM: freshness manual
[postal_universe_onemap_2020] OneMap-derived Singapore postal dump, accessed 10 Jun 2020 by xuancong84: freshness manual
[overture_addresses_sg_candidate] Overture Maps Addresses — Singapore candidate: freshness unknown_age (monthly)
Freshness: current 11, stale 9, manual 3, unknown_policy 0, unknown_age 1
Oldest current source: building_points (HDB Existing Building, 69.0d of 120d threshold, 51.0d until stale)
Stale sources: covered_linkway (Covered Linkway), overhead_bridge_underpass (Pedestrian Overhead Bridge / Underpass), traffic_signals (Traffic Signals), planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), leaf_area_index (NParks Leaf Area Index), nparks_nature_ways (NParks Nature Ways), nparks_tracks (NParks Tracks), nparks_heritage_trees (NParks Heritage Trees), nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers)
Manual sources: train_station_codes (Train Station Codes and Chinese Names), osm_extract (Geofabrik Malaysia/Singapore/Brunei OSM), postal_universe_onemap_2020 (OneMap-derived Singapore postal dump, accessed 10 Jun 2020 by xuancong84)
Unknown-age sources: overture_addresses_sg_candidate (Overture Maps Addresses — Singapore candidate)
Stale freshness action: report and plan a versioned refresh; do not mutate frozen v1 in place.
```

## Focused Tests

```text
...........................................................              [100%]
59 passed in 66.18s (0:01:06)
```

## Repo Integrity

```text
repo_integrity=ok
exit=0
```

## Protected Diff Guard

```text
```

## FINDINGS

1. Before P830, `run.py check --freshness-only` and production readiness iterated configured sources only. A source key present only in `raw/manifest.json` would be hidden from the manifest-only freshness report instead of surfaced as a policy gap.
2. The current copied manifest has no manifest-only source keys. The only config-only key is `overture_addresses_sg_candidate`, which remains expected and reports as `unknown_age` because the cached candidate archive has no timestamp.
3. The fix keeps selected-source freshness checks scoped to the selected configured source, so targeted operator checks are not polluted by unrelated manifest/config drift.

## DISAGREEMENTS

1. None.
