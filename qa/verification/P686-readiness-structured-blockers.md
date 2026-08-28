# P686 Readiness Structured Blockers

## Working Root Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Focused Tests

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_production_readiness.py -q -p no:cacheprovider; Write-Output "exit=$LASTEXITCODE"
..........................                                               [100%]
26 passed in 155.40s (0:02:35)
exit=0
```

## Real Gate Summary Probe

```text
PS C:\sgSHIOK2026> uv run python run.py readiness --gate-summary; Write-Output "exit=$LASTEXITCODE"
[production-readiness] resolving active bundle and QA paths
[production-readiness] validating static bundle artifacts
[production-readiness] static artifacts: scanning JSON artifact files
[production-readiness] static artifacts: scanned 4848 JSON artifact files
[production-readiness] static artifacts: checking artifact file sizes
[production-readiness] static artifacts: validating score index and shards
[production-readiness] static artifacts: validating 304 score shards
[production-readiness] static artifacts: validated 304/304 score shards
[production-readiness] static artifacts: validated 124443 indexed score records
[production-readiness] static artifacts: validating manifest references
[production-readiness] static artifacts: validating geometry index and shards
[production-readiness] static artifacts: validating 3453 geometry shards
[production-readiness] static artifacts: validated 3453/3453 geometry shards
[production-readiness] static artifacts: validated 114140 geometry records
[production-readiness] static artifacts: validating transit POI artifact
[production-readiness] auditing bundle state
[production-readiness] validating island network QA
[production-readiness] building dry-run batch plan
[production-readiness] checking Vercel, environment, source freshness, and lamp overlay
[production-readiness] checking bundle freshness and score provenance
[production-readiness] checking OneMap validation status
[production-readiness] summarizing feature policy
[production-readiness] readiness report complete
{
  "errors": [],
  "generated_at": "2026-08-28T07:11:44.072550+00:00",
  "ok": true,
  "release_gate_passed": false,
  "release_gate_status": "blocked",
  "release_gate_summary": {
    "active_bundle": "generated_20260805_prefer_scored_routed",
    "blocking_checks": [
      "onemap_validation_same_bundle_fresh",
      "onemap_validation_waived"
    ],
    "checks": {
      "infrastructure_readiness": true,
      "lamp_overlay_artifact": true,
      "onemap_validation_same_bundle_fresh": false,
      "onemap_validation_waived": false,
      "scoring_fingerprints": true,
      "state_counts_match_manifest": true,
      "static_artifact_validation": true,
      "vercel_root_directory": true
    },
    "source_freshness": {
      "counts": {
        "current": 10,
        "manual": 2,
        "stale": 8,
        "unknown_age": 1,
        "unknown_policy": 0
      },
      "nearest_current_source_to_stale": {
        "age_basis": "last_modified",
        "age_days": 119.970586,
        "days_until_stale": 0.029414,
        "expected_cadence": "quarterly",
        "name": "NParks Leaf Area Index",
        "source_key": "leaf_area_index",
        "stale_after_days": 120,
        "status": "current"
      },
      "ok": true,
      "upstream_urls_probed": false
    },
    "static_artifact_validation": {
      "errors": [],
      "ok": true,
      "warnings": []
    },
    "warning_checks": [
      "source_freshness",
      "bundle_network_freshness",
      "scoring_fingerprints",
      "onemap_validation",
      "vercel_link"
    ]
  },
  "warnings": [
    "Vercel project is not linked in this local checkout",
    "source freshness warning: stale sources: covered_linkway (Covered Linkway), nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers), nparks_heritage_trees (NParks Heritage Trees), nparks_nature_ways (NParks Nature Ways), nparks_tracks (NParks Tracks), overhead_bridge_underpass (Pedestrian Overhead Bridge / Underpass), planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), traffic_signals (Traffic Signals); unknown_age sources: overture_addresses_sg_candidate (Overture Maps Addresses \\u2014 Singapore candidate); Stale freshness action: report and plan a versioned refresh; do not mutate frozen v1 in place.",
    "active bundle predates current network build; run targeted/full rescore/export before claiming latest network corrections are live",
    "active bundle uses legacy provenance schema; missing capability: full 18-file scoring fingerprint set, record-level scoring fingerprint digests, record-level scoring input provenance, record-level network provenance; score values may be used as a verified legacy artifact, but this bundle cannot provide full record-level provenance evidence; non-score reference source hashes present: leaf_area_index (NParks Leaf Area Index)",
    "latest cached 95,157-row OneMap walk validation failed: median abs delta 11.884% (max 12.0%), p95 abs delta 69.861% (max 100.0%), missing cache results 0, invalid cache results 62; failing criteria: complete cache coverage, subset thresholds; failing subsets: endpoint_connector, graph_routed_bus_stop, endpoint_connector_plausible_onemap_distance, graph_routed_bus_stop_plausible_onemap_distance"
  ]
}
exit=0
```

## FINDINGS

1. `readiness --gate-summary` now exposes `release_gate_summary.blocking_checks`, so the active release blocker is machine-readable instead of requiring warning-string parsing.
2. The current active bundle's blocking checks are `onemap_validation_same_bundle_fresh` and `onemap_validation_waived`, which means the release gate is blocked because the same-bundle OneMap gate has not passed and no owner waiver is active.
3. Non-blocking warning checks are separately exposed as `source_freshness`, `bundle_network_freshness`, `scoring_fingerprints`, `onemap_validation`, and `vercel_link`.

## DISAGREEMENTS

1. None for this step.
