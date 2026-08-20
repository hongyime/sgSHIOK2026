# P250 deployed-bundle audit CLI wording

Root: `C:\sgSHIOK2026`
Host: `PRAWN-E14`
Date: 2026-08-21

## Scope

The current-bundle audit CLI still described the deployed artifact as a score bundle. This phase changes only the argparse description to `current deployed shelter-map bundle` and guards that wording in `tests/test_audit_current_bundle.py`.

No scoring, export, rescore, subset run, ingest, network build, deployment, bundle audit run, input mutation, public-data mutation, or locked weight change was run.

## Commands

```text
uv run pytest C:\sgSHIOK2026\tests\test_audit_current_bundle.py -p no:cacheprovider
```

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 5 items

tests\test_audit_current_bundle.py .....                                 [100%]

============================== 5 passed in 5.51s ==============================
```

```text
rg -n "Fast audit of the current deployed score bundle|current deployed score bundle" C:\sgSHIOK2026\scripts --glob '!**/__pycache__/**'; Write-Output "exit=$LASTEXITCODE"
```

```text
exit=1
```

## FINDINGS

1. `scripts/audit_current_bundle.py` still framed the deployed artifact as a score bundle in operator help text.
2. The CLI help now says current deployed shelter-map bundle while leaving score fields and audit behavior unchanged.

## DISAGREEMENTS

1. None.
