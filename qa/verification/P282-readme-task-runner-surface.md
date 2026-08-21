# P282 README Task Runner Surface

## root guard

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

## git check-ignore -v qa/verification/P282-readme-task-runner-surface.md

```text
EXIT_CODE=1
```

## uv run pytest tests/test_readme.py -q

```text
...                                                                      [100%]
3 passed in 3.39s
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

1. README's repo map still described `run.py` with the old compact task list and did not name current safe report tasks such as `p19-gap-status`, `readiness`, or `batch-plan`.
2. README now separates safe reports from gated pipeline tasks in the `run.py` repo-map line, making the no-pipeline-cost operator surface easier to find.
3. This was documentation and test coverage only; no scoring, export, rescore, subset run, ingest, network build, public data write, deploy, or locked-weight change was run.

## DISAGREEMENTS

1. None.
