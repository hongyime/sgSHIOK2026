# P587 Route Option Manifest Contract

Date: 2026-08-28
Machine: PRAWN-E14
Working root: C:\sgSHIOK2026

## Startup Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

Free-tier export contract change only. No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data write, deployment, protected QA mutation, checksums mutation, or locked-weight change was performed.

## git diff --stat -- pipeline/export.py tests/test_export.py

```text
 pipeline/export.py   | 10 ++++++++++
 tests/test_export.py | 11 +++++++++++
 2 files changed, 21 insertions(+)
```

## git diff -- pipeline/export.py tests/test_export.py

```diff
diff --git a/pipeline/export.py b/pipeline/export.py
index 6ee37aa..5d57649 100644
--- a/pipeline/export.py
+++ b/pipeline/export.py
@@ -1351,6 +1351,15 @@ def export_static_artifacts(
                     "geometry_ref_format": "<postal>_<node_id>",
                     "node_id_prefixes": ["bus:", "mrt:"],
                 },
+                "route_options": {
+                    "keys": ["best_transit", "mrt_lrt", "bus"],
+                    "best_transit_geometry": "uses the top-level geom shard record",
+                    "switchable_geometry_ref_format": "geom.<cell>.json[postal].route_options[<option_key>]",
+                    "switchable_geometry_requirement": (
+                        "non-best route_options with paths require matching geom shard "
+                        "route_options entries"
+                    ),
+                },
                 "state_semantics": {
                     NO_TRANSIT_IN_RANGE: {
                         "score_fields": "total and subscores are null",
@@ -1381,6 +1390,7 @@ def export_static_artifacts(
             # no scored non-best candidates.
             "record_shape": {
                 "candidates_map": "geom.<cell>.json[postal].candidates[<node_id>]",
+                "route_options_map": "geom.<cell>.json[postal].route_options[<option_key>]",
             },
         },
         "transit": {
diff --git a/tests/test_export.py b/tests/test_export.py
index 8635578..de804c1 100644
--- a/tests/test_export.py
+++ b/tests/test_export.py
@@ -495,6 +495,17 @@ def test_export_static_artifacts_preserves_no_transit_walk_evidence(tmp_path: Pa
     no_transit_semantics = manifest["scores"]["record_shape"]["state_semantics"][
         "NO_TRANSIT_IN_RANGE"
     ]
+    assert manifest["scores"]["record_shape"]["route_options"] == {
+        "keys": ["best_transit", "mrt_lrt", "bus"],
+        "best_transit_geometry": "uses the top-level geom shard record",
+        "switchable_geometry_ref_format": "geom.<cell>.json[postal].route_options[<option_key>]",
+        "switchable_geometry_requirement": (
+            "non-best route_options with paths require matching geom shard route_options entries"
+        ),
+    }
+    assert manifest["geom"]["record_shape"]["route_options_map"] == (
+        "geom.<cell>.json[postal].route_options[<option_key>]"
+    )
     assert no_transit_semantics == {
         "score_fields": "total and subscores are null",
         "walk_evidence": (
```

## Focused Tests

Command:

```text
uv run pytest tests/test_export.py::test_export_static_artifacts_preserves_no_transit_walk_evidence tests/test_export.py::test_validate_requires_geometry_for_switchable_route_options -q
```

Output:

```text
..                                                                       [100%]
2 passed in 34.07s
```

## Full Export Tests

Command:

```text
uv run pytest tests/test_export.py -q
```

Output:

```text
...........................................                              [100%]
43 passed in 243.30s (0:04:03)
```

## Python Collection Count

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
444 tests collected in 25.52s
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
git check-ignore -v qa/verification/P587-route-option-manifest-contract.md; Write-Output "exit=$LASTEXITCODE"
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

1. P586 made route-option geometry a validation requirement, but the exported manifest still only documented candidate geometry references. Consumers reading the manifest could not discover the `geom.<cell>.json[postal].route_options[<option_key>]` contract.
2. The manifest now documents both sides of the route-option geometry contract: score-shard route options name the switchable geometry reference, and geom shards advertise the matching route-options map.
3. No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data write, protected QA mutation, checksums mutation, deployment, or locked-weight change was performed.

## DISAGREEMENTS

1. None.
