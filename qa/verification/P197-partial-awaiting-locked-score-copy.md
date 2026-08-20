# P197 Partial And Awaiting Locked Score Copy

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Scope

Renamed remaining visible bundle-score labels in score states:

- `Partial bundle score` -> `Partial locked score`
- `Awaiting bundle score` -> `Awaiting locked score`

The `No full score in this bundle` context remains for not-yet-scored records.

## Freshness Recheck

```text
uv run python run.py check --freshness-only
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
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE — last_modified age 258.7d exceeds 120d threshold (quarterly)
[leaf_area_index] NParks Leaf Area Index: freshness current (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 126.7d exceeds 120d threshold (quarterly)
[nparks_park_connector_loop] NParks Park Connector Loop: freshness current (quarterly)
[nparks_tracks] NParks Tracks: STALE — last_modified age 238.7d exceeds 120d threshold (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 141.7d exceeds 120d threshold (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 200.7d exceeds 120d threshold (quarterly)
[osm_extract] Geofabrik Malaysia/Singapore/Brunei OSM: freshness manual
[overture_addresses_sg_candidate] Overture Maps Addresses — Singapore candidate: freshness unknown_age (monthly)
Freshness: current 12, stale 6, manual 2, unknown_policy 0, unknown_age 1
Stale sources: traffic_signals, planning_area_boundary, nparks_nature_ways, nparks_tracks, nparks_heritage_trees, nparks_heritage_road_green_buffers
Unknown-age sources: overture_addresses_sg_candidate
```

## Verification

```text
npm --prefix web test -- --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  34 passed (34)
   Start at  02:31:06
   Duration  1.97s (transform 931ms, setup 0ms, import 1.30s, tests 358ms, environment 1ms)
```

```text
python C:\sgSHIOK2026\scripts\check_repo_integrity.py
repo_integrity=ok
integrity_exit=0
```

```text
git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml
weights_diff_start
weights_diff_end
```

## FINDINGS

1. The freshness-only output still matches the browser disclosure: 12 current, 6 stale, 2 manual, and 1 unknown-age source.
2. Two visible score-state labels still said `bundle score` after the surrounding score-facing copy had moved to `Locked score`.
3. The change keeps the bundle limitation where users need it: not-yet-scored records still say there is no full score in this bundle.

## DISAGREEMENTS

1. None.
