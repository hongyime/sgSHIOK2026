```text
$ git diff c826ae5..HEAD -- pipeline/config/weights.yaml pipeline/config/params.yaml
```

```text
$ payload measurement
shard=web\public\data\generated_20260805_prefer_scored_routed\scores\ANG_MO_KIO_PART_001.json
shard_bytes=5240179
records=374
existing_records_with_scoring_fingerprints=374
existing_scoring_fingerprints_json_bytes=183634
existing_bytes_per_record=491.000
existing_share_of_shard=3.504%
current_fingerprint_file_count=18
current_fingerprint_map_json_bytes=1704
current_git_json_bytes=158
current_full_per_record_projected_bytes=1862
current_full_per_record_projected_total_mb=231.713
digest_per_record_json_bytes=58
digest_projected_total_mb=7.218
```

```text
$ rg -n "scoring_fingerprints|scoring_fingerprint_digest|\bgit\b|dirty_paths" web --glob "*.ts" --glob "*.tsx"; if ($LASTEXITCODE -eq 1) { "NO_WEB_CONSUMERS" }
NO_WEB_CONSUMERS
```

```text
$ determinism subset creation
subset_path=qa\p8_provenance_repair_20260813\subset_1200_ready.parquet
subset_rows=1200
subset_status_counts={'READY_TO_SCORE': 1200}
subset_first=['000135', '009901', '018593', '018906', '018907']
subset_last=['820235', '820237', '821232', '824233', '828629']
```

```text
$ context load and pilot timing
context_load_exit=0
context_load_seconds=228.663
pilot_score_exit=0
pilot_score_seconds=511.42
pilot_export_exit=0
pilot_export_seconds=4.226
```

```text
$ paired determinism timing
determinism_base=qa/p8_provenance_repair_20260813/determinism_20260813_122736
run1_score_exit=0
run1_score_seconds=2000.535
run1_export_exit=0
run1_export_seconds=28.756
run2_score_exit=0
run2_score_seconds=2019.308
run2_export_exit=0
run2_export_seconds=31.902
```

```text
$ paired determinism byte comparison
expected_to_differ={"manifest.json":["generated_at"]}
left_file_count=289
right_file_count=289
file_lists_equal=True
byte_diff_count=1
byte_diffs=['manifest.json']
normalized_diff_count=0
normalized_diffs=[]
```

```text
$ P7 stall diagnosis: chunk size
p7_chunk_bytes=100672802
p7_chunk_records=500
p7_chunk_bytes_per_record=201345.6
p7_chunk_state_counts={'NOT_YET_SCORED': 44, 'NO_TRANSIT_IN_RANGE': 5, 'SCORED': 450, 'SCORED_PARTIAL': 1}
p7_chunk_records_with_private_geometry=451
p7_chunk_records_with_candidates=451
p6_chunk=qa\p6_rerun_cost_20260812_102712\merged_records\chunks\chunk_000001_part01_of04_00001_000104_058360.json bytes=100689302 records=500 bytes_per_record=201378.6
active_sample_bytes_per_record=11964.7
```

```text
$ P6 scratch attribution
active_records=124443
scratch_records=124032
common_records=124032
active_only_count=411
scratch_only_count=0
active_only_state_counts={'NOT_YET_SCORED': 157, 'NO_TRANSIT_IN_RANGE': 15, 'SCORED': 199, 'SCORED_PARTIAL': 40}
total_moved_count=7527
subscore_moved_counts={'access': 5459, 'bus': 643, 'crossing': 1057, 'heat': 5157, 'rain': 4964}
moved_with_paths_changed=7482
moved_with_best_node_changed=7476
fallback_to_routed_signature_count=263
changed_state_same_total_count=27
changed_state_same_total_transitions={('SCORED', 'SCORED_PARTIAL'): 1, ('SCORED_PARTIAL', 'SCORED'): 26}
```

```text
$ processed geocoded universe row counts
processed\postal_universe_candidate_full_registered_geocoded.parquet rows=124443 status_counts={'NEEDS_GEOCODE': 476, 'READY_TO_SCORE': 123967}
processed\postal_universe_candidate_full_registered_geocoded_part01_of04.parquet rows=31008 status_counts={'NEEDS_GEOCODE': 164, 'READY_TO_SCORE': 30844}
processed\postal_universe_candidate_full_registered_geocoded_part02_of04.parquet rows=31008 status_counts={'NEEDS_GEOCODE': 61, 'READY_TO_SCORE': 30947}
processed\postal_universe_candidate_full_registered_geocoded_part03_of04.parquet rows=31008 status_counts={'NEEDS_GEOCODE': 45, 'READY_TO_SCORE': 30963}
processed\postal_universe_candidate_full_registered_geocoded_part04_of04.parquet rows=31008 status_counts={'NEEDS_GEOCODE': 49, 'READY_TO_SCORE': 30959}
```

```text
$ tripwire simulated revert proof
HEAD pass:
repo_integrity=ok
exit=0
notice_revert:
FAIL NOTICE attribution block changed: expected git blob 116404a4b4192d6fd737e54f66f647f7d73fa22d, got 79979e8fb97acf54d28dc3273d01b04fbaea4b5f
exit=1
agents_revert:
FAIL AGENTS.md missing required override text: durable project decisions live in `decisions.md`, not in `.agents/JOURNAL.md`
FAIL AGENTS.md missing required override text: ignores dot-directories unless they are explicitly allowlisted
FAIL AGENTS.md missing required override text: Do not put durable product decisions only in `.agents/`.
exit=1
vercelignore_revert:
FAIL .vercelignore missing required line: !web/public/data/generated_20260805_prefer_scored_routed/
FAIL .vercelignore missing required line: !web/public/data/generated_20260805_prefer_scored_routed/**
exit=1
```

```text
$ uv run python run.py test
collected 321 items
============================ 321 passed in 31.78s =============================
```

```text
$ npm --prefix web test
Test Files  21 passed (21)
Tests  103 passed (103)
```

```text
$ Test-Path qa/p6_rerun_cost_20260812_102712; Test-Path qa/p7_determinism_20260813
True
True
```
