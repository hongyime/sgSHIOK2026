# P833 CLI Stale Source Order

## Startup

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
HEAD=db446e6a045a1f4035b5eca1ca72252dd429a18a
origin/main=db446e6a045a1f4035b5eca1ca72252dd429a18a
```

## Focused Test

```text
...........................                                              [100%]
27 passed in 4.35s
```

## Current CLI Summary Probe

```text

Freshness: current 11, stale 9, manual 3, unknown_policy 0, unknown_age 1
Oldest current source: building_points (HDB Existing Building, 69.0d of 120d threshold, 51.0d until stale)
Stale sources: planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), nparks_tracks (NParks Tracks), nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers), 
traffic_signals (Traffic Signals), overhead_bridge_underpass (Pedestrian Overhead Bridge / Underpass), covered_linkway (Covered Linkway), nparks_heritage_trees (NParks Heritage Trees), 
nparks_nature_ways (NParks Nature Ways), leaf_area_index (NParks Leaf Area Index)
```

## FINDINGS

1. Before P833, the CLI grouped `Stale sources:` summary preserved configured source order, while readiness and browser detail now used days-past-stale severity order.
2. The CLI grouped summary now starts with `planning_area_boundary`, then `nparks_tracks`, matching the current readiness/browser severity order.
3. Individual per-source freshness lines still print in configured order; only the action summary changed.

## DISAGREEMENTS

1. None.
