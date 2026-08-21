# P383 P19 Status MCST Probe Evidence

## Root Guard

```powershell
PS C:\sgSHIOK2026> Get-Location; hostname; git rev-parse HEAD; git ls-remote origin main; git status --short

Path
----
C:\sgSHIOK2026

Prawn-E14
12de809b476320442d8505e076ad17a6a3223e8f
12de809b476320442d8505e076ad17a6a3223e8f	refs/heads/main
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
PS C:\sgSHIOK2026> git check-ignore -v qa/verification/P383-p19-status-mcst-probe.md; Write-Output "exit_code=$LASTEXITCODE"
exit_code=1
```

## Focused Tests

```powershell
PS C:\sgSHIOK2026> uv run pytest tests/test_analysis_scripts.py tests/test_run.py tests/test_readme.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 18 items

tests\test_analysis_scripts.py .....                                     [ 27%]
tests\test_run.py .........                                              [ 77%]
tests\test_readme.py ....                                                [100%]

============================= 18 passed in 14.08s =============================
```

## P19 Status Command

```powershell
PS C:\sgSHIOK2026> uv run python run.py p19-gap-status
{
  "files": {
    "detail": {
      "bytes": 447136,
      "exists": true,
      "hdb_row_count": 749,
      "mcst_row_count": 233,
      "path": "qa\\p19\\universe_gap_measurement_detail.json",
      "top_level_keys": [
        "hdb_rows",
        "mcst_rows"
      ]
    },
    "hdb_onemap_geocode_cache": {
      "bytes": 556863,
      "cached_query_count": 749,
      "exists": true,
      "path": "qa\\p19\\hdb_2021_2026_onemap_geocode_cache.json",
      "sample_cached_queries": [
        "107A BIDADARI PK DR",
        "107B BIDADARI PK DR",
        "108A BIDADARI PK DR",
        "108B BIDADARI PK DR",
        "109A BIDADARI PK DR",
        "109A CANBERRA WALK",
        "109B BIDADARI PK DR",
        "109B CANBERRA WALK",
        "109C CANBERRA WALK",
        "109D CANBERRA WALK"
      ]
    },
    "overpass_addr_postcodes_cache": {
      "age_days": 5.299,
      "bytes": 388652,
      "cached_postcode_count": 25878,
      "exists": true,
      "path": "qa\\p19\\overpass_addr_postcodes_cache.json",
      "queried_at_utc": "2026-08-16T01:57:53.873221+00:00",
      "top_level_keys": [
        "bytes",
        "elapsed_sec",
        "element_count",
        "generator",
        "osm3s",
        "postcodes",
        "queried_at_utc",
        "status_code"
      ]
    },
    "summary": {
      "age_days": 5.291,
      "bytes": 4168,
      "combined_recent_completion_signal": {
        "missing_rows": 8,
        "missing_unique_postals": 8,
        "row_miss_rate": 0.008197,
        "rows_with_postal": 976
      },
      "exists": true,
      "generated_at_utc": "2026-08-16T02:08:55.624822+00:00",
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
      "path": "qa\\p19\\universe_gap_measurement_summary.json",
      "top_level_keys": [
        "combined_recent_completion_signal",
        "generated_at_utc",
        "hdb_2021_2026_geocoded",
        "mcst_2021_2026",
        "method_limits",
        "overpass_addr_postcode",
        "sources",
        "v1_universe",
        "working_root"
      ]
    }
  },
  "mcst_proxy_location_probe": {
    "cache_exists": true,
    "cache_path": "qa/p379/p19_mcst_missing_onemap_cache.json",
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
    "report_exists": true,
    "report_path": "qa/p379/p19_mcst_missing_locations_report.json",
    "unlocated_developments": [
      "CANAAN",
      "MYRA"
    ],
    "unlocated_rows": 2,
    "will_export": false,
    "will_mutate_p19": false,
    "will_score": false
  },
  "missing_row_detail": {
    "detail_exists": true,
    "detail_path": "qa/p19/universe_gap_measurement_detail.json",
    "missing_development_clusters": [
      {
        "bbox": {
          "max_lat": 1.3585855,
          "max_lon": 103.9495319,
          "min_lat": 1.3581836,
          "min_lon": 103.9486325
        },
        "centroid": {
          "lat": 1.3584495,
          "lon": 103.9490744
        },
        "coordinate_count": 3,
        "coordinate_source": "cached_onemap_search_result",
        "development": "SUN PLAZA SPRING",
        "missing_postals": [
          "521400",
          "522400",
          "523400"
        ],
        "missing_rows": 3,
        "source": "hdb_2021_2026_geocoded",
        "years": [
          2026
        ]
      },
      {
        "bbox": {
          "max_lat": 1.4242769,
          "max_lon": 103.836389,
          "min_lat": 1.4233001,
          "min_lon": 103.8362424
        },
        "centroid": {
          "lat": 1.4237757,
          "lon": 103.8363103
        },
        "coordinate_count": 3,
        "coordinate_source": "cached_onemap_search_result",
        "development": "YISHUN BEACON",
        "missing_postals": [
          "762936",
          "763936",
          "764936"
        ],
        "missing_rows": 3,
        "source": "hdb_2021_2026_geocoded",
        "years": [
          2026
        ]
      },
      {
        "development": "CANAAN",
        "missing_postals": [
          "378720"
        ],
        "missing_rows": 1,
        "source": "mcst_2021_2026",
        "years": [
          2023
        ]
      },
      {
        "development": "MYRA",
        "missing_postals": [
          "935456"
        ],
        "missing_rows": 1,
        "source": "mcst_2021_2026",
        "years": [
          2024
        ]
      }
    ],
    "missing_postals": [
      "378720",
      "521400",
      "522400",
      "523400",
      "762936",
      "763936",
      "764936",
      "935456"
    ],
    "missing_rows": 8,
    "missing_rows_by_source": {
      "hdb_2021_2026_geocoded": [
        {
          "blk_no": "400A",
          "postal": "521400",
          "searchval": "SUN PLAZA SPRING",
          "street": "TAMPINES ST 41",
          "total_dwelling_units": 110,
          "year_completed": 2026
        },
        {
          "blk_no": "400B",
          "postal": "522400",
          "searchval": "SUN PLAZA SPRING",
          "street": "TAMPINES ST 41",
          "total_dwelling_units": 99,
          "year_completed": 2026
        },
        {
          "blk_no": "400C",
          "postal": "523400",
          "searchval": "SUN PLAZA SPRING",
          "street": "TAMPINES ST 41",
          "total_dwelling_units": 58,
          "year_completed": 2026
        },
        {
          "blk_no": "936B",
          "postal": "762936",
          "searchval": "YISHUN BEACON",
          "street": "YISHUN CTRL 1",
          "total_dwelling_units": 143,
          "year_completed": 2026
        },
        {
          "blk_no": "936C",
          "postal": "763936",
          "searchval": "YISHUN BEACON",
          "street": "YISHUN CTRL 1",
          "total_dwelling_units": 115,
          "year_completed": 2026
        },
        {
          "blk_no": "936D",
          "postal": "764936",
          "searchval": "YISHUN BEACON",
          "street": "YISHUN CTRL 1",
          "total_dwelling_units": 143,
          "year_completed": 2026
        }
      ],
      "mcst_2021_2026": [
        {
          "development_location": "11 MATTAR ROAD 378720",
          "development_name": "CANAAN",
          "mc_form_year": 2023,
          "postal": "378720",
          "usr_mcno": "4841"
        },
        {
          "development_location": "9 MEYAPPA CHETTIAR ROAD 935456",
          "development_name": "MYRA",
          "mc_form_year": 2024,
          "postal": "935456",
          "usr_mcno": "4918"
        }
      ]
    },
    "missing_rows_by_year": {
      "2023": 1,
      "2024": 1,
      "2026": 6
    },
    "missing_unique_postals": 8
  },
  "mode": "cache_status_only",
  "qa_dir": "qa\\p19",
  "will_call_apis": false,
  "will_write_files": false
}
```

## Findings

1. Structured source policy already claimed the P19 status command reports the MCST proxy location probe, but the command did not emit that block before P383.
2. `p19-gap-status` now reports the P379 MCST probe from existing local files without calling APIs or writing files.
3. The status output now contains the operational distinction needed by the standing goal: coordinate-backed HDB clusters are separate from unlocated MCST proxy evidence.

## Disagreements

1. None.
