# P355 P19 Cache Status Age

## Scope

`uv run python run.py p19-gap-status` now reports `age_days` for the cached P19 summary and Overpass postcode cache so operators can tell how old the read-only universe-gap evidence is without manual timestamp arithmetic.

## Commands

```text
uv run pytest tests/test_analysis_scripts.py -p no:cacheprovider
uv run python run.py p19-gap-status
python scripts/check_repo_integrity.py
git diff -- pipeline/config/weights.yaml
```

## Output

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 3 items

tests\test_analysis_scripts.py ...                                       [100%]

============================== 3 passed in 2.43s ==============================
```

```text
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
      "age_days": 5.18,
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
      "age_days": 5.172,
      "bytes": 4168,
      "combined_recent_completion_signal": {
        "missing_rows": 8,
        "missing_unique_postals": 8,
        "row_miss_rate": 0.008197,
        "rows_with_postal": 976
      },
      "exists": true,
      "generated_at_utc": "2026-08-16T02:08:55.624822+00:00",
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
  "mode": "cache_status_only",
  "qa_dir": "qa\\p19",
  "will_call_apis": false,
  "will_write_files": false
}
```

```text
repo_integrity=ok
EXIT=0
```

```text
EXIT=0
```

## FINDINGS

1. P19 cache status already proved it would call no APIs and write no files, but it exposed only timestamps for the cached measurement and Overpass query, not their age in days.
2. The current local cached P19 summary is 5.172 days old and the cached P19 Overpass query is 5.18 days old at the verification run.

## DISAGREEMENTS

1. None.
