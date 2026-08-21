# P484 Dated P125 Policy Surfaces

Date: 2026-08-22
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Free-tier docs and structured reporting copy only.

No scoring, export, rescore, subset run, ingest, network build, deployment, input rebuild, public-data mutation, protected QA mutation, or weights.yaml edit was performed.

## Evidence commands

```text
PS C:\sgSHIOK2026> rg -n "P125 live Overpass|valid distinct live OSM|P125 found 25,879|P125 found 25879|Live OSM addr:postcode coverage" README.md CLAUDE.md scripts pipeline tests web/app/page.tsx web/lib/__tests__/score-card-copy.test.ts
web/lib/__tests__/score-card-copy.test.ts:212:    expect(source).not.toContain("Live OSM addr:postcode coverage:");
tests\test_agent_docs.py:35:    assert "valid distinct live OSM `addr:postcode` values" not in normalized
tests\test_readme.py:40:    assert "P125 live Overpass measurement" not in normalized
```

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_readme.py tests/test_agent_docs.py tests/test_production_readiness.py tests/test_batch_plan.py tests/test_analysis_scripts.py -q
.................................................                        [100%]
49 passed in 109.85s (0:01:49)
```

```text
PS C:\sgSHIOK2026> npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  01:03:50
   Duration  824ms (transform 126ms, setup 0ms, import 156ms, tests 84ms, environment 0ms)
```

```text
PS C:\sgSHIOK2026> uv run python run.py p125-osm-status | Select-String -- '"measurement"|"will_call_apis"|"will_write_files"|"mtime_utc"|"osm_valid_distinct_postcodes"|"osm_valid_in_v1"|"osm_valid_not_in_v1"|"v1_distinct_postals"'

    "osm_valid_distinct_postcodes": 25879,
    "osm_valid_in_v1": 25873,
    "osm_valid_not_in_v1": 6,
    "v1_distinct_postals": 124443,
      "mtime_utc": "2026-08-20T13:46:41.503966+00:00",
      "mtime_utc": "2026-08-20T13:46:16.941574+00:00",
      "mtime_utc": "2026-08-01T22:19:14+00:00",
  "measurement": "P125 20 Aug 2026 Overpass addr:postcode coverage",
  "will_call_apis": false,
  "will_write_files": false
```

```text
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "EXIT=$LASTEXITCODE"
repo_integrity=ok
EXIT=0
```

```text
PS C:\sgSHIOK2026> git check-ignore -v qa/verification/P484-dated-p125-policy-surfaces.md; Write-Output "EXIT=$LASTEXITCODE"
EXIT=1
```

```text
PS C:\sgSHIOK2026> git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4 qa/releases
```

## FINDINGS

1. README, CLAUDE, readiness, and batch-plan policy still described the cached P125 Overpass postcode measurement as `live`. They now date it as the P125 20 Aug 2026 Overpass check, matching the browser copy and P125 evidence.

## DISAGREEMENTS

1. None.
