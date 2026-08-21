# P499 Freshness Warning Source Names

## Working Root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Change

Readiness source-freshness warnings now include source display names alongside source keys for non-current sources. Structured `by_status` keys remain unchanged.

## Focused Test

```text
.                                                                        [100%]
1 passed in 7.98s
```

## Readiness Gate Summary Source-Freshness Output

```text
"source_freshness": {
  "by_status": {
    "current": [
      "building_points",
      "bus_routes",
      "bus_services",
      "bus_stops",
      "covered_linkway",
      "lamp_posts",
      "leaf_area_index",
      "mrt_lrt_exits",
      "nparks_park_connector_loop",
      "overhead_bridge_underpass",
      "sla_dwelling_information",
      "ura_no_dwelling_units"
    ],
    "stale": [
      "nparks_heritage_road_green_buffers",
      "nparks_heritage_trees",
      "nparks_nature_ways",
      "nparks_tracks",
      "planning_area_boundary",
      "traffic_signals"
    ],
    "unknown_age": [
      "overture_addresses_sg_candidate"
    ],
    "unknown_policy": []
  },
  "checked_at": "2026-08-21T18:43:19.151647+00:00",
  "config_path": "C:\\sgSHIOK2026\\pipeline\\config\\sources.yaml",
  "counts": {
    "current": 12,
    "manual": 2,
    "stale": 6,
    "unknown_age": 1,
    "unknown_policy": 0
  },
  "manifest_path": "C:\\sgSHIOK2026\\raw\\manifest.json",
  "ok": true,
  "oldest_current_source": "Oldest current source: leaf_area_index (NParks Leaf Area Index, 113.5d of 120d threshold)",
  "scope": "manifest_only",
  "state": "reported",
  "summary": "manifest-only source freshness checked at 2026-08-21T18:43:19.151647+00:00: current 12, stale 6, manual 2, unknown_policy 0, unknown_age 1",
  "upstream_urls_probed": false,
  "warning": "source freshness warning: stale sources: nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers), nparks_heritage_trees (NParks Heritage Trees), nparks_nature_ways (NParks Nature Ways), nparks_tracks (NParks Tracks), planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), traffic_signals (Traffic Signals); unknown_age sources: overture_addresses_sg_candidate (Overture Maps Addresses — Singapore candidate)"
}
```

```text
"source freshness warning: stale sources: nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers), nparks_heritage_trees (NParks Heritage Trees), nparks_nature_ways (NParks Nature Ways), nparks_tracks (NParks Tracks), planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), traffic_signals (Traffic Signals); unknown_age sources: overture_addresses_sg_candidate (Overture Maps Addresses \u2014 Singapore candidate)"
```

## FINDINGS

1. Readiness source-freshness warnings previously reported only source keys, even though the underlying freshness status carried readable source names.
2. The Overture unknown-age warning is clearer with both key and name: `overture_addresses_sg_candidate (Overture Maps Addresses — Singapore candidate)`.

## DISAGREEMENTS

1. None.
