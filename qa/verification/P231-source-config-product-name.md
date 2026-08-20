# P231 Source Config Product Name

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14
Date: 2026-08-21

## Scope

No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected-QA write, or locked-weights edit was performed.

## Commands

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 5 items

tests\test_fetch.py F                                                    [ 20%]
tests\test_readme.py ...                                                 [ 80%]
tests\test_agent_docs.py .                                               [100%]

================================== FAILURES ===================================
__________ test_source_config_has_freshness_policy_for_every_source ___________

    def test_source_config_has_freshness_policy_for_every_source() -> None:
        config = load_source_config()
        defaults = config["freshness_defaults"]
        sources = config["sources"]
>       source_text = (PROJECT_ROOT / "pipeline" / "config" / "sources.yaml").read_text(
                       ^^^^^^^^^^^^
            encoding="utf-8"
        )
E       NameError: name 'PROJECT_ROOT' is not defined

tests\test_fetch.py:143: NameError
=========================== short test summary info ===========================
FAILED tests/test_fetch.py::test_source_config_has_freshness_policy_for_every_source
========================= 1 failed, 4 passed in 5.01s =========================
```

```text
C:\sgSHIOK2026\tests\test_readme.py:15:    assert text.startswith("# S.H.I.O.K. Shelter Map")
C:\sgSHIOK2026\tests\test_readme.py:16:    assert "# S.H.I.O.K. Index" not in text
C:\sgSHIOK2026\README.md:1:# S.H.I.O.K. Shelter Map
C:\sgSHIOK2026\tests\test_fetch.py:148:    assert "S.H.I.O.K. Shelter Map" in source_text
C:\sgSHIOK2026\tests\test_fetch.py:149:    assert "S.H.I.O.K. Index" not in source_text
C:\sgSHIOK2026\pipeline\config\sources.yaml:1:# Upstream data sources configuration for S.H.I.O.K. Shelter Map (PRD v4.2 §5, DATA_SOURCES.md)
C:\sgSHIOK2026\tests\test_agent_docs.py:15:    assert text.startswith("# CLAUDE.md — S.H.I.O.K. Shelter Map")
C:\sgSHIOK2026\tests\test_agent_docs.py:16:    assert "S.H.I.O.K. Index" not in text
C:\sgSHIOK2026\CLAUDE.md:1:# CLAUDE.md — S.H.I.O.K. Shelter Map (agent instructions)
C:\sgSHIOK2026\CLAUDE.md:3:You are building S.H.I.O.K. Shelter Map: a free, non-commercial civic web app
```

```text
exit=1
```

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 5 items

tests\test_fetch.py .                                                    [ 20%]
tests\test_readme.py ...                                                 [ 80%]
tests\test_agent_docs.py .                                               [100%]

============================== 5 passed in 5.92s ==============================
```

```text
repo_integrity=ok
exit=0
```

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
 decisions.md                 | 6 ++++++
 pipeline/config/sources.yaml | 2 +-
 tests/test_fetch.py          | 5 +++++
 3 files changed, 12 insertions(+), 1 deletion(-)
```

## FINDINGS

1. `pipeline/config/sources.yaml` still named the retired S.H.I.O.K. Index in its maintained header while README, CLAUDE, and the browser frame now name S.H.I.O.K. Shelter Map.
2. P230 had evidence committed but no durable `decisions.md` entry; this pass records that missing entry.
3. The P231 change is a comment/test/decision alignment only. Freshness defaults, source definitions, URLs, dataset ids, source policies, manifests, scoring, exports, public data, deployment, and locked weights are unchanged.

## DISAGREEMENTS

1. None.
