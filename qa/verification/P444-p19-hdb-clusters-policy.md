# P444 P19 HDB clusters policy

## Working root

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Base

```text
664fef5241f882ab8338b8d58479596f9fb463f6
664fef5 docs: update agent state after P443
04add91 fix: carry OSM-only postcode count in source policy
48a964b docs: update agent state after P442
```

## Command

```text
uv run python run.py p19-gap-status
```

## Measurement Summary

```json
{
  "evidence_split": {
    "confirmed_missing_address_rows": 6,
    "coordinate_backed_hdb_missing_rows": 6,
    "detail_exists": true,
    "source_quality_warning_rows": 2,
    "unvalidated_mcst_proxy_rows": 2
  },
  "files": {
    "summary": {
      "age_days": 5.484,
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
      "path": "qa\\p19\\universe_gap_measurement_summary.json"
    }
  },
  "mcst_proxy_location_probe": {
    "located_rows": 0,
    "mcst_missing_rows": 2,
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
    "missing_development_clusters": [
      {
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
    "missing_rows": 8,
    "missing_unique_postals": 8
  },
  "mode": "cache_status_only",
  "will_call_apis": false,
  "will_write_files": false
}
```

## Change

The structured source policy now carries the coordinate-backed HDB clusters directly:

```text
SUN PLAZA SPRING: 521400, 522400, 523400; 3 rows; 2026; cached_onemap_search_result
YISHUN BEACON: 762936, 763936, 764936; 3 rows; 2026; cached_onemap_search_result
```

## Diff stat

```text
 pipeline/batch_plan.py             | 16 ++++++++++++++++
 tests/test_batch_plan.py           | 16 ++++++++++++++++
 tests/test_production_readiness.py | 16 ++++++++++++++++
 3 files changed, 48 insertions(+)
```

## Focused tests

```text
............................
.......                                      [100%]
35 passed in 40.70s
```

## Repo integrity

```text
repo_integrity=ok
EXIT=0
```

## Protected diff guard

```text
EXIT=0
```

## Evidence ignore check

```text
EXIT=1
```

## FINDINGS

1. P19 source policy already exposed the HDB/MCST evidence split and missing postals, but not the coordinate-backed HDB development cluster names.
2. The cache-status output identifies the actionable missing-address clusters as SUN PLAZA SPRING and YISHUN BEACON, each with 3 missing 2026 postals and cached OneMap coordinates.
3. P444 carries those two clusters into batch-plan/readiness source policy while leaving MCST proxy rows as unvalidated source-quality warnings.

## DISAGREEMENTS

1. None.
