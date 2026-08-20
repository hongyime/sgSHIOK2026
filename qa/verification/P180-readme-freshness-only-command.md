# P180 README freshness-only command

## Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
objective_read=ok
git=ok
ff9499c781a210b3c7f52a8fe41ece29e63e6b72
ff9499c781a210b3c7f52a8fe41ece29e63e6b72	refs/heads/main
```

## Change

The README now documents the zero-mutation source-age command as `uv run python run.py check --freshness-only`.

## Bare system-python check

```text
Traceback (most recent call last):
  File "<frozen runpy>", line 198, in _run_module_as_main
  File "<frozen runpy>", line 88, in _run_code
  File "C:\sgSHIOK2026\pipeline\fetch.py", line 25, in <module>
    from pipeline.bus import fetch_paginated
  File "C:\sgSHIOK2026\pipeline\bus.py", line 21, in <module>
    from pipeline.routing import RoutingGraph, route_worker
  File "C:\sgSHIOK2026\pipeline\routing.py", line 3, in <module>
    import igraph as ig
ModuleNotFoundError: No module named 'igraph'
exit=1
```

## Verified freshness-only command

```text
Source freshness from raw/manifest.json...
[covered_linkway] Covered Linkway: freshness current (quarterly)
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: freshness current (quarterly)
[bus_stops] Bus Stops: freshness current (weekly)
[bus_services] Bus Services: freshness current (weekly)
[bus_routes] Bus Routes: freshness current (weekly)
[mrt_lrt_exits] MRT/LRT Station Exits: freshness current (quarterly)
[train_station_codes] Train Station Codes and Chinese Names: freshness manual
[traffic_signals] Traffic Signals: STALE — last_modified age 167.4d exceeds 120d threshold (quarterly)
[lamp_posts] Lamp Posts: freshness current (quarterly)
[building_points] HDB Existing Building: freshness current (quarterly)
[sla_dwelling_information] SLA Dwelling Information: freshness current (quarterly)
[ura_no_dwelling_units] URA No of Dwelling Units: freshness current (quarterly)
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE — last_modified age 258.6d exceeds 120d threshold (quarterly)
[leaf_area_index] NParks Leaf Area Index: freshness current (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 126.6d exceeds 120d threshold (quarterly)
[nparks_park_connector_loop] NParks Park Connector Loop: freshness current (quarterly)
[nparks_tracks] NParks Tracks: STALE — last_modified age 238.6d exceeds 120d threshold (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 141.6d exceeds 120d threshold (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 200.6d exceeds 120d threshold (quarterly)
[osm_extract] Geofabrik Malaysia/Singapore/Brunei OSM: freshness manual
[overture_addresses_sg_candidate] Overture Maps Addresses — Singapore candidate: freshness unknown_age (monthly)
Freshness: current 12, stale 6, manual 2, unknown_policy 0, unknown_age 1
Stale sources: traffic_signals, planning_area_boundary, nparks_nature_ways, nparks_tracks, nparks_heritage_trees, nparks_heritage_road_green_buffers
Unknown-age sources: overture_addresses_sg_candidate
exit=0
```

## Focused README test

```text
...                                                                      [100%]
3 passed in 1.33s
```

## Diff check

```text
git diff --check
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
```

## Locked weights check

```text
git diff -- pipeline/config/weights.yaml
```

No output.

## Evidence path ignore check

```text
git check-ignore -v qa/verification/P180-readme-freshness-only-command.md; "exit=$LASTEXITCODE"
exit=1
```

## FINDINGS

1. The non-mutating freshness-only command exists, but documenting it as bare `python run.py check --freshness-only` is brittle on this machine because system Python lacks project dependencies and fails before freshness logic runs.
2. `uv run python run.py check --freshness-only` succeeds, does not fetch or probe upstream APIs, and reports the current local freshness snapshot: 12 current, 6 stale, 2 manual, 0 unknown-policy, and 1 unknown-age source.
3. This change is documentation and test coverage only. It reads but does not modify `raw/`, and it does not alter inputs, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None for this slice.
