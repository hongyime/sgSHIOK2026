# P201 Freshness Current Age Reporting

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

`run.py check --freshness-only` already reported stale sources from `raw/manifest.json`, but current-source lines only said `freshness current (cadence)`. P201 makes current-source lines auditable by printing the timestamp basis, age in days, and threshold when the manifest has an age.

## Focused Tests

```text
uv run pytest C:\sgSHIOK2026\tests\test_fetch.py -q -p no:cacheprovider
................                                                         [100%]
16 passed in 5.07s
```

## Freshness-Only Output

```text
Source freshness from raw/manifest.json...
[covered_linkway] Covered Linkway: freshness current — last_modified age 25.6d within 120d threshold (quarterly)
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: freshness current — last_modified age 25.6d within 120d threshold (quarterly)
[bus_stops] Bus Stops: freshness current — fetched_at age 20.6d within 30d threshold (weekly)
[bus_services] Bus Services: freshness current — fetched_at age 20.6d within 30d threshold (weekly)
[bus_routes] Bus Routes: freshness current — fetched_at age 20.6d within 30d threshold (weekly)
[mrt_lrt_exits] MRT/LRT Station Exits: freshness current — last_modified age 32.7d within 120d threshold (quarterly)
[train_station_codes] Train Station Codes and Chinese Names: freshness manual
[traffic_signals] Traffic Signals: STALE — last_modified age 167.4d exceeds 120d threshold (quarterly)
[lamp_posts] Lamp Posts: freshness current — last_modified age 44.7d within 120d threshold (quarterly)
[building_points] HDB Existing Building: freshness current — last_modified age 60.7d within 120d threshold (quarterly)
[sla_dwelling_information] SLA Dwelling Information: freshness current — last_modified age 51.7d within 120d threshold (quarterly)
[ura_no_dwelling_units] URA No of Dwelling Units: freshness current — fetched_at age 18.9d within 120d threshold (quarterly)
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE — last_modified age 258.7d exceeds 120d threshold (quarterly)
[leaf_area_index] NParks Leaf Area Index: freshness current — last_modified age 112.5d within 120d threshold (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 126.7d exceeds 120d threshold (quarterly)
[nparks_park_connector_loop] NParks Park Connector Loop: freshness current — last_modified age 36.7d within 120d threshold (quarterly)
[nparks_tracks] NParks Tracks: STALE — last_modified age 238.7d exceeds 120d threshold (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 141.7d exceeds 120d threshold (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 200.7d exceeds 120d threshold (quarterly)
[osm_extract] Geofabrik Malaysia/Singapore/Brunei OSM: freshness manual
[overture_addresses_sg_candidate] Overture Maps Addresses — Singapore candidate: freshness unknown_age (monthly)
Freshness: current 12, stale 6, manual 2, unknown_policy 0, unknown_age 1
Stale sources: traffic_signals, planning_area_boundary, nparks_nature_ways, nparks_tracks, nparks_heritage_trees, nparks_heritage_road_green_buffers
Unknown-age sources: overture_addresses_sg_candidate
```

## FINDINGS

1. `run.py check --freshness-only` is a safe manifest-only source freshness report and does not probe upstream URLs.
2. The freshness report now gives current-source age evidence as well as stale-source threshold breaches.
3. The live manifest freshness state remains 12 current, 6 stale, 2 manual, 0 unknown-policy, and 1 unknown-age source.
4. `leaf_area_index` is still current but close to the 120-day quarterly threshold at 112.5 days.

## DISAGREEMENTS

1. None.
