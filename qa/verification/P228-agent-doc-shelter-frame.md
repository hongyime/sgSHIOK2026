# P228 Agent Doc Shelter Frame

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

============================== 4 passed in 1.61s ==============================
```

## Phrase Search

Command:

```powershell
rg -n "S\.H\.I\.O\.K\. Index|comfort score|preview-route evidence|Night Safety|S\.H\.I\.O\.K\. Shelter Map|clicked-stop walk-preview|locked SHIOK score" C:\sgSHIOK2026\CLAUDE.md C:\sgSHIOK2026\tests\test_agent_docs.py
```

Output:

```text
C:\sgSHIOK2026\tests\test_agent_docs.py:15:    assert text.startswith("# CLAUDE.md — S.H.I.O.K. Shelter Map")
C:\sgSHIOK2026\tests\test_agent_docs.py:16:    assert "S.H.I.O.K. Index" not in text
C:\sgSHIOK2026\tests\test_agent_docs.py:17:    assert "comfort score" not in text
C:\sgSHIOK2026\tests\test_agent_docs.py:19:    assert "locked SHIOK score visible but secondary" in normalized
C:\sgSHIOK2026\tests\test_agent_docs.py:20:    assert "clicked-stop walk-preview evidence" in normalized
C:\sgSHIOK2026\tests\test_agent_docs.py:21:    assert "preview-route evidence" not in normalized
C:\sgSHIOK2026\tests\test_agent_docs.py:23:    assert "Night Safety is a map overlay only" not in normalized
C:\sgSHIOK2026\CLAUDE.md:1:# CLAUDE.md — S.H.I.O.K. Shelter Map (agent instructions)
C:\sgSHIOK2026\CLAUDE.md:3:You are building S.H.I.O.K. Shelter Map: a free, non-commercial civic web app
C:\sgSHIOK2026\CLAUDE.md:6:night-lighting evidence as a map layer, and keeps the locked SHIOK score visible
C:\sgSHIOK2026\CLAUDE.md:25:   `/api/onemap-route` for clicked-stop walk-preview evidence. Everything else is static
C:\sgSHIOK2026\CLAUDE.md:92:- Night lighting is a map overlay only — never part of the locked SHIOK score.
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

1. `CLAUDE.md` still opened with the retired S.H.I.O.K. Index / comfort-score-first framing even though README and the browser now use the shelter-map product frame.
2. The minimal runtime backend description still called `/api/onemap-route` clicked-stop `preview-route evidence`; it now says clicked-stop walk-preview evidence.

## DISAGREEMENTS

1. None.
