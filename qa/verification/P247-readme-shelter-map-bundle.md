# P247 README shelter-map bundle wording

## Root and host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Scope

P247 updates maintained onboarding wording so the active static artifact is the
live shelter-map bundle, while the locked-score availability remains secondary
inside that bundle.

No scoring, export, rescore, subset run, ingest, network build, deployment,
public-data mutation, source fetch, upstream API call, or locked-weight change
was run.

## Focused pytest

```text
uv run pytest C:\sgSHIOK2026\tests\test_readme.py::test_readme_documents_local_lamp_overlay_artifact -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 1 item

tests\test_readme.py .                                                   [100%]

============================== 1 passed in 0.52s ==============================
```

## Retired active-artifact wording grep

```text
rg -n "live score bundle remains configured|validates the score bundle|latest validated static score bundle" C:\sgSHIOK2026\README.md C:\sgSHIOK2026\web\lib\data.ts; Write-Output "exit=$LASTEXITCODE"
exit=1
```

## Evidence tracking check

```text
git check-ignore -v C:\sgSHIOK2026\qa\verification\P247-readme-shelter-map-bundle.md; Write-Output "exit=$LASTEXITCODE"
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

1. README onboarding still called the active public artifact the live `score bundle`, which pulls the operator frame back toward the secondary locked score.
2. The README now calls it the live shelter-map bundle and says readiness validates the shelter-map bundle while preserving the exact locked-score availability counts and limitations.
3. The web data-loader comment now also describes the default artifact as the validated static shelter-map bundle.

## DISAGREEMENTS

1. None.
