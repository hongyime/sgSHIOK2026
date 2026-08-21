# P273 P19 Cache Status

## Root Guard

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

## Evidence Path

```text
EXIT_CODE=1
```

## Focused Tests

```text
..                                                                       [100%]
2 passed in 1.98s
```

## Cache Status Command

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

## Repository Integrity

```text
repo_integrity=ok
EXIT_CODE=0
```

## Locked Weights Diff

```text
EXIT_CODE=0
```

## FINDINGS

1. The P19 postal-universe gap measurement had no cheap status mode; running the script meant loading the postal universe and potentially calling APIs/updating `qa/p19` caches.
2. The new `--cache-status-only` mode confirms the local P19 evidence currently has 749 HDB OneMap geocode cache queries, 25,878 Overpass postcodes, 749 HDB detail rows, 233 MCST detail rows, and the recorded combined recent-completion signal of 8 missing rows out of 976 rows with postals, without API calls or writes.
3. No pipeline work was run. No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data mutation, or locked-weight change was needed.

## DISAGREEMENTS

1. None.
