# P244 readiness freshness summary timestamp

## Root and host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Scope

P244 makes the production-readiness `source_freshness` timestamp visible in the
human summary and present in non-reported states as well as the reported state.

No scoring, export, rescore, subset run, ingest, network build, deployment,
public-data mutation, source fetch, or locked-weight change was run.

## Focused pytest

```text
uv run pytest C:\sgSHIOK2026\tests\test_production_readiness.py::test_source_freshness_readiness_reports_manifest_only_status C:\sgSHIOK2026\tests\test_production_readiness.py::test_source_freshness_readiness_is_non_blocking_when_manifest_absent -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 2 items

tests\test_production_readiness.py ..                                    [100%]

============================== 2 passed in 3.33s ==============================
```

## Summary probe

```text
uv run python -c "from datetime import UTC, datetime; from scripts.production_readiness import source_freshness_readiness; s=source_freshness_readiness(now=datetime(2026,8,16,tzinfo=UTC)); print(s['checked_at']); print(s['summary'])"
2026-08-16T00:00:00+00:00
source freshness checked at 2026-08-16T00:00:00+00:00: current 12, stale 6, manual 2, unknown_policy 0, unknown_age 1
```

## Evidence tracking check

```text
git check-ignore -v C:\sgSHIOK2026\qa\verification\P244-readiness-freshness-summary-timestamp.md; Write-Output "exit=$LASTEXITCODE"
exit=1
```

## Repository integrity

```text
python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

## Locked weights diff

```text
git diff -- pipeline/config/weights.yaml
```

## FINDINGS

1. P243 added `checked_at` to the machine-readable `source_freshness` block, but the human-readable source-freshness summary still omitted the timestamp.
2. Source-freshness readiness now includes `checked_at` in reported, missing, and unreadable states, and the reported-state summary starts with the exact ISO-8601 timestamp used for classification.

## DISAGREEMENTS

1. None.
