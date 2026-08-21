# P443 OSM registry status

## Working root

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Base

```text
48a964bf26348500f23e13c4588b61edad57f9f7
48a964b docs: update agent state after P442
7673602 fix: frame locked score availability as coverage
d3e3698 docs: update agent state after P441
```

## Command

```text
uv run python run.py p125-osm-status
```

## Output

```json
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
      "age_days": 0.995,
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
      "age_days": 0.996,
      "bytes": 188,
      "exists": true,
      "mtime_utc": "2026-08-20T13:46:16.941574+00:00",
      "path": "qa/p125/overpass_sg_addr_postcode.query"
    },
    "v1_universe": {
      "age_days": 19.639,
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

## Existing policy check

```text
  40: OSM_ADDR_POSTCODE_COVERAGE = {
  41:     "measurement": "P125 live Overpass addr:postcode coverage",
  42:     "cache_status_command": "uv run python run.py p125-osm-status",
  43:     "cache_status_calls_apis": False,
  44:     "cache_status_writes_files": False,
  45:     "cache_status_reports_age_days": True,
  46:     "overpass_output_path": "qa/p125/overpass_sg_addr_postcode.json",
  47:     "overpass_query_path": "qa/p125/overpass_sg_addr_postcode.query",
  48:     "valid_distinct_postcodes": 25879,
  49:     "overlap_frozen_v1_postals": 25873,
  50:     "valid_osm_only_postcodes": 6,
  51:     "frozen_v1_postals": 124443,
  52:     "coverage_pct": 20.791045,
  53:     "invalid_distinct_postcode_tags": 23,
  54:     "verdict": "not sufficient as primary registry",
  55: }
```

## Focused tests

```text
.............................
......                                      [100%]
35 passed in 52.15s
```

## Repo integrity

```text
repo_integrity=ok
EXIT=0
```

## Protected diff guard

```text
EXIT=0
```

## Evidence ignore check

```text
EXIT=1
```

## FINDINGS

1. Fresh cached P125 output still supports the existing policy: OSM `addr:postcode` covers 25,873 of 124,443 frozen-v1 postals, or 20.791045%.
2. The P125 output also shows 6 valid OSM-only postcodes; P443 carries that count into the static `OSM_ADDR_POSTCODE_COVERAGE` policy block as `valid_osm_only_postcodes`.
3. `run.py p125-osm-status` was zero-mutation in this run: it reported `will_call_apis: false` and `will_write_files: false`.

## DISAGREEMENTS

1. None.
