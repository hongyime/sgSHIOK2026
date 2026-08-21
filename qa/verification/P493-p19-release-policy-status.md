# P493 P19 Release Policy Status

Working root:

```text
C:\sgSHIOK2026
Prawn-E14
```

## Check-ignore

```text
Command: git check-ignore -v qa/verification/P493-p19-release-policy-status.md; if ($LASTEXITCODE -eq 0) { "exit=$LASTEXITCODE" } else { "exit=$LASTEXITCODE" }
exit=1
```

## Focused Tests

```text
Command: uv run pytest C:\sgSHIOK2026\tests\test_analysis_scripts.py -q
........                                                                 [100%]
8 passed in 4.25s
```

## Real Cached P19 Status

```text
Command: uv run python C:\sgSHIOK2026\run.py p19-gap-status
{
  "evidence_split": {
    "confirmed_missing_address_rows": 6,
    "coordinate_backed_hdb_missing_rows": 6,
    "detail_exists": true,
    "source_quality_warning_rows": 2,
    "unvalidated_mcst_proxy_rows": 2
  },
  "release_policy": {
    "confirmed_missing_address_rows": 6,
    "measurement_label": "16 Aug 2026 public-source sample",
    "source_quality_warning_rows": 2,
    "status": "sample_classified",
    "summary": "6 coordinate-backed HDB missing rows confirmed as address-universe gaps; 2 MCST proxy rows remain source-quality warnings"
  },
  "will_call_apis": false,
  "will_write_files": false
}
```

## Parsed Release Policy

```text
Command: $json = uv run python C:\sgSHIOK2026\run.py p19-gap-status | Out-String; $report = $json | ConvertFrom-Json; $report.release_policy | ConvertTo-Json -Depth 5; "will_call_apis=$($report.will_call_apis)"; "will_write_files=$($report.will_write_files)"
{
  "confirmed_missing_address_rows": 6,
  "measurement_label": "16 Aug 2026 public-source sample",
  "source_quality_warning_rows": 2,
  "status": "sample_classified",
  "summary": "6 coordinate-backed HDB missing rows confirmed as address-universe gaps; 2 MCST proxy rows remain source-quality warnings"
}
will_call_apis=False
will_write_files=False
```

## Repository Integrity

```text
Command: python C:\sgSHIOK2026\scripts\check_repo_integrity.py; if ($LASTEXITCODE -eq 0) { "exit=$LASTEXITCODE" } else { "exit=$LASTEXITCODE" }
repo_integrity=ok
exit=0
```

## Protected Path Diff

```text
Command: git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4 qa/releases
```

## FINDINGS

1. `run.py p19-gap-status` already reported the evidence split, but it did not expose the release-policy label that the browser/readiness copy now uses.
2. The real cached status now reports `16 Aug 2026 public-source sample`, 6 confirmed coordinate-backed HDB address-universe gaps, and 2 MCST proxy rows as source-quality warnings.
3. The real status command still reports `will_call_apis=false` and `will_write_files=false`; no P19 or P379 cache files were mutated.

## DISAGREEMENTS

1. None.
