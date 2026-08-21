# P494 P125 OSM Policy Status

Working root:

```text
C:\sgSHIOK2026
Prawn-E14
```

## Check-ignore

```text
Command: git check-ignore -v qa/verification/P494-p125-osm-policy-status.md; if ($LASTEXITCODE -eq 0) { "exit=$LASTEXITCODE" } else { "exit=$LASTEXITCODE" }
exit=1
```

## Focused Tests

```text
Command: uv run pytest C:\sgSHIOK2026\tests\test_analysis_scripts.py C:\sgSHIOK2026\tests\test_batch_plan.py C:\sgSHIOK2026\tests\test_production_readiness.py -q
............................................                             [100%]
44 passed in 96.51s (0:01:36)
```

## Parsed Real P125 Status

```text
Command: $json = uv run python C:\sgSHIOK2026\run.py p125-osm-status | Out-String; $report = $json | ConvertFrom-Json; $report.coverage | ConvertTo-Json -Depth 5; "will_call_apis=$($report.will_call_apis)"; "will_write_files=$($report.will_write_files)"
{
  "osm_coverage_of_v1_pct": 20.791045,
  "osm_only_sample": [
    "289916",
    "289917",
    "289918",
    "289919",
    "289920",
    "519454"
  ],
  "osm_valid_distinct_postcodes": 25879,
  "osm_valid_in_v1": 25873,
  "osm_valid_not_in_v1": 6,
  "registry_policy": "not the address registry",
  "source_role": "geometry evidence and coverage cross-check",
  "v1_distinct_postals": 124443,
  "v1_not_in_osm_valid": 98570,
  "v1_only_sample": [
    "000104",
    "000105",
    "000106",
    "000135",
    "000207",
    "000208",
    "000315",
    "000316",
    "000511",
    "000512",
    "000617",
    "000718",
    "000719",
    "000820",
    "000821",
    "000922",
    "000923",
    "001024",
    "001025",
    "001026",
    "001027",
    "001130",
    "001232",
    "001233",
    "001334",
    "001438",
    "001439",
    "001441",
    "001542",
    "001543",
    "001648",
    "001750",
    "001781",
    "001953",
    "001954",
    "001955",
    "002262",
    "002367",
    "002469",
    "002677",
    "002880",
    "018907",
    "018910",
    "018925",
    "018926",
    "018927",
    "018928",
    "018929",
    "018930",
    "018937"
  ],
  "verdict": "not sufficient as primary Singapore address registry"
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

1. The P125 cached status already reported the measured coverage and verdict, but did not expose OSM's product role as structured metadata.
2. Batch-plan/readiness shortened the verdict to `not sufficient as primary registry`, while direct P125 status used `not sufficient as primary Singapore address registry`.
3. The real cached status now reports OSM as `geometry evidence and coverage cross-check`, with `registry_policy` set to `not the address registry`, and remains zero-mutation.

## DISAGREEMENTS

1. None.
