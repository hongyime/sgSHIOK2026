# P831 Readiness Stale Source Order

## Startup

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
HEAD=e88f5a4cd32c2dc6e88e42ceb6458d7e29df6c51
origin/main=e88f5a4cd32c2dc6e88e42ceb6458d7e29df6c51
```

## Evidence Path Ignore Check

```text
exit=1
```

## Post-Change Manifest-Only Readiness Warning

```text
source freshness warning: stale sources: planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), nparks_tracks (NParks Tracks), nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers), traffic_signals (Traffic Signals), overhead_bridge_underpass (Pedestrian Overhead Bridge / Underpass), covered_linkway (Covered Linkway), nparks_heritage_trees (NParks Heritage Trees), nparks_nature_ways (NParks Nature Ways), leaf_area_index (NParks Leaf Area Index); unknown_age sources: overture_addresses_sg_candidate (Overture Maps Addresses — Singapore candidate); Stale freshness action: report and plan a versioned refresh; do not mutate frozen v1 in place.
most_overdue planning_area_boundary
stale_order ['planning_area_boundary', 'nparks_tracks', 'nparks_heritage_road_green_buffers', 'traffic_signals', 'overhead_bridge_underpass', 'covered_linkway', 'nparks_heritage_trees', 'nparks_nature_ways', 'leaf_area_index']
```

## Focused Test

```text
....                                             [100%]
28 passed in 113.34s (0:01:53)
```

## FINDINGS

1. Before P831, production-readiness `stale_sources` and `most_overdue_stale_source` were severity-sorted, but the warning sentence listed stale sources in source-key order.
2. The warning now starts with `planning_area_boundary`, the current `most_overdue_stale_source`, matching the structured stale-source order.
3. The regression fixture now uses `alpha_less_stale` and `zeta_more_stale` so source-key order and severity order differ; the test would catch the old behavior.

## DISAGREEMENTS

1. None.
