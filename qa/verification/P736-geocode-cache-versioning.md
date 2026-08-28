# P736 bounded geocode cache versioning

## Root and host

```text
pwd=C:\sgSHIOK2026
host=PRAWN-E14
```

## Evidence path ignore check

```text
exit_code=1
```

## Focused tests

```text
...............................                                          [100%]
31 passed in 19.14s
```

## Help text guard

```text
                           [--confirm-bounded-geocode]
frozen v1 in place. The mutable geocode cache must also be explicitly
                        refuse unversioned or existing outputs.
                        example raw/geocode_cache_v2.db.
  --confirm-bounded-geocode
```

## Pytest collection count

```text
533 tests collected in 82.86s (0:01:22)
```

## Repository integrity

```text
repo_integrity=ok
exit_code=0
```

## Diff whitespace guard

```text
exit_code=0
```

## Protected-path diff guard

```text
exit_code=0
```

## Head and remote

```text
9d976d24f0c76ff68fee25547a00a760997d8a66
9d976d24f0c76ff68fee25547a00a760997d8a66	refs/heads/main
```

## Findings

1. A confirmed non-dry bounded geocode fill could previously use the default unversioned `raw/geocode_cache.db`, creating a mutable cache side channel even though the parquet and summary outputs were already required to be new numeric-version artifacts.
2. The guard now fails before reading queued rows, opening the cache, or calling OneMap when the cache path lacks a numeric version suffix such as `_v2`.
3. `run.py` now names `geocode-universe` in the gated pipeline task list because it can call OneMap and write a cache, parquet, and summary.

## Disagreements

1. None.

## P737 appended follow-up: batch-plan completed fill boundary

### Focused tests

```text
.........................................                                [100%]
41 passed in 14.16s
```

### Diff excerpt

```text
diff --git a/pipeline/batch_plan.py b/pipeline/batch_plan.py
index c369698..dc9787d 100644
--- a/pipeline/batch_plan.py
+++ b/pipeline/batch_plan.py
@@ -3,6 +3,7 @@ from __future__ import annotations
 import argparse
 import json
 import os
+import re
 from collections.abc import Mapping
 from pathlib import Path
 from typing import Any
@@ -394,6 +395,16 @@ def display_geocode_fill_report(report: Any) -> Any:
     return normalized


+def is_versioned_geocode_cache_path(value: Any) -> bool:
+    if not isinstance(value, str):
+        return False
+    try:
+        path = Path(value)
+    except (OSError, ValueError):
+        return False
+    return bool(re.search(r"_v[1-9][0-9]*$", path.stem))
+
+
 def default_universe_paths(
     mode: str,
     processed_dir: Path = PROCESSED_DIR,
@@ -469,6 +480,11 @@ def build_batch_plan(
         + int(geocode_fill.get("cache_successes") or 0)
         + int(geocode_fill.get("cache_failures") or 0)
     )
+    geocode_fill_cache_versioned = (
+        is_versioned_geocode_cache_path(geocode_fill.get("cache_db"))
+        if geocode_fill_complete
+        else None
+    )
     remaining_geocode_requests = 0 if geocode_fill_complete else needs_geocode
     wall_clock_seconds = float(remaining_geocode_requests) * float(onemap_delay_sec)

@@ -495,6 +511,11 @@ def build_batch_plan(
         warnings.append(
             f"{needs_geocode} source-derived postals remain unresolved after bounded OneMap geocode"
         )
+    if geocode_fill_cache_versioned is False:
+        blockers.append(
+            "completed bounded geocode fill used an unversioned cache path; "
+            "future bounded geocode fills must use a numeric-version cache artifact"
+        )
     api_environment = api_environment_readiness(environment)
     warnings.extend(api_environment["warnings"])

@@ -548,6 +569,7 @@ def build_batch_plan(
             "minimum_wall_clock_seconds": wall_clock_seconds,
             "minimum_wall_clock_human": format_duration(wall_clock_seconds),
             "completed_fill": geocode_fill_display if geocode_fill_complete else None,
+            "completed_fill_cache_versioned": geocode_fill_cache_versioned,
             "unresolved_after_bounded_geocode": needs_geocode if geocode_fill_complete else None,
         },
         "scoring_batch": {
diff --git a/tests/test_batch_plan.py b/tests/test_batch_plan.py
index c6f16c6..c15ac7c 100644
--- a/tests/test_batch_plan.py
+++ b/tests/test_batch_plan.py
@@ -465,6 +465,7 @@ def test_batch_plan_treats_completed_geocode_fill_remaining_rows_as_unresolved(
     assert ok, report
     assert report["bounded_geocoding"]["requests"] == 0
     assert report["bounded_geocoding"]["unresolved_after_bounded_geocode"] == 1
+    assert report["bounded_geocoding"]["completed_fill_cache_versioned"] is False
     assert report["bounded_geocoding"]["completed_fill"]["cache_db"] == r"raw\geocode_cache.db"
     assert report["bounded_geocoding"]["completed_fill"]["input"] == (
         r"processed\postal_universe_candidate_full_registered.parquet"
@@ -480,6 +481,10 @@ def test_batch_plan_treats_completed_geocode_fill_remaining_rows_as_unresolved(
     assert report["scoring_batch"]["would_emit_records"] == 3
     assert report["scoring_batch"]["would_emit_not_yet_scored"] == 1
     assert "1 source-derived postals remain unresolved" in report["warnings"][0]
+    assert any(
+        "completed bounded geocode fill used an unversioned cache path" in blocker
+        for blocker in report["checkpoint_gates"]["blockers"]
+    )
     assert report["api_environment"]["ready_for_api_collection"] is True
```

### Findings

1. Batch-plan previously normalized `C:\shiok\raw\geocode_cache.db` to `raw\geocode_cache.db` and kept treating the fill as completed without exposing that the cache artifact was unversioned.
2. The dry-run report now names the cache-version status as `completed_fill_cache_versioned` and adds a checkpoint blocker for completed fills backed by unversioned caches.

### Disagreements

1. None.
