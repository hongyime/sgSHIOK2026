# P70 API credential readiness

Date: 2026-08-20
Machine: PRAWN-E14
Working root: C:\sgSHIOK2026

## Scope

Free-tier readiness-reporting change only.
No scoring, export, rescore, subset run, ingest, network build, input rebuild, API collection, public-data write, deployment, or weights change was run.

## Startup guard

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Current non-secret environment readiness

Command:

```text
uv run python -c "import json; from scripts.production_readiness import environment_readiness; print(json.dumps(environment_readiness(), indent=2, sort_keys=True))"
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

The report intentionally does not include credential values.

## Focused tests

Command:

```text
uv run pytest tests/test_production_readiness.py::test_environment_readiness_reports_missing_api_credentials_without_values tests/test_production_readiness.py::test_build_readiness_report_accepts_minimal_valid_current_state -q
```

Output:

```text
..                                                                       [100%]
2 passed in 18.00s
```

## Full readiness test file

Command:

```text
uv run pytest tests/test_production_readiness.py -q
```

Output:

```text
.................                                                        [100%]
17 passed in 60.79s (0:01:00)
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

1. The readiness report did not previously expose API credential readiness, so future OneMap/LTA work could start from a stale assumption about local credentials.
2. The new `environment` block reports only credential presence booleans and missing variable names, never values.
3. Contrary to earlier local state, Prawn-E14 currently has `LTA_DATAMALL_ACCOUNT_KEY`, `ONEMAP_EMAIL`, and `ONEMAP_PASSWORD` present.

## DISAGREEMENTS

1. None for this phase.
