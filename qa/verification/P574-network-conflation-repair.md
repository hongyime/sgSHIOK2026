# P574 Network Conflation Repair

## Scope

Repair the DataMall bus-stop stop-to-graph conflation defect without changing the locked shortest or sheltered routing cost formulas. The repair is limited to bus-stop snap selection during postal scoring, with focused tests and one native full island network rebuild.

## Evidence

### Mechanism Study Notes

`pipeline/network.py` delegates the graph build to `scripts.run_network_build.run_build`. DataMall bus stop snap/conflation for scoring is loaded in `pipeline.bus.BusConnectivityIndex.from_raw_data()`, where each DataMall bus stop is assigned to exactly one Euclidean nearest graph node through `nearest_graph_node(geom, nodes, node_xy)`, storing `graph_node` and `snap_distance_m`. `select_bus_stop_candidates()` then returns nearby stops with that preselected node. Before this repair, `pipeline.scoring_integration.score_postal_row()` grouped routes using those pre-snapped bus nodes, so a stop whose straight-line nearest node had an implausibly long route from the postal origin could be rejected by the routed-bus cap even when another graph node inside the stop snap policy gave a plausible route.

### RED

Command:

```powershell
$env:PYTHONUTF8='1'; uv run python -m pytest C:\sgSHIOK2026\tests\test_scoring_integration.py::test_score_postal_row_repairs_bus_stop_snap_before_routed_bus_cap -q
```

Initial fixture correction: the first attempt failed because the empty MRT fixture lacked required columns:

```text
KeyError: 'STATION_NA'
```

After fixing only the fixture shape, the test failed for the intended conflation reason:

```text
E       assert 290.0 == 245.0
```

This showed the current code kept the straight-line-nearest bus stop graph node, producing a 290m routed access leg instead of the reachable nearby snap candidate.

### GREEN

Focused regression command:

```powershell
$env:PYTHONUTF8='1'; uv run python -m pytest C:\sgSHIOK2026\tests\test_scoring_integration.py::test_score_postal_row_repairs_bus_stop_snap_before_routed_bus_cap C:\sgSHIOK2026\tests\test_scoring_integration.py::test_score_postal_row_uses_bus_access_connector_before_direct_fallback C:\sgSHIOK2026\tests\test_scoring_integration.py::test_score_postal_row_uses_partial_fallback_for_combined_connector_dominant_route C:\sgSHIOK2026\tests\test_scoring_integration.py::test_score_postal_row_uses_partial_fallback_for_untrusted_bus_access_connector -q
```

Result:

```text
4 passed in 39.92s
```

Full network-related test selection:

```powershell
$env:PYTHONUTF8='1'; uv run python -m pytest C:\sgSHIOK2026\tests\test_audited_shelter_corrections.py C:\sgSHIOK2026\tests\test_bus.py C:\sgSHIOK2026\tests\test_bus_arrivals.py C:\sgSHIOK2026\tests\test_shelter_skeleton.py C:\sgSHIOK2026\tests\test_osm_tags.py C:\sgSHIOK2026\tests\test_production_readiness.py C:\sgSHIOK2026\tests\test_routing.py C:\sgSHIOK2026\tests\test_hdb_void_deck_inference.py C:\sgSHIOK2026\tests\test_diagnose_bus_connectors.py C:\sgSHIOK2026\tests\test_network_preflight.py C:\sgSHIOK2026\tests\test_network_qa.py C:\sgSHIOK2026\tests\test_scoring_integration.py C:\sgSHIOK2026\tests\test_batch_plan.py -q
```

Result:

```text
156 passed in 264.40s (0:04:24)
```

### Preflight

Command:

```powershell
$env:PYTHONUTF8='1'; uv run python C:\sgSHIOK2026\run.py network-preflight
```

Exit: `0`

Key output:

```text
"ok": true
"errors": []
"can_run_after_human_approval": true
```

### Rebuild

Single rebuild command:

```powershell
$env:PYTHONUTF8='1'; uv run python C:\sgSHIOK2026\run.py network --area island > C:\sgSHIOK2026\logs\p574_network_rebuild.log 2>&1
```

Log path: `C:\sgSHIOK2026\logs\p574_network_rebuild.log`

Duration from log file timestamps: `10:11:59.4302400` (`2026-08-25T22:33:52` to `2026-08-26T08:45:51`)

Completion tail:

```text
============================================================
5 GATE: Synthesis metrics
============================================================
Total synthesized-surface length: 1605.77m (0.5% of total)
Unsnapped / NEEDS_MANUAL counts: 1310
Top 3 component node share: 95.16%
Top 5 component sizes: [618084, 1946, 1470, 1402, 1295]
```

### Network QA

Default `run.py network-qa` points at pilot QA paths and failed because `C:\sgSHIOK2026\qa\pilot_debug.geojson` is absent. The documented area flag was used for the island rebuild artifacts:

```powershell
$env:PYTHONUTF8='1'; uv run python C:\sgSHIOK2026\run.py network-qa --area island
```

Exit: `0`

Gate output:

```json
{
  "ok": true,
  "qa_path": "C:\\sgSHIOK2026\\qa\\conflation_qa_island.json",
  "debug_path": "C:\\sgSHIOK2026\\qa\\island_debug.geojson",
  "errors": [],
  "warnings": [],
  "metrics": {
    "nodes": 653122,
    "edges": 896830,
    "mean_edge_length_m": 17.853022466092206,
    "connected_components_count": 2752,
    "top_5_component_sizes": [
      618084,
      1946,
      1470,
      1402,
      1295
    ],
    "real_disconnection_count_osm_only": 0,
    "real_disconnection_count_final": 0,
    "flags": [],
    "osm_residual_components_gt_50": 77,
    "final_residual_components_gt_50": 77,
    "shade_proxy_edge_count": 64541,
    "shade_proxy_weighted_length_m": 843339.2275912806,
    "audited_shelter_corrections": {
      "approved_features": 12,
      "candidate_lines": 12,
      "added_edges": 12,
      "skipped_edges": 0,
      "snap_max_m": 8.0,
      "path": "data\\audited_shelter_corrections.geojson"
    },
    "covered_edge_length_m_audited_corrections": 440.3052758694887
  }
}
```

### Diff / Guard

Code and test diff stat before evidence:

```text
pipeline/scoring_integration.py   | 124 +++++++++++++++++++++++++++++++++++++-
tests/test_scoring_integration.py |  69 +++++++++++++++++++++
2 files changed, 192 insertions(+), 1 deletion(-)
```

Protected-path guard:

```powershell
git -C 'C:\sgSHIOK2026' diff --exit-code -- pipeline/config/weights.yaml checksums.json web/public/data
```

Exit: `0`

## Findings

The repair adds an origin-aware bus stop snap check after nearby DataMall bus stops are selected and before route grouping. For each close-snap bus candidate, it probes graph nodes within the existing bus access connector search radius and only reassigns the candidate if a nearby node keeps the total routed access leg within the existing routed-bus cap. Candidates already within the cap, candidates outside the connector snap policy, and cases handled by existing direct-bus fallback remain unchanged. The shortest and sheltered routing cost formulas were untouched; the code change is confined to `pipeline/scoring_integration.py`, with regression coverage in `tests/test_scoring_integration.py`.

## Disagreements

None.
