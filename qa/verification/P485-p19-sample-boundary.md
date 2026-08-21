# P485 P19 Sample Boundary Wording

Date: 2026-08-22
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Free-tier browser, docs, and structured reporting copy only.

No scoring, export, rescore, subset run, ingest, network build, deployment, input rebuild, API probe, public-data mutation, protected QA mutation, or weights.yaml edit was performed.

## Evidence commands

```text
PS C:\sgSHIOK2026> uv run python run.py p19-gap-status | Select-Object -First 120
{
  "evidence_split": {
    "confirmed_missing_address_rows": 6,
    "coordinate_backed_hdb_missing_rows": 6,
    "detail_exists": true,
    "source_quality_warning_rows": 2,
    "unvalidated_mcst_proxy_rows": 2
  },
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
      "age_days": 5.632,
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
      "age_days": 5.624,
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
```

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_readme.py tests/test_agent_docs.py tests/test_production_readiness.py tests/test_batch_plan.py -q
.........................................                                [100%]
41 passed in 76.62s (0:01:16)
```

```text
PS C:\sgSHIOK2026> npm --prefix web test -- lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  42 passed (42)
   Start at  01:10:20
   Duration  14.76s (transform 8.26s, setup 0ms, import 11.39s, tests 1.18s, environment 4ms)
```

```text
PS C:\sgSHIOK2026> rg -n "small current-source gap|out of 976 \(0\.82%\) 2021-2026 public-source rows|P19 check found 6 coordinate-backed" README.md CLAUDE.md web/app/page.tsx scripts/production_readiness.py pipeline/batch_plan.py tests web/lib/__tests__
web/lib/__tests__\score-card-copy.test.ts:198:    expect(source).not.toContain("out of 976 (0.82%) 2021-2026 public-source rows with postals");
tests\test_readme.py:28:    assert "small current-source gap" not in normalized
tests\test_readme.py:33:    assert "Recent public-source checks found a small current-source gap" not in normalized
```

```text
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "EXIT=$LASTEXITCODE"
repo_integrity=ok
EXIT=0
```

```text
PS C:\sgSHIOK2026> git check-ignore -v qa/verification/P485-p19-sample-boundary.md; Write-Output "EXIT=$LASTEXITCODE"
EXIT=1
```

```text
PS C:\sgSHIOK2026> git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4 qa/releases
```

## FINDINGS

1. P19 is a 976-row sampled public-source check, but some surfaces called it a current-source gap without the sample boundary. The browser, README, CLAUDE, readiness, and batch-plan wording now name the sample boundary while preserving the measured counts and caveats.
2. Process note: during this phase I briefly used a PowerShell replacement command with relative write paths while already in `C:\sgSHIOK2026`. That violated the session guard even though the resulting diff was narrow and inspected. Future writes must use absolute paths only.

## DISAGREEMENTS

1. None.
