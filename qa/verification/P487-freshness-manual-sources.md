# P487 Freshness Manual Sources

Working root:

```text
C:\sgSHIOK2026
Prawn-E14
```

## Check-ignore

```text
Command: git check-ignore -v qa/verification/P487-freshness-manual-sources.md; if ($LASTEXITCODE -eq 0) { "exit=$LASTEXITCODE" } else { "exit=$LASTEXITCODE" }
exit=1
```

## Focused Tests

```text
Command: uv run pytest C:\sgSHIOK2026\tests\test_fetch.py -q
....................                                                     [100%]
20 passed in 3.18s
```

## Freshness-Only Output

```text
Command: uv run python C:\sgSHIOK2026\run.py check --freshness-only
Source freshness from raw/manifest.json at 2026-08-21T17:21:46.472224+00:00...
Manifest-only check: no upstream URLs were probed.
[covered_linkway] Covered Linkway: freshness current — last_modified age 26.5d within 120d threshold (quarterly)
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: freshness current — last_modified age 26.5d within 120d threshold (quarterly)
[bus_stops] Bus Stops: freshness current — fetched_at age 21.6d within 30d threshold (weekly)
[bus_services] Bus Services: freshness current — fetched_at age 21.6d within 30d threshold (weekly)
[bus_routes] Bus Routes: freshness current — fetched_at age 21.6d within 30d threshold (weekly)
[mrt_lrt_exits] MRT/LRT Station Exits: freshness current — last_modified age 33.6d within 120d threshold (quarterly)
[train_station_codes] Train Station Codes and Chinese Names: freshness manual
[traffic_signals] Traffic Signals: STALE — last_modified age 168.4d exceeds 120d threshold (quarterly)
[lamp_posts] Lamp Posts: freshness current — last_modified age 45.6d within 120d threshold (quarterly)
[building_points] HDB Existing Building: freshness current — last_modified age 61.6d within 120d threshold (quarterly)
[sla_dwelling_information] SLA Dwelling Information: freshness current — last_modified age 52.6d within 120d threshold (quarterly)
[ura_no_dwelling_units] URA No of Dwelling Units: freshness current — fetched_at age 19.8d within 120d threshold (quarterly)
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE — last_modified age 259.6d exceeds 120d threshold (quarterly)
[leaf_area_index] NParks Leaf Area Index: freshness current — last_modified age 113.4d within 120d threshold (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 127.6d exceeds 120d threshold (quarterly)
[nparks_park_connector_loop] NParks Park Connector Loop: freshness current — last_modified age 37.6d within 120d threshold (quarterly)
[nparks_tracks] NParks Tracks: STALE — last_modified age 239.6d exceeds 120d threshold (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 142.6d exceeds 120d threshold (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 201.6d exceeds 120d threshold (quarterly)
[osm_extract] Geofabrik Malaysia/Singapore/Brunei OSM: freshness manual
[overture_addresses_sg_candidate] Overture Maps Addresses — Singapore candidate: freshness unknown_age (monthly)
Freshness: current 12, stale 6, manual 2, unknown_policy 0, unknown_age 1
Oldest current source: leaf_area_index (NParks Leaf Area Index, 113.4d of 120d threshold)
Stale sources: traffic_signals, planning_area_boundary, nparks_nature_ways, nparks_tracks, nparks_heritage_trees, nparks_heritage_road_green_buffers
Manual sources: train_station_codes, osm_extract
Unknown-age sources: overture_addresses_sg_candidate
```

## FINDINGS

1. The safe freshness report previously counted two manual-policy sources but only named stale and unknown-age sources in the footer, so release review had to scan the full per-source list to learn that the manual sources are `train_station_codes` and `osm_extract`.
2. The reporting gap was duplicated in `run_freshness_report()` and the broader `run_check()` footer; both now summarize manual sources through the same `freshness_key_summary()` path used by stale and unknown-age sources.

## DISAGREEMENTS

1. None.
