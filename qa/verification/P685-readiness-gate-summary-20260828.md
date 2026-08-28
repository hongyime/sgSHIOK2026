# P685 Readiness Gate Summary, 2026-08-28

## Working Root Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Command

```text
PS C:\sgSHIOK2026> uv run python run.py readiness --gate-summary; Write-Output "exit=$LASTEXITCODE"
[production-readiness] resolving active bundle and QA paths
[production-readiness] validating static bundle artifacts
[production-readiness] static artifacts: scanning JSON artifact files
[production-readiness] static artifacts: scanned 4848 JSON artifact files
[production-readiness] static artifacts: checking artifact file sizes
[production-readiness] static artifacts: validating score index and shards
[production-readiness] static artifacts: validating 304 score shards
[production-readiness] static artifacts: validated 25/304 score shards
[production-readiness] static artifacts: validated 50/304 score shards
[production-readiness] static artifacts: validated 75/304 score shards
[production-readiness] static artifacts: validated 100/304 score shards
[production-readiness] static artifacts: validated 125/304 score shards
[production-readiness] static artifacts: validated 150/304 score shards
[production-readiness] static artifacts: validated 175/304 score shards
[production-readiness] static artifacts: validated 200/304 score shards
[production-readiness] static artifacts: validated 225/304 score shards
[production-readiness] static artifacts: validated 250/304 score shards
[production-readiness] static artifacts: validated 275/304 score shards
[production-readiness] static artifacts: validated 300/304 score shards
[production-readiness] static artifacts: validated 304/304 score shards
[production-readiness] static artifacts: validated 124443 indexed score records
[production-readiness] static artifacts: validating manifest references
[production-readiness] static artifacts: validating geometry index and shards
[production-readiness] static artifacts: validating 3453 geometry shards
[production-readiness] static artifacts: validated 250/3453 geometry shards
[production-readiness] static artifacts: validated 500/3453 geometry shards
[production-readiness] static artifacts: validated 750/3453 geometry shards
[production-readiness] static artifacts: validated 1000/3453 geometry shards
[production-readiness] static artifacts: validated 1250/3453 geometry shards
[production-readiness] static artifacts: validated 1500/3453 geometry shards
[production-readiness] static artifacts: validated 1750/3453 geometry shards
[production-readiness] static artifacts: validated 2000/3453 geometry shards
[production-readiness] static artifacts: validated 2250/3453 geometry shards
[production-readiness] static artifacts: validated 2500/3453 geometry shards
[production-readiness] static artifacts: validated 2750/3453 geometry shards
[production-readiness] static artifacts: validated 3000/3453 geometry shards
[production-readiness] static artifacts: validated 3250/3453 geometry shards
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
  "generated_at": "2026-08-28T06:54:15.379547+00:00",
  "ok": true,
  "release_gate_passed": false,
  "release_gate_status": "blocked",
  "release_gate_summary": {
    "active_bundle": "generated_20260805_prefer_scored_routed",
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
    "lamp_overlay_artifact": {
      "artifact_dir": "C:\\sgSHIOK2026\\web\\public\\data\\lamp_posts_v1",
      "h3_resolution": 8,
      "local_tile_bytes": 3026077,
      "manifest_path": "C:\\sgSHIOK2026\\web\\public\\data\\lamp_posts_v1\\manifest.json",
      "missing_tile_count": 0,
      "missing_tiles_sample": [],
      "ok": true,
      "point_count": 126144,
      "size_mismatch_count": 0,
      "size_mismatches_sample": [],
      "source_bytes": 41907845,
      "source_sha256": "2b552c1429aaf93c544209df3da68838d708a78ec5ae86dcd2852c10b0589f29",
      "state": "passed",
      "tile_bytes": 3026077,
      "tile_count": 700,
      "tile_index_count": 700,
      "warning": null
    },
    "manifest_path": "C:\\sgSHIOK2026\\web\\public\\data\\generated_20260805_prefer_scored_routed\\manifest.json",
    "onemap_validation": {
      "active_bundle": "generated_20260805_prefer_scored_routed",
      "bundle": "generated_20260805_prefer_scored_routed",
      "bundle_matches_active": true,
      "cached_results": 95095,
      "failing_subset_order": [
        {
          "count": 8283,
          "median_abs_delta_m": 43.8,
          "median_abs_pct_delta": 23.19,
          "p95_abs_delta_m": 452.0,
          "p95_abs_pct_delta": 80.206,
          "subset": "endpoint_connector"
        },
        {
          "count": 31330,
          "median_abs_delta_m": 27.9,
          "median_abs_pct_delta": 15.988,
          "p95_abs_delta_m": 265.9,
          "p95_abs_pct_delta": 76.321,
          "subset": "graph_routed_bus_stop"
        },
        {
          "count": 8030,
          "median_abs_delta_m": 42.8,
          "median_abs_pct_delta": 22.228,
          "p95_abs_delta_m": 461.4,
          "p95_abs_pct_delta": 74.611,
          "subset": "endpoint_connector_plausible_onemap_distance"
        },
        {
          "count": 30176,
          "median_abs_delta_m": 26.8,
          "median_abs_pct_delta": 15.242,
          "p95_abs_delta_m": 276.9,
          "p95_abs_pct_delta": 67.965,
          "subset": "graph_routed_bus_stop_plausible_onemap_distance"
        }
      ],
      "fresh_for_active_bundle": true,
      "gate_passed": false,
      "generated_at": "2026-08-10T18:14:29.330832+00:00",
      "invalid_cache_results": 62,
      "median_abs_pct_delta": 11.884,
      "missing_cache_results": 0,
      "p95_abs_pct_delta": 69.861,
      "same_bundle_fresh_gate_passed": false,
      "sample_size": 95157,
      "state": "failed",
      "summary": "latest cached 95,157-row OneMap walk validation failed: median abs delta 11.884% (max 12.0%), p95 abs delta 69.861% (max 100.0%), missing cache results 0, invalid cache results 62; failing criteria: complete cache coverage, subset thresholds; failing subsets: endpoint_connector, graph_routed_bus_stop, endpoint_connector_plausible_onemap_distance, graph_routed_bus_stop_plausible_onemap_distance",
      "thresholds": {
        "median_abs_pct_delta_max": 12.0,
        "p95_abs_pct_delta_max": 100.0
      }
    },
    "owner_approvals": {
      "note": "",
      "production_deploy": false
    },
    "required_owner_approvals": [
      "production_deploy"
    ],
    "scoring_fingerprint_status": {
      "blocking_provenance_signals": [],
      "legacy_missing_capabilities": [
        "full 18-file scoring fingerprint set",
        "record-level scoring fingerprint digests",
        "record-level scoring input provenance",
        "record-level network provenance"
      ],
      "manifest_path": "C:\\sgSHIOK2026\\web\\public\\data\\generated_20260805_prefer_scored_routed\\manifest.json",
      "mixed_network_digests": false,
      "mixed_scoring_fingerprint_digests": false,
      "mixed_scoring_input_digests": false,
      "network_changed_during_run": false,
      "non_score_reference_source_hashes": [
        "leaf_area_index"
      ],
      "ok": true,
      "scoring_fingerprint_changed_during_run": false,
      "scoring_input_changed_during_run": false,
      "state": "legacy",
      "warning": "active bundle uses legacy provenance schema; missing capability: full 18-file scoring fingerprint set, record-level scoring fingerprint digests, record-level scoring input provenance, record-level network provenance; score values may be used as a verified legacy artifact, but this bundle cannot provide full record-level provenance evidence; non-score reference source hashes present: leaf_area_index (NParks Leaf Area Index)",
      "warning_provenance_signals": []
    },
    "source_freshness": {
      "counts": {
        "current": 10,
        "manual": 2,
        "stale": 8,
        "unknown_age": 1,
        "unknown_policy": 0
      },
      "most_overdue_stale_source": {
        "age_basis": "last_modified",
        "age_days": 266.198813,
        "days_past_stale": 146.198813,
        "expected_cadence": "quarterly",
        "name": "Planning Area Boundaries (MP2019 No Sea)",
        "source_key": "planning_area_boundary",
        "stale_after_days": 120
      },
      "nearest_current_source_to_stale": {
        "age_basis": "last_modified",
        "age_days": 119.958442,
        "days_until_stale": 0.041558,
        "expected_cadence": "quarterly",
        "name": "NParks Leaf Area Index",
        "source_key": "leaf_area_index",
        "stale_after_days": 120,
        "status": "current"
      },
      "ok": true,
      "upstream_urls_probed": false
    },
    "state_counts": {
      "NOT_YET_SCORED": 476,
      "NO_TRANSIT_IN_RANGE": 9827,
      "SCORED": 95157,
      "SCORED_PARTIAL": 18983
    },
    "static_artifact_validation": {
      "errors": [],
      "ok": true,
      "warnings": []
    },
    "unresolved_warnings": [
      "Vercel project is not linked in this local checkout",
      "source freshness warning: stale sources: covered_linkway (Covered Linkway), nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers), nparks_heritage_trees (NParks Heritage Trees), nparks_nature_ways (NParks Nature Ways), nparks_tracks (NParks Tracks), overhead_bridge_underpass (Pedestrian Overhead Bridge / Underpass), planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), traffic_signals (Traffic Signals); unknown_age sources: overture_addresses_sg_candidate (Overture Maps Addresses \\u2014 Singapore candidate); Stale freshness action: report and plan a versioned refresh; do not mutate frozen v1 in place.",
      "active bundle predates current network build; run targeted/full rescore/export before claiming latest network corrections are live",
      "active bundle uses legacy provenance schema; missing capability: full 18-file scoring fingerprint set, record-level scoring fingerprint digests, record-level scoring input provenance, record-level network provenance; score values may be used as a verified legacy artifact, but this bundle cannot provide full record-level provenance evidence; non-score reference source hashes present: leaf_area_index (NParks Leaf Area Index)",
      "latest cached 95,157-row OneMap walk validation failed: median abs delta 11.884% (max 12.0%), p95 abs delta 69.861% (max 100.0%), missing cache results 0, invalid cache results 62; failing criteria: complete cache coverage, subset thresholds; failing subsets: endpoint_connector, graph_routed_bus_stop, endpoint_connector_plausible_onemap_distance, graph_routed_bus_stop_plausible_onemap_distance"
    ],
    "vercel_root_directory": null
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

1. The 2026-08-28 read-only readiness gate summary still reports `ok: true` for generating the report and `release_gate_status: blocked` for release.
2. Static artifact validation passed over 4,848 JSON artifacts, 304 score shards, 124,443 indexed score records, 3,453 geometry shards, and 114,140 geometry records.
3. The active bundle remains blocked by the same release-facing signals: failed same-bundle OneMap validation, stale source freshness, active bundle predating current network build, legacy provenance capability gaps, and missing owner approval for production deploy.
4. The lamp-post browser layer artifact remains structurally ready: 126,144 points, 700 tiles, 0 missing tiles, and 0 size mismatches.

## DISAGREEMENTS

1. None for this step.
