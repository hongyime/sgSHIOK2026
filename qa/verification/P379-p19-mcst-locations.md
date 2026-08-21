# P379 P19 MCST Missing Locations

## Root Guard

```text
pwd=C:\sgSHIOK2026
```

## Evidence Path

```text
exit_code=1
```

## Live Measurement

Command:

```text
uv run python run.py p19-mcst-locations --delay-sec 0.25
```

Output after cold and warm cache runs:

```json
{
  "cache_path": "qa/p379/p19_mcst_missing_onemap_cache.json",
  "cache_queries": [
    "11 MATTAR ROAD 378720",
    "378720",
    "9 MEYAPPA CHETTIAR ROAD 935456",
    "935456"
  ],
  "cache_written": false,
  "detail_path": "qa/p19/universe_gap_measurement_detail.json",
  "generated_at_utc": "2026-08-21T08:32:55.136711+00:00",
  "located": [],
  "located_rows": 0,
  "mcst_missing_rows": 2,
  "mode": "p379_p19_mcst_missing_locations",
  "report_path": "qa/p379/p19_mcst_missing_locations_report.json",
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

## Focused Tests

Command:

```text
uv run pytest tests/test_analysis_scripts.py tests/test_run.py -p no:cacheprovider
```

Output:

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 14 items

tests\test_analysis_scripts.py .....                                     [ 35%]
tests\test_run.py .........                                              [100%]

============================= 14 passed in 2.24s ==============================
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

1. Neither P19 MCST proxy missing postal is locatable by bounded OneMap Search using the recorded location string or postal-only fallback.
2. CANAAN is a source-quality warning: `11 MATTAR ROAD 378720` returns OneMap postal `387720`, so the MCST proxy postal `378720` is not supported by this lookup.
3. MYRA remains unlocated: both `9 MEYAPPA CHETTIAR ROAD 935456` and `935456` returned no OneMap candidates.
4. The P19 actionable current-source gap is therefore strongest for the two coordinate-backed HDB clusters; MCST proxy rows need separate validation before driving v2 promotion.

## DISAGREEMENTS

1. None.
