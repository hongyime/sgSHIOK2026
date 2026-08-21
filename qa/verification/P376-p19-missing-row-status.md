# P376 P19 Missing Row Status

## Root Guard

```text
pwd=C:\sgSHIOK2026
```

## Evidence Path

```text
exit_code=1
```

## P19 Status Output

Command:

```text
uv run python run.py p19-gap-status
```

Output:

```json
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
      "age_days": 5.258,
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
      "age_days": 5.25,
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
  "missing_row_detail": {
    "detail_exists": true,
    "detail_path": "qa/p19/universe_gap_measurement_detail.json",
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

## Focused Tests

Command:

```text
uv run pytest tests/test_analysis_scripts.py tests/test_batch_plan.py tests/test_production_readiness.py tests/test_run.py tests/test_readme.py -p no:cacheprovider
```

Output:

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 51 items

tests\test_analysis_scripts.py ....                                      [  7%]
tests\test_batch_plan.py ..........                                      [ 27%]
tests\test_production_readiness.py .........................             [ 76%]
tests\test_run.py ........                                               [ 92%]
tests\test_readme.py ....                                                [100%]

======================= 51 passed in 100.28s (0:01:40) ========================
```

## Repository Integrity

```text
repo_integrity=ok
exit_code=0
```

## Protected Diffs

Command:

```text
git diff -- pipeline/config/weights.yaml
git diff -- checksums.json
git diff -- web/public/data
```

Output:

```text
```

## FINDINGS

1. The cached P19 measurement already proved the current-source gap is small at 8 missing rows out of 976 rows with postals, but the safe status command did not name the specific missing rows.
2. `p19-gap-status` now names all eight cached missing rows: six 2026 HDB block rows from SUN PLAZA SPRING and YISHUN BEACON, plus two MCST proxy rows, CANAAN and MYRA.
3. The cached missing rows are distributed as 1 in 2023, 1 in 2024, and 6 in 2026; this makes the v1 gap inspectable without rerunning data.gov.sg, OneMap, or Overpass probes.

## DISAGREEMENTS

1. None.
