# P380 P19 MCST Proxy Source Policy Evidence

## Root Guard

```powershell
PS C:\sgSHIOK2026> Get-Location; hostname; git rev-parse HEAD; git status --short

Path
----
C:\sgSHIOK2026

Prawn-E14
80ba94c54c170992d2d281f666e64a14ec6f2d1d
?? qa/p10_network_provenance_20260813/
?? qa/p11/d_calibration_w2_0050/
?? qa/p11/d_full_w2_1200/
?? qa/p11/d_pilot_w2_0200_final/
?? qa/p11/d_pilot_w2_0200_retry3/
?? qa/p11/d_pilot_w2_0200_retry4/
?? qa/p11/diffs/
?? qa/p11/subset_0050_ready.parquet
?? qa/p11/subset_0200_ready.parquet
?? qa/p11/wip-worktree.diff
?? qa/p12/
?? qa/p125/
?? qa/p13/
?? qa/p16/
?? qa/p19/
?? qa/p21/
?? qa/p379/
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
```

## Evidence Path Ignore Check

```powershell
PS C:\sgSHIOK2026> git check-ignore -v qa/verification/P380-p19-mcst-policy.md; Write-Output "exit_code=$LASTEXITCODE"
exit_code=1
```

## P379 MCST Location Report Excerpt

```powershell
PS C:\sgSHIOK2026> uv run python -c "import json; data=json.load(open('qa/p379/p19_mcst_missing_locations_report.json', encoding='utf-8')); print(json.dumps({'mcst_missing_rows': data['mcst_missing_rows'], 'located_rows': data['located_rows'], 'unlocated_rows': data['unlocated_rows'], 'unlocated': data['unlocated'], 'will_score': data['will_score'], 'will_export': data['will_export'], 'will_mutate_p19': data['will_mutate_p19']}, indent=2, sort_keys=True))"
{
  "located_rows": 0,
  "mcst_missing_rows": 2,
  "unlocated": [
    {
      "address": null,
      "candidate_postals_by_query": {
        "11 MATTAR ROAD 378720": [
          "387720"
        ],
        "378720": []
      },
      "coordinate": null,
      "development_location": "11 MATTAR ROAD 378720",
      "development_name": "CANAAN",
      "found": 1,
      "matched_postal": null,
      "matched_query": null,
      "mc_form_year": 2023,
      "postal": "378720",
      "queries": [
        "11 MATTAR ROAD 378720",
        "378720"
      ],
      "searchval": null,
      "status_code": 200,
      "usr_mcno": "4841"
    },
    {
      "address": null,
      "candidate_postals_by_query": {
        "9 MEYAPPA CHETTIAR ROAD 935456": [],
        "935456": []
      },
      "coordinate": null,
      "development_location": "9 MEYAPPA CHETTIAR ROAD 935456",
      "development_name": "MYRA",
      "found": 0,
      "matched_postal": null,
      "matched_query": null,
      "mc_form_year": 2024,
      "postal": "935456",
      "queries": [
        "9 MEYAPPA CHETTIAR ROAD 935456",
        "935456"
      ],
      "searchval": null,
      "status_code": 200,
      "usr_mcno": "4918"
    }
  ],
  "unlocated_rows": 2,
  "will_export": false,
  "will_mutate_p19": false,
  "will_score": false
}
```

## Batch Plan Source Policy Output

```powershell
PS C:\sgSHIOK2026> uv run python -c "import json; from pipeline.batch_plan import build_batch_plan; ok, report = build_batch_plan(mode='candidate_full_registered'); print(json.dumps(report['source_policy']['recent_public_source_gap_sample'], indent=2, sort_keys=True)); print('ok=' + str(ok).lower())"
{
  "cache_status_calls_apis": false,
  "cache_status_command": "uv run python run.py p19-gap-status",
  "cache_status_reports_age_days": true,
  "cache_status_reports_hdb_cluster_coordinates": true,
  "cache_status_reports_mcst_proxy_location_probe": true,
  "cache_status_reports_missing_development_clusters": true,
  "cache_status_reports_missing_rows": true,
  "cache_status_writes_files": false,
  "detail_path": "qa/p19/universe_gap_measurement_detail.json",
  "mcst_proxy_location_probe": {
    "cache_path": "qa/p379/p19_mcst_missing_onemap_cache.json",
    "command": "uv run python run.py p19-mcst-locations",
    "conflicting_candidate_postals": {
      "CANAAN": {
        "candidate_postals": [
          "387720"
        ],
        "recorded_postal": "378720"
      }
    },
    "located_rows": 0,
    "mcst_missing_rows": 2,
    "report_path": "qa/p379/p19_mcst_missing_locations_report.json",
    "unlocated_developments": [
      "CANAAN",
      "MYRA"
    ],
    "unlocated_rows": 2,
    "verdict": "MCST proxy rows remain unvalidated; HDB clusters are the coordinate-backed actionable gap",
    "will_export": false,
    "will_mutate_p19": false,
    "will_score": false
  },
  "measurement": "P19 recent public-source gap sample",
  "missing_pct": 0.819672,
  "missing_postals_by_source": {
    "hdb_2021_2026_geocoded": [
      "521400",
      "522400",
      "523400",
      "762936",
      "763936",
      "764936"
    ],
    "mcst_2021_2026": [
      "378720",
      "935456"
    ]
  },
  "missing_rows": 8,
  "source_rows_with_postals": 976,
  "source_window": "2021-2026",
  "sources": [
    "HDB completion",
    "BCA MCST proxy"
  ],
  "summary_path": "qa/p19/universe_gap_measurement_summary.json",
  "verdict": "small current-source gap in frozen v1; candidate-source-first v2 remains required"
}
ok=true
```

## Focused Tests

```powershell
PS C:\sgSHIOK2026> uv run pytest tests/test_batch_plan.py tests/test_production_readiness.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 35 items

tests\test_batch_plan.py ..........                                      [ 28%]
tests\test_production_readiness.py .........................             [100%]

======================= 35 passed in 145.85s (0:02:25) ========================
```

## Repo Integrity

```powershell
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

## Protected Diff Checks

```powershell
PS C:\sgSHIOK2026> git diff -- pipeline/config/weights.yaml; Write-Output "weights_diff_exit=$LASTEXITCODE"; git diff -- checksums.json; Write-Output "checksums_diff_exit=$LASTEXITCODE"; git diff -- web/public/data; Write-Output "public_data_diff_exit=$LASTEXITCODE"
weights_diff_exit=0
checksums_diff_exit=0
public_data_diff_exit=0
```

## Findings

1. P379 makes the P19 actionable gap narrower than the raw 8 missing rows: the two HDB clusters are coordinate-backed, but the two MCST proxy rows remain unlocated.
2. CANAAN has a material proxy-postal conflict: the recorded missing postal is 378720, while OneMap Search for the recorded address returned candidate postal 387720.
3. Structured source-policy consumers now receive the P379 MCST probe boundary, including `will_score=false`, `will_export=false`, and `will_mutate_p19=false`.

## Disagreements

1. None.
