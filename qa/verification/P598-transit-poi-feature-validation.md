# P598 Transit POI Feature Validation

## Root guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

No scoring, export, rescore, subset run, ingest, network build, upstream probe, input mutation, public-data write, protected QA mutation, deployment, or locked-weight change was performed.

Changed files:

```text
pipeline/export.py
tests/test_export.py
qa/verification/P598-transit-poi-feature-validation.md
```

## Diff stat

```text
 pipeline/export.py   | 21 +++++++++++++++++++++
 tests/test_export.py | 19 +++++++++++++++++++
 2 files changed, 40 insertions(+)
```

## Full diff

```diff
diff --git a/pipeline/export.py b/pipeline/export.py
index 919f269..605854a 100644
--- a/pipeline/export.py
+++ b/pipeline/export.py
@@ -2415,6 +2415,19 @@ def validate_static_artifacts(
                     )
                     if not isinstance(coordinates, list) or len(coordinates) < 2:
                         errors.append(f"transit/pois.json:{index}: missing coordinates")
+                    else:
+                        lon, lat = coordinates[0], coordinates[1]
+                        if not (
+                            isinstance(lon, int | float)
+                            and isinstance(lat, int | float)
+                            and math.isfinite(float(lon))
+                            and math.isfinite(float(lat))
+                            and 103.5 <= float(lon) <= 104.2
+                            and 1.1 <= float(lat) <= 1.6
+                        ):
+                            errors.append(
+                                f"transit/pois.json:{index}: coordinates outside Singapore bounds"
+                            )
                     if not isinstance(properties, dict) or properties.get("kind") not in {
                         "mrt_exit",
                         "mrt_station",
@@ -2423,6 +2436,14 @@ def validate_static_artifacts(
                         errors.append(f"transit/pois.json:{index}: invalid kind")
                     elif isinstance(properties.get("kind"), str):
                         transit_kind_counts[str(properties["kind"])] += 1
+                    if not isinstance(properties, dict) or not isinstance(
+                        properties.get("id"), str
+                    ) or not properties.get("id"):
+                        errors.append(f"transit/pois.json:{index}: missing id")
+                    if not isinstance(properties, dict) or not isinstance(
+                        properties.get("name"), str
+                    ) or not properties.get("name"):
+                        errors.append(f"transit/pois.json:{index}: missing name")
                 transit_counts = dict(sorted(transit_kind_counts.items()))
     if isinstance(manifest, dict):
         manifest_transit = manifest.get("transit")
diff --git a/tests/test_export.py b/tests/test_export.py
index efcfe5e..9e4be24 100644
--- a/tests/test_export.py
+++ b/tests/test_export.py
@@ -347,6 +347,25 @@ def test_validate_rejects_stale_transit_manifest_counts(tmp_path: Path):
     ]
 
 
+def test_validate_rejects_malformed_transit_poi_features(tmp_path: Path):
+    export_static_artifacts([sample_record("123456")], output_dir=tmp_path)
+    transit_path = tmp_path / "transit" / "pois.json"
+    transit = json.loads(transit_path.read_text(encoding="utf-8"))
+    transit["features"][0]["geometry"]["coordinates"] = [0, 0]
+    transit["features"][0]["properties"].pop("id")
+    transit["features"][0]["properties"]["name"] = ""
+    transit_path.write_text(json.dumps(transit), encoding="utf-8")
+
+    ok, validation = validate_static_artifacts(tmp_path)
+
+    assert not ok
+    assert validation["errors"] == [
+        "transit/pois.json:0: coordinates outside Singapore bounds",
+        "transit/pois.json:0: missing id",
+        "transit/pois.json:0: missing name",
+    ]
+
+
 def test_route_segments_split_disjoint_multiline_parts_without_fake_connector():
     segments = route_segment_geometries(
         [
```

## Focused test

Command:

```text
uv run pytest tests/test_export.py::test_validate_rejects_malformed_transit_poi_features -q
```

Output:

```text
.                                                                        [100%]
1 passed in 19.53s
```

## Export tests

Command:

```text
uv run pytest tests/test_export.py -q
```

Output:

```text
.....................................................                    [100%]
53 passed in 321.19s (0:05:21)
```

## Test collection

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
454 tests collected in 65.28s (0:01:05)
```

## Repository integrity

Command:

```text
python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
exit=0
```

## Evidence path ignore check

Command:

```text
git check-ignore -v qa/verification/P598-transit-poi-feature-validation.md; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
exit=1
```

## Protected path diff

Command:

```text
git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
exit=0
```

## Findings

1. `deriveNearestTransitCandidates()` drops POIs without a stable `properties.id`, but static validation previously accepted transit POI features without an id.
2. Static validation now rejects transit POIs with missing ids, missing names, or non-finite/out-of-Singapore point coordinates.
3. Python collection increased from 453 to 454 because this pass added one focused export-validator regression test.

## Disagreements

1. None.
