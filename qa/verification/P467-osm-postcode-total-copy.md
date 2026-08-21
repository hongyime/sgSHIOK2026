# P467 OSM Postcode Total Copy

## Startup guard

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

README and browser first-view copy now state the full P125 distinct OSM postcode measurement: 25,879 valid distinct OSM `addr:postcode` values, 25,873 overlapping frozen v1, and 6 valid OSM-only postcodes.

No scoring, export, rescore, subset run, ingest, network build, deployment, public data write, or input rebuild was run.

## Read-only P125 status

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
    "verdict": "not sufficient as primary Singapore address registry"
  },
  "measurement": "P125 live Overpass addr:postcode coverage",
  "mode": "p125_osm_status",
  "will_call_apis": false,
  "will_write_files": false
}
```

## Focused tests

```text
....                                                                     [100%]
4 passed in 1.66s
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  23:42:24
   Duration  1.30s (transform 203ms, setup 0ms, import 246ms, tests 96ms, environment 1ms)
```

## Evidence path ignore check

```text
EXIT=1
```

## Repository integrity

```text
repo_integrity=ok
EXIT=0
```

## Changed files

```text
README.md
decisions.md
tests/test_readme.py
web/app/page.tsx
web/lib/__tests__/score-card-copy.test.ts
qa/verification/P467-osm-postcode-total-copy.md
```

## FINDINGS

1. Existing README/browser copy carried the overlap count and OSM-only count but did not explicitly state the measured 25,879 valid distinct OSM postcode total, even though the standing source-policy question is about distinct OSM postcode values compared with the 124,443-record universe.
2. The added total does not change the policy conclusion: OSM remains geometry evidence, not the primary Singapore address registry.

## DISAGREEMENTS

1. None.
