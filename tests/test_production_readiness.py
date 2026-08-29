import json
import os
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path

import pyarrow as pa
import pyarrow.parquet as pq
import pytest

from pipeline.export import export_static_artifacts
from pipeline.scoring_integration import SCORE_PROVENANCE_SOURCE_HASH_KEYS, scoring_fingerprints
from scripts.production_readiness import (
    build_readiness_report,
    bundle_score_provenance_status,
    environment_readiness,
    lamp_overlay_artifact_status,
    readiness_output_payload,
    source_freshness_readiness,
    vercel_readiness,
)
from tests.test_export import sample_record

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload), encoding="utf-8")


def test_production_readiness_script_runs_by_absolute_path(tmp_path: Path) -> None:
    result = subprocess.run(
        [sys.executable, str(PROJECT_ROOT / "scripts" / "production_readiness.py"), "--help"],
        cwd=tmp_path,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0
    assert "Fast production-readiness report without scoring or deploying." in result.stdout
    assert "--gate-summary" in result.stdout


def test_readiness_output_payload_can_return_gate_summary_only() -> None:
    report = {
        "ok": True,
        "release_gate_passed": False,
        "release_gate_status": "blocked",
        "generated_at": "2026-08-22T00:00:00+00:00",
        "release_gate_summary": {
            "active_bundle": "generated_test",
            "checks": {"onemap_validation_same_bundle_fresh": False},
        },
        "warnings": ["source freshness warning"],
        "errors": [],
        "batch_plan": {"large": "omitted"},
        "bundle": {"large": "omitted"},
        "features": {"large": "omitted"},
    }

    payload = readiness_output_payload(report, gate_summary_only=True)

    assert payload == {
        "ok": True,
        "release_gate_passed": False,
        "release_gate_status": "blocked",
        "generated_at": "2026-08-22T00:00:00+00:00",
        "release_gate_summary": {
            "active_bundle": "generated_test",
            "checks": {"onemap_validation_same_bundle_fresh": False},
        },
        "warnings": ["source freshness warning"],
        "errors": [],
    }


def write_universe(path: Path, rows: int = 1) -> None:
    table = pa.table(
        {
            "postal_code": [f"{index:06d}" for index in range(1, rows + 1)],
            "status": ["READY_TO_SCORE"] * rows,
        }
    )
    pq.write_table(table, path)


def write_production_island_qa(path: Path) -> None:
    payload = {
        "nodes": 100,
        "edges": 120,
        "mean_edge_length_m": 18.0,
        "connected_components_count": 1,
        "top_5_component_sizes": [100],
        "residual_components_gt_50_osm_only": [],
        "residual_components_gt_50_final": [],
        "real_disconnection_count_osm_only": 0,
        "real_disconnection_count_final": 0,
        "flags": [],
        "covered_edge_length_m_osm_tags": 1.0,
        "covered_edge_length_m_lta_bridge_underpass_match": 1.0,
        "covered_edge_length_m_osm_roof_canopy": 1.0,
        "covered_edge_length_m_inferred_hdb_precinct_footways": 1.0,
        "covered_edge_length_m_inferred_hdb_point_footways": 1.0,
        "covered_edge_length_m_inferred_hdb_void_deck": 1.0,
        "shade_proxy_edge_count": 1,
        "shade_proxy_weighted_length_m": 1.0,
        "shade_proxy_sources": {
            "nparks_heritage_road_green_buffers": {
                "status": "loaded",
                "features_raw": 1,
                "features_in_scope": 1,
                "proxy_polygons": 1,
            },
            "nparks_heritage_trees": {
                "status": "loaded",
                "features_raw": 1,
                "features_in_scope": 1,
                "proxy_polygons": 1,
            },
            "nparks_nature_ways": {
                "status": "loaded",
                "features_raw": 1,
                "features_in_scope": 1,
                "proxy_polygons": 1,
            },
            "nparks_park_connector_loop": {
                "status": "loaded",
                "features_raw": 1,
                "features_in_scope": 1,
                "proxy_polygons": 1,
            },
            "nparks_tracks": {
                "status": "loaded",
                "features_raw": 1,
                "features_in_scope": 1,
                "proxy_polygons": 1,
            },
        },
    }
    write_json(path, payload)


def write_lamp_overlay_artifact(web_dir: Path) -> None:
    artifact_dir = web_dir / "public" / "data" / "lamp_posts_v1"
    tile_path = artifact_dir / "tiles" / "cell-a.json"
    tile_payload = {"cell": "cell-a", "points": [[103.8, 1.3], [103.8001, 1.3001]]}
    tile_text = json.dumps(tile_payload, sort_keys=True, separators=(",", ":")) + "\n"
    tile_path.parent.mkdir(parents=True, exist_ok=True)
    tile_path.write_text(tile_text, encoding="utf-8", newline="\n")
    write_json(
        artifact_dir / "manifest.json",
        {
            "schema_version": 1,
            "generated_at": "2026-08-16T00:00:00+00:00",
            "source": {
                "path": "raw/hash/lamp_posts.geojson",
                "sha256": "a" * 64,
                "bytes": 123,
            },
            "h3_resolution": 8,
            "point_count": 2,
            "skipped_feature_count": 0,
            "tile_count": 1,
            "tile_bytes": len(tile_text.encode("utf-8")),
            "bbox": [103.8, 1.3, 103.8001, 1.3001],
            "tiles": [
                {
                    "cell": "cell-a",
                    "path": "tiles/cell-a.json",
                    "count": 2,
                    "bytes": len(tile_text.encode("utf-8")),
                    "bbox": [103.8, 1.3, 103.8001, 1.3001],
                }
            ],
        },
    )


def export_current_fingerprint_bundle(output_dir: Path) -> None:
    export_static_artifacts([sample_record("123456")], output_dir=output_dir)
    manifest_path = output_dir / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    fingerprints = scoring_fingerprints()
    manifest["provenance"]["source_hashes"] = {
        source_key: f"{index:064x}"
        for index, source_key in enumerate(sorted(SCORE_PROVENANCE_SOURCE_HASH_KEYS), start=1)
    }
    manifest["provenance"]["scoring_fingerprints"] = fingerprints
    manifest["provenance"]["scoring_fingerprint_files"] = sorted(fingerprints)
    manifest["provenance"]["scoring_fingerprint_algorithm"] = "sha256-json-sort-keys-24hex"
    manifest["provenance"]["scoring_fingerprint_digest"] = "a" * 24
    manifest["provenance"]["record_scoring_fingerprint_digest"] = "a" * 24
    manifest["provenance"]["score_batch_start_scoring_fingerprint_digest"] = "a" * 24
    manifest["provenance"]["export_scoring_fingerprint_digest"] = "a" * 24
    manifest["provenance"]["scoring_fingerprint_digest_counts"] = {"a" * 24: 1}
    manifest["provenance"]["scoring_fingerprints_by_digest"] = {"a" * 24: fingerprints}
    manifest["provenance"]["scoring_fingerprint_digests_missing_maps"] = []
    manifest["provenance"]["scoring_fingerprint_changed_during_run"] = False
    manifest["provenance"]["mixed_scoring_fingerprint_digests"] = False
    manifest["provenance"]["records_missing_scoring_fingerprint_digest"] = 0
    manifest["provenance"]["scoring_fingerprint_provenance_complete"] = True
    manifest["provenance"]["scoring_input_algorithm"] = "sha256-json-sort-keys-24hex"
    manifest["provenance"]["scoring_input_digest"] = "b" * 24
    manifest["provenance"]["scoring_input_digest_counts"] = {"b" * 24: 1}
    manifest["provenance"]["scoring_inputs_by_digest"] = {"b" * 24: {"inputs": []}}
    manifest["provenance"]["scoring_input_digests_missing_maps"] = []
    manifest["provenance"]["scoring_input_changed_during_run"] = False
    manifest["provenance"]["mixed_scoring_input_digests"] = False
    manifest["provenance"]["records_missing_scoring_input_digest"] = 0
    manifest["provenance"]["scoring_input_provenance_complete"] = True
    manifest["provenance"]["network_algorithm"] = "sha256-json-sort-keys-24hex"
    manifest["provenance"]["network_digest"] = "c" * 24
    manifest["provenance"]["network_digest_counts"] = {"c" * 24: 1}
    manifest["provenance"]["networks_by_digest"] = {"c" * 24: {"networks": []}}
    manifest["provenance"]["network_digests_missing_maps"] = []
    manifest["provenance"]["network_changed_during_run"] = False
    manifest["provenance"]["mixed_network_digests"] = False
    manifest["provenance"]["records_missing_network_digest"] = 0
    manifest["provenance"]["network_provenance_complete"] = True
    write_json(manifest_path, manifest)


def legacy_live_bundle_provenance_shape(manifest: dict) -> None:
    manifest["provenance"] = {
        "source_hashes": {
            source_key: f"{index:064x}"
            for index, source_key in enumerate(sorted(SCORE_PROVENANCE_SOURCE_HASH_KEYS), start=1)
        },
        "scoring_fingerprints": {
            "pipeline\\config\\params.yaml": "0" * 64,
            "pipeline\\config\\weights.yaml": "1" * 64,
            "pipeline\\routing.py": "2" * 64,
            "pipeline\\scoring.py": "3" * 64,
            "pipeline\\scoring_integration.py": "4" * 64,
        },
        "subscore_status": {
            "access": "complete",
            "bus": "complete",
            "crossing": "complete",
            "heat": "complete",
            "rain": "complete",
        },
    }


def test_vercel_readiness_prefers_root_project_settings(tmp_path: Path):
    write_json(
        tmp_path / ".vercel" / "project.json",
        {
            "projectId": "prj_test",
            "projectName": "sgshiok",
            "settings": {"rootDirectory": "web"},
        },
    )
    write_json(
        tmp_path / "web" / ".vercel" / "project.json",
        {"projectId": "prj_test", "projectName": "old-name"},
    )

    report = vercel_readiness(tmp_path, tmp_path / "web")

    assert report["linked"] is True
    assert report["project_name"] == "sgshiok"
    assert report["root_directory_ok"] is True
    assert report["warnings"] == ["root and web Vercel project names differ but project ID matches"]


def test_vercel_readiness_treats_unlinked_local_checkout_as_nonblocking(tmp_path: Path):
    report = vercel_readiness(tmp_path, tmp_path / "web")

    assert report["linked"] is False
    assert report["root_directory_ok"] is None
    assert report["local_config_ok"] is True
    assert report["blocking"] is False
    assert report["warnings"] == [
        "local Vercel project is not linked; production deploy still requires owner approval"
    ]


def test_vercel_readiness_blocks_explicit_wrong_root_directory(tmp_path: Path):
    write_json(
        tmp_path / ".vercel" / "project.json",
        {
            "projectId": "prj_test",
            "projectName": "sgshiok",
            "settings": {"rootDirectory": "."},
        },
    )

    report = vercel_readiness(tmp_path, tmp_path / "web")

    assert report["linked"] is True
    assert report["root_directory"] == "."
    assert report["root_directory_ok"] is False
    assert report["local_config_ok"] is False
    assert report["blocking"] is True


def test_environment_readiness_reports_missing_api_credentials_without_values() -> None:
    missing = environment_readiness({})

    assert missing["ready_for_api_collection"] is False
    assert missing["missing"] == [
        "LTA_DATAMALL_ACCOUNT_KEY",
        "ONEMAP_EMAIL",
        "ONEMAP_PASSWORD",
    ]
    assert missing["lta_datamall_account_key_present"] is False
    assert missing["onemap_credentials_present"] is False
    assert any("DataMall" in warning for warning in missing["warnings"])
    assert any("OneMap walk-validation" in warning for warning in missing["warnings"])

    present = environment_readiness(
        {
            "LTA_DATAMALL_ACCOUNT_KEY": "secret-lta",
            "ONEMAP_EMAIL": "owner@example.test",
            "ONEMAP_PASSWORD": "secret-onemap",
        }
    )

    assert present["ready_for_api_collection"] is True
    assert present["missing"] == []
    assert present["warnings"] == []
    assert "secret-lta" not in json.dumps(present)
    assert "secret-onemap" not in json.dumps(present)
    assert "owner@example.test" not in json.dumps(present)


def test_source_freshness_readiness_reports_manifest_only_status(tmp_path: Path) -> None:
    sources_path = tmp_path / "pipeline" / "config" / "sources.yaml"
    sources_path.parent.mkdir(parents=True, exist_ok=True)
    sources_path.write_text(
        "\n".join(
            [
                "freshness_defaults:",
                "  datagov_polldownload:",
                "    expected_cadence: monthly",
                "    stale_after_days: 30",
                "sources:",
                "  fresh:",
                "    name: Fresh",
                "    kind: datagov_polldownload",
                "  alpha_less_stale:",
                "    name: Alpha Less Stale",
                "    kind: datagov_polldownload",
                "  zeta_more_stale:",
                "    name: Zeta More Stale",
                "    kind: datagov_polldownload",
                "  manual:",
                "    name: Manual",
                "    kind: osm_pbf",
                "    refresh: manual",
                "  unknown_age:",
                "    name: Unknown Age",
                "    kind: datagov_polldownload",
                "",
            ]
        ),
        encoding="utf-8",
    )
    write_json(
        tmp_path / "raw" / "manifest.json",
        {
            "sources": {
                    "fresh": {"fetched_at": "2026-08-15T00:00:00+00:00"},
                    "alpha_less_stale": {"last_modified": "Wed, 15 Jul 2026 00:00:00 GMT"},
                    "zeta_more_stale": {"last_modified": "Tue, 07 Jul 2026 02:06:48 GMT"},
                    "manual": {"last_modified": "Mon, 01 Jan 2024 00:00:00 GMT"},
                    "unknown_age": {},
                    "manifest_only": {"name": "Copied Manifest Only"},
            }
        },
    )

    status = source_freshness_readiness(
        tmp_path,
        now=datetime(2026, 8, 16, tzinfo=UTC),
    )

    assert status["ok"] is True
    assert status["state"] == "reported"
    assert status["checked_at"] == "2026-08-16T00:00:00+00:00"
    assert status["scope"] == "manifest_only"
    assert status["upstream_urls_probed"] is False
    assert status["counts"] == {
        "current": 1,
        "stale": 2,
        "manual": 1,
        "unknown_policy": 1,
        "unknown_age": 1,
    }
    assert status["by_status"]["unknown_policy"] == ["manifest_only"]
    assert status["unconfigured_manifest_sources"] == ["manifest_only"]
    assert status["by_status"]["stale"] == ["alpha_less_stale", "zeta_more_stale"]
    assert status["by_status"]["unknown_age"] == ["unknown_age"]
    assert status["oldest_current_source"] == (
        "Oldest current source: fresh (Fresh, 1.0d of 30d threshold, 29.0d until stale)"
    )
    assert status["nearest_current_source_to_stale"] == {
        "source_key": "fresh",
        "name": "Fresh",
        "status": "current",
        "age_basis": "fetched_at",
        "age_days": 1.0,
        "stale_after_days": 30,
        "days_until_stale": 29.0,
        "expected_cadence": "monthly",
    }
    assert status["stale_sources"] == [
        {
            "source_key": "zeta_more_stale",
            "name": "Zeta More Stale",
            "age_basis": "last_modified",
            "age_days": 39.911944,
            "stale_after_days": 30,
            "days_past_stale": 9.911944,
            "expected_cadence": "monthly",
        },
        {
            "source_key": "alpha_less_stale",
            "name": "Alpha Less Stale",
            "age_basis": "last_modified",
            "age_days": 32.0,
            "stale_after_days": 30,
            "days_past_stale": 2.0,
            "expected_cadence": "monthly",
        }
    ]
    assert status["most_overdue_stale_source"] == status["stale_sources"][0]
    assert status["summary"].startswith(
        "manifest-only source freshness checked at 2026-08-16T00:00:00+00:00: current 1"
    )
    assert status["warning"] == (
        "source freshness warning: stale sources: zeta_more_stale (Zeta More Stale), "
        "alpha_less_stale (Alpha Less Stale); "
        "unknown_policy sources: manifest_only (Copied Manifest Only); "
        "unknown_age sources: unknown_age (Unknown Age); "
        "Stale freshness action: report and plan a versioned refresh; "
        "do not mutate frozen v1 in place."
    )


def test_source_freshness_readiness_is_non_blocking_when_manifest_absent(tmp_path: Path) -> None:
    status = source_freshness_readiness(tmp_path)

    assert status["ok"] is True
    assert status["state"] == "not_available"
    assert "checked_at" in status
    assert status["scope"] == "manifest_only"
    assert status["upstream_urls_probed"] is False
    assert status["warning"] is None


def test_lamp_overlay_artifact_status_validates_manifest_and_tiles(tmp_path: Path) -> None:
    web_dir = tmp_path / "web"
    write_lamp_overlay_artifact(web_dir)

    status = lamp_overlay_artifact_status(web_dir)

    assert status["ok"] is True
    assert status["state"] == "passed"
    assert status["tile_count"] == 1
    assert status["tile_index_count"] == 1
    assert status["point_count"] == 2
    assert status["missing_tile_count"] == 0
    assert status["size_mismatch_count"] == 0
    assert status["source_sha256"] == "a" * 64
    assert status["warning"] is None


def test_lamp_overlay_artifact_status_blocks_missing_deploy_artifact(tmp_path: Path) -> None:
    status = lamp_overlay_artifact_status(tmp_path / "web")

    assert status["ok"] is False
    assert status["state"] == "missing"
    assert "lamp_posts_v1" in status["manifest_path"]
    assert "local deploy artifact manifest is missing" in status["warning"]
    assert "night lighting browser layer" in status["warning"]
    assert "night-lighting" not in status["warning"]


def test_build_readiness_report_accepts_minimal_valid_current_state(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
):
    from pipeline.batch_plan import RECENT_PUBLIC_SOURCE_GAP_SAMPLE

    monkeypatch.setattr(
        "scripts.production_readiness.recent_public_source_gap_sample_policy",
        lambda: RECENT_PUBLIC_SOURCE_GAP_SAMPLE,
    )

    web_dir = tmp_path / "web"
    write_lamp_overlay_artifact(web_dir)
    bundle_dir = web_dir / "public" / "data" / "generated_test"
    export_current_fingerprint_bundle(bundle_dir)
    write_json(web_dir / "data-bundle.json", {"bundle": "generated_test"})

    summary_path = tmp_path / "processed" / "postal_universe_candidate_full_registered_summary.json"
    universe_path = tmp_path / "processed" / "postal_universe_candidate_full_registered.parquet"
    write_json(
        summary_path,
        {
            "mode": "candidate_full_registered",
            "total_unique_postals": 1,
            "ready_to_score": 1,
            "needs_geocode": 0,
            "source_stats": [],
            "source_only_counts": {},
            "warnings": [],
        },
    )
    write_universe(universe_path, rows=1)
    params_path = tmp_path / "params.yaml"
    params_path.write_text("onemap:\n  client_delay_sec: 2.0\n", encoding="utf-8")
    qa_path = tmp_path / "qa" / "conflation_qa_island.json"
    debug_path = tmp_path / "qa" / "island_debug.geojson"
    write_production_island_qa(qa_path)

    progress_events: list[str] = []
    ok, report = build_readiness_report(
        project_root=tmp_path,
        web_dir=web_dir,
        bundle_dir=bundle_dir,
        summary_path=summary_path,
        universe_path=universe_path,
        params_path=params_path,
        qa_path=qa_path,
        debug_path=debug_path,
        network_path=tmp_path / "unused_network.parquet",
        postal_universe_path=universe_path,
        environment={
            "LTA_DATAMALL_ACCOUNT_KEY": "test-lta",
            "ONEMAP_EMAIL": "owner@example.test",
            "ONEMAP_PASSWORD": "test-onemap",
        },
        progress=progress_events.append,
    )

    assert ok, report
    assert progress_events[0] == "resolving active bundle and QA paths"
    assert "static artifacts: scanning JSON artifact files" in progress_events
    assert any(
        event.startswith("static artifacts: scanned ") for event in progress_events
    )
    assert "auditing bundle state" in progress_events
    assert progress_events[-1] == "readiness report complete"
    assert report["ok"] is True
    assert report["release_gate_passed"] is False
    assert report["release_gate_status"] == "blocked"
    assert report["release_gate_summary"]["checks"]["infrastructure_readiness"] is True
    assert report["release_gate_summary"]["checks"]["lamp_overlay_artifact"] is True
    assert report["release_gate_summary"]["checks"]["onemap_validation_same_bundle_fresh"] is False
    assert report["bundle"]["manifest_record_count"] == 1
    assert report["bundle"]["state_total_matches_manifest"] is True
    assert report["bundle"]["score_provenance"]["ok"] is True
    assert report["bundle"]["score_provenance"]["missing_scoring_fingerprints"] == []
    assert report["bundle"]["score_provenance"]["missing_subscore_status"] == []
    assert report["bundle"]["static_validation"]["geometry_postals_with_route_segments"] == 1
    assert report["network"]["ok"] is True
    assert report["network"]["debug_path"] == str(debug_path)
    assert not debug_path.exists()
    assert report["vercel"]["linked"] is False
    assert report["vercel"]["root_directory_ok"] is None
    assert report["vercel"]["local_config_ok"] is True
    assert report["vercel"]["blocking"] is False
    assert report["release_gate_summary"]["checks"]["vercel_root_directory"] is True
    assert report["lamp_overlay"]["ok"] is True
    assert report["lamp_overlay"]["point_count"] == 2
    assert report["environment"]["ready_for_api_collection"] is True
    assert report["environment"]["warnings"] == []
    assert report["features"]["incorporated"]["bus_as_transit_direct_fallback"] is True
    assert report["features"]["incorporated"]["ura_no_dwelling_units_postal_source"] is True
    assert "124443" in report["features"]["not_incorporated"]["ura_expanded_scores_live"]
    assert (
        "the P19 v2 28 Aug 2026 public-source sample found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) sampled 2021-2026"
        in report["features"]["not_incorporated"]["canonical_140k_postal_universe"]
    )
    assert (
        "the 16 Aug 2026 P19 sampled check found"
        not in report["features"]["not_incorporated"]["canonical_140k_postal_universe"]
    )
    assert (
        "P19 found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows"
        not in report["features"]["not_incorporated"]["canonical_140k_postal_universe"]
    )
    assert (
        "its Overpass coverage cross-check found 25919 valid distinct OSM addr:postcode values, 25899 overlapping frozen postals, 20 valid OSM-only postcodes"
        in report["features"]["not_incorporated"]["canonical_140k_postal_universe"]
    )
    assert (
        "P63 found live OSM addr:postcode"
        not in report["features"]["not_incorporated"]["canonical_140k_postal_universe"]
    )
    assert (
        "recent completion rows"
        not in report["features"]["not_incorporated"]["canonical_140k_postal_universe"]
    )
    assert (
        "candidate-source-first"
        in report["features"]["not_incorporated"]["postal_universe_v2_source_policy"]
    )
    assert (
        "do not use OSM or OneMap Search as a complete postal registry"
        in report["features"]["not_incorporated"]["postal_universe_v2_source_policy"]
    )
    assert (
        "72-hour token refresh"
        in report["features"]["not_incorporated"]["postal_universe_v2_source_policy"]
    )
    assert report["features"]["source_policy"]["onemap_search_controls"] == {
        "token_required": True,
        "token_refresh_hours": 72,
        "documented_token_authenticated_call_limit_cap": 250,
        "higher_limit_requires_sla_case_by_case_approval": True,
    }
    assert (
        report["features"]["source_policy"]["frozen_v1"]
        == "frozen v1 remains the 124443-record June 2020 OneMap-derived universe"
    )
    assert "candidate-source-first" in report["features"]["source_policy"]["v2"]
    assert (
        report["features"]["source_policy"]["onemap_search_role"]
        == "candidate validation/geocoding, not national enumeration"
    )
    assert report["features"]["recent_public_source_gap_evidence_split"] == {
        "coordinate_backed_hdb_missing_rows": 6,
        "unvalidated_mcst_proxy_rows": 2,
        "confirmed_missing_address_rows": 6,
        "source_quality_warning_rows": 2,
    }
    assert report["features"]["source_policy"]["recent_public_source_gap_sample"] == {
        "measurement": "P19 v2 28 Aug 2026 public-source gap sample",
        "generated_at_utc": "2026-08-28T21:15:15.685030+00:00",
        "currentness": {
            "status": "runtime_status_required",
            "fresh_for_current_gap_sizing": False,
            "dynamic_status_command": "uv run python run.py p19-gap-status",
            "reason": (
                "currentness is time-sensitive; call p19-gap-status before using this "
                "sample for current gap sizing"
            ),
        },
        "cache_status_command": "uv run python run.py p19-gap-status",
        "cache_status_calls_apis": False,
        "cache_status_writes_files": False,
        "cache_status_reports_age_days": True,
        "cache_status_reports_missing_rows": True,
        "cache_status_reports_missing_development_clusters": True,
        "cache_status_reports_hdb_cluster_coordinates": True,
        "cache_status_reports_mcst_proxy_location_probe": True,
        "summary_path": "qa/p19/universe_gap_measurement_summary_v2.json",
        "detail_path": "qa/p19/universe_gap_measurement_detail_v2.json",
        "mcst_proxy_location_probe": {
            "command": "uv run python run.py p19-mcst-locations",
            "command_calls_apis": False,
            "command_writes_files": False,
            "cache_path": "qa/p379/p19_mcst_missing_onemap_cache.json",
            "report_path": "qa/p379/p19_mcst_missing_locations_report.json",
            "mcst_missing_rows": 2,
            "located_rows": 0,
            "unlocated_rows": 2,
            "conflicting_candidate_postals": {
                "CANAAN": {
                    "recorded_postal": "378720",
                    "candidate_postals": ["387720"],
                }
            },
            "unlocated_developments": ["CANAAN", "MYRA"],
            "will_score": False,
            "will_export": False,
            "will_mutate_p19": False,
            "verdict": "MCST proxy rows remain unvalidated; HDB clusters are the coordinate-backed actionable gap",
        },
        "source_rows_with_postals": 976,
        "missing_rows": 8,
        "evidence_split": {
            "coordinate_backed_hdb_missing_rows": 6,
            "unvalidated_mcst_proxy_rows": 2,
            "confirmed_missing_address_rows": 6,
            "source_quality_warning_rows": 2,
        },
        "missing_postals_by_source": {
            "hdb_2021_2026_geocoded": ["521400", "522400", "523400", "762936", "763936", "764936"],
            "mcst_2021_2026": ["378720", "935456"],
        },
        "coordinate_backed_hdb_missing_development_clusters": [
            {
                "development": "SUN PLAZA SPRING",
                "missing_postals": ["521400", "522400", "523400"],
                "missing_rows": 3,
                "year_completed": 2026,
                "coordinate_source": "cached_onemap_search_result",
            },
            {
                "development": "YISHUN BEACON",
                "missing_postals": ["762936", "763936", "764936"],
                "missing_rows": 3,
                "year_completed": 2026,
                "coordinate_source": "cached_onemap_search_result",
            },
        ],
        "missing_pct": 0.819672,
        "confirmed_missing_pct": 0.614754,
        "missing_or_source_quality_warning_pct": 0.819672,
        "directional_scale_if_sample_rate_applied_to_v1": {
            "basis": (
                "directional only; applies sampled recent-completion row rates to the "
                "frozen-v1 distinct postal count, not a measured full-universe gap"
            ),
            "v1_distinct_postals": 124443,
            "confirmed_missing_rows_estimate": 765,
            "missing_or_source_quality_warning_rows_estimate": 1020,
        },
        "v2_build_decision": {
            "status": "not_approved_from_current_sample",
            "reason": (
                "fresh cached sample indicates a small gap; building postal-universe v2 "
                "requires separate owner approval, candidate-source-first scope, and "
                "new versioned outputs"
            ),
        },
        "source_window": "2021-2026",
        "sources": ["HDB completion geocoded rows", "BCA MCST constitution-date proxy rows"],
        "source_limitations": [
            "HDB rows use completion year but require OneMap geocoding to obtain postals",
            "BCA MCST constitution date is private-strata onboarding proxy evidence, not TOP or completion date",
        ],
        "verdict": "small sampled current-source gap in frozen v1; v2 remains candidate-source-first if approved",
    }
    assert (
        "candidate-only postal-universe evidence"
        in report["features"]["not_incorporated"]["overture_addresses_sg_candidate"]
    )
    assert (
        "does not approve scoring or address-registry use"
        in report["features"]["not_incorporated"]["overture_addresses_sg_candidate"]
    )
    assert (
        "outlier review/rescore"
        not in report["features"]["not_incorporated"]["overture_addresses_sg_candidate"]
    )
    assert (
        "has not been collected yet"
        in report["features"]["not_incorporated"]["onemap_walk_validation_gate"]
    )
    assert (
        report["features"]["validation_gates"]["onemap_walk_validation"]["state"] == "not_collected"
    )
    assert report["features"]["source_policy"]["osm_addr_postcode_registry"] == {
        "measurement": "P19 v2 28 Aug 2026 Overpass addr:postcode coverage cross-check",
        "cache_status_command": "uv run python run.py p19-gap-status",
        "cache_status_calls_apis": False,
        "cache_status_writes_files": False,
        "cache_status_reports_age_days": True,
        "overpass_output_path": "qa/p19/overpass_addr_postcodes_cache_v2.json",
        "overpass_query_path": None,
        "valid_distinct_postcodes": 25919,
        "overlap_frozen_v1_postals": 25899,
        "valid_osm_only_postcodes": 20,
        "frozen_v1_postals": 124443,
        "coverage_pct": 20.811938,
        "invalid_distinct_postcode_tags": None,
        "source_role": "geometry evidence and coverage cross-check",
        "registry_policy": "not the address registry",
        "verdict": "not sufficient as primary Singapore address registry",
    }
    assert report["features"]["source_policy"]["datamall_geospatial_discovery"] == {
        "measurement": "P682/P683/P750 DataMall geospatial discovery-only probe",
        "checked_at_local_date": "2026-08-28",
        "command": "uv run python run.py check --geospatial-discovery-only",
        "payload_downloads": False,
        "manifest_writes": False,
        "changed_sources": [],
        "matched_sources": ["covered_linkway", "overhead_bridge_underpass", "traffic_signals"],
        "verdict": "discovery URLs still match frozen v1; stale payload ages still require a new numbered input version before any refresh",
    }
    assert report["features"]["source_policy"]["non_score_reference_sources"] == {
        "leaf_area_index": {
            "role": "source freshness reference table only",
            "reason": "species/generic LAI table; not route-level geometry or shade-proxy geometry",
            "score_provenance": "excluded from score source hashes",
            "promotion_requires": "separate species-located canopy inventory and approved model design",
        }
    }
    assert report["features"]["source_policy"]["night_lighting_layer"] == {
        "source_key": "lamp_posts",
        "artifact": "web/public/data/lamp_posts_v1/",
        "replacement_command_example": "uv run python run.py lamp-overlay --output web/public/data/lamp_posts_v2 --confirm-lamp-overlay",
        "owner_approval_required_for_replacement": True,
        "role": "separate night lighting map layer",
        "score_role": "not part of the locked score",
        "release_gate": (
            "production readiness validates manifest, source identity, tile index, "
            "tile files, and tile byte totals"
        ),
        "existing_artifact_mutation": "forbidden",
        "versioning": "new lamp overlay artifacts must use a new numbered directory",
    }
    assert report["features"]["source_policy"]["source_freshness"] == {
        "command": "uv run python run.py check --freshness-only",
        "scope": "manifest_only",
        "upstream_urls_probed": False,
        "writes_manifest": False,
        "grouped_summaries_include_source_names": True,
        "role": "release context, not a corruption or hash-repair signal",
        "stale_result": "report and plan a versioned refresh; do not mutate frozen v1 in place",
    }
    assert report["batch_plan"]["full_batch_release_scope"] == {
        "status": "approved_in_principle_not_approved_to_run",
        "owner_approval_required_before_execution": True,
        "one_attempt_only": True,
        "must_prove_each_change_on_1200_subset_first": True,
        "bundled_changes": [
            "bus remodel",
            "NO_TRANSIT_IN_RANGE partial-score fix",
            "network conflation repair",
            "promoted postal universe v2 if approved",
        ],
        "prohibited_without_explicit_owner_approval": [
            "full rescore",
            "piecemeal full-bundle rerun",
            "production deploy",
            "live-site repoint",
        ],
        "required_prerequisite_evidence": [
            {
                "change": "bus remodel",
                "required_before_full_batch": "1200-record subset proof with bus-score movement and failure-mode accounting",
            },
            {
                "change": "NO_TRANSIT_IN_RANGE partial-score fix",
                "required_before_full_batch": "1200-record subset proof of state transitions and locked-weight zero-contribution behavior",
                "locked_score_policy": (
                    "missing or NO_TRANSIT_IN_RANGE component terms remain zero-contribution "
                    "under the locked weights; do not renormalize to a four-of-five score "
                    "without a new explicit display state"
                ),
            },
            {
                "change": "network conflation repair",
                "required_before_full_batch": "island network QA plus 1200-record subset proof of route/value impact",
            },
            {
                "change": "promoted postal universe v2 if approved",
                "required_before_full_batch": "candidate-source diff, bounded OneMap validation report, and owner approval",
            },
        ],
    }


def test_build_readiness_report_summarizes_failed_onemap_gate(tmp_path: Path):
    web_dir = tmp_path / "web"
    write_lamp_overlay_artifact(web_dir)
    bundle_dir = web_dir / "public" / "data" / "generated_test"
    export_current_fingerprint_bundle(bundle_dir)
    write_json(web_dir / "data-bundle.json", {"bundle": "generated_test"})
    write_json(
        tmp_path / ".vercel" / "project.json",
        {
            "projectId": "prj_test",
            "projectName": "sgshiok",
            "settings": {"rootDirectory": "web"},
        },
    )

    summary_path = tmp_path / "processed" / "postal_universe_candidate_full_registered_summary.json"
    universe_path = tmp_path / "processed" / "postal_universe_candidate_full_registered.parquet"
    write_json(
        summary_path,
        {
            "mode": "candidate_full_registered",
            "total_unique_postals": 1,
            "ready_to_score": 1,
            "needs_geocode": 0,
            "source_stats": [],
            "source_only_counts": {},
            "warnings": [],
        },
    )
    write_universe(universe_path, rows=1)
    params_path = tmp_path / "params.yaml"
    params_path.write_text("onemap:\n  client_delay_sec: 2.0\n", encoding="utf-8")
    qa_path = tmp_path / "qa" / "conflation_qa_island.json"
    debug_path = tmp_path / "qa" / "island_debug.geojson"
    write_production_island_qa(qa_path)
    debug_path.write_text('{"type":"FeatureCollection","features":[]}', encoding="utf-8")
    write_json(
        tmp_path / "qa" / "onemap_validation_cached_report_20260802.json",
        {
            "bundle": "generated_old",
            "gate_passed": False,
            "sample_size": 2000,
            "cached_results": 1999,
            "missing_cache_results": 0,
            "invalid_cache_results": 1,
            "median_abs_pct_delta": 11.458,
            "p95_abs_pct_delta": 94.037,
            "thresholds": {
                "median_abs_pct_delta_max": 10.0,
                "p95_abs_pct_delta_max": 100.0,
            },
            "subset_summary": {
                "graph_routed_mrt_lrt": {
                    "count": 386,
                    "median_abs_pct_delta": 6.679,
                    "p95_abs_pct_delta": 59.114,
                    "median_abs_delta_m": 42.5,
                    "p95_abs_delta_m": 351.5,
                    "thresholds_passed": True,
                },
                "endpoint_connector": {
                    "count": 19,
                    "median_abs_pct_delta": 77.358,
                    "p95_abs_pct_delta": 80.206,
                    "median_abs_delta_m": 271.4,
                    "p95_abs_delta_m": 1161.4,
                    "thresholds_passed": False,
                },
                "graph_routed_bus_stop": {
                    "count": 123,
                    "median_abs_pct_delta": 15.988,
                    "p95_abs_pct_delta": 76.321,
                    "median_abs_delta_m": 91.2,
                    "p95_abs_delta_m": 812.0,
                    "thresholds_passed": False,
                },
                "unused_passed_subset": {
                    "count": 1,
                    "median_abs_pct_delta": 1.0,
                    "p95_abs_pct_delta": 2.0,
                    "thresholds_passed": True,
                },
            },
            "generated_at": "2026-08-02T02:40:10+00:00",
        },
    )

    ok, report = build_readiness_report(
        project_root=tmp_path,
        web_dir=web_dir,
        bundle_dir=bundle_dir,
        summary_path=summary_path,
        universe_path=universe_path,
        params_path=params_path,
        qa_path=qa_path,
        debug_path=debug_path,
        network_path=tmp_path / "unused_network.parquet",
        postal_universe_path=universe_path,
    )

    assert ok, report
    assert report["release_gate_passed"] is False
    assert report["release_gate_status"] == "blocked"
    assert report["release_gate_summary"]["active_bundle"] == "generated_test"
    assert report["release_gate_summary"]["checks"]["onemap_validation_same_bundle_fresh"] is False
    assert report["release_gate_summary"]["blocking_checks"] == [
        "onemap_validation_same_bundle_fresh",
        "onemap_validation_waived",
    ]
    assert "onemap_validation" in report["release_gate_summary"]["warning_checks"]
    gate = report["features"]["validation_gates"]["onemap_walk_validation"]
    assert gate["state"] == "failed_stale_bundle"
    assert gate["bundle_matches_active"] is False
    assert gate["bundle"] == "generated_old"
    assert gate["active_bundle"] == "generated_test"
    assert gate["sample_size"] == 2000
    assert gate["gate_passed"] is False
    assert gate["subset_summary"]["graph_routed_mrt_lrt"]["p95_abs_pct_delta"] == 59.114
    assert [item["subset"] for item in gate["failing_subset_order"]] == [
        "endpoint_connector",
        "graph_routed_bus_stop",
    ]
    assert gate["failing_subset_order"][0]["p95_abs_delta_m"] == 1161.4
    assert "failed" in report["features"]["not_incorporated"]["onemap_walk_validation_gate"]
    assert "not active bundle generated_test" in (
        report["features"]["not_incorporated"]["onemap_walk_validation_gate"]
    )
    assert "11.458%" in report["features"]["not_incorporated"]["onemap_walk_validation_gate"]
    assert "failing criteria: complete cache coverage, median abs delta threshold" in (
        gate["summary"]
    )
    assert "subset thresholds" in gate["summary"]
    assert "p95 abs delta threshold" not in gate["summary"]
    assert "failing subsets: endpoint_connector, graph_routed_bus_stop" in gate["summary"]


def test_build_readiness_report_reads_nested_release_onemap_reports(tmp_path: Path):
    web_dir = tmp_path / "web"
    write_lamp_overlay_artifact(web_dir)
    bundle_dir = web_dir / "public" / "data" / "generated_test"
    export_current_fingerprint_bundle(bundle_dir)
    write_json(web_dir / "data-bundle.json", {"bundle": "generated_test"})
    write_json(
        tmp_path / ".vercel" / "project.json",
        {
            "projectId": "prj_test",
            "projectName": "sgshiok",
            "settings": {"rootDirectory": "web"},
        },
    )

    summary_path = tmp_path / "processed" / "postal_universe_candidate_full_registered_summary.json"
    universe_path = tmp_path / "processed" / "postal_universe_candidate_full_registered.parquet"
    write_json(
        summary_path,
        {
            "mode": "candidate_full_registered",
            "total_unique_postals": 1,
            "ready_to_score": 1,
            "needs_geocode": 0,
            "source_stats": [],
            "source_only_counts": {},
            "warnings": [],
        },
    )
    write_universe(universe_path, rows=1)
    params_path = tmp_path / "params.yaml"
    params_path.write_text("onemap:\n  client_delay_sec: 2.0\n", encoding="utf-8")
    qa_path = tmp_path / "qa" / "conflation_qa_island.json"
    debug_path = tmp_path / "qa" / "island_debug.geojson"
    write_production_island_qa(qa_path)
    debug_path.write_text('{"type":"FeatureCollection","features":[]}', encoding="utf-8")
    write_json(
        tmp_path / "qa" / "onemap_validation_cached_report_old_root.json",
        {
            "bundle": "generated_old",
            "gate_passed": False,
            "sample_size": 2000,
            "cached_results": 2000,
            "missing_cache_results": 0,
            "invalid_cache_results": 0,
            "median_abs_pct_delta": 99.0,
            "p95_abs_pct_delta": 99.0,
            "thresholds": {
                "median_abs_pct_delta_max": 12.0,
                "p95_abs_pct_delta_max": 100.0,
            },
            "generated_at": "2020-01-01T00:00:00+00:00",
        },
    )
    nested_report = (
        tmp_path
        / "qa"
        / "releases"
        / "20260811-full-onemap"
        / "onemap_validation_cached_report_full_scored_20260811.json"
    )
    write_json(
        nested_report,
        {
            "bundle": "generated_test",
            "gate_passed": False,
            "sample_size": 95157,
            "cached_results": 95095,
            "missing_cache_results": 0,
            "invalid_cache_results": 62,
            "median_abs_pct_delta": 11.884,
            "p95_abs_pct_delta": 69.861,
            "thresholds": {
                "median_abs_pct_delta_max": 12.0,
                "p95_abs_pct_delta_max": 100.0,
            },
            "generated_at": "2099-01-01T00:00:00+00:00",
        },
    )

    ok, report = build_readiness_report(
        project_root=tmp_path,
        web_dir=web_dir,
        bundle_dir=bundle_dir,
        summary_path=summary_path,
        universe_path=universe_path,
        params_path=params_path,
        qa_path=qa_path,
        debug_path=debug_path,
        network_path=tmp_path / "unused_network.parquet",
        postal_universe_path=universe_path,
    )

    assert ok, report
    gate = report["release_gate_summary"]["onemap_validation"]
    assert gate["report_path"] == str(nested_report)
    assert gate["state"] == "failed"
    assert gate["bundle_matches_active"] is True
    assert gate["fresh_for_active_bundle"] is True
    assert gate["cached_results"] == 95095
    assert gate["invalid_cache_results"] == 62
    assert gate["summary"].endswith("failing criteria: complete cache coverage")
    assert report["release_gate_summary"]["checks"]["onemap_validation_same_bundle_fresh"] is False
    assert report["release_gate_summary"]["checks"]["onemap_validation_waived"] is False
    assert report["release_gate_summary"]["required_owner_approvals"] == ["production_deploy"]

    ok, waived_report = build_readiness_report(
        project_root=tmp_path,
        web_dir=web_dir,
        bundle_dir=bundle_dir,
        summary_path=summary_path,
        universe_path=universe_path,
        params_path=params_path,
        qa_path=qa_path,
        debug_path=debug_path,
        network_path=tmp_path / "unused_network.parquet",
        postal_universe_path=universe_path,
        waive_onemap_validation=True,
        production_deploy_approved=True,
        owner_approval_note="owner approved release with 62 terminal OneMap invalid rows",
    )

    assert ok, waived_report
    assert waived_report["release_gate_passed"] is True
    assert waived_report["release_gate_status"] == "passed"
    waived_gate = waived_report["release_gate_summary"]["onemap_validation"]
    assert waived_gate["waived"] is True
    assert "62 terminal OneMap invalid rows" in waived_gate["waiver_reason"]
    assert waived_report["release_gate_summary"]["checks"]["onemap_validation_waived"] is True
    assert waived_report["release_gate_summary"]["required_owner_approvals"] == []
    assert waived_report["release_gate_summary"]["owner_approvals"]["production_deploy"] is True


def test_build_readiness_report_blocks_stale_same_bundle_onemap_report(tmp_path: Path):
    web_dir = tmp_path / "web"
    write_lamp_overlay_artifact(web_dir)
    bundle_dir = web_dir / "public" / "data" / "generated_test"
    export_current_fingerprint_bundle(bundle_dir)
    write_json(web_dir / "data-bundle.json", {"bundle": "generated_test"})
    write_json(
        tmp_path / ".vercel" / "project.json",
        {
            "projectId": "prj_test",
            "projectName": "sgshiok",
            "settings": {"rootDirectory": "web"},
        },
    )

    summary_path = tmp_path / "processed" / "postal_universe_candidate_full_registered_summary.json"
    universe_path = tmp_path / "processed" / "postal_universe_candidate_full_registered.parquet"
    write_json(
        summary_path,
        {
            "mode": "candidate_full_registered",
            "total_unique_postals": 1,
            "ready_to_score": 1,
            "needs_geocode": 0,
            "source_stats": [],
            "source_only_counts": {},
            "warnings": [],
        },
    )
    write_universe(universe_path, rows=1)
    params_path = tmp_path / "params.yaml"
    params_path.write_text("onemap:\n  client_delay_sec: 2.0\n", encoding="utf-8")
    qa_path = tmp_path / "qa" / "conflation_qa_island.json"
    debug_path = tmp_path / "qa" / "island_debug.geojson"
    write_production_island_qa(qa_path)
    debug_path.write_text('{"type":"FeatureCollection","features":[]}', encoding="utf-8")
    write_json(
        tmp_path / "qa" / "onemap_validation_cached_report_generated_test_old.json",
        {
            "bundle": "generated_test",
            "gate_passed": True,
            "sample_size": 2000,
            "cached_results": 2000,
            "missing_cache_results": 0,
            "invalid_cache_results": 0,
            "median_abs_pct_delta": 5.0,
            "p95_abs_pct_delta": 20.0,
            "thresholds": {
                "median_abs_pct_delta_max": 12.0,
                "p95_abs_pct_delta_max": 100.0,
            },
            "generated_at": "2020-01-01T00:00:00+00:00",
        },
    )

    ok, report = build_readiness_report(
        project_root=tmp_path,
        web_dir=web_dir,
        bundle_dir=bundle_dir,
        summary_path=summary_path,
        universe_path=universe_path,
        params_path=params_path,
        qa_path=qa_path,
        debug_path=debug_path,
        network_path=tmp_path / "unused_network.parquet",
        postal_universe_path=universe_path,
    )

    assert ok, report
    gate = report["release_gate_summary"]["onemap_validation"]
    assert gate["state"] == "passed_stale_report"
    assert gate["bundle_matches_active"] is True
    assert gate["fresh_for_active_bundle"] is False
    assert gate["gate_passed"] is True
    assert gate["same_bundle_fresh_gate_passed"] is False
    assert report["release_gate_passed"] is False
    assert report["release_gate_status"] == "blocked"


def test_build_readiness_report_warns_when_bundle_predates_network(tmp_path: Path):
    web_dir = tmp_path / "web"
    write_lamp_overlay_artifact(web_dir)
    bundle_dir = web_dir / "public" / "data" / "generated_test"
    export_current_fingerprint_bundle(bundle_dir)
    write_json(web_dir / "data-bundle.json", {"bundle": "generated_test"})
    write_json(
        tmp_path / ".vercel" / "project.json",
        {
            "projectId": "prj_test",
            "projectName": "sgshiok",
            "settings": {"rootDirectory": "web"},
        },
    )

    summary_path = tmp_path / "processed" / "postal_universe_candidate_full_registered_summary.json"
    universe_path = tmp_path / "processed" / "postal_universe_candidate_full_registered.parquet"
    write_json(
        summary_path,
        {
            "mode": "candidate_full_registered",
            "total_unique_postals": 1,
            "ready_to_score": 1,
            "needs_geocode": 0,
            "source_stats": [],
            "source_only_counts": {},
            "warnings": [],
        },
    )
    write_universe(universe_path, rows=1)
    params_path = tmp_path / "params.yaml"
    params_path.write_text("onemap:\n  client_delay_sec: 2.0\n", encoding="utf-8")
    qa_path = tmp_path / "qa" / "conflation_qa_island.json"
    debug_path = tmp_path / "qa" / "island_debug.geojson"
    write_production_island_qa(qa_path)
    debug_path.write_text('{"type":"FeatureCollection","features":[]}', encoding="utf-8")
    network_path = tmp_path / "processed" / "network_island.parquet"
    network_path.write_bytes(b"newer network")

    old_time = 1_800_000_000
    new_time = old_time + 120
    os.utime(bundle_dir / "manifest.json", (old_time, old_time))
    os.utime(network_path, (new_time, new_time))

    ok, report = build_readiness_report(
        project_root=tmp_path,
        web_dir=web_dir,
        bundle_dir=bundle_dir,
        summary_path=summary_path,
        universe_path=universe_path,
        params_path=params_path,
        qa_path=qa_path,
        debug_path=debug_path,
        network_path=network_path,
        postal_universe_path=universe_path,
    )

    assert ok, report
    assert report["bundle"]["freshness"]["active_bundle_reflects_current_network"] is False
    assert report["bundle"]["freshness"]["stale_seconds"] == 120
    assert any(
        "active bundle predates current network build" in warning for warning in report["warnings"]
    )


def test_build_readiness_report_warns_when_bundle_manifest_lacks_score_provenance(
    tmp_path: Path,
):
    web_dir = tmp_path / "web"
    write_lamp_overlay_artifact(web_dir)
    bundle_dir = web_dir / "public" / "data" / "generated_test"
    export_current_fingerprint_bundle(bundle_dir)
    manifest_path = bundle_dir / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["provenance"].pop("source_hashes", None)
    manifest["provenance"].pop("subscore_status", None)
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    write_json(web_dir / "data-bundle.json", {"bundle": "generated_test"})
    write_json(
        tmp_path / ".vercel" / "project.json",
        {
            "projectId": "prj_test",
            "projectName": "sgshiok",
            "settings": {"rootDirectory": "web"},
        },
    )

    summary_path = tmp_path / "processed" / "postal_universe_candidate_full_registered_summary.json"
    universe_path = tmp_path / "processed" / "postal_universe_candidate_full_registered.parquet"
    write_json(
        summary_path,
        {
            "mode": "candidate_full_registered",
            "total_unique_postals": 1,
            "ready_to_score": 1,
            "needs_geocode": 0,
            "source_stats": [],
            "source_only_counts": {},
            "warnings": [],
        },
    )
    write_universe(universe_path, rows=1)
    params_path = tmp_path / "params.yaml"
    params_path.write_text("onemap:\n  client_delay_sec: 2.0\n", encoding="utf-8")
    qa_path = tmp_path / "qa" / "conflation_qa_island.json"
    debug_path = tmp_path / "qa" / "island_debug.geojson"
    write_production_island_qa(qa_path)
    debug_path.write_text('{"type":"FeatureCollection","features":[]}', encoding="utf-8")

    ok, report = build_readiness_report(
        project_root=tmp_path,
        web_dir=web_dir,
        bundle_dir=bundle_dir,
        summary_path=summary_path,
        universe_path=universe_path,
        params_path=params_path,
        qa_path=qa_path,
        debug_path=debug_path,
        network_path=tmp_path / "unused_network.parquet",
        postal_universe_path=universe_path,
    )

    assert ok, report
    score_provenance = report["bundle"]["score_provenance"]
    assert score_provenance["ok"] is False
    assert score_provenance["state"] == "failed"
    assert score_provenance["source_hash_count"] == 0
    assert score_provenance["missing_subscore_status"] == [
        "access",
        "bus",
        "crossing",
        "heat",
        "rain",
    ]
    assert any(
        "active bundle manifest lacks score source hashes" in warning
        for warning in report["warnings"]
    )
    assert any(
        "complete locked-term status" in warning
        and "locked-term status: access, bus, crossing, heat, rain" in warning
        for warning in report["warnings"]
    )
    assert all("complete component-score status" not in warning for warning in report["warnings"])
    assert all("component-score status: access" not in warning for warning in report["warnings"])
    assert all("complete subscore status" not in warning for warning in report["warnings"])
    assert all("subscore status: access" not in warning for warning in report["warnings"])


def test_build_readiness_report_warns_when_bundle_lacks_scoring_fingerprints(
    tmp_path: Path,
):
    web_dir = tmp_path / "web"
    write_lamp_overlay_artifact(web_dir)
    bundle_dir = web_dir / "public" / "data" / "generated_test"
    export_current_fingerprint_bundle(bundle_dir)
    manifest_path = bundle_dir / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["provenance"].pop("scoring_fingerprints", None)
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    write_json(web_dir / "data-bundle.json", {"bundle": "generated_test"})
    write_json(
        tmp_path / ".vercel" / "project.json",
        {
            "projectId": "prj_test",
            "projectName": "sgshiok",
            "settings": {"rootDirectory": "web"},
        },
    )

    summary_path = tmp_path / "processed" / "postal_universe_candidate_full_registered_summary.json"
    universe_path = tmp_path / "processed" / "postal_universe_candidate_full_registered.parquet"
    write_json(
        summary_path,
        {
            "mode": "candidate_full_registered",
            "total_unique_postals": 1,
            "ready_to_score": 1,
            "needs_geocode": 0,
            "source_stats": [],
            "source_only_counts": {},
            "warnings": [],
        },
    )
    write_universe(universe_path, rows=1)
    params_path = tmp_path / "params.yaml"
    params_path.write_text("onemap:\n  client_delay_sec: 2.0\n", encoding="utf-8")
    qa_path = tmp_path / "qa" / "conflation_qa_island.json"
    debug_path = tmp_path / "qa" / "island_debug.geojson"
    write_production_island_qa(qa_path)
    debug_path.write_text('{"type":"FeatureCollection","features":[]}', encoding="utf-8")

    ok, report = build_readiness_report(
        project_root=tmp_path,
        web_dir=web_dir,
        bundle_dir=bundle_dir,
        summary_path=summary_path,
        universe_path=universe_path,
        params_path=params_path,
        qa_path=qa_path,
        debug_path=debug_path,
        network_path=tmp_path / "unused_network.parquet",
        postal_universe_path=universe_path,
    )

    assert ok, report
    score_provenance = report["bundle"]["score_provenance"]
    assert score_provenance["ok"] is False
    assert score_provenance["state"] == "failed"
    assert score_provenance["scoring_fingerprint_count"] == 0
    assert "pipeline\\scoring_integration.py" in score_provenance["missing_scoring_fingerprints"]
    assert any("scoring code/config fingerprints" in warning for warning in report["warnings"])


def test_bundle_score_provenance_reports_real_live_bundle_shape_as_legacy(
    tmp_path: Path,
):
    bundle_dir = tmp_path / "generated_test"
    export_current_fingerprint_bundle(bundle_dir)
    manifest_path = bundle_dir / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    legacy_live_bundle_provenance_shape(manifest)
    write_json(manifest_path, manifest)

    status = bundle_score_provenance_status(bundle_dir)

    assert status["ok"] is True
    assert status["state"] == "legacy"
    assert status["source_hash_count"] == len(SCORE_PROVENANCE_SOURCE_HASH_KEYS)
    assert status["source_hash_keys"] == sorted(SCORE_PROVENANCE_SOURCE_HASH_KEYS)
    assert status["expected_score_source_hash_keys"] == sorted(SCORE_PROVENANCE_SOURCE_HASH_KEYS)
    assert status["missing_expected_score_source_hashes"] == []
    assert status["unexpected_source_hashes"] == []
    assert status["non_score_reference_source_hashes"] == []
    assert status["scoring_fingerprint_count"] == 5
    assert status["missing_subscore_status"] == []
    assert "pipeline\\score_batch.py" in status["missing_scoring_fingerprints"]
    assert status["blocking_provenance_signals"] == []
    assert status["legacy_missing_capabilities"] == [
        "full 18-file scoring fingerprint set",
        "record-level scoring fingerprint digests",
        "record-level scoring input provenance",
        "record-level network provenance",
    ]
    assert "active bundle uses legacy provenance schema" in status["warning"]
    assert "record-level scoring input provenance" in status["warning"]


def test_bundle_score_provenance_reports_non_score_reference_hashes_without_blocking(
    tmp_path: Path,
):
    bundle_dir = tmp_path / "generated_test"
    export_current_fingerprint_bundle(bundle_dir)
    manifest_path = bundle_dir / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    provenance = manifest["provenance"]
    provenance["source_hashes"] = {
        source_key: f"{index:064x}"
        for index, source_key in enumerate(sorted(SCORE_PROVENANCE_SOURCE_HASH_KEYS), start=1)
    }
    provenance["source_hashes"]["leaf_area_index"] = "f" * 64
    write_json(manifest_path, manifest)

    status = bundle_score_provenance_status(bundle_dir)

    assert status["ok"] is True
    assert status["state"] == "passed"
    assert status["source_hash_count"] == len(SCORE_PROVENANCE_SOURCE_HASH_KEYS) + 1
    assert status["non_score_reference_source_hashes"] == ["leaf_area_index"]
    assert status["unexpected_source_hashes"] == ["leaf_area_index"]
    assert "non-score reference source hashes: leaf_area_index (NParks Leaf Area Index)" in status["warning"]


def test_bundle_score_provenance_blocks_missing_expected_score_source_hashes(
    tmp_path: Path,
):
    bundle_dir = tmp_path / "generated_test"
    export_current_fingerprint_bundle(bundle_dir)
    manifest_path = bundle_dir / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["provenance"]["source_hashes"] = {"leaf_area_index": "f" * 64}
    write_json(manifest_path, manifest)

    status = bundle_score_provenance_status(bundle_dir)

    assert status["ok"] is False
    assert status["state"] == "failed"
    assert status["source_hash_count"] == 1
    assert status["source_hash_keys"] == ["leaf_area_index"]
    assert status["missing_expected_score_source_hashes"] == sorted(
        SCORE_PROVENANCE_SOURCE_HASH_KEYS
    )
    assert status["unexpected_source_hashes"] == ["leaf_area_index"]
    assert status["non_score_reference_source_hashes"] == ["leaf_area_index"]
    assert "score source hashes: " in status["warning"]
    assert "leaf_area_index" in status["warning"]


def test_bundle_score_provenance_blocks_partial_modern_refresh_shape(
    tmp_path: Path,
):
    bundle_dir = tmp_path / "generated_test"
    export_current_fingerprint_bundle(bundle_dir)
    manifest_path = bundle_dir / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    provenance = manifest["provenance"]
    for field in [
        "scoring_fingerprint_algorithm",
        "scoring_fingerprint_digest",
        "record_scoring_fingerprint_digest",
        "score_batch_start_scoring_fingerprint_digest",
        "export_scoring_fingerprint_digest",
        "scoring_fingerprint_changed_during_run",
        "mixed_scoring_fingerprint_digests",
        "scoring_fingerprints_by_digest",
        "scoring_fingerprint_digests_missing_maps",
        "scoring_fingerprint_provenance_complete",
        "scoring_input_algorithm",
        "scoring_input_digest",
        "scoring_input_changed_during_run",
        "mixed_scoring_input_digests",
        "scoring_inputs_by_digest",
        "scoring_input_digests_missing_maps",
        "scoring_input_provenance_complete",
        "network_algorithm",
        "network_digest",
        "network_changed_during_run",
        "mixed_network_digests",
        "networks_by_digest",
        "network_digests_missing_maps",
        "network_provenance_complete",
    ]:
        provenance.pop(field, None)
    provenance["scoring_fingerprint_digest_counts"] = {"a" * 24: 1}
    provenance["records_missing_scoring_fingerprint_digest"] = 0
    provenance["scoring_input_digest_counts"] = {"b" * 24: 1}
    provenance["records_missing_scoring_input_digest"] = 1
    provenance["network_digest_counts"] = {"c" * 24: 1}
    provenance["records_missing_network_digest"] = 0
    write_json(manifest_path, manifest)

    status = bundle_score_provenance_status(bundle_dir)

    assert status["ok"] is False
    assert status["state"] == "failed"
    assert status["blocking_provenance_signals"] == [
        "incomplete_scoring_fingerprint_provenance",
        "incomplete_scoring_input_provenance",
        "incomplete_network_provenance",
    ]
    assert "scoring_fingerprint_changed_during_run" in status[
        "missing_scoring_provenance_fields"
    ]
    assert "scoring_inputs_by_digest" in status[
        "missing_scoring_input_provenance_fields"
    ]
    assert "networks_by_digest" in status["missing_network_provenance_fields"]
    assert status["records_missing_scoring_input_digest"] == 1
    assert "missing scoring fingerprint provenance fields" in status["warning"]
    assert "records missing scoring input digest: 1" in status["warning"]


def test_bundle_score_provenance_blocks_real_p10_stale_resume_shape(tmp_path: Path):
    bundle_dir = tmp_path / "generated_test"
    export_current_fingerprint_bundle(bundle_dir)
    manifest_path = bundle_dir / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    provenance = manifest["provenance"]
    old_digest = "06a6d36c1c8cabf7a5f1052a"
    new_digest = "1e312a49f13cdc8a42902b1e"
    provenance["scoring_fingerprint_digest"] = new_digest
    provenance["record_scoring_fingerprint_digest"] = None
    provenance["export_scoring_fingerprint_digest"] = new_digest
    provenance["scoring_fingerprint_digest_counts"] = {old_digest: 1200}
    provenance["scoring_fingerprint_changed_during_run"] = True
    provenance["mixed_scoring_fingerprint_digests"] = False
    provenance["scoring_fingerprint_provenance_complete"] = True
    provenance["scoring_input_digest_counts"] = {"2f7ec7ede5ff5ecebd5f85eb": 1200}
    provenance["scoring_input_changed_during_run"] = False
    provenance["mixed_scoring_input_digests"] = False
    provenance["scoring_input_provenance_complete"] = True
    provenance["network_digest_counts"] = {"e459daf2085fc291773765c1": 1200}
    provenance["network_changed_during_run"] = False
    provenance["mixed_network_digests"] = False
    provenance["network_provenance_complete"] = True
    write_json(manifest_path, manifest)

    status = bundle_score_provenance_status(bundle_dir)

    assert status["ok"] is False
    assert status["state"] == "failed"
    assert status["blocking_provenance_signals"] == [
        "scoring_fingerprint_changed_during_run"
    ]
    assert status["scoring_fingerprint_changed_during_run"] is True
    assert "scoring fingerprint changed during run" in status["warning"]


@pytest.mark.parametrize(
    ("field", "signal", "message"),
    [
        (
            "network_changed_during_run",
            "network_changed_during_run",
            "network changed during run",
        ),
        ("mixed_network_digests", "mixed_network_digests", "mixed network digests"),
        (
            "scoring_input_provenance_complete",
            "incomplete_scoring_input_provenance",
            "incomplete scoring input provenance",
        ),
        (
            "network_provenance_complete",
            "incomplete_network_provenance",
            "incomplete network provenance",
        ),
    ],
)
def test_bundle_score_provenance_blocks_export_integrity_signals(
    tmp_path: Path,
    field: str,
    signal: str,
    message: str,
):
    bundle_dir = tmp_path / "generated_test"
    export_current_fingerprint_bundle(bundle_dir)
    manifest_path = bundle_dir / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["provenance"][field] = not field.endswith("_complete")
    write_json(manifest_path, manifest)

    status = bundle_score_provenance_status(bundle_dir)

    assert status["ok"] is False
    assert status["state"] == "failed"
    assert status[signal] is True
    assert status["blocking_provenance_signals"] == [signal]
    assert message in status["warning"]


@pytest.mark.parametrize(
    ("field", "signal", "message"),
    [
        (
            "scoring_input_changed_during_run",
            "scoring_input_changed_during_run",
            "scoring input changed during run",
        ),
        (
            "mixed_scoring_input_digests",
            "mixed_scoring_input_digests",
            "mixed scoring input digests",
        ),
    ],
)
def test_bundle_score_provenance_warns_on_complete_partitioned_input_signals(
    tmp_path: Path,
    field: str,
    signal: str,
    message: str,
):
    bundle_dir = tmp_path / "generated_test"
    export_current_fingerprint_bundle(bundle_dir)
    manifest_path = bundle_dir / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["provenance"][field] = True
    manifest["provenance"]["scoring_input_provenance_complete"] = True
    write_json(manifest_path, manifest)

    status = bundle_score_provenance_status(bundle_dir)

    assert status["ok"] is True
    assert status["state"] == "passed"
    assert status[signal] is True
    assert status["blocking_provenance_signals"] == []
    assert status["warning_provenance_signals"] == [signal]
    assert message in status["warning"]
