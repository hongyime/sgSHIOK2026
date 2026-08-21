# P276 README uv Operator Commands

## Root Guard

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

## Evidence Path

```text
EXIT_CODE=1
```

## Focused Test

```text
...                                                                      [100%]
3 passed in 2.69s
```

## Repository Integrity

```text
repo_integrity=ok
EXIT_CODE=0
```

## Locked Weights Diff

```text
EXIT_CODE=0
```

## Diff Reviewed

```text
diff --git a/README.md b/README.md
index 2cde633..8e40efa 100644
--- a/README.md
+++ b/README.md
@@ -40,7 +40,7 @@ layer is a separate local artifact at `web/public/data/lamp_posts_v1/`: 700 H3-r
 tile files plus `manifest.json`, 126,144 LTA lamp-post points, source last
 modified 7 Jul 2026. It is map evidence only and is not part of the locked score.
 
-Before any Vercel publish attempt, run `python scripts/production_readiness.py`.
+Before any Vercel publish attempt, run `uv run python scripts/production_readiness.py`.
 That readiness check validates the shelter-map bundle and also verifies that the local
 lamp overlay artifact is present and internally consistent. Do not rebuild,
 overwrite, or mutate existing public data directories to repair a missing
@@ -60,7 +60,7 @@ the current discovery URL differs from frozen v1 and any approved refresh must
 be a new numbered input version, not an in-place repair.
 
 Before any full geocode, scoring, or release batch, run both
-`python scripts/production_readiness.py` and `python run.py batch-plan`. The
+`uv run python scripts/production_readiness.py` and `uv run python run.py batch-plan`. The
 next full-batch release is approved in principle but is not approved to run. It
 is one attempt only, requires explicit owner approval before execution, and must
 bundle the bus remodel, the `NO_TRANSIT_IN_RANGE` partial-score fix, network
diff --git a/tests/test_readme.py b/tests/test_readme.py
index 3b1ec65..c7dd7e6 100644
--- a/tests/test_readme.py
+++ b/tests/test_readme.py
@@ -51,7 +51,8 @@ def test_readme_documents_local_lamp_overlay_artifact() -> None:
     assert "source last modified 7 Jul 2026" in normalized
     assert "Map evidence only" not in normalized
     assert "map evidence only and is not part of the locked score" in normalized
-    assert "python scripts/production_readiness.py" in normalized
+    assert "uv run python scripts/production_readiness.py" in normalized
+    assert "`python scripts/production_readiness.py`" not in normalized
     assert "validates the shelter-map bundle" in normalized
     assert "validates the score bundle" not in normalized
     assert "Do not rebuild, overwrite, or mutate existing public data directories" in normalized
@@ -75,8 +76,9 @@ def test_readme_documents_full_batch_approval_boundary() -> None:
     text = README.read_text(encoding="utf-8")
     normalized = compact(text)
 
-    assert "python scripts/production_readiness.py" in normalized
-    assert "python run.py batch-plan" in normalized
+    assert "uv run python scripts/production_readiness.py" in normalized
+    assert "uv run python run.py batch-plan" in normalized
+    assert "`python run.py batch-plan`" not in normalized
     assert "next full-batch release is approved in principle but is not approved to run" in normalized
     assert "one attempt only" in normalized
     assert "requires explicit owner approval before execution" in normalized
```

## FINDINGS

1. README operator guidance still used bare `python` for production readiness and batch planning, unlike the existing `uv run` guidance for freshness and P19 cache-status commands.
2. Bare system `python` can fail before reaching the intended safety checks when project dependencies are not on that interpreter.
3. No pipeline work was run. No readiness report, batch plan, scoring, export, rescore, subset run, ingest, network build, input mutation, public-data mutation, or locked-weight change was needed.

## DISAGREEMENTS

1. None.
