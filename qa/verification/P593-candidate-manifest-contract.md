# P593 Candidate Manifest Contract

## Root guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

No scoring, export, rescore, subset run, ingest, or network build was run.

Changed files:

```text
pipeline/export.py
tests/test_export.py
qa/verification/P593-candidate-manifest-contract.md
```

Protected paths were checked with `git diff` and produced no diff.

## Diff stat

```text
 pipeline/export.py   | 16 ++++++++++++++++
 tests/test_export.py | 26 ++++++++++++++++++++++++++
 2 files changed, 42 insertions(+)
```

## Full diff

```diff
diff --git a/pipeline/export.py b/pipeline/export.py
index 9187d04..486fbd5 100644
--- a/pipeline/export.py
+++ b/pipeline/export.py
@@ -1350,6 +1350,21 @@ def export_static_artifacts(
                     "cap": 5,
                     "sort_key": "direct_distance_m_ascending",
                     "geometry_ref_format": "<postal>_<node_id>",
+                    "required_fields": [
+                        "node_id",
+                        "node_name",
+                        "node_type",
+                        "direct_distance_m",
+                        "paths",
+                        "geometry_ref",
+                        "route_trust",
+                        "routing_type",
+                        "state",
+                    ],
+                    "geometry_requirement": (
+                        "non-null geometry_ref requires matching "
+                        "geom.<cell>.json[postal].candidates[<node_id>]"
+                    ),
                     "node_id_prefixes": ["bus:", "mrt:"],
                 },
                 "route_options": {
@@ -1391,6 +1406,7 @@ def export_static_artifacts(
             # no scored non-best candidates.
             "record_shape": {
                 "candidates_map": "geom.<cell>.json[postal].candidates[<node_id>]",
+                "candidates_map_required_fields": ["shortest", "sheltered", "exposure_gaps"],
                 "route_options_map": "geom.<cell>.json[postal].route_options[<option_key>]",
             },
         },
diff --git a/tests/test_export.py b/tests/test_export.py
index 94e307d..bc17726 100644
--- a/tests/test_export.py
+++ b/tests/test_export.py
@@ -559,6 +559,27 @@ def test_export_static_artifacts_preserves_no_transit_walk_evidence(tmp_path: Pa
     no_transit_semantics = manifest["scores"]["record_shape"]["state_semantics"][
         "NO_TRANSIT_IN_RANGE"
     ]
+    assert manifest["scores"]["record_shape"]["candidates"] == {
+        "cap": 5,
+        "sort_key": "direct_distance_m_ascending",
+        "geometry_ref_format": "<postal>_<node_id>",
+        "required_fields": [
+            "node_id",
+            "node_name",
+            "node_type",
+            "direct_distance_m",
+            "paths",
+            "geometry_ref",
+            "route_trust",
+            "routing_type",
+            "state",
+        ],
+        "geometry_requirement": (
+            "non-null geometry_ref requires matching "
+            "geom.<cell>.json[postal].candidates[<node_id>]"
+        ),
+        "node_id_prefixes": ["bus:", "mrt:"],
+    }
     assert manifest["scores"]["record_shape"]["route_options"] == {
         "keys": ["best_transit", "mrt_lrt", "bus"],
         "best_transit_geometry": "uses the top-level geom shard record",
@@ -570,6 +591,11 @@ def test_export_static_artifacts_preserves_no_transit_walk_evidence(tmp_path: Pa
     assert manifest["geom"]["record_shape"]["route_options_map"] == (
         "geom.<cell>.json[postal].route_options[<option_key>]"
     )
+    assert manifest["geom"]["record_shape"]["candidates_map_required_fields"] == [
+        "shortest",
+        "sheltered",
+        "exposure_gaps",
+    ]
     assert no_transit_semantics == {
         "score_fields": "total and subscores are null",
         "walk_evidence": (
```

## Focused test

Command:

```text
uv run pytest tests/test_export.py::test_export_static_artifacts_preserves_no_transit_walk_evidence -q
```

Output:

```text
.                                                                        [100%]
1 passed in 20.67s
```

## Export tests

Command:

```text
uv run pytest tests/test_export.py -q
```

Output:

```text
.................................................                        [100%]
49 passed in 292.20s (0:04:52)
```

## Test collection

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
450 tests collected in 76.90s (0:01:16)
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
git check-ignore -v qa/verification/P593-candidate-manifest-contract.md; Write-Output "exit=$LASTEXITCODE"
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

1. The exported manifest already named score candidate cap, sort order, geometry reference format, and node-id prefixes, but did not state the candidate fields required by the records or the required geometry-side evidence for non-null candidate geometry references.
2. The manifest now documents the score candidate required fields, the non-null `geometry_ref` cross-file invariant, and the geometry candidate route evidence fields expected by clients.
3. The existing export test now pins those manifest contracts so later exporter changes cannot silently weaken the published schema description.

## Disagreements

1. None.
