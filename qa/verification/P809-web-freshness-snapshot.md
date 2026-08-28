# P809 web freshness snapshot

## Working root guard

```text
cwd=C:\sgSHIOK2026
hostname=Prawn-E14
```

## Command: uv run python run.py check --freshness-only

```text
Source freshness from raw/manifest.json at 2026-08-28T22:21:36.150100+00:00...
Manifest-only check: no upstream URLs were probed.
[covered_linkway] Covered Linkway: STALE — last_modified age 175.6d exceeds 120d threshold by 55.6d (quarterly)
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: STALE — last_modified age 175.6d exceeds 120d threshold by 55.6d (quarterly)
[bus_stops] Bus Stops: freshness current — fetched_at age 28.8d within 30d threshold with 1.2d until stale (weekly)
[bus_services] Bus Services: freshness current — fetched_at age 28.8d within 30d threshold with 1.2d until stale (weekly)
[bus_routes] Bus Routes: freshness current — fetched_at age 28.8d within 30d threshold with 1.2d until stale (weekly)
[mrt_lrt_exits] MRT/LRT Station Exits: freshness current — last_modified age 40.8d within 120d threshold with 79.2d until stale (quarterly)
[train_station_codes] Train Station Codes and Chinese Names: freshness manual
[traffic_signals] Traffic Signals: STALE — last_modified age 175.6d exceeds 120d threshold by 55.6d (quarterly)
[lamp_posts] Lamp Posts: freshness current — last_modified age 52.8d within 120d threshold with 67.2d until stale (quarterly)
[building_points] HDB Existing Building: freshness current — last_modified age 68.8d within 120d threshold with 51.2d until stale (quarterly)
[acra_registered_entities] Entities Registered with ACRA: freshness current — fetched_at age 32.4d within 120d threshold with 87.6d until stale (quarterly)
[other_uen_registered_entities] Entities Registered with Other UEN Issuance Agencies: freshness current — fetched_at age 28.1d within 120d threshold with 91.9d until stale (quarterly)
[sla_dwelling_information] SLA Dwelling Information: freshness current — last_modified age 59.8d within 120d threshold with 60.2d until stale (quarterly)
[ura_no_dwelling_units] URA No of Dwelling Units: freshness current — fetched_at age 27.0d within 120d threshold with 93.0d until stale (quarterly)
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE — last_modified age 266.8d exceeds 120d threshold by 146.8d (quarterly)
[leaf_area_index] NParks Leaf Area Index: STALE — last_modified age 120.6d exceeds 120d threshold by 0.6d (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 134.8d exceeds 120d threshold by 14.8d (quarterly)
[nparks_park_connector_loop] NParks Park Connector Loop: freshness current — last_modified age 44.8d within 120d threshold with 75.2d until stale (quarterly)
[nparks_tracks] NParks Tracks: STALE — last_modified age 246.8d exceeds 120d threshold by 126.8d (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 149.8d exceeds 120d threshold by 29.8d (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 208.8d exceeds 120d threshold by 88.8d (quarterly)
[osm_extract] Geofabrik Malaysia/Singapore/Brunei OSM: freshness manual
[postal_universe_onemap_2020] OneMap-derived Singapore postal dump, accessed 10 Jun 2020 by xuancong84: freshness manual
[overture_addresses_sg_candidate] Overture Maps Addresses — Singapore candidate: freshness unknown_age (monthly)
Freshness: current 11, stale 9, manual 3, unknown_policy 0, unknown_age 1
Oldest current source: building_points (HDB Existing Building, 68.8d of 120d threshold, 51.2d until stale)
Stale sources: covered_linkway (Covered Linkway), overhead_bridge_underpass (Pedestrian Overhead Bridge / Underpass), traffic_signals (Traffic Signals), planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), leaf_area_index (NParks Leaf Area Index), nparks_nature_ways (NParks Nature Ways), nparks_tracks (NParks Tracks), nparks_heritage_trees (NParks Heritage Trees), nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers)
Manual sources: train_station_codes (Train Station Codes and Chinese Names), osm_extract (Geofabrik Malaysia/Singapore/Brunei OSM), postal_universe_onemap_2020 (OneMap-derived Singapore postal dump, accessed 10 Jun 2020 by xuancong84)
Unknown-age sources: overture_addresses_sg_candidate (Overture Maps Addresses — Singapore candidate)
Stale freshness action: report and plan a versioned refresh; do not mutate frozen v1 in place.
```

## FINDINGS

1. The previous web copy still named the 28 Aug 2026 11:52 UTC freshness snapshot after a newer no-write 22:21 UTC manifest-only check was available.
2. Freshness counts did not change: 11 current, 9 stale, 3 manual, 1 unknown-age candidate.
3. Operator-relevant age windows did change: bus source inputs are now 1.2 days from stale, and HDB Existing Building is 68.8 days into its 120-day threshold with 51.2 days until stale.

## Command: npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  56 passed (56)
   Start at  06:24:43
   Duration  8.52s (transform 3.59s, setup 0ms, import 4.61s, tests 957ms, environment 1ms)
```

## Command: uv run pytest -q --collect-only

```text
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs
tests/test_triage_onemap_outliers.py::test_triage_cli_refuses_existing_explicit_output_before_input_reads

629 tests collected in 11.13s
exit_code=0
```

## Command: python scripts/check_repo_integrity.py

```text
repo_integrity=ok
exit_code=0
```

## Command: protected path diff guard

```text
protected_diff_exit_code=0
```

## DISAGREEMENTS

1. None.
