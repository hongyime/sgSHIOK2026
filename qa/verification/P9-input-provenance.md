```text
$ git rev-parse HEAD
7a74c8ac6c0b5b44bb95c06098c2d087f013a149
```

```text
$ git diff -- pipeline/config/weights.yaml pipeline/config/params.yaml checksums.json web/public/data/generated_20260805_prefer_scored_routed/
```

```text
$ python coordinate_drift_analysis.py
active_records=124443 scratch_records=124032 common_records=124032
total_moved_count=7527
split_rows_total=124032 combined_rows=124443
coord_changed_common=78707 (63.457%)
moved_coord_changed=7468 (99.216% of moved)
moved_coord_same_or_missing=59
moved_coord_delta_m={"max": 25889.358, "median": 2.907, "min": 0.001, "p25": 1.211, "p75": 8.464, "p90": 15.951, "p95": 26.417, "p99": 77.077}
coord_changed_moved_rate=7468/78707 = 9.488%
coord_unchanged_moved_rate=59/45325 = 0.130%
risk_ratio_changed_vs_unchanged=72.891
threshold_gt_0.1m common_changed=23856 moved_changed=7223 share_of_moved=95.961%
threshold_gt_0.5m common_changed=18870 moved_changed=6867 share_of_moved=91.232%
threshold_gt_1m common_changed=13641 moved_changed=6007 share_of_moved=79.806%
threshold_gt_5m common_changed=4368 moved_changed=2820 share_of_moved=37.465%
```

```text
$ python payload_cost.py
shard=web\public\data\generated_20260805_prefer_scored_routed\scores\ANG_MO_KIO_PART_001.json
records=374
base_bytes_compact_json=3543974
with_scoring_input_digest_bytes=3562674
full_input_per_record_bytes=3652808
digest_added_bytes_per_record=50.000
digest_projected_uncompressed_mb=6.222
full_input_added_bytes_per_record=291.000
full_input_projected_uncompressed_mb=36.213
manifest_resolver_projected_bytes_for_4_parts=1209
```

```text
$ rg -n "scoring_fingerprints|scoring_fingerprint_digest|scoring_input|scoring_inputs|dirty_paths|\bgit\b" web --glob "*.ts" --glob "*.tsx"; if ($LASTEXITCODE -eq 1) { 'NO_WEB_CONSUMERS' }
NO_WEB_CONSUMERS
```

```text
$ python manifest_provenance_before_after.py
before_manifest_provenance_selected=
{
  "mixed_scoring_fingerprint_digests": false,
  "records_missing_scoring_fingerprint_digest": 0,
  "scoring_fingerprint_digest": "43454975ee6a6bb43b4efee6",
  "scoring_fingerprint_digest_counts": {
    "43454975ee6a6bb43b4efee6": 1200
  },
  "scoring_fingerprint_provenance_complete": true
}
after_manifest_provenance_selected=
{
  "mixed_scoring_fingerprint_digests": false,
  "mixed_scoring_input_digests": false,
  "records_missing_scoring_fingerprint_digest": 0,
  "records_missing_scoring_input_digest": 0,
  "scoring_fingerprint_digest": "113d094a9f2a5ca6e6ff5362",
  "scoring_fingerprint_digest_counts": {
    "113d094a9f2a5ca6e6ff5362": 1200
  },
  "scoring_fingerprint_provenance_complete": true,
  "scoring_input_algorithm": "sha256-json-sort-keys-24hex",
  "scoring_input_changed_during_run": false,
  "scoring_input_digest": "2f7ec7ede5ff5ecebd5f85eb",
  "scoring_input_digest_counts": {
    "2f7ec7ede5ff5ecebd5f85eb": 1200
  },
  "scoring_input_digests_missing_maps": [],
  "scoring_input_provenance_complete": true,
  "scoring_inputs_by_digest": {
    "2f7ec7ede5ff5ecebd5f85eb": {
      "inputs": [
        {
          "path": "qa\\p8_provenance_repair_20260813\\subset_1200_ready.parquet",
          "row_count": 1200,
          "sha256": "8e524720d21acd0ff7f705dac22ff335412f6af615ccaa28f28557351a5d296d"
        }
      ],
      "scoring_input_algorithm": "sha256-json-sort-keys-24hex",
      "total_rows": 1200
    }
  }
}
```

```text
$ uv run python unresolved_digest_probe.py; "exit_code=$LASTEXITCODE"
ValueError: unresolved scoring input digest maps: iiiiiiiiiiiiiiiiiiiiiiii
exit_code=1
```

```text
$ python p9_subset_field_compare.py
old_records=1200 new_records=1200 common=1200
missing_old=0 missing_new=0
state_changed=0
total_changed=0
subscores_changed=0
best_node_changed=0
paths_changed=0
exposure_gaps_changed=0
candidates_changed=0
route_options_changed=0
visible_score_record_changed_excluding_provenance=0
geom_file_lists_equal=True geom_file_count_old=229 geom_file_count_new=229 geom_byte_diffs=0
transit_file_lists_equal=True transit_byte_diffs=0
state_counts_equal=True
record_count_equal=True
new_scoring_input_digest_counts={'2f7ec7ede5ff5ecebd5f85eb': 1200}
```

```text
$ pipeline execution accounting
score_exit=0
score_seconds=1872.118
failed_export_exit=1
failed_export_seconds=1.094
export1_exit=0
export1_seconds=30.805
export2_exit=0
export2_seconds=30.508
total_pipeline_seconds=1934.525
budget_seconds=3600
```

```text
$ git log --oneline --grep "\[skip ci\]" -- .github/workflows AGENTS.md NOTICE .vercelignore | Select-Object -First 8
d5538e6 chore(config): sync from sourcerepo [skip ci]
13a2684 chore(config): sync from sourcerepo [skip ci]
4332ab3 chore(config): sync from sourcerepo [skip ci]
e385a04 chore(config): sync from sourcerepo [skip ci]
5b9e4f1 chore(ci): add bandit Python SAST workflow [skip ci]
ebe6a15 chore(ci): add semgrep SAST workflow [skip ci]
3e602cf chore(config): sync from sourcerepo [skip ci]
5fd42ab chore(config): sync from sourcerepo [skip ci]
```

```text
$ Get-Content .github\workflows\repo-integrity.yml
name: Repository Integrity

on:
  pull_request:
    branches: [main, master]
    paths:
      - "NOTICE"
      - "AGENTS.md"
      - ".vercelignore"
      - "scripts/check_repo_integrity.py"
      - ".github/workflows/repo-integrity.yml"
  push:
    branches: [main, master]
    paths:
      - "NOTICE"
      - "AGENTS.md"
      - ".vercelignore"
      - "scripts/check_repo_integrity.py"
      - ".github/workflows/repo-integrity.yml"
  schedule:
    - cron: "31 9 * * 1" # Weekly Monday 09:31 UTC (5:31pm SGT), bypasses [skip ci] push skips.
  workflow_dispatch:

permissions: read-all

jobs:
  repo-integrity:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check sgSHIOK protected repo files
        run: python scripts/check_repo_integrity.py
```

```text
$ uv run python scripts/check_repo_integrity.py
repo_integrity=ok
```

```text
$ uv run python run.py test
collected 325 items
============================ 325 passed in 42.31s =============================
```

```text
$ npm --prefix web test
Test Files  21 passed (21)
Tests  103 passed (103)
```

```text
$ Test-Path qa\p6_rerun_cost_20260812_102712; Test-Path qa\p7_determinism_20260813; Test-Path qa\p8_provenance_repair_20260813
True
True
True
```
