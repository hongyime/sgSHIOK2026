# P271 Bus-Connector Shelter-Map Wording

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
.........                                                                [100%]
9 passed in 3.58s
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
diff --git a/decisions.md b/decisions.md
index 31c3518..0fdf516 100644
--- a/decisions.md
+++ b/decisions.md
@@ -736,3 +736,6 @@ Dry-run batch planning and production readiness should expose the settled lamp-p
 
 2026-08-21 - P270 structured source-freshness policy:
 Dry-run batch planning and production readiness should expose the source-freshness check boundary in structured source-policy data. The manifest-only command is `uv run python run.py check --freshness-only`; it probes no upstream URLs, writes no manifest, and reports release context rather than corruption or hash-repair status. A stale result means plan a versioned refresh, not an in-place frozen-v1 mutation. This is reporting/test coverage only; it does not probe upstream APIs, fetch sources, mutate manifests or inputs, score, export, deploy, public data, or locked weights.
+
+2026-08-21 - P271 bus-connector diagnostic shelter-map wording:
+Bus-connector diagnostics should tell operators to refresh a targeted shelter-map bundle, not a targeted score bundle, before promoting recovered rows into active validation failures. The diagnostic still concerns score-bearing rows, but the current artifact is the shelter-map bundle with locked scores inside it; using score-bundle language weakens the settled shelter-first operator frame. This is diagnostic copy and test coverage only; it does not run diagnostics, score, export, deploy, mutate public data, mutate inputs, or touch locked weights.
diff --git a/scripts/diagnose_bus_connectors.py b/scripts/diagnose_bus_connectors.py
index 6a6491e..b75822f 100644
--- a/scripts/diagnose_bus_connectors.py
+++ b/scripts/diagnose_bus_connectors.py
@@ -365,7 +365,7 @@ def diagnostic_action_summary(rows: list[dict[str, Any]]) -> dict[str, Any]:
             compact_action_row(row) for row in current_routable[:10]
         ],
         "recommended_next_actions": [
-            "Refresh a targeted score bundle for recovered rows before using them as active validation failures.",
+            "Refresh a targeted shelter-map bundle for recovered rows before using them as active validation failures.",
             "Treat alternate-snap rows as transit endpoint geometry QA; do not relax trust thresholds globally.",
             "Review current-routable rows for missing pedestrian connectors, barriers, or OneMap endpoint differences.",
         ],
diff --git a/tests/test_diagnose_bus_connectors.py b/tests/test_diagnose_bus_connectors.py
index 69fbf94..f065307 100644
--- a/tests/test_diagnose_bus_connectors.py
+++ b/tests/test_diagnose_bus_connectors.py
@@ -259,3 +259,10 @@ def test_diagnostic_action_summary_separates_rescore_and_model_fix_rows():
     assert summary["top_needs_rescore_candidates"][2]["target_transit_name"] == (
         "ESPLANADE MRT STATION Exit B"
     )
+    assert (
+        "Refresh a targeted shelter-map bundle for recovered rows before using them as active validation failures."
+        in summary["recommended_next_actions"]
+    )
+    assert not any(
+        "targeted score bundle" in action for action in summary["recommended_next_actions"]
+    )
```

## FINDINGS

1. A maintained operator diagnostic still told users to refresh a targeted `score bundle` before using recovered rows as active validation failures. That copy was stale against the settled shelter-map artifact frame and is now guarded by `tests/test_diagnose_bus_connectors.py`.
2. No pipeline work was run. No export, rescore, subset run, ingest, network build, public-data mutation, input mutation, or locked-weight change was needed.

## DISAGREEMENTS

1. None.
