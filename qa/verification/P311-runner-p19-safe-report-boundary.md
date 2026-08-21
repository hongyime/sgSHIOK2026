# P311 Runner P19 Safe Report Boundary

## Evidence

Command output is recorded below for the runner P19 safe-report boundary change.

### Root Guard

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

### Focused Python Test

```text
......                                                                   [100%]
6 passed in 1.92s
```

### Help Output

```text
usage: run.py [-h] task

S.H.I.O.K. task runner (cross-platform replacement for make).

Usage: uv run python run.py <task> [options]

Safe reports:
  check --freshness-only | check --geospatial-discovery-only | p19-gap-status | readiness | batch-plan
  p19-gap-status reads cached P19 measurement status only; it calls no APIs and writes no files.

Gated pipeline tasks:
  ingest | network | score | score-batch | export | export-transit | validate | publish

`publish` ALWAYS runs `validate` first — this gate is hard-coded and must never be removed.

positional arguments:
  task

options:
  -h, --help  show this help message and exit
```

### Repository Integrity

```text
repo_integrity=ok
EXIT_CODE=0
```

### Locked Weights Diff Check

```text
EXIT_CODE=0
```

## FINDINGS

1. `run.py --help` listed `p19-gap-status` as a safe report but did not state the crucial no-API/no-write boundary. The help now says the task reads cached P19 status only, calls no APIs, and writes no files.

## DISAGREEMENTS

1. None.
