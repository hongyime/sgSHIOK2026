# P245 freshness CLI checked_at

## Root and host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Scope

P245 makes the zero-mutation source-freshness CLI output print the timestamp
used to compute manifest-entry ages.

No scoring, export, rescore, subset run, ingest, network build, deployment,
public-data mutation, source fetch, or locked-weight change was run.

## Focused pytest

```text
uv run pytest C:\sgSHIOK2026\tests\test_fetch.py::test_run_check_reports_stale_freshness_without_failing C:\sgSHIOK2026\tests\test_fetch.py::test_run_freshness_report_does_not_probe_upstream -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 2 items

tests\test_fetch.py ..                                                   [100%]

============================== 2 passed in 6.01s ==============================
```

## Freshness-only command

```text
uv run python run.py check --freshness-only
Source freshness from raw/manifest.json at 2026-08-20T22:56:04.239424+00:00...
[covered_linkway] Covered Linkway: freshness current — last_modified age 25.7d within 120d threshold (quarterly)
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: freshness current — last_modified age 25.7d within 120d threshold (quarterly)
[bus_stops] Bus Stops: freshness current — fetched_at age 20.8d within 30d threshold (weekly)
[bus_services] Bus Services: freshness current — fetched_at age 20.8d within 30d threshold (weekly)
[bus_routes] Bus Routes: freshness current — fetched_at age 20.8d within 30d threshold (weekly)
[mrt_lrt_exits] MRT/LRT Station Exits: freshness current — last_modified age 32.9d within 120d threshold (quarterly)
[train_station_codes] Train Station Codes and Chinese Names: freshness manual
[traffic_signals] Traffic Signals: STALE — last_modified age 167.6d exceeds 120d threshold (quarterly)
[lamp_posts] Lamp Posts: freshness current — last_modified age 44.9d within 120d threshold (quarterly)
[building_points] HDB Existing Building: freshness current — last_modified age 60.9d within 120d threshold (quarterly)
[sla_dwelling_information] SLA Dwelling Information: freshness current — last_modified age 51.9d within 120d threshold (quarterly)
[ura_no_dwelling_units] URA No of Dwelling Units: freshness current — fetched_at age 19.0d within 120d threshold (quarterly)
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE — last_modified age 258.9d exceeds 120d threshold (quarterly)
[leaf_area_index] NParks Leaf Area Index: freshness current — last_modified age 112.6d within 120d threshold (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 126.9d exceeds 120d threshold (quarterly)
[nparks_park_connector_loop] NParks Park Connector Loop: freshness current — last_modified age 36.9d within 120d threshold (quarterly)
[nparks_tracks] NParks Tracks: STALE — last_modified age 238.9d exceeds 120d threshold (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 141.9d exceeds 120d threshold (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 200.9d exceeds 120d threshold (quarterly)
[osm_extract] Geofabrik Malaysia/Singapore/Brunei OSM: freshness manual
[overture_addresses_sg_candidate] Overture Maps Addresses — Singapore candidate: freshness unknown_age (monthly)
Freshness: current 12, stale 6, manual 2, unknown_policy 0, unknown_age 1
Oldest current source: leaf_area_index (NParks Leaf Area Index, 112.6d of 120d threshold)
Stale sources: traffic_signals, planning_area_boundary, nparks_nature_ways, nparks_tracks, nparks_heritage_trees, nparks_heritage_road_green_buffers
Unknown-age sources: overture_addresses_sg_candidate
```

## Evidence tracking check

```text
git check-ignore -v C:\sgSHIOK2026\qa\verification\P245-freshness-cli-checked-at.md; Write-Output "exit=$LASTEXITCODE"
exit=1
```

## Repository integrity

```text
python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

## Locked weights diff

```text
git diff -- pipeline/config/weights.yaml
```

## FINDINGS

1. Production readiness now reports source-freshness `checked_at`, but `run.py check --freshness-only` still printed manifest-entry ages without naming the timestamp used to compute those ages.
2. `run_freshness_report()` now resolves one `checked_at` value, passes it into every source freshness status, and prints it in the first output line.
3. The upstream-check `run_check()` path remains unchanged; P245 is scoped to the zero-mutation freshness-only report.

## DISAGREEMENTS

1. None.
