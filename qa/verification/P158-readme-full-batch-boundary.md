# P158 README Full-Batch Boundary

## Scope

Documentation-only guardrail: surface the one-attempt full-batch approval boundary in README onboarding, with a focused README test and a decision-log entry.

## Command Output

```text
uv run pytest tests/test_readme.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 3 items

tests\test_readme.py ...                                                 [100%]

============================== 3 passed in 0.77s ==============================
```

```text
python scripts/check_repo_integrity.py
repo_integrity=ok
exit=0
```

```text
git diff -- pipeline/config/weights.yaml
```

```text
git diff --check
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
```

```text
git check-ignore -v qa/verification/P158-readme-full-batch-boundary.md; "exit=$LASTEXITCODE"
exit=1
```

## Findings

1. The README documented publish readiness but did not yet mention `python run.py batch-plan` or the one-attempt full-batch owner-approval boundary.
2. This change touches only README/test/evidence/decision documentation and does not alter inputs, scoring, export, public data, deployment, or locked weights.

## Disagreements

1. None.
