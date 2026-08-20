# P233 Scoring Module Product Name

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14
Date: 2026-08-21

## Scope

No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected-QA write, scoring formula change, or locked-weights edit was performed.

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
collected 12 items

tests\test_scoring.py ............                                       [100%]

============================= 12 passed in 2.43s ==============================
```

```text
C:\sgSHIOK2026\tests\test_scoring.py:45:    assert "S.H.I.O.K. Shelter Map" in source
C:\sgSHIOK2026\tests\test_scoring.py:46:    assert "S.H.I.O.K. Index" not in source
C:\sgSHIOK2026\pipeline\scoring.py:2:Scoring engine for S.H.I.O.K. Shelter Map.
C:\sgSHIOK2026\pipeline\scoring.py:3:Implements pure functions for component scores and locked score calculation.
C:\sgSHIOK2026\decisions.md:382:The app's first brand signal should describe the user-facing artifact rather than the secondary score. The visible H1 and document metadata title now say `S.H.I.O.K. Shelter Map` instead of `S.H.I.O.K. Index`, while the subtitle remains `Shelter-first walks to transit` and the locked SHIOK score remains visible as a secondary route-evidence field. This is browser naming only; it does not alter scoring, ranking, route geometry, exports, public data, deployment, or locked weights.
C:\sgSHIOK2026\decisions.md:391:The repository README should use the same shelter-map framing as the browser title. Its heading now says `S.H.I.O.K. Shelter Map` instead of `S.H.I.O.K. Index`, while the existing intro continues to state that the app leads with covered-walkway ratio and exposed gaps and keeps the locked SHIOK score secondary. This is documentation and test coverage only; it does not alter browser behavior, scoring, exports, public data, deployment, or locked weights.
C:\sgSHIOK2026\decisions.md:615:`CLAUDE.md` is part of the agent handoff surface and should not teach new sessions the retired comfort-score-first product frame. It now opens with S.H.I.O.K. Shelter Map, covered-walkway ratio, exposed gaps, night-lighting map evidence, and the locked SHIOK score as secondary; the clicked-stop helper is described as walk-preview evidence. This is documentation and test coverage only; it does not alter runtime behavior, scoring, exports, inputs, public data, deployment, or locked weights.
C:\sgSHIOK2026\decisions.md:624:The `pipeline/config/sources.yaml` header now names S.H.I.O.K. Shelter Map instead of the retired S.H.I.O.K. Index framing. The freshness/source policy remains unchanged; this is config-comment and regression-test alignment only and does not alter input fetching, source URLs, source cadence thresholds, manifests, scoring, exports, public data, deployment, or locked weights.
C:\sgSHIOK2026\decisions.md:630:The `pipeline/scoring.py` module docstring now names S.H.I.O.K. Shelter Map and describes pure component-score functions plus locked score calculation instead of the retired Index/composite framing. This is documentation and regression-test alignment only; it does not alter score formulas, scoring behavior, exports, inputs, public data, deployment, or locked weights.
```

```text
exit=1
```

```text
repo_integrity=ok
exit=0
```

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
 decisions.md          | 3 +++
 pipeline/scoring.py   | 4 ++--
 tests/test_scoring.py | 8 ++++++++
 3 files changed, 13 insertions(+), 2 deletions(-)
```

## FINDINGS

1. `pipeline/scoring.py` still opened with the retired `S.H.I.O.K. Index` name and composite wording while the product frame is S.H.I.O.K. Shelter Map with a secondary locked score.
2. The change is docstring/test/decision alignment only. Score functions, formulas, weights, inputs, exports, public data, and deployment are unchanged.

## DISAGREEMENTS

1. None.
