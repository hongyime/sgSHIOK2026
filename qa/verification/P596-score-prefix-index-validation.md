# P596 Score Prefix Index Validation

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
qa/verification/P596-score-prefix-index-validation.md
```

## Diff stat

```text
 pipeline/export.py   | 18 ++++++++++++++++++
 tests/test_export.py | 17 +++++++++++++++++
 2 files changed, 35 insertions(+)
```

## Full diff

```diff
diff --git a/pipeline/export.py b/pipeline/export.py
index c81b236..9b9a36f 100644
--- a/pipeline/export.py
+++ b/pipeline/export.py
@@ -2219,6 +2219,8 @@ def validate_static_artifacts(
             if shard_index == len(score_items) or shard_index % 25 == 0:
                 mark(f"validated {shard_index}/{len(score_items)} score shards")
         mark(f"validated {len(indexed_postals)} indexed score records")
+    else:
+        score_index = {}
 
     manifest = None
     if manifest_path.is_file():
@@ -2236,6 +2238,22 @@ def validate_static_artifacts(
                     errors.append(f"{prefix_rel_path} must be an object")
                 else:
                     score_prefixes = len(prefix_payload)
+                    expected_prefix_index = score_prefix_index(
+                        {
+                            str(shard): [str(postal) for postal in postals]
+                            for shard, postals in score_index.items()
+                            if isinstance(postals, list)
+                        }
+                    )
+                    normalized_prefix_index = {
+                        str(prefix): [str(shard) for shard in shards]
+                        for prefix, shards in prefix_payload.items()
+                        if isinstance(shards, list)
+                    }
+                    if normalized_prefix_index != expected_prefix_index:
+                        errors.append(
+                            f"{prefix_rel_path} does not match scores/index.json prefixes"
+                        )
 
     geom_postals: set[str] = set()
     actual_geom_postal_index: dict[str, str] = {}
diff --git a/tests/test_export.py b/tests/test_export.py
index 4867a5f..ba333fd 100644
--- a/tests/test_export.py
+++ b/tests/test_export.py
@@ -313,6 +313,23 @@ def test_validate_accepts_gzipped_json_artifacts(tmp_path: Path):
     assert validation["geometry_postals_with_route_segments"] == 2
 
 
+def test_validate_rejects_stale_score_prefix_index(tmp_path: Path):
+    records = [sample_record("123456"), sample_record("654321")]
+    export_static_artifacts(records, output_dir=tmp_path)
+    prefix_index_path = tmp_path / "scores" / "prefix-index.json"
+    prefix_index = json.loads(prefix_index_path.read_text(encoding="utf-8"))
+    prefix_index["123"] = []
+    prefix_index["999"] = ["TEST_AREA"]
+    prefix_index_path.write_text(json.dumps(prefix_index), encoding="utf-8")
+
+    ok, validation = validate_static_artifacts(tmp_path)
+
+    assert not ok
+    assert validation["errors"] == [
+        "scores/prefix-index.json does not match scores/index.json prefixes"
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
uv run pytest tests/test_export.py::test_validate_rejects_stale_score_prefix_index -q
```

Output:

```text
.                                                                        [100%]
1 passed in 18.38s
```

## Export tests

Command:

```text
uv run pytest tests/test_export.py -q
```

Output:

```text
...................................................                      [100%]
51 passed in 301.90s (0:05:01)
```

## Test collection

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
452 tests collected in 51.32s
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
git check-ignore -v qa/verification/P596-score-prefix-index-validation.md; Write-Output "exit=$LASTEXITCODE"
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

1. `scores/prefix-index.json` is loaded by the browser before score-shard lookup, but static validation only checked that the manifest-referenced file existed and was an object.
2. Static validation now recomputes the expected prefix index from `scores/index.json` and rejects stale, missing, or extra prefix mappings.
3. Python collection increased from 451 to 452 because this pass added one focused export-validator regression test.

## Disagreements

1. None.
