# P62 Freshness Key Summary

## Root Guard

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Remote Check

```text
87528515277f48f22f115196de838307b613e2bf	refs/heads/main
```

## Diff Stat

```text
 pipeline/fetch.py   | 37 +++++++++++++++++++++++++++++++++++++
 tests/test_fetch.py | 12 +++++++++++-
 2 files changed, 48 insertions(+), 1 deletion(-)
```

## Manifest-Only Freshness Report

Command:

```text
uv run python run.py check --freshness-only
```

Output:

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
Stale sources: traffic_signals, planning_area_boundary, nparks_nature_ways, nparks_tracks, nparks_heritage_trees, nparks_heritage_road_green_buffers
Unknown-age sources: overture_addresses_sg_candidate
```

## Focused Test

Command:

```text
uv run pytest tests/test_fetch.py -p no:cacheprovider
```

Output:

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 15 items

tests\test_fetch.py ...............                                      [100%]

============================= 15 passed in 4.24s ==============================
```

## Full Python Test

Command:

```text
uv run pytest -p no:cacheprovider
```

Output:

```text
======================= 348 passed in 170.46s (0:02:50) =======================
```

## Repo Integrity

Command:

```text
python scripts/check_repo_integrity.py
```

Output:

```text
repo_integrity=ok
```

## Diff Checks

Command:

```text
git diff --check
git diff -- pipeline/config/weights.yaml
```

Output:

```text
```

## FINDINGS

1. Manifest-only freshness reporting now prints the exact stale source keys and unknown-age source keys after the count summary, so the title-card freshness disclosure can be reproduced without parsing per-source prose.
2. The current manifest-only freshness snapshot remains `current 12, stale 6, manual 2, unknown_policy 0, unknown_age 1`.
3. The stale source key list is `traffic_signals, planning_area_boundary, nparks_nature_ways, nparks_tracks, nparks_heritage_trees, nparks_heritage_road_green_buffers`.
4. The only unknown-age source remains `overture_addresses_sg_candidate`.
5. No API collection, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.

## DISAGREEMENTS

1. None.
