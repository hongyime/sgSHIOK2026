# P525 Runner batch-plan release boundary

Working root: C:\sgSHIOK2026
Host: Prawn-E14
Date: 2026-08-22

## Guard

```text
C:\sgSHIOK2026
Prawn-E14
1fe96632b38d7d75e72027c9ef3397ca3e8ea00f
1fe96632b38d7d75e72027c9ef3397ca3e8ea00f	refs/heads/main
```

## Evidence path ignore check

```text
check_ignore_exit=1
```

## Focused tests

Command:

```text
uv run pytest tests/test_run.py -q
```

Output:

```text
...............                                                          [100%]
15 passed in 3.61s
```

## Runner help probe

Command:

```text
uv run python run.py --help | Select-String -Pattern "batch-plan|one-attempt|owner approval|bounded OneMap"
```

Output:

```text

  check --freshness-only | check --geospatial-discovery-only | p19-gap-status | p19-mcst-locations | p125-osm-status | readiness | readiness --gate-summary | batch-plan
  batch-plan dry-runs one-attempt full-batch prerequisites and policy status without scoring; execution still requires owner approval and bounded OneMap controls.

```

## FINDINGS

1. `run.py --help` still described `batch-plan` as a generic dry run, while README, CLAUDE, batch-plan, and readiness carry the one-attempt owner-approval boundary and bounded OneMap controls.
2. The task runner now exposes that release boundary at the operator entry point.

## DISAGREEMENTS

1. None.
