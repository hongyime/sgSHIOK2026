import json
import re
from pathlib import Path

import pyarrow as pa
import pyarrow.parquet as pq

from pipeline.batch_plan import (
    FULL_BATCH_CHANGE_READINESS,
    RECENT_PUBLIC_SOURCE_GAP_SAMPLE,
    api_environment_readiness,
    build_batch_plan,
    default_universe_paths,
    format_duration,
)


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload), encoding="utf-8")


def write_universe(path: Path, rows: int = 2) -> None:
    table = pa.table(
        {
            "postal_code": [f"{index:06d}" for index in range(1, rows + 1)],
            "status": ["READY_TO_SCORE"] * rows,
        }
    )
    pq.write_table(table, path)


def write_params(path: Path, delay: float = 2.0) -> None:
    path.write_text(f"onemap:\n  client_delay_sec: {delay}\n", encoding="utf-8")


def write_island_qa(path: Path) -> None:
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
    }
    write_json(path, payload)


def test_format_duration_compacts_days_hours_minutes_seconds():
    assert format_duration(0) == "0s"
    assert format_duration(972) == "16m 12s"
    assert format_duration(17256) == "4h 47m 36s"
    assert format_duration(90061) == "1d 1h 1m 1s"


def test_default_universe_paths_prefers_completed_bounded_geocode_pair(tmp_path: Path):
    base_summary = tmp_path / "postal_universe_candidate_full_registered_summary.json"
    base_universe = tmp_path / "postal_universe_candidate_full_registered.parquet"
    geocoded_summary = tmp_path / "postal_universe_candidate_full_registered_geocoded_summary.json"
    geocoded_universe = tmp_path / "postal_universe_candidate_full_registered_geocoded.parquet"
    for path in [base_summary, base_universe, geocoded_summary, geocoded_universe]:
        path.write_text("placeholder", encoding="utf-8")

    assert default_universe_paths("candidate_full_registered", tmp_path) == (
        geocoded_summary,
        geocoded_universe,
    )


def test_default_universe_paths_requires_complete_geocoded_pair(tmp_path: Path):
    base_summary = tmp_path / "postal_universe_candidate_full_registered_summary.json"
    base_universe = tmp_path / "postal_universe_candidate_full_registered.parquet"
    geocoded_summary = tmp_path / "postal_universe_candidate_full_registered_geocoded_summary.json"
    for path in [base_summary, base_universe, geocoded_summary]:
        path.write_text("placeholder", encoding="utf-8")

    assert default_universe_paths("candidate_full_registered", tmp_path) == (
        base_summary,
        base_universe,
    )


def test_api_environment_readiness_reports_missing_keys_without_values():
    missing = api_environment_readiness({})

    assert missing["ready_for_api_collection"] is False
    assert missing["missing"] == [
        "LTA_DATAMALL_ACCOUNT_KEY",
        "ONEMAP_EMAIL",
        "ONEMAP_PASSWORD",
    ]
    assert missing["lta_datamall_account_key_present"] is False
    assert missing["onemap_credentials_present"] is False
    assert any("DataMall-backed source refreshes" in item for item in missing["warnings"])
    assert any("OneMap token-backed validation" in item for item in missing["warnings"])

    present = api_environment_readiness(
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


def test_batch_plan_reports_bounded_geocoding_and_keeps_gate_closed(tmp_path: Path):
    summary_path = tmp_path / "summary.json"
    universe_path = tmp_path / "universe.parquet"
    params_path = tmp_path / "params.yaml"
    qa_path = tmp_path / "conflation_qa_island.json"
    debug_path = tmp_path / "island_debug.geojson"
    write_json(
        summary_path,
        {
            "generated_at": "2026-07-27T10:00:00+00:00",
            "mode": "candidate_full_registered",
            "total_unique_postals": 2,
            "ready_to_score": 1,
            "needs_geocode": 1,
            "source_stats": [
                {
                    "source_key": "postal_universe_onemap_2020",
                    "raw_records": 2,
                    "valid_unique_postals": 2,
                    "records_with_coordinates": 1,
                    "sha256": "abc",
                    "path": "raw/example",
                    "url": "https://example.test/source",
                }
            ],
            "source_only_counts": {"postal_universe_onemap_2020": 1},
            "warnings": [
                "postal_universe_onemap_2020 is a third-party OneMap-derived 2020 dump and must be human-approved before full-batch use"
            ],
        },
    )
    write_universe(universe_path, rows=2)
    write_params(params_path, delay=2.0)
    write_island_qa(qa_path)
    debug_path.write_text('{"type":"FeatureCollection","features":[]}', encoding="utf-8")

    ok, report = build_batch_plan(
        mode="candidate_full_registered",
        summary_path=summary_path,
        universe_path=universe_path,
        params_path=params_path,
        qa_path=qa_path,
        debug_path=debug_path,
        environment={},
    )

    assert ok, report
    assert report["postal_universe"]["total_unique_postals"] == 2
    assert report["bounded_geocoding"]["requests"] == 1
    assert report["bounded_geocoding"]["minimum_wall_clock_seconds"] == 2.0
    assert report["bounded_geocoding"]["will_bruteforce"] is False
    assert report["checkpoint_gates"]["island_network_qa_ok"] is True
    assert report["checkpoint_gates"]["requires_human_approval_for_universe"] is True
    assert report["checkpoint_gates"]["full_batch_allowed_now"] is False
    assert report["full_batch_release_scope"] == {
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
    assert report["full_batch_change_readiness"] == FULL_BATCH_CHANGE_READINESS
    readiness_by_change = {
        item["change"]: item for item in report["full_batch_change_readiness"]
    }
    assert readiness_by_change["bus remodel"]["full_batch_inclusion_ready"] is True
    assert readiness_by_change["network conflation repair"]["full_batch_inclusion_ready"] is True
    assert (
        readiness_by_change["NO_TRANSIT_IN_RANGE partial-score fix"][
            "full_batch_inclusion_ready"
        ]
        is False
    )
    assert readiness_by_change["promoted postal universe v2"]["status"] == (
        "not_approved_from_current_sample"
    )
    assert (
        "not every bundled full-batch change has prerequisite subset evidence"
        in report["checkpoint_gates"]["blockers"]
    )
    assert (
        "frozen v1 third-party OneMap-derived 2020 source"
        in report["checkpoint_gates"]["blockers"][2]
    )
    assert (
        report["source_policy"]["frozen_v1"]
        == "frozen v1 remains the 124443-record June 2020 OneMap-derived universe"
    )
    assert "candidate-source-first" in report["source_policy"]["v2"]
    assert report["source_policy"]["recent_public_source_gap_sample"] == {
        "measurement": "P19 v2 28 Aug 2026 public-source gap sample",
        "generated_at_utc": "2026-08-28T21:15:15.685030+00:00",
        "currentness": {
            "status": "fresh",
            "fresh_for_current_gap_sizing": True,
            "stale_after_days": 7,
            "stale_after_utc": "2026-09-04T21:15:15.685030+00:00",
            "dynamic_status_command": "uv run python run.py p19-gap-status",
            "reason": (
                "the cached v2 sample is fresh current-source evidence; promotion still "
                "requires explicit owner approval and candidate-source-first scope"
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
    assert report["source_policy"]["osm_addr_postcode_registry"] == {
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
    assert report["source_policy"]["datamall_geospatial_discovery"] == {
        "measurement": "P682/P683/P750 DataMall geospatial discovery-only probe",
        "checked_at_local_date": "2026-08-28",
        "command": "uv run python run.py check --geospatial-discovery-only",
        "payload_downloads": False,
        "manifest_writes": False,
        "changed_sources": [],
        "matched_sources": ["covered_linkway", "overhead_bridge_underpass", "traffic_signals"],
        "verdict": "discovery URLs still match frozen v1; stale payload ages still require a new numbered input version before any refresh",
    }
    assert report["source_policy"]["non_score_reference_sources"] == {
        "leaf_area_index": {
            "role": "source freshness reference table only",
            "reason": "species/generic LAI table; not route-level geometry or shade-proxy geometry",
            "score_provenance": "excluded from score source hashes",
            "promotion_requires": "separate species-located canopy inventory and approved model design",
        }
    }
    assert report["source_policy"]["night_lighting_layer"] == {
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
    assert report["source_policy"]["source_freshness"] == {
        "command": "uv run python run.py check --freshness-only",
        "scope": "manifest_only",
        "upstream_urls_probed": False,
        "writes_manifest": False,
        "grouped_summaries_include_source_names": True,
        "role": "release context, not a corruption or hash-repair signal",
        "stale_result": "report and plan a versioned refresh; do not mutate frozen v1 in place",
    }
    assert (
        report["source_policy"]["onemap_search_role"]
        == "candidate validation/geocoding, not national enumeration"
    )
    assert report["source_policy"]["onemap_search_controls"] == {
        "token_required": True,
        "token_refresh_hours": 72,
        "documented_token_authenticated_call_limit_cap": 250,
        "higher_limit_requires_sla_case_by_case_approval": True,
    }
    assert report["api_environment"]["ready_for_api_collection"] is False
    assert report["api_environment"]["missing"] == [
        "LTA_DATAMALL_ACCOUNT_KEY",
        "ONEMAP_EMAIL",
        "ONEMAP_PASSWORD",
    ]
    assert any("DataMall-backed source refreshes" in item for item in report["warnings"])


def test_batch_plan_treats_completed_geocode_fill_remaining_rows_as_unresolved(
    tmp_path: Path,
):
    summary_path = tmp_path / "summary.json"
    universe_path = tmp_path / "universe.parquet"
    params_path = tmp_path / "params.yaml"
    qa_path = tmp_path / "conflation_qa_island.json"
    debug_path = tmp_path / "island_debug.geojson"
    write_json(
        summary_path,
        {
            "generated_at": "2026-07-27T10:00:00+00:00",
            "mode": "candidate_full_registered",
            "total_unique_postals": 3,
            "ready_to_score": 2,
            "needs_geocode": 1,
            "geocode_fill": {
                "ok": True,
                "cache_db": r"C:\shiok\raw\geocode_cache.db",
                "input": r"C:\shiok\processed\postal_universe_candidate_full_registered.parquet",
                "output": (
                    r"C:\shiok\processed"
                    r"\postal_universe_candidate_full_registered_geocoded.parquet"
                ),
                "summary": (
                    r"C:\shiok\processed"
                    r"\postal_universe_candidate_full_registered_geocoded_summary.json"
                ),
                "queued_postals": 2,
                "http_requests": 2,
                "cache_successes": 0,
                "cache_failures": 0,
                "filled_successes": 1,
                "status_counts": {"SUCCESS": 1, "NOT_FOUND": 1},
            },
            "source_stats": [],
            "source_only_counts": {},
            "warnings": [],
        },
    )
    write_universe(universe_path, rows=3)
    write_params(params_path, delay=2.0)
    write_island_qa(qa_path)
    debug_path.write_text('{"type":"FeatureCollection","features":[]}', encoding="utf-8")

    ok, report = build_batch_plan(
        mode="candidate_full_registered",
        summary_path=summary_path,
        universe_path=universe_path,
        params_path=params_path,
        qa_path=qa_path,
        debug_path=debug_path,
        environment={
            "LTA_DATAMALL_ACCOUNT_KEY": "test-lta",
            "ONEMAP_EMAIL": "owner@example.test",
            "ONEMAP_PASSWORD": "test-onemap",
        },
    )

    assert ok, report
    assert report["bounded_geocoding"]["requests"] == 0
    assert report["bounded_geocoding"]["unresolved_after_bounded_geocode"] == 1
    assert report["bounded_geocoding"]["completed_fill_cache_versioned"] is False
    assert report["bounded_geocoding"]["completed_fill"]["cache_db"] == r"raw\geocode_cache.db"
    assert report["bounded_geocoding"]["completed_fill"]["input"] == (
        r"processed\postal_universe_candidate_full_registered.parquet"
    )
    assert report["bounded_geocoding"]["completed_fill"]["output"] == (
        r"processed\postal_universe_candidate_full_registered_geocoded.parquet"
    )
    assert report["bounded_geocoding"]["completed_fill"]["summary"] == (
        r"processed\postal_universe_candidate_full_registered_geocoded_summary.json"
    )
    assert r"C:\shiok" not in json.dumps(report["bounded_geocoding"]["completed_fill"])
    assert report["scoring_batch"]["would_score_after_bounded_geocoding"] == 2
    assert report["scoring_batch"]["would_emit_records"] == 3
    assert report["scoring_batch"]["would_emit_not_yet_scored"] == 1
    assert "1 source-derived postals remain unresolved" in report["warnings"][0]
    assert any(
        "completed bounded geocode fill used an unversioned cache path" in blocker
        for blocker in report["checkpoint_gates"]["blockers"]
    )
    assert report["api_environment"]["ready_for_api_collection"] is True


def test_batch_plan_reports_missing_island_qa_as_blocker_not_artifact_error(tmp_path: Path):
    summary_path = tmp_path / "summary.json"
    universe_path = tmp_path / "universe.parquet"
    params_path = tmp_path / "params.yaml"
    write_json(
        summary_path,
        {
            "mode": "official_current",
            "total_unique_postals": 2,
            "ready_to_score": 2,
            "needs_geocode": 0,
            "source_stats": [],
            "source_only_counts": {},
            "warnings": [],
        },
    )
    write_universe(universe_path, rows=2)
    write_params(params_path, delay=2.0)

    ok, report = build_batch_plan(
        mode="official_current",
        summary_path=summary_path,
        universe_path=universe_path,
        params_path=params_path,
        qa_path=tmp_path / "missing_qa.json",
        debug_path=tmp_path / "missing_debug.geojson",
    )

    assert ok, report
    assert report["errors"] == []
    assert report["checkpoint_gates"]["island_network_qa_ok"] is False
    assert "island-wide network QA is not green" in report["checkpoint_gates"]["blockers"]


def test_batch_plan_does_not_block_on_missing_rebuildable_debug_geojson(tmp_path: Path):
    summary_path = tmp_path / "summary.json"
    universe_path = tmp_path / "universe.parquet"
    params_path = tmp_path / "params.yaml"
    qa_path = tmp_path / "conflation_qa_island.json"
    debug_path = tmp_path / "island_debug.geojson"
    write_json(
        summary_path,
        {
            "mode": "official_current",
            "total_unique_postals": 2,
            "ready_to_score": 2,
            "needs_geocode": 0,
            "source_stats": [],
            "source_only_counts": {},
            "warnings": [],
        },
    )
    write_universe(universe_path, rows=2)
    write_params(params_path, delay=2.0)
    write_island_qa(qa_path)

    ok, report = build_batch_plan(
        mode="official_current",
        summary_path=summary_path,
        universe_path=universe_path,
        params_path=params_path,
        qa_path=qa_path,
        debug_path=debug_path,
    )

    assert ok, report
    assert report["checkpoint_gates"]["island_network_qa_ok"] is True
    assert report["checkpoint_gates"]["island_network_debug_required_for_plan"] is False
    assert report["checkpoint_gates"]["island_network_debug_required_for_full_batch_execution"] is True
    assert "island-wide network QA is not green" not in report["checkpoint_gates"]["blockers"]
    assert report["island_network_qa"]["errors"] == []
    assert not debug_path.exists()


def test_batch_plan_rejects_missing_or_mismatched_universe_artifact(tmp_path: Path):
    summary_path = tmp_path / "summary.json"
    universe_path = tmp_path / "universe.parquet"
    params_path = tmp_path / "params.yaml"
    write_json(
        summary_path,
        {
            "mode": "official_current",
            "total_unique_postals": 3,
            "ready_to_score": 3,
            "needs_geocode": 0,
            "source_stats": [],
            "source_only_counts": {},
            "warnings": [],
        },
    )
    write_universe(universe_path, rows=2)
    write_params(params_path, delay=2.0)

    ok, report = build_batch_plan(
        mode="official_current",
        summary_path=summary_path,
        universe_path=universe_path,
        params_path=params_path,
        qa_path=tmp_path / "missing_qa.json",
        debug_path=tmp_path / "missing_debug.geojson",
    )

    assert not ok
    assert "postal universe row mismatch: parquet has 2, summary has 3" in report["errors"]


def test_browser_known_p19_missing_postals_match_structured_policy() -> None:
    page_source = (Path(__file__).resolve().parents[1] / "web" / "app" / "page.tsx").read_text(
        encoding="utf-8"
    )
    browser_mapping = dict(
        re.findall(
            r'"(\d{6})": "(HDB 2021-2026 geocoded rows|MCST 2021-2026 proxy rows)"',
            page_source,
        )
    )
    source_labels = {
        "hdb_2021_2026_geocoded": "HDB 2021-2026 geocoded rows",
        "mcst_2021_2026": "MCST 2021-2026 proxy rows",
    }
    expected = {
        postal: source_labels[source_key]
        for source_key, postals in RECENT_PUBLIC_SOURCE_GAP_SAMPLE[
            "missing_postals_by_source"
        ].items()
        for postal in postals
    }

    assert browser_mapping == expected
    for postal in RECENT_PUBLIC_SOURCE_GAP_SAMPLE["missing_postals_by_source"][
        "mcst_2021_2026"
    ]:
        assert f'"{postal}":' in page_source
    assert "unvalidated MCST proxy row" in page_source
    assert "source-quality evidence rather than a confirmed missing address" in page_source
    assert "cached recent public-source misses" not in page_source
