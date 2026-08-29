# P1013 universe status currentness

Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Date: 2026-08-30

## Scope

Read-only cached universe status only. No APIs, scoring, export, rescore, subset run, ingest, network build, public-data write, dependency install, deployment, or locked weight change was run.

## Command Output

``text
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
        "max_age_days": 0.799,
        "status": "fresh",
        "summary": "cached P19 sample age 0.799d is within the 7d current-gap sizing threshold",
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
``

## FINDINGS

1. The cached P19 v2 28 Aug 2026 public-source sample is still fresh for current gap sizing under the 7-day policy: age 0.798 days in this run.
2. The measured recent-public-source gap remains small in the current cached sample: 6 confirmed coordinate-backed HDB missing rows out of 976 sampled rows with postals, or 0.614754%; including 2 MCST source-quality warnings gives 8 rows, or 0.819672%.
3. The directional scale, if the sample row rate is applied to the 124,443 frozen-v1 distinct postals, is 765 confirmed missing rows or 1,020 including source-quality warnings. The command explicitly marks this as directional only, not a measured full-universe gap.
4. OSM remains a coverage cross-check and geometry source, not an address registry: the cached P19 v2 Overpass check finds 25,919 valid distinct OSM postcodes, 25,899 in v1 and 20 valid OSM-only, covering only 20.811938% of the frozen v1 postals.
5. On current evidence, building postal-universe v2 is still not the next free-tier implementation step; the right next move is more candidate-source measurement or owner approval for a bounded v2 experiment, not promotion.

## DISAGREEMENTS

1. None.
