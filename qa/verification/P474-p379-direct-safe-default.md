# P474 P379 Direct Script Safe Default

Startup guard:

```text
C:\sgSHIOK2026
PRAWN-E14
```

Scope:

```text
Free operator-tooling safety change.
No scoring, export, rescore, subset run, ingest, network build, deployment, public-data mutation, or P19/P379 evidence mutation.
pipeline/config/weights.yaml untouched.
```

Finding:

```text
P473 made run.py p19-mcst-locations read-only by default, but direct invocation of scripts.analysis.p19_mcst_missing_locations still used the write/API-capable probe path unless --cache-status-only was supplied. That left one sharp edge for accidental P379 cache/report mutation.
```

Change:

```text
scripts.analysis.p19_mcst_missing_locations now defaults to cache-status-only mode.
The write/API-capable path requires explicit --probe.
--refresh-cache is documented as a --probe modifier.
```

Observed command output:

```text
uv run python -m scripts.analysis.p19_mcst_missing_locations
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

uv run python -m scripts.analysis.p19_mcst_missing_locations --help
usage: p19_mcst_missing_locations.py [-h] [--delay-sec DELAY_SEC] [--probe]
                                     [--refresh-cache] [--cache-status-only]

Report or explicitly refresh cached P19 MCST proxy location probes. The
default path only reads the existing P379 cache/report. Explicit direct script
runs with `--probe` can locate the two P19 MCST proxy rows through bounded
OneMap Search; that mode writes a new numbered P379 cache/report and never
mutates the original P19 measurement files.

options:
  -h, --help            show this help message and exit
  --delay-sec DELAY_SEC
  --probe               Call OneMap for missing cache entries and write the
                        P379 cache/report.
  --refresh-cache       With --probe, re-query cached OneMap searches before
                        writing the P379 report.
  --cache-status-only   Read existing P379 cache/report status only; retained
                        for explicitness because this is the default.
```

Verification:

```text
uv run pytest C:\sgSHIOK2026\tests\test_analysis_scripts.py C:\sgSHIOK2026\tests\test_run.py -q -p no:cacheprovider
..................                                                       [100%]
18 passed in 6.33s

git diff --name-only -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11\d_calibration_w2_0050 C:\sgSHIOK2026\qa\p11\d_full_w2_1200 C:\sgSHIOK2026\qa\p11\d_pilot_w2_0200_final C:\sgSHIOK2026\qa\releases

python C:\sgSHIOK2026\scripts\check_repo_integrity.py; Write-Output "EXIT=$LASTEXITCODE"
repo_integrity=ok
EXIT=0

git check-ignore -v -- C:\sgSHIOK2026\qa\verification\P474-p379-direct-safe-default.md; Write-Output "EXIT=$LASTEXITCODE"
EXIT=1
```

FINDINGS:

1. Direct P379 script invocation was still write/API-capable by default after P473; it now requires explicit `--probe`.

DISAGREEMENTS:

1. None.
