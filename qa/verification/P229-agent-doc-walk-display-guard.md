# P229 Agent Doc Walk Display Guard

## Root Guard

Command:

```powershell
$ErrorActionPreference='Stop'; $p=(Get-Location).ProviderPath; $h=$env:COMPUTERNAME; Write-Output "cwd=$p"; Write-Output "host=$h"; if ($p -ne 'C:\sgSHIOK2026') { throw "Wrong working root: $p" }
```

Output:

```text
cwd=C:\sgSHIOK2026
host=PRAWN-E14
```

## Focused Docs Tests

Command:

```powershell
uv run pytest C:\sgSHIOK2026\tests\test_agent_docs.py C:\sgSHIOK2026\tests\test_readme.py -p no:cacheprovider
```

Output:

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 4 items

tests\test_agent_docs.py .                                               [ 25%]
tests\test_readme.py ...                                                 [100%]

============================== 4 passed in 1.01s ==============================
```

## Phrase Search

Command:

```powershell
rg -n "walk display is shelter-map evidence|route display is score|route display|score \*evidence\*|S\.H\.I\.O\.K\. Index|comfort score" C:\sgSHIOK2026\CLAUDE.md C:\sgSHIOK2026\tests\test_agent_docs.py
```

Output:

```text
C:\sgSHIOK2026\tests\test_agent_docs.py:16:    assert "S.H.I.O.K. Index" not in text
C:\sgSHIOK2026\tests\test_agent_docs.py:17:    assert "comfort score" not in text
C:\sgSHIOK2026\tests\test_agent_docs.py:22:    assert "walk display is shelter-map evidence only" in normalized
C:\sgSHIOK2026\tests\test_agent_docs.py:23:    assert "route display is score" not in normalized
C:\sgSHIOK2026\CLAUDE.md:88:- No turn-by-turn navigation, no live routing UI (walk display is shelter-map evidence only).
```

## Repository Integrity

Command:

```powershell
uv run python C:\sgSHIOK2026\scripts\check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
exit=0
```

## Protected Weights Diff

Command:

```powershell
git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml
```

Output:

```text
```

## FINDINGS

1. `CLAUDE.md` still described the scoped map surface as `route display is score evidence only`, which conflicts with the settled walk-display and shelter-map evidence framing.
2. The focused agent-doc test now guards the scope line against regressing to route-display/score-evidence wording.

## DISAGREEMENTS

1. None.
