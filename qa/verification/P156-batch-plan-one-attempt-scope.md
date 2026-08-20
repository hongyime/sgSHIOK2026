# P156 Batch Plan One Attempt Scope

## Scope

Free-tier dry-run planning/reporting change only. No scoring, export, rescore, subset run, ingest, network build, deploy, live-site repoint, public data write, or locked weight change.

## Change

`pipeline.batch_plan` now emits `full_batch_release_scope` so the dry-run report records that the full batch is only approved in principle, needs explicit owner approval before execution, is one attempt only, and must bundle the bus remodel, `NO_TRANSIT_IN_RANGE` partial-score fix, network conflation repair, and any approved postal-universe v2 promotion.

## Verification

`uv run pytest tests/test_batch_plan.py -p no:cacheprovider`

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 8 items

tests\test_batch_plan.py ........                                        [100%]

============================== 8 passed in 3.48s ==============================
```

`git diff --check`

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
```

`git diff -- pipeline/config/weights.yaml`

```text
```

`python scripts/check_repo_integrity.py; "exit=$LASTEXITCODE"`

```text
repo_integrity=ok
exit=0
```

## Findings

1. The batch planner already blocked full geocode/scoring runs, but it did not spell out the current one-attempt release scope or the changes that must be bundled before any owner-approved full run.

## Disagreements

1. None.
