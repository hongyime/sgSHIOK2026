# P1024 Universe Status First

Date: 2026-08-30
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

README operator guidance for existing no-API/no-write reports.
No scoring, export, rescore, subset run, ingest, network build, deployment, dependency install, upstream probe, manifest write, or protected data mutation.

## Command Output

```text
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
        "max_age_days": 0.844,
        "status": "fresh",
        "summary": "cached P19 sample age 0.844d is within the 7d current-gap sizing threshold",
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

```text
....                                                                     [100%]
4 passed in 2.62s
```

## FINDINGS

1. `universe-status` is the right first command for address-universe gap sizing because it consolidates the current P19 v2 sample and P19 v2 Overpass cross-check without API calls or writes.
2. The older P125 report remains useful as historical OSM-only evidence, but it is not the current source-policy surface.
3. The cached P19 v2 sample remains fresh under the 7-day current-gap sizing threshold at this check.

## DISAGREEMENTS

1. None.
