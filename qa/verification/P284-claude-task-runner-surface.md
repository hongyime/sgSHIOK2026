# P284 CLAUDE Task Runner Surface

## root guard

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

## git check-ignore -v qa/verification/P284-claude-task-runner-surface.md

```text
EXIT_CODE=1
```

## uv run pytest tests/test_agent_docs.py -q

```text
.                                                                        [100%]
1 passed in 1.14s
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

1. `CLAUDE.md` still documented `run.py` with the old compact task list after README had been updated to separate safe reports from gated pipeline tasks.
2. `CLAUDE.md` now names the safe report commands (`check --freshness-only`, `check --geospatial-discovery-only`, `p19-gap-status`, `readiness`, `batch-plan`) and keeps gated pipeline tasks separate.
3. This was agent-facing documentation and test coverage only; no scoring, export, rescore, subset run, ingest, network build, public data write, deploy, or locked-weight change was run.

## DISAGREEMENTS

1. None.
