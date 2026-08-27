# P597 Transit Manifest Validation

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
qa/verification/P597-transit-manifest-validation.md
```

## Diff stat

```text
 pipeline/export.py   | 17 ++++++++++++++++-
 tests/test_export.py | 17 +++++++++++++++++
 2 files changed, 33 insertions(+), 1 deletion(-)
```

## Full diff

```diff
diff --git a/pipeline/export.py b/pipeline/export.py
index 9b9a36f..919f269 100644
--- a/pipeline/export.py
+++ b/pipeline/export.py
@@ -2138,11 +2138,13 @@ def validate_static_artifacts(
     score_index_path = artifact_json_path(input_dir, "scores/index.json")
     geom_index_path = artifact_json_path(input_dir, "geom/index.json")
     geom_postal_index_path = artifact_json_path(input_dir, "geom/postal-index.json")
+    transit_path = artifact_json_path(input_dir, "transit/pois.json")
     for rel_path, required in [
         ("manifest.json", manifest_path),
         ("scores/index.json", score_index_path),
         ("geom/index.json", geom_index_path),
         ("geom/postal-index.json", geom_postal_index_path),
+        ("transit/pois.json", transit_path),
     ]:
         if not required.is_file():
             errors.append(f"missing required file: {rel_path}")
@@ -2387,7 +2389,7 @@ def validate_static_artifacts(
         warnings.append(f"{len(extra_geom)} geometry postals are not in scores/index.json")
 
     transit_features = 0
-    transit_path = artifact_json_path(input_dir, "transit/pois.json")
+    transit_counts: dict[str, int] = {}
     if transit_path.is_file():
         mark("validating transit POI artifact")
         transit = read_artifact_json(input_dir, "transit/pois.json")
@@ -2399,6 +2401,7 @@ def validate_static_artifacts(
                 errors.append("transit/pois.json features must be a list")
             else:
                 transit_features = len(features)
+                transit_kind_counts: Counter[str] = Counter()
                 for index, feature in enumerate(features):
                     if not isinstance(feature, dict):
                         errors.append(f"transit/pois.json:{index}: feature must be an object")
@@ -2418,6 +2421,18 @@ def validate_static_artifacts(
                         "bus_stop",
                     }:
                         errors.append(f"transit/pois.json:{index}: invalid kind")
+                    elif isinstance(properties.get("kind"), str):
+                        transit_kind_counts[str(properties["kind"])] += 1
+                transit_counts = dict(sorted(transit_kind_counts.items()))
+    if isinstance(manifest, dict):
+        manifest_transit = manifest.get("transit")
+        if isinstance(manifest_transit, dict):
+            if manifest_transit.get("feature_count") != transit_features:
+                errors.append(
+                    "manifest transit.feature_count does not match transit/pois.json"
+                )
+            if manifest_transit.get("counts") != transit_counts:
+                errors.append("manifest transit.counts does not match transit/pois.json")
 
     report = {
         "input_dir": str(input_dir),
diff --git a/tests/test_export.py b/tests/test_export.py
index ba333fd..efcfe5e 100644
--- a/tests/test_export.py
+++ b/tests/test_export.py
@@ -330,6 +330,23 @@ def test_validate_rejects_stale_score_prefix_index(tmp_path: Path):
     ]
 
 
+def test_validate_rejects_stale_transit_manifest_counts(tmp_path: Path):
+    export_static_artifacts([sample_record("123456")], output_dir=tmp_path)
+    manifest_path = tmp_path / "manifest.json"
+    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
+    manifest["transit"]["feature_count"] = 999
+    manifest["transit"]["counts"] = {"bus_stop": 999}
+    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
+
+    ok, validation = validate_static_artifacts(tmp_path)
+
+    assert not ok
+    assert validation["errors"] == [
+        "manifest transit.feature_count does not match transit/pois.json",
+        "manifest transit.counts does not match transit/pois.json",
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
uv run pytest tests/test_export.py::test_validate_rejects_stale_transit_manifest_counts -q
```

Output:

```text
.                                                                        [100%]
1 passed in 65.65s (0:01:05)
```

## Export tests

Command:

```text
uv run pytest tests/test_export.py -q
```

Output:

```text
....................................................                     [100%]
52 passed in 304.80s (0:05:04)
```

## Test collection

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
453 tests collected in 16.44s
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
git check-ignore -v qa/verification/P597-transit-manifest-validation.md; Write-Output "exit=$LASTEXITCODE"
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

1. `transit/pois.json` is loaded by the browser for transit-stop picking, but static validation previously treated it as optional and did not compare manifest transit counts with the actual POI file.
2. Static validation now requires `transit/pois.json`, counts actual POI kinds, and rejects stale `manifest.transit.feature_count` or `manifest.transit.counts` metadata.
3. Python collection increased from 452 to 453 because this pass added one focused export-validator regression test.

## Disagreements

1. None.
