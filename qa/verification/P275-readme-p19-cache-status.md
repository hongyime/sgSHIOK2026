# P275 README P19 Cache Status

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
3 passed in 1.85s
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
index 68393da..2cde633 100644
--- a/README.md
+++ b/README.md
@@ -23,7 +23,9 @@ postal enumerator. Any v2 universe should therefore be candidate-source-first:
 use current free source datasets to propose rows, then pass bounded candidates
 through OneMap Search under explicit token controls, 72-hour token refresh, and
 the current documented token-authenticated call-limit cap unless SLA approves a
-higher limit case-by-case.
+higher limit case-by-case. To inspect the cached P19 measurement without calling
+data.gov.sg, OneMap, or Overpass, run
+`uv run python scripts/analysis/p19_universe_gap_measurement.py --cache-status-only`.
 
 ## Local data artifacts
 
diff --git a/tests/test_readme.py b/tests/test_readme.py
index bf85f68..3b1ec65 100644
--- a/tests/test_readme.py
+++ b/tests/test_readme.py
@@ -25,6 +25,11 @@ def test_readme_documents_universe_source_policy() -> None:
     assert "72-hour token refresh" in normalized
     assert "token-authenticated call-limit cap" in normalized
     assert "higher limit case-by-case" in normalized
+    assert (
+        "uv run python scripts/analysis/p19_universe_gap_measurement.py --cache-status-only"
+        in normalized
+    )
+    assert "without calling data.gov.sg, OneMap, or Overpass" in normalized
 
 
 def test_readme_documents_local_lamp_overlay_artifact() -> None:
```

## FINDINGS

1. The README stated the P19 8-of-976 recent-source gap result but did not tell operators how to inspect the cached evidence without API calls.
2. The README now names the read-only cache-status command and its no-data.gov.sg/no-OneMap/no-Overpass boundary.
3. No pipeline work was run. No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data mutation, or locked-weight change was needed.

## DISAGREEMENTS

1. None.
