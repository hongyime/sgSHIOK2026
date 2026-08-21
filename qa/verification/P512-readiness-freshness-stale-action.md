# P512 readiness stale freshness action

Working root: C:\sgSHIOK2026
Host: Prawn-E14
Date: 2026-08-22

## Guard

```text
C:\sgSHIOK2026
Prawn-E14
5cdf705ac653cf4294759203faaa19685d97edd4
5cdf705ac653cf4294759203faaa19685d97edd4	refs/heads/main
```

```text
False
check_ignore_exit=1
```

## Focused test

Command:

```text
uv run pytest tests/test_production_readiness.py -q
```

Output:

```text
..........................                                               [100%]
26 passed in 107.51s (0:01:47)
```

## Real readiness warning probe

Command:

```text
uv run python run.py readiness --gate-summary | Select-String -Pattern "source freshness warning|Stale freshness action"
```

Output:

```text
[production-readiness] validating island network QA
[production-readiness] building dry-run batch plan
[production-readiness] checking Vercel, environment, source freshness, and lamp overlay
[production-readiness] checking bundle freshness and score provenance
[production-readiness] checking OneMap validation status
[production-readiness] summarizing feature policy
[production-readiness] readiness report complete

      "warning": "source freshness warning: stale sources: nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers), nparks_heritage_trees (NParks Heritage Trees), 
nparks_nature_ways (NParks Nature Ways), nparks_tracks (NParks Tracks), planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), traffic_signals (Traffic Signals); unknown_age 
sources: overture_addresses_sg_candidate (Overture Maps Addresses \u2014 Singapore candidate); Stale freshness action: report and plan a versioned refresh; do not mutate frozen v1 in 
place."
      "source freshness warning: stale sources: nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers), nparks_heritage_trees (NParks Heritage Trees), 
nparks_nature_ways (NParks Nature Ways), nparks_tracks (NParks Tracks), planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), traffic_signals (Traffic Signals); unknown_age 
sources: overture_addresses_sg_candidate (Overture Maps Addresses \u2014 Singapore candidate); Stale freshness action: report and plan a versioned refresh; do not mutate frozen v1 in 
place.",
    "source freshness warning: stale sources: nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers), nparks_heritage_trees (NParks Heritage Trees), nparks_nature_ways 
(NParks Nature Ways), nparks_tracks (NParks Tracks), planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), traffic_signals (Traffic Signals); unknown_age sources: 
overture_addresses_sg_candidate (Overture Maps Addresses \u2014 Singapore candidate); Stale freshness action: report and plan a versioned refresh; do not mutate frozen v1 in place.",
```

## FINDINGS

1. Production-readiness source freshness warnings named stale and unknown-age sources but did not tell the operator what to do with stale sources.
2. Reusing `STALE_FRESHNESS_ACTION` keeps the readiness warning aligned with `run.py check --freshness-only`: report and plan a versioned refresh; do not mutate frozen v1 in place.

## DISAGREEMENTS

1. None.
