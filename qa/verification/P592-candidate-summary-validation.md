# P592 Candidate Summary Validation

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
 pipeline/export.py   | 61 ++++++++++++++++++++++++++++++++++++++++++++++++++++
 tests/test_export.py | 46 +++++++++++++++++++++++++++++++++++++++
 2 files changed, 107 insertions(+)
```

## git diff -- pipeline/export.py tests/test_export.py

```diff
diff --git a/pipeline/export.py b/pipeline/export.py
index 3f03390..9187d04 100644
--- a/pipeline/export.py
+++ b/pipeline/export.py
@@ -2045,6 +2045,44 @@ def validate_score_record(record: dict[str, Any], errors: list[str], context: st
                 errors.append(f"{context}: exposure_gaps missing for path-bearing {state}")
 
 
+def validate_candidate_summary(
+    candidate: dict[str, Any],
+    errors: list[str],
+    context: str,
+    postal: str,
+) -> str | None:
+    for key in [
+        "node_id",
+        "node_name",
+        "node_type",
+        "direct_distance_m",
+        "paths",
+        "geometry_ref",
+        "route_trust",
+        "routing_type",
+        "state",
+    ]:
+        if key not in candidate:
+            errors.append(f"{context}: missing {key}")
+    node_id = candidate.get("node_id")
+    if not isinstance(node_id, str) or not node_id:
+        errors.append(f"{context}: node_id must be a non-empty string")
+        return None
+    state = candidate.get("state")
+    if state not in VALID_STATES:
+        errors.append(f"{context}: invalid state {state!r}")
+    if not isinstance(candidate.get("paths"), dict):
+        errors.append(f"{context}: paths must be an object")
+    geometry_ref = candidate.get("geometry_ref")
+    if geometry_ref is None:
+        return None
+    expected_ref = f"{postal}_{node_id}"
+    if geometry_ref != expected_ref:
+        errors.append(f"{context}: geometry_ref must be {expected_ref!r} or null")
+        return None
+    return node_id
+
+
 def validate_static_artifacts(
     input_dir: Path = DEFAULT_VALIDATE_DIR,
     progress: Callable[[str], None] | None = None,
@@ -2085,6 +2123,7 @@ def validate_static_artifacts(
     indexed_postals: set[str] = set()
     postals_with_geom_required: set[str] = set()
     route_options_with_geom_required: dict[str, set[str]] = defaultdict(set)
+    candidates_with_geom_required: dict[str, set[str]] = defaultdict(set)
     score_prefixes = 0
     if score_index_path.is_file():
         mark("validating score index and shards")
@@ -2122,6 +2161,20 @@ def validate_static_artifacts(
                     or record.get("paths") is not None
                 ):
                     postals_with_geom_required.add(postal)
+                candidates = record.get("candidates")
+                if isinstance(candidates, list):
+                    if len(candidates) > 5:
+                        errors.append(f"scores/{area}.json:{postal}: candidates exceeds cap 5")
+                    for index, candidate in enumerate(candidates):
+                        candidate_context = f"scores/{area}.json:{postal}:candidates[{index}]"
+                        if not isinstance(candidate, dict):
+                            errors.append(f"{candidate_context}: record must be an object")
+                            continue
+                        node_id = validate_candidate_summary(
+                            candidate, errors, candidate_context, postal
+                        )
+                        if node_id is not None:
+                            candidates_with_geom_required[postal].add(node_id)
                 route_options = record.get("route_options")
                 if isinstance(route_options, dict):
                     for key, option in route_options.items():
@@ -2160,6 +2213,7 @@ def validate_static_artifacts(
     geom_postals: set[str] = set()
     geom_postals_with_route_segments: set[str] = set()
     geom_route_options: dict[str, set[str]] = defaultdict(set)
+    geom_candidates: dict[str, set[str]] = defaultdict(set)
     if geom_index_path.is_file():
         mark("validating geometry index and shards")
         geom_index = read_artifact_json(input_dir, "geom/index.json")
@@ -2235,6 +2289,7 @@ def validate_static_artifacts(
                         for required_key in ["shortest", "sheltered", "exposure_gaps"]:
                             if required_key not in candidate:
                                 errors.append(f"{candidate_context}: missing {required_key}")
+                    geom_candidates[postal].update(str(node_id) for node_id in candidates)
             if shard_index == len(geom_targets) or shard_index % 250 == 0:
                 mark(f"validated {shard_index}/{len(geom_targets)} geometry shards")
         mark(f"validated {len(geom_postals)} geometry records")
@@ -2248,6 +2303,12 @@ def validate_static_artifacts(
             errors.append(
                 f"scores route_options:{postal}: {option} has paths but missing geom route option"
             )
+    for postal, required_candidates in sorted(candidates_with_geom_required.items()):
+        missing_candidates = sorted(required_candidates - geom_candidates.get(postal, set()))
+        for node_id in missing_candidates:
+            errors.append(
+                f"scores candidates:{postal}: {node_id} has geometry_ref but missing geom candidate"
+            )
     extra_geom = geom_postals - indexed_postals
     if extra_geom:
         warnings.append(f"{len(extra_geom)} geometry postals are not in scores/index.json")
diff --git a/tests/test_export.py b/tests/test_export.py
index f00bc0c..94e307d 100644
--- a/tests/test_export.py
+++ b/tests/test_export.py
@@ -504,6 +504,52 @@ def test_validate_rejects_incomplete_candidate_geometry(tmp_path: Path):
     ]
 
 
+def test_validate_rejects_malformed_score_candidates(tmp_path: Path):
+    record = sample_record_with_candidates("560242")
+    record["candidates"][0].pop("node_name")
+    record["candidates"][0]["geometry_ref"] = "560242_bus:missing"
+    record["candidates"][1]["state"] = "BROKEN"
+    record["candidates"].append({**record["candidates"][1], "node_id": "bus:extra1"})
+    record["candidates"].append({**record["candidates"][1], "node_id": "bus:extra2"})
+    record["candidates"].append({**record["candidates"][1], "node_id": "bus:extra3"})
+    record["candidates"].append({**record["candidates"][1], "node_id": "bus:extra4"})
+
+    export_static_artifacts([record], output_dir=tmp_path)
+    ok, validation = validate_static_artifacts(tmp_path)
+
+    assert not ok
+    assert validation["errors"] == [
+        "scores/TEST_AREA.json:560242: candidates exceeds cap 5",
+        "scores/TEST_AREA.json:560242:candidates[0]: missing node_name",
+        "scores/TEST_AREA.json:560242:candidates[0]: geometry_ref must be '560242_bus:66361' or null",
+        "scores/TEST_AREA.json:560242:candidates[1]: invalid state 'BROKEN'",
+        "scores/TEST_AREA.json:560242:candidates[2]: invalid state 'BROKEN'",
+        "scores/TEST_AREA.json:560242:candidates[2]: geometry_ref must be '560242_bus:extra1' or null",
+        "scores/TEST_AREA.json:560242:candidates[3]: invalid state 'BROKEN'",
+        "scores/TEST_AREA.json:560242:candidates[3]: geometry_ref must be '560242_bus:extra2' or null",
+        "scores/TEST_AREA.json:560242:candidates[4]: invalid state 'BROKEN'",
+        "scores/TEST_AREA.json:560242:candidates[4]: geometry_ref must be '560242_bus:extra3' or null",
+        "scores/TEST_AREA.json:560242:candidates[5]: invalid state 'BROKEN'",
+        "scores/TEST_AREA.json:560242:candidates[5]: geometry_ref must be '560242_bus:extra4' or null",
+    ]
+
+
+def test_validate_requires_geom_for_candidate_geometry_ref(tmp_path: Path):
+    export_static_artifacts([sample_record_with_candidates("560243")], output_dir=tmp_path)
+    postal_index = json.loads((tmp_path / "geom" / "postal-index.json").read_text())
+    shard_path = tmp_path / "geom" / "h3" / f"{postal_index['560243']}.json"
+    geom_payload = json.loads(shard_path.read_text(encoding="utf-8"))
+    geom_payload[0]["candidates"].pop("bus:66361")
+    shard_path.write_text(json.dumps(geom_payload), encoding="utf-8")
+
+    ok, validation = validate_static_artifacts(tmp_path)
+
+    assert not ok
+    assert validation["errors"] == [
+        "scores candidates:560243: bus:66361 has geometry_ref but missing geom candidate"
+    ]
+
+
 def test_export_static_artifacts_preserves_no_transit_walk_evidence(tmp_path: Path):
     export_static_artifacts([no_transit_walk_evidence_record("560235")], output_dir=tmp_path)
     ok, validation = validate_static_artifacts(tmp_path)
```

## Focused Tests

Command:

```text
uv run pytest tests/test_export.py::test_validate_rejects_malformed_score_candidates tests/test_export.py::test_validate_requires_geom_for_candidate_geometry_ref -q
```

Output:

```text
..                                                                       [100%]
2 passed in 30.35s
```

## Full Export Tests

Command:

```text
uv run pytest tests/test_export.py -q
```

Output:

```text
.................................................                        [100%]
49 passed in 389.07s (0:06:29)
```

## Python Collection Count

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
450 tests collected in 19.85s
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
git check-ignore -v qa/verification/P592-candidate-summary-validation.md; Write-Output "exit=$LASTEXITCODE"
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

1. Score-shard candidate summaries are browser-visible `TransitCandidate` records, but static validation did not enforce their required fields, state validity, cap, or `geometry_ref` shape.
2. `geometry_ref` is the score-to-geom link for precomputed transit-stop picker routes; a candidate could previously name a missing geom candidate entry and still pass validation.
3. `validate_static_artifacts()` now validates candidate summary fields, candidate cap, candidate state, `geometry_ref == "<postal>_<node_id>" or null`, and matching geom candidate presence for non-null refs.
4. Python collection moved from 448 to 450 because this phase added two export regression tests.

## DISAGREEMENTS

1. None.
