# P591 Candidate Geometry Shape Validation

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
 pipeline/export.py   | 12 ++++++++++++
 tests/test_export.py | 18 ++++++++++++++++++
 2 files changed, 30 insertions(+)
```

## git diff -- pipeline/export.py tests/test_export.py

```diff
diff --git a/pipeline/export.py b/pipeline/export.py
index 33a4ae2..3f03390 100644
--- a/pipeline/export.py
+++ b/pipeline/export.py
@@ -2223,6 +2223,18 @@ def validate_static_artifacts(
                                     f"missing {required_key}"
                                 )
                     geom_route_options[postal].update(str(key) for key in route_options)
+                candidates = item.get("candidates")
+                if isinstance(candidates, dict):
+                    for node_id, candidate in candidates.items():
+                        candidate_context = (
+                            f"geom/h3/{target_cell}.json:{postal}:candidates.{node_id}"
+                        )
+                        if not isinstance(candidate, dict):
+                            errors.append(f"{candidate_context}: record must be an object")
+                            continue
+                        for required_key in ["shortest", "sheltered", "exposure_gaps"]:
+                            if required_key not in candidate:
+                                errors.append(f"{candidate_context}: missing {required_key}")
             if shard_index == len(geom_targets) or shard_index % 250 == 0:
                 mark(f"validated {shard_index}/{len(geom_targets)} geometry shards")
         mark(f"validated {len(geom_postals)} geometry records")
diff --git a/tests/test_export.py b/tests/test_export.py
index a7f1877..f00bc0c 100644
--- a/tests/test_export.py
+++ b/tests/test_export.py
@@ -486,6 +486,24 @@ def test_export_static_artifacts_writes_candidates_into_score_and_geom_shards(tm
     assert "postal" not in entry["candidates"]["bus:66361"]
 
 
+def test_validate_rejects_incomplete_candidate_geometry(tmp_path: Path):
+    export_static_artifacts([sample_record_with_candidates("560241")], output_dir=tmp_path)
+    postal_index = json.loads((tmp_path / "geom" / "postal-index.json").read_text())
+    shard_path = tmp_path / "geom" / "h3" / f"{postal_index['560241']}.json"
+    geom_payload = json.loads(shard_path.read_text(encoding="utf-8"))
+    geom_payload[0]["candidates"]["bus:66361"].pop("shortest")
+    geom_payload[0]["candidates"]["bus:66361"].pop("exposure_gaps")
+    shard_path.write_text(json.dumps(geom_payload), encoding="utf-8")
+
+    ok, validation = validate_static_artifacts(tmp_path)
+
+    assert not ok
+    assert validation["errors"] == [
+        "geom/h3/886520d835fffff.json:560241:candidates.bus:66361: missing shortest",
+        "geom/h3/886520d835fffff.json:560241:candidates.bus:66361: missing exposure_gaps",
+    ]
+
+
 def test_export_static_artifacts_preserves_no_transit_walk_evidence(tmp_path: Path):
     export_static_artifacts([no_transit_walk_evidence_record("560235")], output_dir=tmp_path)
     ok, validation = validate_static_artifacts(tmp_path)
```

## Focused Test

Command:

```text
uv run pytest tests/test_export.py::test_validate_rejects_incomplete_candidate_geometry -q
```

Output:

```text
.                                                                        [100%]
1 passed in 20.98s
```

## Full Export Tests

Command:

```text
uv run pytest tests/test_export.py -q
```

Output:

```text
...............................................                          [100%]
47 passed in 330.30s (0:05:30)
```

## Python Collection Count

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
448 tests collected in 74.25s (0:01:14)
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
git check-ignore -v qa/verification/P591-candidate-geometry-shape-validation.md; Write-Output "exit=$LASTEXITCODE"
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

1. Candidate stop geometry uses the same browser `PostalRouteGeomOption` shape as switchable route-option geometry, but static validation did not check candidate geometry entries for `shortest`, `sheltered`, or `exposure_gaps`.
2. A malformed `geom.candidates[<node_id>]` entry could previously pass static validation and then fail the browser's precomputed transit-stop picker path.
3. `validate_static_artifacts()` now rejects non-object candidate geometry entries and candidate geometry entries missing required path fields.
4. Python collection moved from 447 to 448 because this phase added one export regression test.

## DISAGREEMENTS

1. None.
