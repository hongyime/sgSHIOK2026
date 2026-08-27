# P590 Geom Route Option Shape Validation

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
 pipeline/export.py   | 14 +++++++++++++-
 tests/test_export.py | 44 ++++++++++++++++++++++++++++++++++++++++++++
 2 files changed, 57 insertions(+), 1 deletion(-)
```

## git diff -- pipeline/export.py tests/test_export.py

```diff
diff --git a/pipeline/export.py b/pipeline/export.py
index 7045545..33a4ae2 100644
--- a/pipeline/export.py
+++ b/pipeline/export.py
@@ -2204,12 +2204,24 @@ def validate_static_artifacts(
                         geom_postals_with_route_segments.add(postal)
                 route_options = item.get("route_options")
                 if isinstance(route_options, dict):
-                    for key in route_options:
+                    for key, option in route_options.items():
                         if key not in VALID_ROUTE_OPTION_KEYS:
                             errors.append(
                                 f"geom/h3/{target_cell}.json:{postal}:route_options.{key}: "
                                 "invalid route option key"
                             )
+                        if not isinstance(option, dict):
+                            errors.append(
+                                f"geom/h3/{target_cell}.json:{postal}:route_options.{key}: "
+                                "record must be an object"
+                            )
+                            continue
+                        for required_key in ["shortest", "sheltered", "exposure_gaps"]:
+                            if required_key not in option:
+                                errors.append(
+                                    f"geom/h3/{target_cell}.json:{postal}:route_options.{key}: "
+                                    f"missing {required_key}"
+                                )
                     geom_route_options[postal].update(str(key) for key in route_options)
             if shard_index == len(geom_targets) or shard_index % 250 == 0:
                 mark(f"validated {shard_index}/{len(geom_targets)} geometry shards")
diff --git a/tests/test_export.py b/tests/test_export.py
index 0be8082..a7f1877 100644
--- a/tests/test_export.py
+++ b/tests/test_export.py
@@ -694,6 +694,50 @@ def test_validate_rejects_unknown_route_option_keys(tmp_path: Path):
     ]
 
 
+def test_validate_rejects_incomplete_geom_route_options(tmp_path: Path):
+    record = sample_record("560240")
+    record["route_options"] = {
+        "best_transit": {
+            "state": "SCORED",
+            "total": record["total"],
+            "subscores": record["subscores"],
+            "best_node": record["best_node"],
+            "paths": record["paths"],
+            "exposure_gaps": record["exposure_gaps"],
+        },
+        "bus": {
+            "state": "SCORED",
+            "total": 62.0,
+            "subscores": record["subscores"],
+            "best_node": {"type": "bus_stop", "name": "Bus Option", "routed_m": 420.0},
+            "paths": {
+                "shortest_m": 420.0,
+                "sheltered_m": 470.0,
+                "covered_ratio": 0.51,
+                "detour_pct": 11.9,
+            },
+            "exposure_gaps": [],
+        },
+    }
+    record["_geometry_options"] = {"bus": record["_geometry"]}
+
+    export_static_artifacts([record], output_dir=tmp_path)
+    postal_index = json.loads((tmp_path / "geom" / "postal-index.json").read_text())
+    shard_path = tmp_path / "geom" / "h3" / f"{postal_index['560240']}.json"
+    geom_payload = json.loads(shard_path.read_text(encoding="utf-8"))
+    geom_payload[0]["route_options"]["bus"].pop("sheltered")
+    geom_payload[0]["route_options"]["bus"].pop("exposure_gaps")
+    shard_path.write_text(json.dumps(geom_payload), encoding="utf-8")
+
+    ok, validation = validate_static_artifacts(tmp_path)
+
+    assert not ok
+    assert validation["errors"] == [
+        "geom/h3/886520d835fffff.json:560240:route_options.bus: missing sheltered",
+        "geom/h3/886520d835fffff.json:560240:route_options.bus: missing exposure_gaps",
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
uv run pytest tests/test_export.py::test_validate_rejects_incomplete_geom_route_options -q
```

Output:

```text
.                                                                        [100%]
1 passed in 57.62s
```

## Full Export Tests

Command:

```text
uv run pytest tests/test_export.py -q
```

Output:

```text
..............................................                           [100%]
46 passed in 319.60s (0:05:19)
```

## Python Collection Count

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
447 tests collected in 19.36s
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
git check-ignore -v qa/verification/P590-geom-route-option-shape-validation.md; Write-Output "exit=$LASTEXITCODE"
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

1. Static validation checked top-level geom records for `shortest`, `sheltered`, and `exposure_gaps`, but did not check the same required fields inside `geom.route_options`.
2. The browser `PostalRouteGeomOption` contract requires `shortest`, `sheltered`, and `exposure_gaps`; malformed route-option geometry could previously pass static validation once the option key existed.
3. `validate_static_artifacts()` now rejects non-object geometry route options and missing required geometry fields for each route option.
4. Python collection moved from 446 to 447 because this phase added one export regression test.

## DISAGREEMENTS

1. None.
