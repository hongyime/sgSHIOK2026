# P200 Production Readiness Absolute Run

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Command

```text
uv run python C:\sgSHIOK2026\scripts\production_readiness.py
```

## Raw Run Summary

```text
readiness_exit=1
elapsed_seconds=388.593
stdout_bytes=41382
stderr_bytes=0
stderr_head
stdout_head
{
  "batch_plan": {
    "bounded_geocoding": {
      "completed_fill": {
        "cache_db": "C:\\shiok\\raw\\geocode_cache.db",
        "cache_failures": 476,
        "cache_successes": 99,
        "delay_seconds": 2.0,
        "dry_run": false,
        "errors": [],
        "filled_successes": 99,
        "http_requests": 0,
        "input": "processed\\postal_universe_candidate_full_registered.parquet",
        "needs_geocode_after": 476,
        "ok": true,
        "output": "processed\\postal_universe_candidate_full_registered_geocoded.parquet",
        "queued_postals": 575,
        "ready_to_score_after": 123967,
        "retry_cached_failures": false,
        "status_counts": {
          "NOT_FOUND": 476,
          "SUCCESS": 99
        },
        "summary": "processed\\postal_universe_candidate_full_registered_geocoded_summary.json",
        "will_bruteforce": false
      },
      "consumer": "OneMap search API",
      "delay_seconds": 2.0,
      "minimum_wall_clock_human": "0s",
      "minimum_wall_clock_seconds": 0.0,
      "requests": 0,
      "scope": "completed bounded fill; remaining NEEDS_GEOCODE rows stay NOT_YET_SCORED",
      "unresolved_after_bounded_geocode": 476,
      "will_bruteforce": false
    },
    "checkpoint_gates": {
      "blockers": [
        "human approval required before full geocode/scoring batch",
        "human approval required before production deploy or mock-to-real frontend cutover",
        "island-wide network QA is not green",
        "postal universe uses frozen v1 third-party OneMap-derived 2020 source; v2 requires candidate-source-first approval before full-batch use"
      ],
```

## Parsed Release State

```text
{
  "release_gate_passed": false,
  "release_gate_status": "blocked",
  "ok": false,
  "errors": [
    "island network QA failed",
    "Vercel project is not linked",
    "Vercel root directory is not web"
  ],
  "warnings": [
    "source freshness warning: stale sources: nparks_heritage_road_green_buffers, nparks_heritage_trees, nparks_nature_ways, nparks_tracks, planning_area_boundary, traffic_signals; unknown_age sources: overture_addresses_sg_candidate",
    "active bundle uses legacy provenance schema; missing capability: full 18-file scoring fingerprint set, record-level scoring fingerprint digests, record-level scoring input provenance, record-level network provenance; score values may be used as a verified legacy artifact, but this bundle cannot provide full record-level provenance evidence; non-score reference source hashes present: leaf_area_index",
    "latest cached 95,157-row OneMap walk validation failed: median abs delta 11.884% (max 12.0%), p95 abs delta 69.861% (max 100.0%), missing cache results 0, invalid cache results 62; failing criteria: complete cache coverage, subset thresholds; failing subsets: endpoint_connector, graph_routed_bus_stop, endpoint_connector_plausible_onemap_distance, graph_routed_bus_stop_plausible_onemap_distance"
  ]
}
```

## Network Gate Output

```text
network
{
  "debug_path": "C:\\sgSHIOK2026\\qa\\island_debug.geojson",
  "errors": [
    "missing debug GeoJSON: C:\\sgSHIOK2026\\qa\\island_debug.geojson"
  ],
  "metrics": {
    "audited_shelter_corrections": {
      "added_edges": 12,
      "approved_features": 12,
      "candidate_lines": 12,
      "path": "data\\audited_shelter_corrections.geojson",
      "skipped_edges": 0,
      "snap_max_m": 8.0
    },
    "connected_components_count": 2752,
    "covered_edge_length_m_audited_corrections": 440.3052758694887,
    "edges": 896830,
    "final_residual_components_gt_50": 77,
    "flags": [],
    "mean_edge_length_m": 17.853022466092206,
    "nodes": 653122,
    "osm_residual_components_gt_50": 77,
    "real_disconnection_count_final": 0,
    "real_disconnection_count_osm_only": 0,
    "shade_proxy_edge_count": 64541,
    "shade_proxy_weighted_length_m": 843339.2275912806,
    "top_5_component_sizes": [
      618084,
      1946,
      1470,
      1402,
      1295
    ]
  },
  "ok": false,
  "qa_path": "C:\\sgSHIOK2026\\qa\\conflation_qa_island.json",
  "warnings": []
}
```

## Legacy Provenance State

```text
score_provenance
{
  "blocking_provenance_signals": [],
  "expected_score_source_hash_keys": [
    "bus_routes",
    "bus_services",
    "bus_stops",
    "covered_linkway",
    "mrt_lrt_exits",
    "nparks_heritage_road_green_buffers",
    "nparks_heritage_trees",
    "nparks_nature_ways",
    "nparks_park_connector_loop",
    "nparks_tracks",
    "osm_extract",
    "overhead_bridge_underpass",
    "traffic_signals"
  ],
  "incomplete_network_provenance": false,
  "incomplete_scoring_fingerprint_provenance": false,
  "incomplete_scoring_input_provenance": false,
  "legacy_missing_capabilities": [
    "full 18-file scoring fingerprint set",
    "record-level scoring fingerprint digests",
    "record-level scoring input provenance",
    "record-level network provenance"
  ],
  "manifest_path": "C:\\sgSHIOK2026\\web\\public\\data\\generated_20260805_prefer_scored_routed\\manifest.json",
  "missing_expected_score_source_hashes": [],
  "missing_scoring_fingerprints": [
    "pipeline\\bus.py",
    "pipeline\\bus_arrivals.py",
    "pipeline\\connector_candidates.py",
    "pipeline\\export.py",
    "pipeline\\fetch.py",
    "pipeline\\geocode.py",
    "pipeline\\geocode_universe.py",
    "pipeline\\network.py",
    "pipeline\\osm_tags.py",
    "pipeline\\postal_universe.py",
    "pipeline\\score_batch.py",
    "pipeline\\shade.py",
    "run.py"
  ],
  "missing_subscore_status": [],
  "mixed_network_digests": false,
  "mixed_scoring_fingerprint_digests": false,
  "mixed_scoring_input_digests": false,
  "network_changed_during_run": false,
  "non_score_reference_source_hashes": [
    "leaf_area_index"
  ],
  "ok": true,
  "scoring_fingerprint_changed_during_run": false,
  "scoring_fingerprint_count": 5,
  "scoring_input_changed_during_run": false,
  "source_hash_count": 14,
  "source_hash_keys": [
    "bus_routes",
    "bus_services",
    "bus_stops",
    "covered_linkway",
    "leaf_area_index",
    "mrt_lrt_exits",
    "nparks_heritage_road_green_buffers",
    "nparks_heritage_trees",
    "nparks_nature_ways",
    "nparks_park_connector_loop",
    "nparks_tracks",
    "osm_extract",
    "overhead_bridge_underpass",
    "traffic_signals"
  ],
  "state": "legacy",
  "subscore_status_keys": [
    "access",
    "bus",
    "crossing",
    "heat",
    "rain"
  ],
  "unexpected_source_hashes": [
    "leaf_area_index"
  ],
  "warning": "active bundle uses legacy provenance schema; missing capability: full 18-file scoring fingerprint set, record-level scoring fingerprint digests, record-level scoring input provenance, record-level network provenance; score values may be used as a verified legacy artifact, but this bundle cannot provide full record-level provenance evidence; non-score reference source hashes present: leaf_area_index",
  "warning_provenance_signals": []
}
```

## OneMap Gate Output

```text
onemap
{
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
  "freshness": {
    "bundle_generated_at": "2026-08-05T14:00:15.974693+00:00",
    "fresh_after": "2026-08-05T14:00:56+00:00",
    "manifest_mtime": "2026-08-05T14:00:56+00:00",
    "manifest_path": "C:\\sgSHIOK2026\\web\\public\\data\\generated_20260805_prefer_scored_routed\\manifest.json"
  },
  "gate_passed": false,
  "generated_at": "2026-08-10T18:14:29.330832+00:00",
  "invalid_cache_results": 62,
  "latest_any_report_path": "C:\\sgSHIOK2026\\qa\\releases\\20260811-full-onemap\\onemap_validation_cached_report_full_scored_prefer_scored_routed_20260811.json",
  "median_abs_pct_delta": 11.884,
  "missing_cache_results": 0,
  "p95_abs_pct_delta": 69.861,
  "report_path": "C:\\sgSHIOK2026\\qa\\releases\\20260811-full-onemap\\onemap_validation_cached_report_full_scored_prefer_scored_routed_20260811.json",
  "same_bundle_fresh_gate_passed": false,
  "sample_size": 95157,
  "state": "failed"
}
```

## FINDINGS

1. The absolute-path readiness invocation now reaches the real gate and exits 1 after 388.593 seconds, not from import failure.
2. Legacy provenance is now classified as `state: legacy` with `ok: true`; it is not the release blocker.
3. The active release gate remains blocked by island network QA, local Vercel link/root-directory checks, and the cached OneMap validation failure.
4. The network QA blocker is specifically the missing local `C:\sgSHIOK2026\qa\island_debug.geojson`, even though `C:\sgSHIOK2026\qa\conflation_qa_island.json` metrics are readable.

## DISAGREEMENTS

1. None.
