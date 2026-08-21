# P537 Freshness Planning

## Scope

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

Change: add source-freshness planning deltas to `uv run python run.py check --freshness-only`.

Hard limits observed:
- No scoring, export, rescore, subset run, ingest, network build, or deployment was run.
- No upstream API probes were run; the freshness command remained manifest-only.
- `pipeline/config/weights.yaml` was not modified.
- Existing protected QA evidence, `web/public/data/`, `qa/releases/`, and `checksums.json` were not modified.
- Existing `qa/verification/` evidence was not rewritten.

## Command Output

### Working Root

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

### git check-ignore -v qa/verification/P537-freshness-planning.md

```text
exit_code=1
```

### uv run python run.py check --freshness-only

```text
Source freshness from raw/manifest.json at 2026-08-21T21:25:11.344497+00:00...
Manifest-only check: no upstream URLs were probed.
[covered_linkway] Covered Linkway: freshness current — last_modified age 26.7d within 120d threshold with 93.3d until stale (quarterly)
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: freshness current — last_modified age 26.7d within 120d threshold with 93.3d until stale (quarterly)
[bus_stops] Bus Stops: freshness current — fetched_at age 21.7d within 30d threshold with 8.3d until stale (weekly)
[bus_services] Bus Services: freshness current — fetched_at age 21.7d within 30d threshold with 8.3d until stale (weekly)
[bus_routes] Bus Routes: freshness current — fetched_at age 21.7d within 30d threshold with 8.3d until stale (weekly)
[mrt_lrt_exits] MRT/LRT Station Exits: freshness current — last_modified age 33.8d within 120d threshold with 86.2d until stale (quarterly)
[train_station_codes] Train Station Codes and Chinese Names: freshness manual
[traffic_signals] Traffic Signals: STALE — last_modified age 168.5d exceeds 120d threshold by 48.5d (quarterly)
[lamp_posts] Lamp Posts: freshness current — last_modified age 45.8d within 120d threshold with 74.2d until stale (quarterly)
[building_points] HDB Existing Building: freshness current — last_modified age 61.8d within 120d threshold with 58.2d until stale (quarterly)
[sla_dwelling_information] SLA Dwelling Information: freshness current — last_modified age 52.8d within 120d threshold with 67.2d until stale (quarterly)
[ura_no_dwelling_units] URA No of Dwelling Units: freshness current — fetched_at age 20.0d within 120d threshold with 100.0d until stale (quarterly)
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE — last_modified age 259.8d exceeds 120d threshold by 139.8d (quarterly)
[leaf_area_index] NParks Leaf Area Index: freshness current — last_modified age 113.6d within 120d threshold with 6.4d until stale (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 127.8d exceeds 120d threshold by 7.8d (quarterly)
[nparks_park_connector_loop] NParks Park Connector Loop: freshness current — last_modified age 37.8d within 120d threshold with 82.2d until stale (quarterly)
[nparks_tracks] NParks Tracks: STALE — last_modified age 239.8d exceeds 120d threshold by 119.8d (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 142.8d exceeds 120d threshold by 22.8d (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 201.8d exceeds 120d threshold by 81.8d (quarterly)
[osm_extract] Geofabrik Malaysia/Singapore/Brunei OSM: freshness manual
[overture_addresses_sg_candidate] Overture Maps Addresses — Singapore candidate: freshness unknown_age (monthly)
Freshness: current 12, stale 6, manual 2, unknown_policy 0, unknown_age 1
Oldest current source: leaf_area_index (NParks Leaf Area Index, 113.6d of 120d threshold)
Stale sources: traffic_signals (Traffic Signals), planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), nparks_nature_ways (NParks Nature Ways), nparks_tracks (NParks Tracks), nparks_heritage_trees (NParks Heritage Trees), nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers)
Manual sources: train_station_codes (Train Station Codes and Chinese Names), osm_extract (Geofabrik Malaysia/Singapore/Brunei OSM)
Unknown-age sources: overture_addresses_sg_candidate (Overture Maps Addresses — Singapore candidate)
Stale freshness action: report and plan a versioned refresh; do not mutate frozen v1 in place.
```

### uv run pytest tests/test_fetch.py tests/test_readme.py -q

```text
..........................                                               [100%]
26 passed in 14.89s
```

### uv run pytest -q --collect-only | Select-Object -Last 5

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

437 tests collected in 7.13s
```

### python scripts/check_repo_integrity.py

```text
repo_integrity=ok
exit_code=0
```

### git diff --check

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

### Protected Diff Guard

Command:

```text
git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases qa/p11
```

Output:

```text
```

## FINDINGS

1. Manifest-only freshness already identified current and stale sources, but it did not show how close current sources were to becoming stale or how far stale sources were past their threshold.
2. `run.py check --freshness-only` now reports those planning deltas without changing its no-upstream-probe and no-manifest-write boundary.
3. The current manifest-only check shows DataMall bus inputs have 8.3 days until stale and NParks Leaf Area Index has 6.4 days until stale, which matters for timing any future versioned refresh or batch run.

## DISAGREEMENTS

1. None.
