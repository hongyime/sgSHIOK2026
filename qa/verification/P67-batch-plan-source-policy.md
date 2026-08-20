# P67 batch-plan source-policy output

Date: 2026-08-20
Machine: PRAWN-E14
Working root: C:\sgSHIOK2026

## Scope

Free-tier dry-run planner/reporting change only.
No scoring, export, rescore, subset run, ingest, network build, input rebuild, API collection, public-data write, deployment, or weights change was run.

## Startup guard

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Batch-plan tests

Command:

```text
uv run pytest tests/test_batch_plan.py -q
```

Output:

```text
.......                                                                  [100%]
7 passed in 3.68s
```

## Repo integrity

Command:

```text
python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
exit=0
```

## Diff check

Command:

```text
git diff --check; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
exit=0
```

## Weights guard

Command:

```text
git diff -- pipeline/config/weights.yaml; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
exit=0
```

## FINDINGS

1. The dry-run batch planner still blocked on the frozen third-party OneMap-derived 2020 source, but it did not tell a future operator what acceptable v2 source policy replaces it.
2. The batch plan now exposes a `source_policy` block and a clearer approval blocker: frozen v1 is acceptable only as the current locked baseline, while a future v2 needs candidate-source-first approval before full-batch use.
3. This is planning/reporting only; no source data, public bundle, scoring, export, deployment, or locked weights changed.

## DISAGREEMENTS

1. None for this phase.
