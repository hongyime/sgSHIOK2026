# P588 Route Option Shape Validation

Date: 2026-08-28
Machine: PRAWN-E14
Working root: C:\sgSHIOK2026

## Startup Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

Free-tier static export validation change only. No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data write, protected QA mutation, checksums mutation, deployment, or locked-weight change was performed.

## git diff --stat -- pipeline/export.py tests/test_export.py

```text
 pipeline/export.py   |  7 ++++++-
 tests/test_export.py | 53 ++++++++++++++++++++++++++++++++++++++++++++++++++++
 2 files changed, 59 insertions(+), 1 deletion(-)
```

## git diff -- pipeline/export.py tests/test_export.py

```diff
diff --git a/pipeline/export.py b/pipeline/export.py
index 5d57649..8ccaec3 100644
--- a/pipeline/export.py
+++ b/pipeline/export.py
@@ -2124,7 +2124,12 @@ def validate_static_artifacts(
                 route_options = record.get("route_options")
                 if isinstance(route_options, dict):
                     for key, option in route_options.items():
-                        if key == "best_transit" or not isinstance(option, dict):
+                        option_context = f"scores/{area}.json:{postal}:route_options.{key}"
+                        if not isinstance(option, dict):
+                            errors.append(f"{option_context}: record must be an object")
+                            continue
+                        validate_score_record(option, errors, option_context)
+                        if key == "best_transit":
                             continue
                         if option.get("paths") is not None:
                             route_options_with_geom_required[postal].add(str(key))
diff --git a/tests/test_export.py b/tests/test_export.py
index de804c1..4752e0b 100644
--- a/tests/test_export.py
+++ b/tests/test_export.py
@@ -604,6 +604,59 @@ def test_validate_requires_geometry_for_switchable_route_options(tmp_path: Path)
     ]
 
 
+def test_validate_rejects_incomplete_switchable_route_options(tmp_path: Path):
+    record = sample_record("560238")
+    record["route_options"] = {
+        "best_transit": {
+            "state": "SCORED",
+            "total": record["total"],
+            "subscores": record["subscores"],
+            "best_node": record["best_node"],
+            "paths": record["paths"],
+            "exposure_gaps": record["exposure_gaps"],
+        },
+        "mrt_lrt": {
+            "state": "SCORED",
+            "total": 75.0,
+            "subscores": record["subscores"],
+            "best_node": {"type": "mrt_lrt_exit", "name": "MRT Option", "routed_m": 390.0},
+            "paths": {
+                "shortest_m": 390.0,
+                "sheltered_m": 430.0,
+                "covered_ratio": 0.55,
+                "detour_pct": 10.3,
+            },
+            "exposure_gaps": None,
+        },
+        "bus": {
+            "state": "SCORED",
+            "total": 62.0,
+            "subscores": record["subscores"],
+            "best_node": None,
+            "paths": {
+                "shortest_m": 420.0,
+                "sheltered_m": 470.0,
+                "covered_ratio": 0.51,
+                "detour_pct": 11.9,
+            },
+            "exposure_gaps": [],
+        },
+    }
+    record["_geometry_options"] = {
+        "mrt_lrt": record["_geometry"],
+        "bus": record["_geometry"],
+    }
+
+    export_static_artifacts([record], output_dir=tmp_path)
+    ok, validation = validate_static_artifacts(tmp_path)
+
+    assert not ok
+    assert validation["errors"] == [
+        "scores/TEST_AREA.json:560238:route_options.bus: best_node missing for SCORED",
+        "scores/TEST_AREA.json:560238:route_options.mrt_lrt: exposure_gaps missing for SCORED",
+    ]
+
+
 def test_refresh_score_provenance_manifest_preserves_candidates_field(tmp_path: Path):
     export_static_artifacts([sample_record_with_candidates("560234")], output_dir=tmp_path)
     scores_dir = tmp_path / "scores"
```

## Focused Tests

Command:

```text
uv run pytest tests/test_export.py::test_validate_rejects_incomplete_switchable_route_options tests/test_export.py::test_validate_requires_geometry_for_switchable_route_options -q
```

Output:

```text
..                                                                       [100%]
2 passed in 93.99s (0:01:33)
```

## Full Export Tests

Command:

```text
uv run pytest tests/test_export.py -q
```

Output:

```text
............................................                             [100%]
44 passed in 216.94s (0:03:36)
```

## Python Collection Count

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
445 tests collected in 43.58s
```

## Repository Integrity

Command:

```text
python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
exit=0
```

## Evidence Ignore Check

Command:

```text
git check-ignore -v qa/verification/P588-route-option-shape-validation.md; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
exit=1
```

## Protected Path Diff Check

Command:

```text
git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
exit=0
```

## FINDINGS

1. Static validation enforced complete top-level score-record shape and route-option geometry presence, but did not validate the internal shape of each route option.
2. A switchable route option could advertise `paths` while omitting its own `best_node` or `exposure_gaps`; the browser `RouteOption` type expects those fields to be present or explicitly null according to state.
3. `validate_static_artifacts()` now validates each route option with the same state/field rules used for top-level score records before checking non-best geometry references.
4. Python collection moved from 444 to 445 because this phase added one export regression test.

## DISAGREEMENTS

1. None.
