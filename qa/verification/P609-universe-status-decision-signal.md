# P609 Universe Status Decision Signal

## Root guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

Free-tier read-only reporting change.

No scoring, export, rescore, subset run, ingest, network build, upstream probe, input mutation, public-data writes, protected QA mutation, deployment, or locked-weight changes were performed.

## Live read-only universe status

```text
{
  "decision_boundary": "Use these cached measurements to size the frozen-v1 address-universe gap before building postal-universe v2. They do not approve a v2 promotion, scoring, export, or input mutation.",
  "measurements": {
    "osm_addr_postcode_coverage": {
      "cache_status_command": "uv run python run.py p125-osm-status",
      "measurement": "P125 20 Aug 2026 Overpass addr:postcode coverage cross-check",
      "osm_coverage_of_v1_pct": 20.791045,
      "osm_valid_distinct_postcodes": 25879,
      "osm_valid_in_v1": 25873,
      "osm_valid_not_in_v1": 6,
      "osm_valid_not_in_v1_as_share_of_v1_pct": 0.004821,
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
      "directional_if_sample_rate_applied_to_v1_distinct_postals": {
        "basis": "Directional scale only: applies recent-completion sample row rates to the frozen-v1 distinct postal count; it is not a measured full-universe gap.",
        "confirmed_missing_address_rows_estimate": 765,
        "missing_or_source_quality_warning_rows_estimate": 1020,
        "v1_distinct_postals": 124443
      },
      "measurement": "16 Aug 2026 public-source sample",
      "missing_or_source_quality_warning_row_rate_pct": 0.819672,
      "sample_missing_development_clusters": [
        {
          "bbox": {
            "max_lat": 1.3585855,
            "max_lon": 103.9495319,
            "min_lat": 1.3581836,
            "min_lon": 103.9486325
          },
          "centroid": {
            "lat": 1.3584495,
            "lon": 103.9490744
          },
          "coordinate_count": 3,
          "coordinate_source": "cached_onemap_search_result",
          "development": "SUN PLAZA SPRING",
          "missing_postals": [
            "521400",
            "522400",
            "523400"
          ],
          "missing_rows": 3,
          "source": "hdb_2021_2026_geocoded",
          "years": [
            2026
          ]
        },
        {
          "bbox": {
            "max_lat": 1.4242769,
            "max_lon": 103.836389,
            "min_lat": 1.4233001,
            "min_lon": 103.8362424
          },
          "centroid": {
            "lat": 1.4237757,
            "lon": 103.8363103
          },
          "coordinate_count": 3,
          "coordinate_source": "cached_onemap_search_result",
          "development": "YISHUN BEACON",
          "missing_postals": [
            "762936",
            "763936",
            "764936"
          ],
          "missing_rows": 3,
          "source": "hdb_2021_2026_geocoded",
          "years": [
            2026
          ]
        },
        {
          "development": "CANAAN",
          "missing_postals": [
            "378720"
          ],
          "missing_rows": 1,
          "source": "mcst_2021_2026",
          "years": [
            2023
          ]
        },
        {
          "development": "MYRA",
          "missing_postals": [
            "935456"
          ],
          "missing_rows": 1,
          "source": "mcst_2021_2026",
          "years": [
            2024
          ]
        }
      ],
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

## Focused regression

```text
.                                                                        [100%]
1 passed in 18.96s
```

## Related analysis and run tests

```text
.........................                                                [100%]
25 passed in 15.68s
```

## Python collect-only

```text
457 tests collected in 26.25s
```

## Repository integrity

```text
repo_integrity=ok
exit=0
```

## Evidence path check-ignore

```text
exit=1
```

## Protected-path diff

```text
exit=0
```

## FINDINGS

1. `run.py universe-status` now directly answers the recent-completion coverage question from cached P19/P125 evidence: the 16 Aug 2026 public-source sample has 6 confirmed missing address rows out of 976 rows with postals, or 0.614754%, and 8 rows including MCST source-quality warnings, or 0.819672%.
2. Applying that sample rate to the frozen v1 distinct postal count is explicitly labeled directional, not measured full-universe evidence; it estimates 765 confirmed missing rows or 1,020 rows including warnings, which is closer to footnote scale than a 20,000-record product-reshaping gap.
3. The named cached gaps are now visible in the consolidated report: SUN PLAZA SPRING, YISHUN BEACON, CANAAN, and MYRA, with eight sample missing postals listed.
4. The OSM addr:postcode cross-check remains in the same consolidated report and still supports the settled policy: 25,879 valid distinct OSM postcodes, 25,873 overlapping frozen v1, 6 OSM-only, and OSM is geometry evidence rather than the address registry.

## DISAGREEMENTS

1. None.
