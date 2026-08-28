# P808 P19 v2 operator surfaces

## Working root guard

```text
cwd=C:\sgSHIOK2026
hostname=Prawn-E14
```

## Command: uv run python run.py universe-status

```json
{
  "decision_boundary": "Use the cached P19 v2 measurements to size the frozen-v1 address-universe gap before building postal-universe v2. The older P125 OSM-only status remains a historical report, not the current source-policy surface. These measurements do not approve a v2 promotion, scoring, export, or input mutation.",
  "measurements": {
    "osm_addr_postcode_coverage": {
      "cache_status_command": "uv run python run.py p19-gap-status",
      "measurement": "P19 v2 28 Aug 2026 Overpass addr:postcode coverage cross-check",
      "osm_coverage_of_v1_pct": 20.811938,
      "osm_valid_distinct_postcodes": 25919,
      "osm_valid_in_v1": 25899,
      "osm_valid_not_in_v1": 20,
      "osm_valid_not_in_v1_as_share_of_v1_pct": 0.016072,
      "registry_policy": "not the address registry",
      "source_role": "geometry evidence and coverage cross-check",
      "v1_distinct_postals": 124443,
      "verdict": "not sufficient as primary Singapore address registry",
      "will_call_apis": false,
      "will_write_files": false
    },
    "recent_public_source_gap_sample": {
      "cache_status_command": "uv run python run.py p19-gap-status",
      "confirmed_missing_address_row_rate_pct": 0.614754,
      "confirmed_missing_address_rows": 6,
      "currentness": {
        "fresh_for_current_gap_sizing": true,
        "max_age_days": 0.04,
        "status": "fresh",
        "summary": "cached P19 sample age 0.04d is within the 7d current-gap sizing threshold",
        "threshold_days": 7.0
      },
      "directional_if_sample_rate_applied_to_v1_distinct_postals": {
        "basis": "Directional scale only: applies recent-completion sample row rates to the frozen-v1 distinct postal count; it is not a measured full-universe gap.",
        "confirmed_missing_address_rows_estimate": 765,
        "missing_or_source_quality_warning_rows_estimate": 1020,
        "v1_distinct_postals": 124443
      },
      "measurement": "P19 v2 28 Aug 2026 public-source sample",
      "missing_or_source_quality_warning_row_rate_pct": 0.819672,
      "sample_missing_postals": [
        "378720",
        "521400",
        "522400",
        "523400",
        "762936",
        "763936",
        "764936",
        "935456"
      ],
      "sample_missing_unique_postals": 8,
      "sample_rows_with_postal": 976,
      "source_quality_warning_rows": 2,
      "status": "sample_classified",
      "summary": "6 coordinate-backed HDB missing rows confirmed as address-universe gaps; 2 MCST proxy rows remain source-quality warnings",
      "will_call_apis": false,
      "will_write_files": false
    }
  },
  "mode": "universe_measurement_status",
  "will_call_apis": false,
  "will_write_files": false
}
```

## Command: uv run python run.py p19-gap-status

```text
"measurement_version": 2
"measurement_complete": true
"release_policy.measurement_label": "P19 v2 28 Aug 2026 public-source sample"
"files.summary.path": "qa\\p19\\universe_gap_measurement_summary_v2.json"
"files.summary.overpass_addr_postcode.unique_postcodes": 25919
"files.summary.overpass_addr_postcode.intersection": 25899
"files.summary.overpass_addr_postcode.missing_from_v1": 20
"files.summary.v1_universe.unique_postals": 124443
"will_call_apis": false
"will_write_files": false
```

## Command: uv run pytest tests/test_analysis_scripts.py tests/test_readme.py tests/test_run.py tests/test_batch_plan.py tests/test_production_readiness.py -q

```text
........................................................................ [ 56%]
........................................................                 [100%]
128 passed in 111.86s (0:01:51)
```

## Command: python scripts/check_repo_integrity.py

```text
repo_integrity=ok
exit_code=0
```

## Command: protected path diff guard

```text
protected_diff_exit_code=0
```

## P807 precision correction

```text
P807 evidence said "P19 v2 Source Values" while citing qa/p19/overpass_addr_postcodes_cache_v2.json.
The source values used by source-policy code are from qa/p19/universe_gap_measurement_summary_v2.json.
qa/p19/overpass_addr_postcodes_cache_v2.json carries the raw Overpass postcodes and query metadata.
```

## FINDINGS

1. `universe-status` was still using P125 as the current OSM coverage source after P807 changed batch-plan and readiness policy surfaces to P19 v2.
2. `p19-gap-status` already read the P19 v2 summary but did not expose the `overpass_addr_postcode` and `v1_universe` blocks needed by the consolidated operator report.
3. README and `run.py` help text still described P19 as the 16 Aug sample and P125 as the current consolidated OSM coverage surface.

## DISAGREEMENTS

1. Subagents could not be restarted in this crashed continuation because `spawn_agent` returned `agent thread limit reached`; the review was therefore local-only.
