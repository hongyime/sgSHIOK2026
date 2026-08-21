# P473 P19 MCST Safe Status

Startup guard:

```text
C:\sgSHIOK2026
PRAWN-E14
```

Scope:

```text
Free operator-tooling safety change.
No scoring, export, rescore, subset run, ingest, network build, deployment, or public-data mutation.
pipeline/config/weights.yaml untouched.
```

Finding:

```text
run.py exposed p19-mcst-locations as a normal task, but the underlying script could call OneMap and write qa/p379 cache/report files by default when cache entries were absent. That was too sharp for an operator surface grouped with read-only P19/P125 status checks.
```

Change:

```text
scripts.analysis.p19_mcst_missing_locations now supports --cache-status-only.
run.py p19-mcst-locations now invokes that status-only mode by default.
The P19 source-policy block records command_calls_apis=false and command_writes_files=false.
README.md and CLAUDE.md list p19-mcst-locations with the safe reports.
```

Observed command output:

```text
uv run python C:\sgSHIOK2026\run.py p19-mcst-locations
{
  "cache_bytes": 1524,
  "cache_exists": true,
  "cache_path": "qa/p379/p19_mcst_missing_onemap_cache.json",
  "cache_queries": [
    "11 MATTAR ROAD 378720",
    "378720",
    "9 MEYAPPA CHETTIAR ROAD 935456",
    "935456"
  ],
  "cache_query_count": 4,
  "conflicting_candidate_postals": {
    "CANAAN": {
      "candidate_postals": [
        "387720"
      ],
      "recorded_postal": "378720"
    }
  },
  "detail_exists": true,
  "detail_path": "qa/p19/universe_gap_measurement_detail.json",
  "located_rows": 0,
  "mcst_missing_rows": 2,
  "mcst_missing_rows_from_detail": 2,
  "mode": "p379_cache_status_only",
  "report_bytes": 1767,
  "report_exists": true,
  "report_path": "qa/p379/p19_mcst_missing_locations_report.json",
  "unlocated_developments": [
    "CANAAN",
    "MYRA"
  ],
  "unlocated_rows": 2,
  "will_call_apis": false,
  "will_export": false,
  "will_mutate_p19": false,
  "will_score": false,
  "will_write_files": false
}
```

Verification:

```text
uv run pytest C:\sgSHIOK2026\tests\test_analysis_scripts.py C:\sgSHIOK2026\tests\test_run.py C:\sgSHIOK2026\tests\test_batch_plan.py C:\sgSHIOK2026\tests\test_production_readiness.py C:\sgSHIOK2026\tests\test_readme.py C:\sgSHIOK2026\tests\test_agent_docs.py -q -p no:cacheprovider
56 passed in 150.81s (0:02:30)

python C:\sgSHIOK2026\scripts\check_repo_integrity.py; Write-Output "EXIT=$LASTEXITCODE"
repo_integrity=ok
EXIT=0

git diff --name-only -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11\d_calibration_w2_0050 C:\sgSHIOK2026\qa\p11\d_full_w2_1200 C:\sgSHIOK2026\qa\p11\d_pilot_w2_0200_final C:\sgSHIOK2026\qa\releases
```

FINDINGS:

1. The P19 MCST probe had a read-only status use case but a write/API-capable default path. The runner now uses status-only mode so inspection cannot mutate P379 by accident.

DISAGREEMENTS:

1. None.
