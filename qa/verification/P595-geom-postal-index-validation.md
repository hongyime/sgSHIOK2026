# P595 Geom Postal Index Validation

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
qa/verification/P595-geom-postal-index-validation.md
```

## Diff stat

```text
 pipeline/export.py   | 30 ++++++++++++++++++++++++++++++
 tests/test_export.py | 18 ++++++++++++++++++
 2 files changed, 48 insertions(+)
```

## Full diff

```diff
diff --git a/pipeline/export.py b/pipeline/export.py
index adf09df..c81b236 100644
--- a/pipeline/export.py
+++ b/pipeline/export.py
@@ -2137,10 +2137,12 @@ def validate_static_artifacts(
     manifest_path = artifact_json_path(input_dir, "manifest.json")
     score_index_path = artifact_json_path(input_dir, "scores/index.json")
     geom_index_path = artifact_json_path(input_dir, "geom/index.json")
+    geom_postal_index_path = artifact_json_path(input_dir, "geom/postal-index.json")
     for rel_path, required in [
         ("manifest.json", manifest_path),
         ("scores/index.json", score_index_path),
         ("geom/index.json", geom_index_path),
+        ("geom/postal-index.json", geom_postal_index_path),
     ]:
         if not required.is_file():
             errors.append(f"missing required file: {rel_path}")
@@ -2236,6 +2238,7 @@ def validate_static_artifacts(
                     score_prefixes = len(prefix_payload)
 
     geom_postals: set[str] = set()
+    actual_geom_postal_index: dict[str, str] = {}
     geom_postals_with_route_segments: set[str] = set()
     geom_route_options: dict[str, set[str]] = defaultdict(set)
     geom_candidates: dict[str, set[str]] = defaultdict(set)
@@ -2270,6 +2273,13 @@ def validate_static_artifacts(
                     continue
                 postal = str(item.get("postal"))
                 geom_postals.add(postal)
+                existing_shard = actual_geom_postal_index.get(postal)
+                if existing_shard is not None and existing_shard != target_cell:
+                    errors.append(
+                        f"geom postal {postal} appears in multiple shards: "
+                        f"{existing_shard}, {target_cell}"
+                    )
+                actual_geom_postal_index[postal] = str(target_cell)
                 for key in ["shortest", "sheltered", "exposure_gaps"]:
                     if key not in item:
                         errors.append(f"geom/h3/{target_cell}.json:{postal}: missing {key}")
@@ -2319,6 +2329,26 @@ def validate_static_artifacts(
                 mark(f"validated {shard_index}/{len(geom_targets)} geometry shards")
         mark(f"validated {len(geom_postals)} geometry records")
 
+    if geom_postal_index_path.is_file():
+        postal_index_payload = read_artifact_json(input_dir, "geom/postal-index.json")
+        if not isinstance(postal_index_payload, dict):
+            errors.append("geom/postal-index.json must be an object")
+        else:
+            postal_index_lookup = {
+                str(postal): str(shard) for postal, shard in postal_index_payload.items()
+            }
+            for postal, expected_shard in sorted(actual_geom_postal_index.items()):
+                indexed_shard = postal_index_lookup.get(postal)
+                if indexed_shard is None:
+                    errors.append(f"geom/postal-index.json missing postal: {postal}")
+                elif indexed_shard != expected_shard:
+                    errors.append(
+                        f"geom/postal-index.json:{postal}: expected shard "
+                        f"{expected_shard}, got {indexed_shard}"
+                    )
+            for postal in sorted(set(postal_index_lookup) - set(actual_geom_postal_index)):
+                errors.append(f"geom/postal-index.json:{postal}: postal not present in geom shards")
+
     missing_geom = postals_with_geom_required - geom_postals
     if missing_geom:
         errors.append(f"{len(missing_geom)} records requiring geometry missing geometry shards")
diff --git a/tests/test_export.py b/tests/test_export.py
index a0d4cf8..4867a5f 100644
--- a/tests/test_export.py
+++ b/tests/test_export.py
@@ -841,6 +841,24 @@ def test_validate_rejects_incomplete_geom_route_options(tmp_path: Path):
     ]
 
 
+def test_validate_rejects_stale_geom_postal_index(tmp_path: Path):
+    export_static_artifacts([sample_record("560244")], output_dir=tmp_path)
+    postal_index_path = tmp_path / "geom" / "postal-index.json"
+    postal_index = json.loads(postal_index_path.read_text(encoding="utf-8"))
+    expected_shard = postal_index["560244"]
+    postal_index["560244"] = "886520d835ffff0"
+    postal_index["999999"] = expected_shard
+    postal_index_path.write_text(json.dumps(postal_index), encoding="utf-8")
+
+    ok, validation = validate_static_artifacts(tmp_path)
+
+    assert not ok
+    assert validation["errors"] == [
+        f"geom/postal-index.json:560244: expected shard {expected_shard}, got 886520d835ffff0",
+        "geom/postal-index.json:999999: postal not present in geom shards",
+    ]
+
+
 def test_refresh_score_provenance_manifest_preserves_candidates_field(tmp_path: Path):
     export_static_artifacts([sample_record_with_candidates("560234")], output_dir=tmp_path)
     scores_dir = tmp_path / "scores"
```

## Focused test

Command:

```text
uv run pytest tests/test_export.py::test_validate_rejects_stale_geom_postal_index -q
```

Output:

```text
.                                                                        [100%]
1 passed in 23.87s
```

## Export tests

Command:

```text
uv run pytest tests/test_export.py -q
```

Output:

```text
..................................................                       [100%]
50 passed in 298.05s (0:04:58)
```

## Test collection

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
451 tests collected in 17.92s
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
git check-ignore -v qa/verification/P595-geom-postal-index-validation.md; Write-Output "exit=$LASTEXITCODE"
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

1. `geom/postal-index.json` is the browser lookup table from postal code to geometry shard, but static validation only required the file and did not prove its entries matched the geometry shards scanned through `geom/index.json`.
2. Static validation now rejects stale postal-index entries, wrong postal-to-shard mappings, missing postal-index entries for real geometry records, and duplicated geometry postals split across shards.
3. Python collection increased from 450 to 451 because this pass added one focused export-validator regression test.

## Disagreements

1. None.
