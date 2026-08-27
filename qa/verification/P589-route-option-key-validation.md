# P589 Route Option Key Validation

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
 pipeline/export.py   |  9 +++++++++
 tests/test_export.py | 37 +++++++++++++++++++++++++++++++++++++
 2 files changed, 46 insertions(+)
```

## git diff -- pipeline/export.py tests/test_export.py

```diff
diff --git a/pipeline/export.py b/pipeline/export.py
index 8ccaec3..7045545 100644
--- a/pipeline/export.py
+++ b/pipeline/export.py
@@ -48,6 +48,7 @@ MAX_FILE_BYTES = 5 * 1024 * 1024
 GEOM_PROMOTION_THRESHOLD_BYTES = int(MAX_FILE_BYTES * 0.9)
 GEOM_MAX_PROMOTION_RESOLUTION = 12
 VALID_STATES = {"SCORED", "SCORED_PARTIAL", NOT_YET_SCORED, NO_TRANSIT_IN_RANGE}
+VALID_ROUTE_OPTION_KEYS = {"best_transit", "mrt_lrt", "bus"}
 TRANSIT_SOURCE_KEYS = (
     "mrt_lrt_exits",
     "train_station_codes",
@@ -2125,6 +2126,8 @@ def validate_static_artifacts(
                 if isinstance(route_options, dict):
                     for key, option in route_options.items():
                         option_context = f"scores/{area}.json:{postal}:route_options.{key}"
+                        if key not in VALID_ROUTE_OPTION_KEYS:
+                            errors.append(f"{option_context}: invalid route option key")
                         if not isinstance(option, dict):
                             errors.append(f"{option_context}: record must be an object")
                             continue
@@ -2201,6 +2204,12 @@ def validate_static_artifacts(
                         geom_postals_with_route_segments.add(postal)
                 route_options = item.get("route_options")
                 if isinstance(route_options, dict):
+                    for key in route_options:
+                        if key not in VALID_ROUTE_OPTION_KEYS:
+                            errors.append(
+                                f"geom/h3/{target_cell}.json:{postal}:route_options.{key}: "
+                                "invalid route option key"
+                            )
                     geom_route_options[postal].update(str(key) for key in route_options)
             if shard_index == len(geom_targets) or shard_index % 250 == 0:
                 mark(f"validated {shard_index}/{len(geom_targets)} geometry shards")
diff --git a/tests/test_export.py b/tests/test_export.py
index 4752e0b..0be8082 100644
--- a/tests/test_export.py
+++ b/tests/test_export.py
@@ -657,6 +657,43 @@ def test_validate_rejects_incomplete_switchable_route_options(tmp_path: Path):
     ]
 
 
+def test_validate_rejects_unknown_route_option_keys(tmp_path: Path):
+    record = sample_record("560239")
+    record["route_options"] = {
+        "best_transit": {
+            "state": "SCORED",
+            "total": record["total"],
+            "subscores": record["subscores"],
+            "best_node": record["best_node"],
+            "paths": record["paths"],
+            "exposure_gaps": record["exposure_gaps"],
+        },
+        "taxi": {
+            "state": "SCORED",
+            "total": 68.0,
+            "subscores": record["subscores"],
+            "best_node": {"type": "taxi_stand", "name": "Taxi Option", "routed_m": 360.0},
+            "paths": {
+                "shortest_m": 360.0,
+                "sheltered_m": 390.0,
+                "covered_ratio": 0.57,
+                "detour_pct": 8.3,
+            },
+            "exposure_gaps": [],
+        },
+    }
+    record["_geometry_options"] = {"taxi": record["_geometry"]}
+
+    export_static_artifacts([record], output_dir=tmp_path)
+    ok, validation = validate_static_artifacts(tmp_path)
+
+    assert not ok
+    assert validation["errors"] == [
+        "scores/TEST_AREA.json:560239:route_options.taxi: invalid route option key",
+        "geom/h3/886520d835fffff.json:560239:route_options.taxi: invalid route option key",
+    ]
+
+
 def test_refresh_score_provenance_manifest_preserves_candidates_field(tmp_path: Path):
     export_static_artifacts([sample_record_with_candidates("560234")], output_dir=tmp_path)
     scores_dir = tmp_path / "scores"
```

## Focused Test

Command:

```text
uv run pytest tests/test_export.py::test_validate_rejects_unknown_route_option_keys -q
```

Output:

```text
.                                                                        [100%]
1 passed in 50.99s
```

## Full Export Tests

Command:

```text
uv run pytest tests/test_export.py -q
```

Output:

```text
.............................................                            [100%]
45 passed in 345.76s (0:05:45)
```

## Python Collection Count

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
446 tests collected in 80.48s (0:01:20)
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
git check-ignore -v qa/verification/P589-route-option-key-validation.md; Write-Output "exit=$LASTEXITCODE"
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

1. The manifest and browser type define route-option keys as `best_transit`, `mrt_lrt`, and `bus`, but static validation previously accepted any score-shard or geom-shard route-option key.
2. `validate_static_artifacts()` now rejects unknown route-option keys in both score shards and geometry shards.
3. Python collection moved from 445 to 446 because this phase added one export regression test.

## DISAGREEMENTS

1. None.
