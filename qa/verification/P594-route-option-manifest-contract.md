# P594 Route Option Manifest Contract

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
qa/verification/P594-route-option-manifest-contract.md
```

## Diff stat

```text
 pipeline/export.py   |  9 +++++++++
 tests/test_export.py | 13 +++++++++++++
 2 files changed, 22 insertions(+)
```

## Full diff

```diff
diff --git a/pipeline/export.py b/pipeline/export.py
index 486fbd5..adf09df 100644
--- a/pipeline/export.py
+++ b/pipeline/export.py
@@ -1369,6 +1369,14 @@ def export_static_artifacts(
                 },
                 "route_options": {
                     "keys": ["best_transit", "mrt_lrt", "bus"],
+                    "required_fields": [
+                        "state",
+                        "total",
+                        "subscores",
+                        "best_node",
+                        "paths",
+                        "exposure_gaps",
+                    ],
                     "best_transit_geometry": "uses the top-level geom shard record",
                     "switchable_geometry_ref_format": "geom.<cell>.json[postal].route_options[<option_key>]",
                     "switchable_geometry_requirement": (
@@ -1408,6 +1416,7 @@ def export_static_artifacts(
                 "candidates_map": "geom.<cell>.json[postal].candidates[<node_id>]",
                 "candidates_map_required_fields": ["shortest", "sheltered", "exposure_gaps"],
                 "route_options_map": "geom.<cell>.json[postal].route_options[<option_key>]",
+                "route_options_map_required_fields": ["shortest", "sheltered", "exposure_gaps"],
             },
         },
         "transit": {
diff --git a/tests/test_export.py b/tests/test_export.py
index bc17726..a0d4cf8 100644
--- a/tests/test_export.py
+++ b/tests/test_export.py
@@ -582,6 +582,14 @@ def test_export_static_artifacts_preserves_no_transit_walk_evidence(tmp_path: Pa
     }
     assert manifest["scores"]["record_shape"]["route_options"] == {
         "keys": ["best_transit", "mrt_lrt", "bus"],
+        "required_fields": [
+            "state",
+            "total",
+            "subscores",
+            "best_node",
+            "paths",
+            "exposure_gaps",
+        ],
         "best_transit_geometry": "uses the top-level geom shard record",
         "switchable_geometry_ref_format": "geom.<cell>.json[postal].route_options[<option_key>]",
         "switchable_geometry_requirement": (
@@ -596,6 +604,11 @@ def test_export_static_artifacts_preserves_no_transit_walk_evidence(tmp_path: Pa
         "sheltered",
         "exposure_gaps",
     ]
+    assert manifest["geom"]["record_shape"]["route_options_map_required_fields"] == [
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
1 passed in 30.49s
```

## Export tests

Command:

```text
uv run pytest tests/test_export.py -q
```

Output:

```text
.................................................                        [100%]
49 passed in 309.61s (0:05:09)
```

## Test collection

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
450 tests collected in 17.91s
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
git check-ignore -v qa/verification/P594-route-option-manifest-contract.md; Write-Output "exit=$LASTEXITCODE"
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

1. Score-shard `route_options` are validated with the same core record fields as top-level score records, but the manifest previously documented only route-option keys and geometry-reference behavior.
2. The manifest now advertises `route_options.required_fields` and `geom.record_shape.route_options_map_required_fields`, matching the enforced score and geometry contracts.
3. The existing manifest contract test now pins those route-option metadata fields.

## Disagreements

1. None.
