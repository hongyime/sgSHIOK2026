# P252 no-transit locked-score policy

## Root guard

```text
ROOT_OK C:\sgSHIOK2026
HOST PRAWN-E14
```

## Diff stat

```text
 pipeline/batch_plan.py             | 5 +++++
 tests/test_batch_plan.py           | 5 +++++
 tests/test_production_readiness.py | 5 +++++
 3 files changed, 15 insertions(+)
```

## Focused tests

```text
uv run pytest tests/test_batch_plan.py tests/test_production_readiness.py -q
..................................                                       [100%]
34 passed in 125.73s (0:02:05)
```

## FINDINGS

1. The full-batch prerequisite for the future `NO_TRANSIT_IN_RANGE` partial-score fix did not explicitly forbid silent four-of-five renormalisation in machine-readable readiness output.
2. The batch plan and production readiness now expose the settled locked-score policy: missing or `NO_TRANSIT_IN_RANGE` component terms remain zero-contribution under locked weights unless a new explicit display state is introduced.
3. This was free-tier reporting/test work only. No scoring, export, rescore, ingest, network build, public data write, input mutation, deployment, or locked weight change was run.

## DISAGREEMENTS

1. None.
