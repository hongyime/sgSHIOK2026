# P582 no-transit export preservation

Date: 2026-08-28
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

No scoring, export, rescore, subset run, ingest, network build, upstream probe, public-data write, protected QA mutation, deployment, or locked-weight change was performed.

## Startup guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

P580 made future score records able to represent `NO_TRANSIT_IN_RANGE` with null locked score fields but non-null `best_node`, `paths`, and `exposure_gaps`. P581 made the browser render that shape honestly. P582 pins the static export path so future score-batch chunks carrying that shape survive score-shard emission, geometry-shard emission, and validation.

No export was run against real records. The regression uses a temporary pytest fixture only.

## Initial focused export test

Command:

```text
uv run pytest tests/test_export.py::test_export_static_artifacts_preserves_no_transit_walk_evidence tests/test_export.py::test_export_static_artifacts_writes_candidates_into_score_and_geom_shards tests/test_export.py::test_export_and_validate_static_artifacts -q
```

Output:

```text
F..                                                                      [100%]
================================== FAILURES ===================================
_______ test_export_static_artifacts_preserves_no_transit_walk_evidence _______

tmp_path = WindowsPath('C:/Users/bryan/AppData/Local/Temp/pytest-of-bryan/pytest-2922/test_export_static_artifacts_p0')

    def test_export_static_artifacts_preserves_no_transit_walk_evidence(tmp_path: Path):
        export_static_artifacts([no_transit_walk_evidence_record("560235")], output_dir=tmp_path)
        ok, validation = validate_static_artifacts(tmp_path)
        assert ok, validation
    
        score_payload = json.loads(next((tmp_path / "scores").glob("TEST_AREA*.json")).read_text())
        score = score_payload[0]
        assert score["postal"] == "560235"
        assert score["state"] == "NO_TRANSIT_IN_RANGE"
        assert score["total"] is None
        assert score["subscores"] is None
        assert score["best_node"]["routed_m"] == 1500.0
        assert score["paths"]["covered_ratio"] == 0.48
        assert score["paths"]["sheltered_m"] == 1500.0
        assert score["exposure_gaps"] == [{"len_m": 180.2, "label": "far connected gap"}]
        assert score["route_options"]["best_transit"]["state"] == "NO_TRANSIT_IN_RANGE"
        assert score["route_options"]["best_transit"]["total"] is None
        assert score["provenance"]["reason"] == "routed_candidates_beyond_access_range"
        assert score["provenance"]["routing_diagnostics"] == {"nearest_routed_m": 1500.0}
        assert "_geometry" not in score
    
        postal_index = json.loads((tmp_path / "geom" / "postal-index.json").read_text())
        shard = postal_index["560235"]
        geom_payload = json.loads((tmp_path / "geom" / "h3" / f"{shard}.json").read_text())
        entry = next(record for record in geom_payload if record["postal"] == "560235")
        assert entry["route_segments"]["sheltered"][0]["len_m"] == 50.0
>       assert entry["exposure_gaps"][0]["len_m"] == 50.0
E       assert 180.2 == 50.0

tests\test_export.py:515: AssertionError
=========================== short test summary info ===========================
FAILED tests/test_export.py::test_export_static_artifacts_preserves_no_transit_walk_evidence
1 failed, 2 passed in 56.15s
```

Interpretation: export preserved the public `exposure_gaps` length, which is the existing contract. The test assertion was corrected from `50.0` to `180.2`; no export code change was needed.

## Focused export test after assertion correction

Command:

```text
uv run pytest tests/test_export.py::test_export_static_artifacts_preserves_no_transit_walk_evidence tests/test_export.py::test_export_static_artifacts_writes_candidates_into_score_and_geom_shards tests/test_export.py::test_export_and_validate_static_artifacts -q
```

Output:

```text
...                                                                      [100%]

3 passed in 94.63s (0:01:34)
```

## Export test file

Command:

```text
uv run pytest tests/test_export.py -q
```

Output:

```text
.......................................                                  [100%]
39 passed in 358.01s (0:05:58)
```

## Python collection

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 5
```

Output:

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

440 tests collected in 71.80s (0:01:11)
```

The count moved from 439 to 440 because P582 adds one export regression test.

## Repository integrity

Command:

```text
python C:\sgSHIOK2026\scripts\check_repo_integrity.py; Write-Output "repo_integrity_exit=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
repo_integrity_exit=0
```

## Evidence ignore check

Command:

```text
git check-ignore -v C:\sgSHIOK2026\qa\verification\P582-no-transit-export-preservation.md; Write-Output "check_ignore_exit=$LASTEXITCODE"
```

Output:

```text
check_ignore_exit=1
```

## Protected path diff

Command:

```text
git diff --name-only -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\releases C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11; Write-Output "protected_diff_exit=$LASTEXITCODE"
```

Output:

```text
protected_diff_exit=0
```

## FINDINGS

1. Static export already preserves P580-style `NO_TRANSIT_IN_RANGE` walk evidence through score shards and geometry shards; no export code change was needed.
2. Before P582, that export contract was not pinned by a test for null locked score fields plus non-null walk evidence.
3. The regression test confirmed that score shards keep `state`, null `total`, null `subscores`, `best_node`, `paths`, `exposure_gaps`, `route_options`, and no private `_geometry`, while geometry shards keep route segments and public exposure-gap length.

## DISAGREEMENTS

1. None.
