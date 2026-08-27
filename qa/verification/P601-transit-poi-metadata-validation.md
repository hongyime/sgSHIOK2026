# P601 Transit POI Metadata Validation

## Scope

Free-tier static export validator change only. No scoring, export CLI run, rescore, ingest, or network build was run.

## Root Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Read-Only Public Artifact Check

```text
path=C:\sgSHIOK2026\web\public\data\generated_20260805_prefer_scored_routed\transit\pois.json
feature_count=6011
counts={"bus_stop": 5208, "mrt_exit": 613, "mrt_station": 190}
missing_required_metadata_count=0
```

## Change

`validate_static_artifacts()` now rejects transit POIs with missing kind-specific browser metadata:

- `bus_stop` must include a non-empty `code`.
- `mrt_exit` must include non-empty `station` and `exit`.
- `mrt_station` must include a positive `exit_count`.

These fields are produced by `build_transit_poi_collection()` and are used by browser candidate labels, map popups, and best-stop resolution.

## Diff

```diff
diff --git a/pipeline/export.py b/pipeline/export.py
index b9da982..75e9025 100644
--- a/pipeline/export.py
+++ b/pipeline/export.py
@@ -2458,6 +2458,25 @@ def validate_static_artifacts(
                                 f"transit/pois.json:{index}: id {poi_id!r} "
                                 f"does not match kind {kind!r}"
                             )
+                        if kind == "bus_stop" and (
+                            not isinstance(properties.get("code"), str)
+                            or not properties.get("code")
+                        ):
+                            errors.append(f"transit/pois.json:{index}: missing bus code")
+                        if kind == "mrt_exit":
+                            for field in ("station", "exit"):
+                                if (
+                                    not isinstance(properties.get(field), str)
+                                    or not properties.get(field)
+                                ):
+                                    errors.append(
+                                        f"transit/pois.json:{index}: missing MRT {field}"
+                                    )
+                        if kind == "mrt_station" and not (
+                            isinstance(properties.get("exit_count"), int)
+                            and properties.get("exit_count") > 0
+                        ):
+                            errors.append(f"transit/pois.json:{index}: missing exit_count")
                         if poi_id in transit_ids:
                             errors.append(
                                 f"transit/pois.json:{index}: duplicate id {poi_id!r} "
diff --git a/tests/test_export.py b/tests/test_export.py
index 31d607e..701ce4c 100644
--- a/tests/test_export.py
+++ b/tests/test_export.py
@@ -403,6 +403,34 @@ def test_validate_rejects_transit_poi_id_kind_mismatch(tmp_path: Path):
     ]
 
 
+def test_validate_rejects_transit_poi_kind_metadata_mismatch(tmp_path: Path):
+    export_static_artifacts([sample_record("123456")], output_dir=tmp_path)
+    transit_path = tmp_path / "transit" / "pois.json"
+    transit = json.loads(transit_path.read_text(encoding="utf-8"))
+    index_by_kind = {
+        feature["properties"]["kind"]: index
+        for index, feature in enumerate(transit["features"])
+    }
+    bus_index = index_by_kind["bus_stop"]
+    mrt_exit_index = index_by_kind["mrt_exit"]
+    station_index = index_by_kind["mrt_station"]
+    transit["features"][bus_index]["properties"]["code"] = ""
+    transit["features"][mrt_exit_index]["properties"]["station"] = ""
+    transit["features"][mrt_exit_index]["properties"]["exit"] = ""
+    transit["features"][station_index]["properties"]["exit_count"] = 0
+    transit_path.write_text(json.dumps(transit), encoding="utf-8")
+
+    ok, validation = validate_static_artifacts(tmp_path)
+
+    assert not ok
+    assert validation["errors"] == [
+        f"transit/pois.json:{bus_index}: missing bus code",
+        f"transit/pois.json:{mrt_exit_index}: missing MRT station",
+        f"transit/pois.json:{mrt_exit_index}: missing MRT exit",
+        f"transit/pois.json:{station_index}: missing exit_count",
+    ]
+
+
 def test_route_segments_split_disjoint_multiline_parts_without_fake_connector():
     segments = route_segment_geometries(
         [
```

## Verification

```text
> uv run pytest tests/test_export.py::test_validate_rejects_transit_poi_kind_metadata_mismatch -q
.                                                                        [100%]
1 passed in 17.65s
```

```text
> uv run pytest tests/test_export.py -q
........................................................                 [100%]
56 passed in 348.29s (0:05:48)
```

```text
> uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 20.73s
```

```text
> python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

```text
> git check-ignore -v qa/verification/P601-transit-poi-metadata-validation.md; Write-Output "exit=$LASTEXITCODE"
exit=1
```

```text
> git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4; Write-Output "exit=$LASTEXITCODE"
exit=0
```

## FINDINGS

1. The current protected public transit POI artifact already satisfies the new metadata rule: 6,011 POIs checked, zero missing required kind-specific metadata.
2. Static validation now catches stale or malformed transit POI metadata that would weaken browser candidate labels, popups, or best-stop matching without changing score values.
3. The Python collection count moved from 456 to 457 because this change adds one focused export validator regression.

## DISAGREEMENTS

1. None.
