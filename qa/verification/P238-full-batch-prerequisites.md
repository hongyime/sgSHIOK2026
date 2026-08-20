# P238 Full-Batch Prerequisites

## Working root and host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Evidence path ignore check

```text
exit=1
```

## Focused tests

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 34 items

tests\test_batch_plan.py .........                                       [ 26%]
tests\test_production_readiness.py .........................             [100%]

======================== 34 passed in 98.25s (0:01:38) ========================
```

## Repo integrity

```text
repo_integrity=ok
exit=0
```

## Locked weights diff

```text
```

## FINDINGS

1. The batch plan already stated that each bundled full-batch change must pass the 1,200-record subset before the one approved full run.
2. The plan did not name the prerequisite evidence per bundled change, so future approval review had to infer what proof was needed.
3. `full_batch_release_scope.required_prerequisite_evidence` now names the required proof for bus remodel, `NO_TRANSIT_IN_RANGE` partial-score fix, network conflation repair, and postal-universe v2 promotion.

## DISAGREEMENTS

1. None.
