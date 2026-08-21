# P468 Readiness OSM Postcode Total

## Startup guard

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

Production-readiness human policy text now carries the same P125 distinct OSM postcode total as README, browser copy, and the structured readiness source-policy block.

No scoring, export, rescore, subset run, ingest, network build, deployment, public data write, or input rebuild was run.

## Focused test

```text
.........................                                                [100%]
25 passed in 72.05s (0:01:12)
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
decisions.md
scripts/production_readiness.py
tests/test_production_readiness.py
qa/verification/P468-readiness-osm-postcode-total.md
```

## FINDINGS

1. The structured readiness source-policy block already reported `valid_distinct_postcodes: 25879`, but the human `canonical_140k_postal_universe` caveat only said OSM covered `25873` frozen postals.
2. Release readers now see both the total distinct OSM postcode count and the overlap count without inspecting nested JSON.

## DISAGREEMENTS

1. None.
