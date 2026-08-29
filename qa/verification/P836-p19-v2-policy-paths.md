# P836 P19 v2 Policy Paths

Working root: `C:\sgSHIOK2026`
Machine: `PRAWN-E14`

## Evidence Path Ignore Check

```text
git check-ignore -v qa/verification/P836-p19-v2-policy-paths.md; Write-Output "exit=$LASTEXITCODE"
exit=1
```

## Local P19 File Inventory

```text
Get-ChildItem -LiteralPath 'C:\sgSHIOK2026\qa\p19' -Force -ErrorAction SilentlyContinue | Select-Object Mode,Length,Name | Format-Table -AutoSize

Mode  Length Name
----  ------ ----
-a--- 565448 hdb_2021_2026_onemap_geocode_cache_v2.json
-a--- 556863 hdb_2021_2026_onemap_geocode_cache.json
-a--- 389268 overpass_addr_postcodes_cache_v2.json
-a--- 388652 overpass_addr_postcodes_cache.json
-a--- 448396 universe_gap_measurement_detail_v2.json
-a--- 447136 universe_gap_measurement_detail.json
-a---   4408 universe_gap_measurement_summary_v2.json
-a---   4168 universe_gap_measurement_summary.json
```

## P19 Status Path Evidence

```text
uv run python -c "import json; from scripts.analysis import p19_universe_gap_measurement as p19; status=p19.cache_status_report(); files=status['files']; out={'measurement_version': status['measurement_version'], 'summary_path': files['summary']['path'], 'detail_path': files['detail']['path'], 'hdb_cache_path': files['hdb_onemap_geocode_cache']['path'], 'overpass_cache_path': files['overpass_addr_postcodes_cache']['path']}; print(json.dumps(out, indent=2, sort_keys=True))"
{
  "detail_path": "qa\\p19\\universe_gap_measurement_detail_v2.json",
  "hdb_cache_path": "qa\\p19\\hdb_2021_2026_onemap_geocode_cache_v2.json",
  "measurement_version": 2,
  "overpass_cache_path": "qa\\p19\\overpass_addr_postcodes_cache_v2.json",
  "summary_path": "qa\\p19\\universe_gap_measurement_summary_v2.json"
}
```

## Batch-plan Policy Path Probe

```text
uv run python -c "from pipeline.batch_plan import RECENT_PUBLIC_SOURCE_GAP_SAMPLE; import json; print(json.dumps({k: RECENT_PUBLIC_SOURCE_GAP_SAMPLE[k] for k in ('measurement','summary_path','detail_path')}, indent=2, sort_keys=True))"
{
  "detail_path": "qa/p19/universe_gap_measurement_detail_v2.json",
  "measurement": "P19 v2 28 Aug 2026 public-source gap sample",
  "summary_path": "qa/p19/universe_gap_measurement_summary_v2.json"
}
```

## Focused Tests

```text
uv run pytest tests/test_batch_plan.py tests/test_production_readiness.py -q
......................................                                   [100%]
38 passed in 134.57s (0:02:14)
```

## FINDINGS

1. Batch-plan and production-readiness source-policy metadata labelled the recent public-source gap sample as P19 v2 while still pointing to the unversioned P19 summary and detail files.
2. `p19-gap-status` already reports the correct v2 files, so this was a structured policy path bug rather than a measurement or cache problem.

## DISAGREEMENTS

1. None.
