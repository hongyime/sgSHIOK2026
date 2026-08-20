# P157 Readiness Full Batch Scope

## Scope

Free-tier readiness reporting/test change only. No scoring, export, rescore, subset run, ingest, network build, deploy, live-site repoint, public data write, or locked weight change.

## Change

`scripts.production_readiness` now preserves the batch planner's `full_batch_release_scope` in the summarized `batch_plan` section, so release review carries the same one-attempt, owner-approval boundary as `pipeline.batch_plan`.

## Verification

`uv run pytest tests/test_production_readiness.py -p no:cacheprovider`

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 21 items

tests\test_production_readiness.py .....................                 [100%]

======================== 21 passed in 76.05s (0:01:16) ========================
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

1. P156 added the full-batch scope to `pipeline.batch_plan`, but production readiness summarized the batch plan without that field, so release review could still omit the one-attempt boundary.

## Disagreements

1. None.
