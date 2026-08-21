# P469 Agent OSM Postcode Total

## Startup guard

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

`CLAUDE.md` now carries the full P125 distinct OSM postcode measurement: 25,879 valid distinct live OSM `addr:postcode` values, 25,873 overlapping frozen v1, and 6 valid OSM-only postcodes.

No scoring, export, rescore, subset run, ingest, network build, deployment, public data write, or input rebuild was run.

## Focused test

```text
.                                                                        [100%]
1 passed in 0.99s
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
CLAUDE.md
decisions.md
tests/test_agent_docs.py
qa/verification/P469-agent-osm-postcode-total.md
```

## FINDINGS

1. Agent-facing startup guidance still used the older overlap-only OSM wording after README, browser copy, and production readiness had been aligned to the P125 total.
2. Future agents now see the same empirical OSM source-policy boundary at startup: OSM remains geometry evidence, not the primary address registry.

## DISAGREEMENTS

1. None.
