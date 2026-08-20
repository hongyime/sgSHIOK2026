# P256 readiness source-freshness scope

## Root guard

```text
ROOT_OK C:\sgSHIOK2026
HOST PRAWN-E14
```

## Scope

Production readiness source-freshness output now exposes:

```text
scope: manifest_only
upstream_urls_probed: false
```

This keeps release-gate JSON aligned with the CLI/README caveat that local freshness status is not an upstream probe.

## Focused tests

```text
uv run pytest tests/test_production_readiness.py -q
.........................                                                [100%]
25 passed in 51.00s
```

## FINDINGS

1. Production-readiness source-freshness JSON did not make its no-upstream-probe scope machine-readable.
2. `source_freshness_readiness()` now returns `scope: manifest_only` and `upstream_urls_probed: false` across reported and nonreported states.
3. This was readiness-reporting/test work only. No upstream probe, fetch, ingest, input mutation, scoring, export, public-data write, deployment, or locked weight change was run.

## DISAGREEMENTS

1. None.
