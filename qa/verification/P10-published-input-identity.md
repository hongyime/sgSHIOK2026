`git rev-parse HEAD`
```text
0c1fd20c273e7de3942911397f71cbd954ecd96c
```

`git status --short --branch`
```text
## main...origin/main
 M .github/workflows/repo-integrity.yml
 M pipeline/export.py
 M pipeline/score_batch.py
 M pipeline/scoring_integration.py
 M scripts/targeted_bundle_refresh.py
 M tests/test_export.py
 M tests/test_repo_integrity.py
 M tests/test_score_batch.py
 M tests/test_scoring_integration.py
 M tests/test_targeted_bundle_refresh.py
?? qa/p10_network_provenance_20260813/
?? qa/p6_rerun_cost_20260812_102712/
?? qa/p7_determinism_20260813/
?? qa/p8_provenance_repair_20260813/
?? qa/p9_input_provenance_20260813/
?? scripts/analysis/p10_coordinate_identity.py
?? scripts/analysis/p10_residual_59.py
```

`uv run python scripts\analysis\p10_coordinate_identity.py`
```text
active_score_files=304 active_records=124443
active_state_counts={"NOT_YET_SCORED": 476, "NO_TRANSIT_IN_RANGE": 9827, "SCORED": 95157, "SCORED_PARTIAL": 18983}
partition_citation_counts=
processed\score_batches\full_rescore_20260804_205430\partitions\part01_of04.parquet 31111
processed\score_batches\full_rescore_20260804_205430\partitions\part02_of04.parquet 31111
processed\score_batches\full_rescore_20260804_205430\partitions\part03_of04.parquet 31111
processed\score_batches\full_rescore_20260804_205430\partitions\part04_of04.parquet 31110
current_subject_partition_files=
{"bytes": 1730915, "mtime": "2026-08-04T20:54:34.585113", "path": "processed\\score_batches\\full_rescore_20260804_205430\\partitions\\part01_of04.parquet", "rows": 31111, "status": {"NEEDS_GEOCODE": 108, "READY_TO_SCORE": 31003}, "unique_postals": 31111}
{"bytes": 1719579, "mtime": "2026-08-04T20:54:34.632638", "path": "processed\\score_batches\\full_rescore_20260804_205430\\partitions\\part02_of04.parquet", "rows": 31111, "status": {"NEEDS_GEOCODE": 122, "READY_TO_SCORE": 30989}, "unique_postals": 31111}
{"bytes": 1718147, "mtime": "2026-08-04T20:54:34.680824", "path": "processed\\score_batches\\full_rescore_20260804_205430\\partitions\\part03_of04.parquet", "rows": 31111, "status": {"NEEDS_GEOCODE": 125, "READY_TO_SCORE": 30986}, "unique_postals": 31111}
{"bytes": 1724172, "mtime": "2026-08-04T20:54:34.729548", "path": "processed\\score_batches\\full_rescore_20260804_205430\\partitions\\part04_of04.parquet", "rows": 31110, "status": {"NEEDS_GEOCODE": 121, "READY_TO_SCORE": 30989}, "unique_postals": 31110}
subject_rows_total=124443 subject_unique=124443
combined_rows=124443 combined_unique=124443
old_split_rows_total=124032 old_split_unique=124032
subject_vs_combined_sets={"combined_only": 0, "common": 124443, "subject_only": 0}
subject_vs_combined_coord_diff=0
subject_vs_combined_status_diff=0
subject_vs_old_sets={"common": 124032, "old_only": 0, "subject_only": 411}
subject_vs_old_coord_diff=82732
subject_vs_old_delta_m={"count": 82732, "max": 25889.358, "median": 0.004, "p90": 2.052, "p95": 5.45, "p99": 18.85}
route_start_discriminator_checked=114140 tolerance_m=2.0
route_start_match_counts={"partition_and_combined": 114140}
route_start_large_delta_ge_77m_checked=91
route_start_large_delta_match_counts={"partition_and_combined": 91}
route_start_distance_to_current_partition_gt_20m_count=0
top_subject_vs_old_delta_cases=
postal=539591 area=HOUGANG old_delta_m=25889.358 dist_to_current_partition_start_m=0.686 dist_to_combined_start_m=0.686 dist_to_old_split_start_m=25888.889 state=SCORED current_source=ura_no_dwelling_units old_source=osm_addr_postcode
postal=575630 area=BISHAN old_delta_m=9396.105 dist_to_current_partition_start_m=0.760 dist_to_combined_start_m=0.760 dist_to_old_split_start_m=9396.244 state=SCORED current_source=ura_no_dwelling_units old_source=osm_addr_postcode
postal=579479 area=ANG_MO_KIO old_delta_m=7525.866 dist_to_current_partition_start_m=0.622 dist_to_combined_start_m=0.622 dist_to_old_split_start_m=7526.403 state=SCORED current_source=ura_no_dwelling_units old_source=osm_addr_postcode
postal=489886 area=BEDOK old_delta_m=6323.501 dist_to_current_partition_start_m=0.293 dist_to_combined_start_m=0.293 dist_to_old_split_start_m=6323.394 state=SCORED current_source=ura_no_dwelling_units old_source=osm_addr_postcode
postal=534890 area=HOUGANG old_delta_m=5558.314 dist_to_current_partition_start_m=0.402 dist_to_combined_start_m=0.402 dist_to_old_split_start_m=5558.715 state=SCORED current_source=ura_no_dwelling_units old_source=osm_addr_postcode
postal=288606 area=BUKIT_TIMAH old_delta_m=4967.248 dist_to_current_partition_start_m=0.123 dist_to_combined_start_m=0.123 dist_to_old_split_start_m=4967.152 state=SCORED current_source=ura_no_dwelling_units old_source=osm_addr_postcode
postal=288607 area=BUKIT_TIMAH old_delta_m=4870.215 dist_to_current_partition_start_m=0.221 dist_to_combined_start_m=0.221 dist_to_old_split_start_m=4870.262 state=SCORED current_source=ura_no_dwelling_units old_source=osm_addr_postcode
postal=528795 area=TAMPINES old_delta_m=4099.002 dist_to_current_partition_start_m=0.473 dist_to_combined_start_m=0.473 dist_to_old_split_start_m=4099.299 state=SCORED_PARTIAL current_source=ura_no_dwelling_units old_source=osm_addr_postcode
postal=798552 area=HOUGANG old_delta_m=3256.953 dist_to_current_partition_start_m=0.474 dist_to_combined_start_m=0.474 dist_to_old_split_start_m=3256.550 state=SCORED current_source=ura_no_dwelling_units old_source=osm_addr_postcode
postal=534365 area=HOUGANG old_delta_m=2973.031 dist_to_current_partition_start_m=0.552 dist_to_combined_start_m=0.552 dist_to_old_split_start_m=2972.640 state=SCORED current_source=ura_no_dwelling_units old_source=osm_addr_postcode
worst_route_start_distance_to_current_partition=
planning_area_boundary_path=C:\shiok\raw\f23856251b467089f788d0fff72ef5a38e753f21aa69b4352401d7ed50d380cc\planning_area_boundary.geojson
planning_area_checked=123967 mismatches=0
planning_area_mismatch_top10=[]
```

`uv run python scripts\analysis\p10_residual_59.py`
```text
moved_with_both_inputs=7527
moved_coord_delta_le_0m=59
moved_coord_delta_le_1e-06m=59
moved_coord_delta_le_0.01m=237
moved_coord_delta_le_0.1m=304
moved_coord_delta_le_0.5m=660
moved_coord_delta_le_1m=1520
residual_exact_all_coordinate_fields_moved_count=47
residual_xy_delta_le_1e-6m_moved_count=59
lat_lon_field_diff_inside_xy_same_residual=12
state_pairs_active_to_scratch={"('SCORED', 'SCORED')": 38, "('SCORED_PARTIAL', 'SCORED')": 21}
candidate_signature_changed=59
best_node_changed=59
total_delta_active_minus_scratch={"max": 3.5, "median": -7.1, "min": -32.6, "p90": 2.2}
best_type_pairs_active_to_scratch={"('bus_stop', 'bus_stop')": 21, "('mrt_lrt_exit', 'bus_stop')": 38}
routing_type_pairs_active_to_scratch={"('direct_bus_fallback_unrouted', 'sheltered')": 17, "('direct_bus_fallback_unrouted', 'sheltered_with_bus_stop_access_connector')": 4, "('sheltered', 'sheltered')": 29, "('sheltered', 'sheltered_with_bus_stop_access_connector')": 7, "('sheltered', 'shortest_due_to_detour')": 1, "('shortest_due_to_detour', 'sheltered_with_bus_stop_access_connector')": 1}
routed_over_fallback_like_active_partial_to_scratch_scored=17
scored_mrt_to_scored_bus=38
```

`uv run python scripts\analysis\p10_network_payload_cost.py`
```text
shard=web/public/data/generated_20260805_prefer_scored_routed/scores/ANG_MO_KIO_PART_001.json
records=374
shard_file_bytes=5240179
compact_json_bytes=3544349
scoring_fingerprints_bytes=180268
scoring_fingerprints_bytes_per_record=482.000
routing_network_path_bytes=13090
routing_network_path_bytes_per_record=35.000
network_digest_added_bytes=16456
network_digest_added_bytes_per_record=44.000
projected_network_digest_added_bytes_for_124443=5475492
projected_network_digest_added_mib_for_124443=5.222
```

`uv run python scripts\analysis\p10_provenance_coverage.py`
```text
sources_yaml_top_level_keys=["ingest_validation", "sources"]
raw_manifest_source_count=23
raw_manifest_sources=["acra_registered_entities", "building_points", "bus_routes", "bus_services", "bus_stops", "covered_linkway", "lamp_posts", "leaf_area_index", "mrt_lrt_exits", "nparks_heritage_road_green_buffers", "nparks_heritage_trees", "nparks_nature_ways", "nparks_park_connector_loop", "nparks_tracks", "osm_extract", "other_uen_registered_entities", "overhead_bridge_underpass", "planning_area_boundary", "postal_universe_onemap_2020", "sla_dwelling_information", "traffic_signals", "train_station_codes", "ura_no_dwelling_units"]
coverage_table=artifact | source | current_identification
postal coordinate universe | processed/score_batches/full_rescore_20260804_205430/partitions/*.parquet | path only in active bundle; sha256,row_count,digest in P9+ manifests
routing network graph | processed/network_island.parquet | path only in active bundle; sha256,row_count,digest in P10+ manifests
bus stops/services/routes | sources.yaml datamall_bus_stops, datamall_bus_services, datamall_bus_routes | identified through raw/manifest.json source hashes when present
covered linkways / shelter evidence | sources.yaml lta_covered_linkway | identified through raw/manifest.json source hashes when present
shade and greenery proxy layers | sources.yaml nparks and greenery/shade sources | identified through raw/manifest.json source hashes when present; some sources may be hash-shipped but unconsumed per P1/P5 findings
crossing data | traffic signal / overhead bridge / underpass sources and derived network attributes | identified through raw/manifest.json source hashes when source is present; derived network now separately fingerprinted
scoring code and tunable config | SCORING_FINGERPRINT_FILES | sha256 map and digest in manifest; compact digest per record
```

`uv run python scripts\analysis\p10_manifest_network_block.py`
```text
before=qa/p9_input_provenance_20260813/bundle/manifest.json
{}
after=qa/p10_network_provenance_20260813/exported_bundle/manifest.json
{
  "mixed_network_digests": false,
  "network_algorithm": "sha256-json-sort-keys-24hex",
  "network_changed_during_run": false,
  "network_digest": "e459daf2085fc291773765c1",
  "network_digest_counts": {
    "e459daf2085fc291773765c1": 1200
  },
  "network_digests_missing_maps": [],
  "network_provenance_complete": true,
  "networks_by_digest": {
    "e459daf2085fc291773765c1": {
      "network_algorithm": "sha256-json-sort-keys-24hex",
      "networks": [
        {
          "path": "processed\\network_island.parquet",
          "row_count": 896830,
          "sha256": "19f3b55847cd1ad74878cdec580f07f5cc3110d1eb252b5b1ffe4c5c38b4ab65"
        }
      ],
      "total_rows": 896830
    }
  },
  "records_missing_network_digest": 0
}
```

`uv run python scripts\analysis\p10_unresolved_network_probe.py`
```text
raised=ValueError
message=unresolved network digest maps: missingnetworkdigest001
```

`uv run python scripts\analysis\p10_compare_subset_outputs.py`
```text
base=qa/p9_input_provenance_20260813/bundle
new=qa/p10_network_provenance_20260813/exported_bundle
base_records=1200
new_records=1200
common_records=1200
base_only=0
new_only=0
value_fields_changed=0
provenance_changed=1200
geom_files_changed=0
transit_files_changed=0
value_changed_postals=[]
geom_diffs=[]
transit_diffs=[]
```

`$start = Get-Date; uv run python run.py export --records-dir qa\p10_network_provenance_20260813\score --output qa\p10_network_provenance_20260813\export_timing_probe > qa\p10_network_provenance_20260813\export_timing_probe_stdout.txt; $code=$LASTEXITCODE; $elapsed=(Get-Date)-$start; "export_probe_exit=$code"; "export_probe_seconds=$([math]::Round($elapsed.TotalSeconds,3))"; if (Test-Path qa\p10_network_provenance_20260813\export_timing_probe\manifest.json) { "export_probe_manifest=true" } else { "export_probe_manifest=false" }`
```text
export_probe_exit=0
export_probe_seconds=25.936
export_probe_manifest=true
```

`uv run python scripts\analysis\p10_readiness_summary.py`
```text
release_gate_status=blocked
release_gate_passed=false
active_bundle=generated_20260805_prefer_scored_routed
onemap_validation.state=failed
onemap_validation.bundle=generated_20260805_prefer_scored_routed
onemap_validation.bundle_matches_active=true
onemap_validation.fresh_for_active_bundle=true
onemap_validation.sample_size=95157
onemap_validation.cached_results=95095
onemap_validation.missing_cache_results=0
onemap_validation.invalid_cache_results=62
onemap_validation.median_abs_pct_delta=11.884
onemap_validation.p95_abs_pct_delta=69.861
onemap_validation.report_path=C:\shiok\qa\releases\20260811-full-onemap\onemap_validation_cached_report_full_scored_prefer_scored_routed_20260811.json
onemap_validation.summary=latest cached 95,157-row OneMap walk validation failed: median abs delta 11.884% (max 12.0%), p95 abs delta 69.861% (max 100.0%), missing cache results 0, invalid cache results 62
unresolved_warnings=["active bundle manifest lacks score source hashes, scoring code/config fingerprints, complete subscore status, single-run scoring fingerprints, or complete fingerprint digest provenance; regenerate/export the bundle with current code before using it as provenance evidence", "latest cached 95,157-row OneMap walk validation failed: median abs delta 11.884% (max 12.0%), p95 abs delta 69.861% (max 100.0%), missing cache results 0, invalid cache results 62"]
```

`uv run python run.py test`
```text
collected 327 items
327 passed in 45.88s
```

`npm --prefix web test`
```text
Test Files  21 passed (21)
Tests  103 passed (103)
Duration  1.94s
```
