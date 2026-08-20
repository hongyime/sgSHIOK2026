# P234 Pipeline Header Frame

## Working root and host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Evidence path ignore check

```text
exit=1
```

## Stale editable header scan

```text
C:\sgSHIOK2026\pipeline\config\weights.yaml:1:# S.H.I.O.K. Index scoring weights (PRD v4.2 §7 - LOCKED)
C:\sgSHIOK2026\pipeline\config\params.yaml:1:# S.H.I.O.K. Index pipeline parameters (PRD v4.2 §7, §15)
C:\sgSHIOK2026\pipeline\fetch.py:1:"""Fetch and hash pipeline module for S.H.I.O.K. Index (T0.3)."""
C:\sgSHIOK2026\pipeline\__init__.py:1:"""S.H.I.O.K. Index pipeline package."""
```

## Editable header check after change

```text
C:\sgSHIOK2026\pipeline\config\weights.yaml:1:# S.H.I.O.K. Index scoring weights (PRD v4.2 §7 - LOCKED)
```

## Focused test

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 17 items

tests\test_fetch.py .................                                    [100%]

============================= 17 passed in 6.89s ==============================
```

## Repo integrity

```text
repo_integrity=ok
exit=0
```

## Locked weights diff

```text
```

## FINDINGS

1. Three editable maintained pipeline headers still used the retired S.H.I.O.K. Index product frame; they now use S.H.I.O.K. Shelter Map and are guarded by `test_editable_pipeline_headers_use_shelter_map_frame`.
2. `pipeline/config/weights.yaml` remains the only hit in the checked pipeline header set, and it was intentionally not edited because the file is locked.

## DISAGREEMENTS

1. None.
