# P375 P125 cache-age status

## Root guard

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## P125 status command

```text
{
  "coverage": {
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
  },
  "files": {
    "overpass_output": {
      "addr_postcode_values": 32250,
      "age_days": 0.757,
      "bytes": 10748837,
      "distinct_addr_postcode_all": 25902,
      "exists": true,
      "invalid_distinct_count": 23,
      "invalid_distinct_sample": [
        "#B1-42",
        "01-01",
        "01-05",
        "135",
        "18983",
        "228232;228239",
        "2395661",
        "48618",
        "49406",
        "500003;500002",
        "50336",
        "510222;510221;510223",
        "52082",
        "59443",
        "59815",
        "62864",
        "769666,769668",
        "80739",
        "81005",
        "82001"
      ],
      "mtime_utc": "2026-08-20T13:46:41.503966+00:00",
      "overpass_elements": 32250,
      "overpass_elements_by_type": {
        "node": 6584,
        "relation": 525,
        "way": 25141
      },
      "path": "qa/p125/overpass_sg_addr_postcode.json",
      "valid_distinct_postcodes": 25879
    },
    "overpass_query": {
      "age_days": 0.758,
      "bytes": 188,
      "exists": true,
      "mtime_utc": "2026-08-20T13:46:16.941574+00:00",
      "path": "qa/p125/overpass_sg_addr_postcode.query"
    },
    "v1_universe": {
      "age_days": 19.402,
      "bytes": 6237203,
      "distinct_postals": 124443,
      "exists": true,
      "mtime_utc": "2026-08-01T22:19:14+00:00",
      "path": "processed/postal_universe_candidate_full_registered_geocoded.parquet",
      "postal_column": "postal_code",
      "row_count": 124443
    }
  },
  "measurement": "P125 live Overpass addr:postcode coverage",
  "mode": "p125_osm_status",
  "will_call_apis": false,
  "will_write_files": false
}
```

## Focused tests

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 43 items

tests\test_analysis_scripts.py ....                                      [  9%]
tests\test_batch_plan.py ..........                                      [ 32%]
tests\test_production_readiness.py .........................             [ 90%]
tests\test_readme.py ....                                                [100%]

======================== 43 passed in 69.31s (0:01:09) ========================
```

## Repo integrity

```text
repo_integrity=ok
exit_code=0
```

## Protected-file guards

```text
git diff -- pipeline/config/weights.yaml
git diff -- checksums.json
git diff -- web/public/data
```

No output.

## FINDINGS

1. P125 status previously reported cache presence and bytes but not file age, unlike the safer P19 cache-status path.
2. P125 now reports `mtime_utc` and `age_days` for the cached Overpass output, cached Overpass query, and frozen v1 universe parquet while preserving the no-API/no-write boundary.
3. The structured P125 source-policy block now declares `cache_status_reports_age_days: true`, so operators can discover the age signal without reading the implementation.

## DISAGREEMENTS

1. None.
