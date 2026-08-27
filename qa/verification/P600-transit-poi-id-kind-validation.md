# P600 Transit POI ID Kind Validation

## Scope

Free-tier static export validator change only. No scoring, export CLI run, rescore, ingest, or network build was run.

## Root Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Change

`validate_static_artifacts()` now rejects `transit/pois.json` features whose `properties.id` namespace does not match `properties.kind`:

- `bus_stop` -> `bus:`
- `mrt_exit` -> `mrt:`
- `mrt_station` -> `station:`

This extends the existing static checks for malformed transit POI features and duplicate POI ids.

## Diff

```diff
diff --git a/pipeline/export.py b/pipeline/export.py
index a19e180..b9da982 100644
--- a/pipeline/export.py
+++ b/pipeline/export.py
@@ -2443,6 +2443,21 @@ def validate_static_artifacts(
                         errors.append(f"transit/pois.json:{index}: missing id")
                     elif isinstance(properties.get("id"), str):
                         poi_id = str(properties["id"])
+                        kind = (
+                            properties.get("kind") if isinstance(properties, dict) else None
+                        )
+                        expected_prefixes = {
+                            "bus_stop": "bus:",
+                            "mrt_exit": "mrt:",
+                            "mrt_station": "station:",
+                        }
+                        if isinstance(kind, str) and not poi_id.startswith(
+                            expected_prefixes.get(kind, "\0")
+                        ):
+                            errors.append(
+                                f"transit/pois.json:{index}: id {poi_id!r} "
+                                f"does not match kind {kind!r}"
+                            )
                         if poi_id in transit_ids:
                             errors.append(
                                 f"transit/pois.json:{index}: duplicate id {poi_id!r} "
diff --git a/tests/test_export.py b/tests/test_export.py
index e5019e0..31d607e 100644
--- a/tests/test_export.py
+++ b/tests/test_export.py
@@ -382,6 +382,27 @@ def test_validate_rejects_duplicate_transit_poi_ids(tmp_path: Path):
     ]
 
 
+def test_validate_rejects_transit_poi_id_kind_mismatch(tmp_path: Path):
+    export_static_artifacts([sample_record("123456")], output_dir=tmp_path)
+    transit_path = tmp_path / "transit" / "pois.json"
+    transit = json.loads(transit_path.read_text(encoding="utf-8"))
+    kind = transit["features"][0]["properties"]["kind"]
+    bad_id = {
+        "bus_stop": "mrt:wrong",
+        "mrt_exit": "bus:wrong",
+        "mrt_station": "bus:wrong",
+    }[kind]
+    transit["features"][0]["properties"]["id"] = bad_id
+    transit_path.write_text(json.dumps(transit), encoding="utf-8")
+
+    ok, validation = validate_static_artifacts(tmp_path)
+
+    assert not ok
+    assert validation["errors"] == [
+        f"transit/pois.json:0: id {bad_id!r} does not match kind {kind!r}"
+    ]
+
+
 def test_route_segments_split_disjoint_multiline_parts_without_fake_connector():
     segments = route_segment_geometries(
         [
```

## Verification

```text
> uv run pytest tests/test_export.py::test_validate_rejects_transit_poi_id_kind_mismatch -q
.                                                                        [100%]
1 passed in 19.54s
```

```text
> uv run pytest tests/test_export.py -q
.......................................................                  [100%]
55 passed in 295.19s (0:04:55)
```

```text
> uv run pytest -q --collect-only | Select-Object -Last 1
456 tests collected in 31.28s
```

```text
> python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

```text
> git check-ignore -v qa/verification/P600-transit-poi-id-kind-validation.md; Write-Output "exit=$LASTEXITCODE"
exit=1
```

```text
> git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4; Write-Output "exit=$LASTEXITCODE"
exit=0
```

## FINDINGS

1. `transit/pois.json` now has static coverage for an id/kind mismatch that would otherwise leave browser-facing POI identity in the wrong namespace.
2. The Python collection count moved from 455 to 456 because this change adds one focused export validator regression.
3. The protected paths remained unchanged, including `pipeline/config/weights.yaml`, `checksums.json`, `web/public/data/`, and the protected QA evidence directories.

## DISAGREEMENTS

1. None.
