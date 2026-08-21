# P286 Agent Runner Command

## Evidence

Command output is recorded below for the docs/test change that aligns `CLAUDE.md` with the uv-managed `run.py` command surface.

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

```text
> uv run pytest tests/test_agent_docs.py -q
.                                                                        [100%]
1 passed in 1.16s
```

```text
> python scripts/check_repo_integrity.py; Write-Output "EXIT_CODE=$LASTEXITCODE"
repo_integrity=ok
EXIT_CODE=0
```

```text
> git diff -- pipeline/config/weights.yaml; Write-Output "EXIT_CODE=$LASTEXITCODE"
EXIT_CODE=0
```

```text
> rg -n "`python run.py|uv run python run.py" CLAUDE.md tests/test_agent_docs.py README.md tests/test_readme.py
tests/test_agent_docs.py:30:    assert "uv run python run.py <task>" in normalized
tests/test_agent_docs.py:31:    assert "uv run python run.py test" in normalized
tests/test_agent_docs.py:32:    assert "uv run python run.py publish" in normalized
tests/test_agent_docs.py:33:    assert "`python run.py <task>`" not in normalized
tests/test_agent_docs.py:34:    assert "`python run.py test`" not in normalized
tests/test_agent_docs.py:35:    assert "`python run.py publish`" not in normalized
CLAUDE.md:42:- **Pipeline:** Python 3.12 (managed by `uv`, `uv.lock` committed) — geopandas, shapely 2, pyproj, duckdb, python-igraph, h3; orchestrated by `uv run python run.py <task>` (cross-platform; there is no make).
CLAUDE.md:67:- A task is DONE only when its acceptance criteria pass and `uv run python run.py test` is green.
CLAUDE.md:84:- `uv run python run.py publish` runs `validate` first (hard-coded gate), then
README.md:27:data.gov.sg, OneMap, or Overpass, run `uv run python run.py p19-gap-status`.
README.md:42:Before any Vercel publish attempt, run `uv run python run.py readiness`.
README.md:48:`uv run python run.py check --freshness-only`; it reads `raw/manifest.json` and
README.md:57:`uv run python run.py check --geospatial-discovery-only`; a nonzero result means
README.md:62:`uv run python run.py readiness` and `uv run python run.py batch-plan`. The
tests/test_readme.py:28:    assert "uv run python run.py p19-gap-status" in normalized
tests/test_readme.py:52:    assert "uv run python run.py readiness" in normalized
tests/test_readme.py:58:    assert "uv run python run.py check --freshness-only" in normalized
tests/test_readme.py:67:    assert "uv run python run.py check --geospatial-discovery-only" in normalized
tests/test_readme.py:81:    assert "uv run python run.py readiness" in normalized
tests/test_readme.py:82:    assert "uv run python run.py batch-plan" in normalized
tests/test_readme.py:83:    assert "`python run.py batch-plan`" not in normalized
```

## FINDINGS

1. `CLAUDE.md` still instructed agents to run bare `python run.py ...` even though README, scripts, and batch-plan guidance now use `uv run python run.py ...`; this could select the wrong interpreter outside the locked uv environment.

## DISAGREEMENTS

1. None.
