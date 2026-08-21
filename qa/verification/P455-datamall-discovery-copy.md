# P455 DataMall Discovery Copy

## Root And Host

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Scope

Surfaced the safe 21 Aug 2026 DataMall geospatial discovery-only result in the
browser's first-view Covered Linkway caveat. No scoring, export, rescore, subset
run, ingest, network build, payload fetch, public data write, or deployment was
run.

## P19 Status

```text
uv run python run.py p19-gap-status; Write-Output "EXIT=$LASTEXITCODE"
{
  "evidence_split": {
    "confirmed_missing_address_rows": 6,
    "coordinate_backed_hdb_missing_rows": 6,
    "detail_exists": true,
    "source_quality_warning_rows": 2,
    "unvalidated_mcst_proxy_rows": 2
  },
  "files": {
    "summary": {
      "age_days": 5.515,
      "bytes": 4168,
      "combined_recent_completion_signal": {
        "missing_rows": 8,
        "missing_unique_postals": 8,
        "row_miss_rate": 0.008197,
        "rows_with_postal": 976
      },
      "exists": true,
      "generated_at_utc": "2026-08-16T02:08:55.624822+00:00",
      "missing_postals_by_source": {
        "hdb_2021_2026_geocoded": [
          "521400",
          "522400",
          "523400",
          "762936",
          "763936",
          "764936"
        ],
        "mcst_2021_2026": [
          "378720",
          "935456"
        ]
      },
      "path": "qa\\p19\\universe_gap_measurement_summary.json"
    }
  },
  "mode": "cache_status_only",
  "will_call_apis": false,
  "will_write_files": false
}
EXIT=0
```

## P125 Status

```text
uv run python run.py p125-osm-status; Write-Output "EXIT=$LASTEXITCODE"
{
  "coverage": {
    "osm_coverage_of_v1_pct": 20.791045,
    "osm_only_sample": [
      "289916",
      "289917",
      "289918",
      "289919",
      "289920",
      "519454"
    ],
    "osm_valid_distinct_postcodes": 25879,
    "osm_valid_in_v1": 25873,
    "osm_valid_not_in_v1": 6,
    "v1_distinct_postals": 124443,
    "v1_not_in_osm_valid": 98570,
    "verdict": "not sufficient as primary Singapore address registry"
  },
  "measurement": "P125 live Overpass addr:postcode coverage",
  "mode": "p125_osm_status",
  "will_call_apis": false,
  "will_write_files": false
}
EXIT=0
```

## Freshness-Only Status

```text
uv run python run.py check --freshness-only; Write-Output "EXIT=$LASTEXITCODE"
Source freshness from raw/manifest.json at 2026-08-21T14:30:54.444944+00:00...
Manifest-only check: no upstream URLs were probed.
[covered_linkway] Covered Linkway: freshness current — last_modified age 26.4d within 120d threshold (quarterly)
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: freshness current — last_modified age 26.4d within 120d threshold (quarterly)
[bus_stops] Bus Stops: freshness current — fetched_at age 21.4d within 30d threshold (weekly)
[bus_services] Bus Services: freshness current — fetched_at age 21.4d within 30d threshold (weekly)
[bus_routes] Bus Routes: freshness current — fetched_at age 21.4d within 30d threshold (weekly)
[mrt_lrt_exits] MRT/LRT Station Exits: freshness current — last_modified age 33.5d within 120d threshold (quarterly)
[train_station_codes] Train Station Codes and Chinese Names: freshness manual
[traffic_signals] Traffic Signals: STALE — last_modified age 168.3d exceeds 120d threshold (quarterly)
[lamp_posts] Lamp Posts: freshness current — last_modified age 45.5d within 120d threshold (quarterly)
[building_points] HDB Existing Building: freshness current — last_modified age 61.5d within 120d threshold (quarterly)
[sla_dwelling_information] SLA Dwelling Information: freshness current — last_modified age 52.5d within 120d threshold (quarterly)
[ura_no_dwelling_units] URA No of Dwelling Units: freshness current — fetched_at age 19.7d within 120d threshold (quarterly)
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE — last_modified age 259.5d exceeds 120d threshold (quarterly)
[leaf_area_index] NParks Leaf Area Index: freshness current — last_modified age 113.3d within 120d threshold (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 127.5d exceeds 120d threshold (quarterly)
[nparks_park_connector_loop] NParks Park Connector Loop: freshness current — last_modified age 37.5d within 120d threshold (quarterly)
[nparks_tracks] NParks Tracks: STALE — last_modified age 239.5d exceeds 120d threshold (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 142.5d exceeds 120d threshold (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 201.5d exceeds 120d threshold (quarterly)
[osm_extract] Geofabrik Malaysia/Singapore/Brunei OSM: freshness manual
[overture_addresses_sg_candidate] Overture Maps Addresses — Singapore candidate: freshness unknown_age (monthly)
Freshness: current 12, stale 6, manual 2, unknown_policy 0, unknown_age 1
Oldest current source: leaf_area_index (NParks Leaf Area Index, 113.3d of 120d threshold)
Stale sources: traffic_signals, planning_area_boundary, nparks_nature_ways, nparks_tracks, nparks_heritage_trees, nparks_heritage_road_green_buffers
Unknown-age sources: overture_addresses_sg_candidate
EXIT=0
```

## DataMall Discovery-Only Status

```text
uv run python run.py check --geospatial-discovery-only; Write-Output "EXIT=$LASTEXITCODE"
DataMall geospatial discovery check...
Discovery-only check: no payloads are downloaded and no manifest files are written.
Unauthenticated static discovery failed for CoveredLinkWay: Unauthenticated static prefix discovery failed for keyword: CoveredLinkWay. Falling back to Authenticated GeospatialWholeIsland API.
[covered_linkway] Covered Linkway: keyword=CoveredLinkWay match=false manifest_url=https://datamall.lta.gov.sg/content/dam/datamall/datasets/Geospatial/CoveredLinkWay_Mar2026.zip discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/CoveredLinkWay.zip
Unauthenticated static discovery failed for PedestrainOverheadbridge_UnderPass: Unauthenticated static prefix discovery failed for keyword: PedestrainOverheadbridge_UnderPass. Falling back to Authenticated GeospatialWholeIsland API.
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: keyword=PedestrainOverheadbridge_UnderPass match=false manifest_url=https://datamall.lta.gov.sg/content/dam/datamall/datasets/Geospatial/PedestrainOverheadbridge_UnderPass_Mar2026.zip discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/PedestrainOverheadbridge_UnderPass.zip
Unauthenticated static discovery failed for TrafficLight: Unauthenticated static prefix discovery failed for keyword: TrafficLight. Falling back to Authenticated GeospatialWholeIsland API.
[traffic_signals] Traffic Signals: keyword=TrafficLight match=true manifest_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/TrafficLight.zip discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/TrafficLight.zip
DataMall geospatial discovery: matched 1, changed 2, errors 0
EXIT=1
```

## Focused Web Test

```text
npm --prefix C:\sgSHIOK2026\web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  22:32:00
   Duration  1.57s (transform 198ms, setup 0ms, import 247ms, tests 187ms, environment 0ms)
```

## FINDINGS

1. The 21 Aug 2026 freshness-only report still says no upstream URLs were probed and reports 12 current, 6 stale, 2 manual, and 1 unknown-age source.
2. The 21 Aug 2026 DataMall geospatial discovery-only report did probe metadata and found current `covered_linkway` and `overhead_bridge_underpass` discovery URLs differ from frozen v1; `traffic_signals` still matches.
3. The browser's Covered Linkway caveat now distinguishes those facts: frozen v1 remains the Mar 2026 listing, current discovery differs, and any refresh must be a new numbered input version.

## DISAGREEMENTS

1. None.
