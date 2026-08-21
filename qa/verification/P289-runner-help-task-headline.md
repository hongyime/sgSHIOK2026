# P289 Runner Help Task Headline

## Evidence

Command output is recorded below for the runner-help task headline change.

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

```text
> uv run pytest tests/test_run.py -q
......                                                                   [100%]
6 passed in 1.06s
```

```text
> uv run python run.py --help
usage: run.py [-h] task

S.H.I.O.K. task runner (cross-platform replacement for make).

Usage: uv run python run.py <task> [options]

Safe reports:
  check --freshness-only | check --geospatial-discovery-only | p19-gap-status | readiness | batch-plan

Gated pipeline tasks:
  ingest | network | score | score-batch | export | export-transit | validate | publish

`publish` ALWAYS runs `validate` first — this gate is hard-coded and must never be removed.

positional arguments:
  task

options:
  -h, --help  show this help message and exit
EXIT_CODE=0
```

```text
> python scripts/check_repo_integrity.py; Write-Output "EXIT_CODE=$LASTEXITCODE"
repo_integrity=ok
EXIT_CODE=0
```

```text
> git diff -- pipeline/config/weights.yaml; Write-Output "EXIT_CODE=$LASTEXITCODE"
EXIT_CODE=0
```

## FINDINGS

1. After P288, the curated safe/gated task split was present, but argparse still printed the full task choice set in the usage line and positional-argument label. The help headline now uses `task`, so the safe/gated sections are the primary command-selection surface.

## DISAGREEMENTS

1. None.
