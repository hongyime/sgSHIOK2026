# P285 README Runner Readiness Command

## root guard

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

## git check-ignore -v qa/verification/P285-readme-runner-readiness-command.md

```text
EXIT_CODE=1
```

## uv run pytest tests/test_readme.py tests/test_run.py -q

```text
.......                                                                  [100%]
7 passed in 0.97s
```

## python scripts/check_repo_integrity.py

```text
repo_integrity=ok
EXIT_CODE=0
```

## git diff -- pipeline/config/weights.yaml

```text
EXIT_CODE=0
```

## FINDINGS

1. README still told operators to run `scripts/production_readiness.py` directly even though `run.py readiness` is the documented safe-report task.
2. README now uses `uv run python run.py readiness` before publish attempts and full-batch planning, and `tests/test_run.py` guards that the task dispatches to `scripts.production_readiness`.
3. This was documentation and task-runner test coverage only; no readiness report, scoring, export, rescore, subset run, ingest, network build, public data write, deploy, or locked-weight change was run.

## DISAGREEMENTS

1. None.
