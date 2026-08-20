# P243 readiness freshness checked_at

## Root and host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Scope

P243 adds `checked_at` to the production-readiness `source_freshness` block so
release evidence can identify the timestamp used for manifest-only source
freshness classification.

No scoring, export, rescore, subset run, ingest, network build, deployment,
public-data mutation, source fetch, or locked-weight change was run.

## Focused pytest

```text
uv run pytest C:\sgSHIOK2026\tests\test_production_readiness.py::test_source_freshness_readiness_reports_manifest_only_status -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 1 item

tests\test_production_readiness.py .                                     [100%]

============================== 1 passed in 3.88s ==============================
```

## Timestamp probe

```text
uv run python -c "from datetime import UTC, datetime; from scripts.production_readiness import source_freshness_readiness; import json; print(json.dumps(source_freshness_readiness(now=datetime(2026,8,16,tzinfo=UTC))['checked_at']))"
"2026-08-16T00:00:00+00:00"
```

## Evidence tracking check

```text
git check-ignore -v C:\sgSHIOK2026\qa\verification\P243-readiness-freshness-checked-at.md; Write-Output "exit=$LASTEXITCODE"
exit=1
```

## Repository integrity

```text
python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

## FINDINGS

1. The browser now dates its fixed source-freshness snapshot, but the machine-readable production-readiness `source_freshness` block still did not carry the timestamp used for classification.
2. `source_freshness_readiness()` now uses one `checked_at` value for all source statuses and reports that value in ISO-8601 form.

## DISAGREEMENTS

1. None.
