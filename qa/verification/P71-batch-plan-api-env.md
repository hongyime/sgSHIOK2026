# P71 batch-plan API environment readiness

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

## Pre-fix discrepancy

Production-readiness helper saw credentials present:

```text
{
  "lta_datamall_account_key_present": true,
  "missing": [],
  "onemap_credentials_present": true,
  "onemap_email_present": true,
  "onemap_password_present": true,
  "ready_for_api_collection": true,
  "warnings": []
}
```

Direct batch-plan helper saw credentials missing before the fix:

```text
{
  "lta_datamall_account_key_present": false,
  "missing": [
    "LTA_DATAMALL_ACCOUNT_KEY",
    "ONEMAP_EMAIL",
    "ONEMAP_PASSWORD"
  ],
  "onemap_credentials_present": false,
  "onemap_email_present": false,
  "onemap_password_present": false,
  "ready_for_api_collection": false,
  "warnings": [
    "LTA_DATAMALL_ACCOUNT_KEY missing; DataMall-backed source refreshes cannot run",
    "ONEMAP_EMAIL/ONEMAP_PASSWORD missing; OneMap token-backed validation cannot run"
  ]
}
```

PowerShell process variables were absent, while `.env` contained all three keys:

```text
LTA_DATAMALL_ACCOUNT_KEY=False
ONEMAP_EMAIL=False
ONEMAP_PASSWORD=False
```

```text
.env:LTA_DATAMALL_ACCOUNT_KEY=True
.env:ONEMAP_EMAIL=True
.env:ONEMAP_PASSWORD=True
```

## Post-fix direct batch-plan probe

Command:

```text
uv run python -c "import json; from pipeline.batch_plan import api_environment_readiness; print(json.dumps(api_environment_readiness(), indent=2, sort_keys=True))"
```

Output:

```text
{
  "lta_datamall_account_key_present": true,
  "missing": [],
  "onemap_credentials_present": true,
  "onemap_email_present": true,
  "onemap_password_present": true,
  "ready_for_api_collection": true,
  "warnings": []
}
```

## Batch-plan tests

Command:

```text
uv run pytest tests/test_batch_plan.py -q
```

Output:

```text
........                                                                 [100%]
8 passed in 3.38s
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

1. Direct `pipeline.batch_plan` invocation did not load `.env`, so it would have falsely warned that all API credentials were missing even though `.env` had them.
2. `pipeline.batch_plan` now loads `.env`, matching other pipeline entrypoints, before emitting the non-secret `api_environment` block.
3. This is dry-run planning/reporting only; no API calls, source data, public bundle, scoring, export, deployment, or locked weights changed.

## DISAGREEMENTS

1. None for this phase.
