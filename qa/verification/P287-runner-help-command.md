# P287 Runner Help Command

## Evidence

Command output is recorded below for the runner-help copy change.

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

```text
> uv run pytest tests/test_run.py -q
....                                                                     [100%]
4 passed in 0.96s
```

```text
> uv run python run.py --help
usage: run.py [-h]
              {batch-plan,bus-arrivals,bus-connector-diagnostics,candidate-audit,check,compare-targeted,export,export-transit,geocode-universe,ingest,lamp-overlay,network,network-debug,network-preflight,network-qa,onemap-outlier-replay,onemap-outlier-triage,onemap-validation,overture-addresses,p19-gap-status,postal-universe,publish,readiness,refresh-provenance,score,score-batch,shell,test,validate}

S.H.I.O.K. task runner (cross-platform replacement for make). Usage: uv run
python run.py <task> [options] Tasks: batch-plan | bus-arrivals | bus-
connector-diagnostics | candidate-audit | check | compare-targeted | ingest |
lamp-overlay | network | network-debug | network-preflight | network-qa |
onemap-validation | onemap-outlier-replay | onemap-outlier-triage | overture-
addresses | p19-gap-status | readiness | refresh-provenance | score | score-
batch | postal-universe | geocode-universe | export | export-transit |
validate | publish | test | shell `publish` ALWAYS runs `validate` first —
this gate is hard-coded and must never be removed. Stubs below are replaced
task-by-task per docs/BUILD_PLAN.md.

positional arguments:
  {batch-plan,bus-arrivals,bus-connector-diagnostics,candidate-audit,check,compare-targeted,export,export-transit,geocode-universe,ingest,lamp-overlay,network,network-debug,network-preflight,network-qa,onemap-outlier-replay,onemap-outlier-triage,onemap-validation,overture-addresses,p19-gap-status,postal-universe,publish,readiness,refresh-provenance,score,score-batch,shell,test,validate}

options:
  -h, --help            show this help message and exit
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

1. `run.py` still advertised `Usage: python run.py <task> [options]`, even after README and `CLAUDE.md` had moved operator guidance to `uv run python run.py ...`. The runner help now matches the uv-managed invocation.

## DISAGREEMENTS

1. None.
