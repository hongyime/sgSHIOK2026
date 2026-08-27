# P599 Transit POI ID Validation

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
qa/verification/P599-transit-poi-id-validation.md
```

## Diff stat

```text
 pipeline/export.py   | 10 ++++++++++
 tests/test_export.py | 16 ++++++++++++++++
 2 files changed, 26 insertions(+)
```

## Full diff

```diff
diff --git a/pipeline/export.py b/pipeline/export.py
index 605854a..a19e180 100644
--- a/pipeline/export.py
+++ b/pipeline/export.py
@@ -2402,6 +2402,7 @@ def validate_static_artifacts(
             else:
                 transit_features = len(features)
                 transit_kind_counts: Counter[str] = Counter()
+                transit_ids: dict[str, int] = {}
                 for index, feature in enumerate(features):
                     if not isinstance(feature, dict):
                         errors.append(f"transit/pois.json:{index}: feature must be an object")
@@ -2440,6 +2441,15 @@ def validate_static_artifacts(
                         properties.get("id"), str
                     ) or not properties.get("id"):
                         errors.append(f"transit/pois.json:{index}: missing id")
+                    elif isinstance(properties.get("id"), str):
+                        poi_id = str(properties["id"])
+                        if poi_id in transit_ids:
+                            errors.append(
+                                f"transit/pois.json:{index}: duplicate id {poi_id!r} "
+                                f"(first seen at {transit_ids[poi_id]})"
+                            )
+                        else:
+                            transit_ids[poi_id] = index
                     if not isinstance(properties, dict) or not isinstance(
                         properties.get("name"), str
                     ) or not properties.get("name"):
diff --git a/tests/test_export.py b/tests/test_export.py
index 9e4be24..e5019e0 100644
--- a/tests/test_export.py
+++ b/tests/test_export.py
@@ -366,6 +366,22 @@ def test_validate_rejects_malformed_transit_poi_features(tmp_path: Path):
     ]
 
 
+def test_validate_rejects_duplicate_transit_poi_ids(tmp_path: Path):
+    export_static_artifacts([sample_record("123456")], output_dir=tmp_path)
+    transit_path = tmp_path / "transit" / "pois.json"
+    transit = json.loads(transit_path.read_text(encoding="utf-8"))
+    duplicate_id = transit["features"][0]["properties"]["id"]
+    transit["features"][1]["properties"]["id"] = duplicate_id
+    transit_path.write_text(json.dumps(transit), encoding="utf-8")
+
+    ok, validation = validate_static_artifacts(tmp_path)
+
+    assert not ok
+    assert validation["errors"] == [
+        f"transit/pois.json:1: duplicate id {duplicate_id!r} (first seen at 0)"
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
uv run pytest tests/test_export.py::test_validate_rejects_duplicate_transit_poi_ids -q
```

Output:

```text
.                                                                        [100%]
1 passed in 36.60s
```

## Export tests

Command:

```text
uv run pytest tests/test_export.py -q
```

Output:

```text
......................................................                   [100%]
54 passed in 347.29s (0:05:47)
```

## Test collection

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
455 tests collected in 84.11s (0:01:24)
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
git check-ignore -v qa/verification/P599-transit-poi-id-validation.md; Write-Output "exit=$LASTEXITCODE"
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

1. `deriveNearestTransitCandidates()` de-duplicates transit POIs by id, so duplicate POI ids can silently hide a bus stop or MRT exit from the picker.
2. Static validation now rejects duplicate `transit/pois.json` ids and reports both the duplicate feature index and the first-seen index.
3. Python collection increased from 454 to 455 because this pass added one focused export-validator regression test.

## Disagreements

1. None.
