# P803 P19 v2 Current Gap Sample

## Working Root

```text
PWD=C:\sgSHIOK2026
Prawn-E14
```

## Measurement Command

```text
uv run python -m scripts.analysis.p19_universe_gap_measurement --measure --confirm-p19-measure --hdb-cache-output C:\sgSHIOK2026\qa\p19\hdb_2021_2026_onemap_geocode_cache_v2.json --overpass-cache-output C:\sgSHIOK2026\qa\p19\overpass_addr_postcodes_cache_v2.json --summary-output C:\sgSHIOK2026\qa\p19\universe_gap_measurement_summary_v2.json --detail-output C:\sgSHIOK2026\qa\p19\universe_gap_measurement_detail_v2.json
```

## Progress and Final Output

```text
p19_geocode_progress rows=25/749 cache_entries=150
p19_geocode_progress rows=50/749 cache_entries=150
p19_geocode_progress rows=75/749 cache_entries=150
p19_geocode_progress rows=100/749 cache_entries=150
p19_geocode_progress rows=125/749 cache_entries=150
p19_geocode_progress rows=150/749 cache_entries=150
p19_geocode_progress rows=175/749 cache_entries=175
p19_geocode_progress rows=200/749 cache_entries=200
p19_geocode_progress rows=225/749 cache_entries=225
p19_geocode_progress rows=250/749 cache_entries=250
p19_geocode_progress rows=275/749 cache_entries=275
p19_geocode_progress rows=300/749 cache_entries=300
p19_geocode_progress rows=325/749 cache_entries=325
p19_geocode_progress rows=350/749 cache_entries=350
p19_geocode_progress rows=375/749 cache_entries=375
p19_geocode_progress rows=400/749 cache_entries=400
p19_geocode_progress rows=425/749 cache_entries=425
p19_geocode_progress rows=450/749 cache_entries=450
p19_geocode_progress rows=475/749 cache_entries=475
p19_geocode_progress rows=500/749 cache_entries=500
p19_geocode_progress rows=525/749 cache_entries=525
p19_geocode_progress rows=550/749 cache_entries=550
p19_geocode_progress rows=575/749 cache_entries=575
p19_geocode_progress rows=600/749 cache_entries=600
p19_geocode_progress rows=625/749 cache_entries=625
p19_geocode_progress rows=650/749 cache_entries=650
p19_geocode_progress rows=675/749 cache_entries=675
p19_geocode_progress rows=700/749 cache_entries=700
p19_geocode_progress rows=725/749 cache_entries=725
p19_geocode_progress rows=749/749 cache_entries=749
{
  "combined_recent_completion_signal": {
    "missing_rows": 8,
    "missing_unique_postals": 8,
    "row_miss_rate": 0.008197,
    "rows_with_postal": 976
  },
  "generated_at_utc": "2026-08-28T21:15:15.685030+00:00",
  "hdb_2021_2026_geocoded": {
    "missing_postals": [
      "521400",
      "522400",
      "523400",
      "762936",
      "763936",
      "764936"
    ],
    "missing_rows": 6,
    "missing_unique_postals": 6,
    "row_miss_rate": 0.008075,
    "rows": 749,
    "rows_with_postal": 743,
    "sample_missing_postals": [
      "521400",
      "522400",
      "523400",
      "762936",
      "763936",
      "764936"
    ],
    "unique_miss_rate": 0.008075,
    "unique_postals": 743
  },
  "mcst_2021_2026": {
    "missing_postals": [
      "378720",
      "935456"
    ],
    "missing_rows": 2,
    "missing_unique_postals": 2,
    "row_miss_rate": 0.008584,
    "rows": 233,
    "rows_with_postal": 233,
    "sample_missing_postals": [
      "378720",
      "935456"
    ],
    "unique_miss_rate": 0.009615,
    "unique_postals": 208
  },
  "overpass_addr_postcode": {
    "intersection": 25899,
    "missing_from_v1": 20,
    "unique_postcodes": 25919,
    "v1_missing_from_overpass": 98544
  },
  "v1_universe": {
    "path": "processed/postal_universe_candidate_full_registered_geocoded.parquet",
    "rows": 124443,
    "status_counts": {
      "NEEDS_GEOCODE": 476,
      "READY_TO_SCORE": 123967
    },
    "unique_postals": 124443
  },
  "working_root": "C:\\sgSHIOK2026"
}
exit_code=0
elapsed_seconds=3251.997
```

## V2 File Hashes

```text
C:\sgSHIOK2026\qa\p19\hdb_2021_2026_onemap_geocode_cache_v2.json bytes=565448 sha256=a501607c8090118b91719bc968d7dbfcfa8309bee265d6a2e247a1c4e2abcc85
C:\sgSHIOK2026\qa\p19\overpass_addr_postcodes_cache_v2.json bytes=389268 sha256=20e6cc83e63ccc2d610b038a37aa88bcbbf17c1f846a9ff45d613a932861a1f3
C:\sgSHIOK2026\qa\p19\universe_gap_measurement_summary_v2.json bytes=4408 sha256=eb70e49827fd47f405d4141da65faf86b7c85bc8fbacceb21bfa1c06b055e349
C:\sgSHIOK2026\qa\p19\universe_gap_measurement_detail_v2.json bytes=448396 sha256=3a309316ab3d31c8f1bbb369c413fc87b58a9c433449fa362b614c8eb1b533bc
```

## Status Probe

```text
{
  "combined": {
    "missing_rows": 8,
    "missing_unique_postals": 8,
    "row_miss_rate": 0.008197,
    "rows_with_postal": 976
  },
  "currentness": {
    "fresh_for_current_gap_sizing": true,
    "max_age_days": 0.003,
    "status": "fresh",
    "summary": "cached P19 sample age 0.003d is within the 7d current-gap sizing threshold",
    "threshold_days": 7.0
  },
  "measurement_complete": true,
  "measurement_label": "P19 v2 28 Aug 2026 public-source sample",
  "measurement_version": 2,
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
  }
}
exit_code=0
```

## Batch Plan Policy Probe

```text
{
  "currentness": {
    "dynamic_status_command": "uv run python run.py p19-gap-status",
    "fresh_for_current_gap_sizing": true,
    "reason": "the cached v2 sample is fresh current-source evidence; promotion still requires explicit owner approval and candidate-source-first scope",
    "stale_after_days": 7,
    "stale_after_utc": "2026-09-04T21:15:15.685030+00:00",
    "status": "fresh"
  },
  "measurement": "P19 v2 28 Aug 2026 public-source gap sample",
  "ok": true,
  "v2_build_decision": {
    "reason": "fresh cached sample indicates a small gap; building postal-universe v2 requires separate owner approval, candidate-source-first scope, and new versioned outputs",
    "status": "not_approved_from_current_sample"
  },
  "verdict": "small sampled current-source gap in frozen v1; v2 remains candidate-source-first if approved"
}
exit_code=0
```

## Tests and Guards

```text
.................................................................
65 passed in 129.81s (0:02:09)
exit_code=0
```

```text
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs
tests/test_triage_onemap_outliers.py::test_triage_cli_refuses_existing_explicit_output_before_input_reads

629 tests collected in 51.60s
exit_code=0
```

```text
repo_integrity=ok
exit_code=0
```

```text
protected_diff_exit_code=0
```

## FINDINGS

1. The refreshed P19 v2 public-source sample completed successfully in 3251.997 seconds.
2. The current measured sample still indicates a small frozen-v1 postal-universe gap: 8 missing rows out of 976 rows with postals, or 0.8197%.
3. The confirmed coordinate-backed HDB gap remains 6 rows: SUN PLAZA SPRING postals 521400, 522400, 523400 and YISHUN BEACON postals 762936, 763936, 764936.
4. The MCST proxy warning remains 2 rows: CANAAN 378720 and MYRA 935456.
5. The refreshed Overpass cross-check found 25,919 distinct valid Singapore addr:postcode values, with 20 not in frozen v1.
6. The completed P19 v2 sample is fresh for current gap sizing at the time of this evidence capture and becomes stale after 2026-09-04T21:15:15.685030+00:00 under the 7 day threshold.
7. The v2 sample does not approve postal-universe v2 promotion; promotion still requires owner approval, candidate-source-first scope, and new versioned outputs.

## DISAGREEMENTS

1. None.
