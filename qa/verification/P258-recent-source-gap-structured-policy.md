# P258 recent-source gap structured policy

Working root: `C:\sgSHIOK2026`
Machine: `PRAWN-E14`
Date: 2026-08-21

## Command output

```text
> uv run pytest tests/test_batch_plan.py tests/test_production_readiness.py -q
..................................                                       [100%]
34 passed in 68.09s (0:01:08)
```

```text
> python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

```text
> git diff -- pipeline/config/weights.yaml
```

```text
> git diff --stat
 pipeline/batch_plan.py             | 10 ++++++++++
 scripts/production_readiness.py    |  2 ++
 tests/test_batch_plan.py           |  9 +++++++++
 tests/test_production_readiness.py |  9 +++++++++
 4 files changed, 30 insertions(+)
```

## FINDINGS

1. The P19 recent public-source miss signal was present in README/readiness prose, but not in the structured `source_policy` block used by dry-run batch planning and production readiness.
2. The structured policy block now carries the P19 measurement directly: 976 HDB completion and BCA MCST proxy rows with postals from 2021-2026, 8 missing rows, 0.819672 percent missing, and the settled verdict that candidate-source-first v2 remains required.
3. This is zero pipeline cost. It does not touch inputs, exports, public data, deployment, scoring, or locked weights.

## DISAGREEMENTS

1. None.
