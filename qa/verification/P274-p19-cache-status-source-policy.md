# P274 P19 Cache Status Source Policy

## Root Guard

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

## Evidence Path

```text
EXIT_CODE=1
```

## Focused Tests

```text
..................................                                       [100%]
34 passed in 36.89s
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
diff --git a/pipeline/batch_plan.py b/pipeline/batch_plan.py
index cea0479..7d84199 100644
--- a/pipeline/batch_plan.py
+++ b/pipeline/batch_plan.py
@@ -47,6 +47,11 @@ OSM_ADDR_POSTCODE_COVERAGE = {
 }
 RECENT_PUBLIC_SOURCE_GAP_SAMPLE = {
     "measurement": "P19 recent public-source gap sample",
+    "cache_status_command": "uv run python scripts/analysis/p19_universe_gap_measurement.py --cache-status-only",
+    "cache_status_calls_apis": False,
+    "cache_status_writes_files": False,
+    "summary_path": "qa/p19/universe_gap_measurement_summary.json",
+    "detail_path": "qa/p19/universe_gap_measurement_detail.json",
     "source_rows_with_postals": 976,
     "missing_rows": 8,
     "missing_pct": 0.819672,
diff --git a/tests/test_batch_plan.py b/tests/test_batch_plan.py
index f511c21..8b468ed 100644
--- a/tests/test_batch_plan.py
+++ b/tests/test_batch_plan.py
@@ -216,6 +216,11 @@ def test_batch_plan_reports_bounded_geocoding_and_keeps_gate_closed(tmp_path: Pa
     assert "candidate-source-first" in report["source_policy"]["v2"]
     assert report["source_policy"]["recent_public_source_gap_sample"] == {
         "measurement": "P19 recent public-source gap sample",
+        "cache_status_command": "uv run python scripts/analysis/p19_universe_gap_measurement.py --cache-status-only",
+        "cache_status_calls_apis": False,
+        "cache_status_writes_files": False,
+        "summary_path": "qa/p19/universe_gap_measurement_summary.json",
+        "detail_path": "qa/p19/universe_gap_measurement_detail.json",
         "source_rows_with_postals": 976,
         "missing_rows": 8,
         "missing_pct": 0.819672,
diff --git a/tests/test_production_readiness.py b/tests/test_production_readiness.py
index ad7c7a9..9cc39ca 100644
--- a/tests/test_production_readiness.py
+++ b/tests/test_production_readiness.py
@@ -504,6 +504,11 @@ def test_build_readiness_report_accepts_minimal_valid_current_state(tmp_path: Pa
     )
     assert report["features"]["source_policy"]["recent_public_source_gap_sample"] == {
         "measurement": "P19 recent public-source gap sample",
+        "cache_status_command": "uv run python scripts/analysis/p19_universe_gap_measurement.py --cache-status-only",
+        "cache_status_calls_apis": False,
+        "cache_status_writes_files": False,
+        "summary_path": "qa/p19/universe_gap_measurement_summary.json",
+        "detail_path": "qa/p19/universe_gap_measurement_detail.json",
         "source_rows_with_postals": 976,
         "missing_rows": 8,
         "missing_pct": 0.819672,
```

## FINDINGS

1. P273 added a safe P19 cache-status command, but dry-run batch planning and production readiness still reported the P19 gap sample without telling operators how to inspect the cached evidence safely.
2. The shared source-policy block now names the read-only cache-status command and declares that it calls no APIs and writes no files.
3. No pipeline work was run. No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data mutation, or locked-weight change was needed.

## DISAGREEMENTS

1. None.
