import json
import os
from pathlib import Path

from scripts.analysis import p10_compare_subset_outputs as p10_compare
from scripts.analysis import p10_manifest_network_block as p10_network_block
from scripts.analysis import p10_network_payload_cost as p10_payload_cost
from scripts.analysis import p10_provenance_coverage as p10_provenance
from scripts.analysis import p19_universe_gap_measurement as p19
from scripts.analysis import p19_mcst_missing_locations as p379
from scripts.analysis import p125_osm_postcode_status as p125
from scripts.analysis import universe_measurement_status as universe_status


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def test_universe_status_consolidates_cached_measurements(monkeypatch) -> None:
    monkeypatch.setattr(
        universe_status.p19,
        "cache_status_report",
        lambda: {
            "will_call_apis": False,
            "will_write_files": False,
            "evidence_split": {
                "confirmed_missing_address_rows": 6,
                "source_quality_warning_rows": 2,
            },
            "release_policy": {
                "measurement_label": "16 Aug 2026 public-source sample",
                "status": "sample_classified",
                "summary": "6 coordinate-backed HDB missing rows confirmed",
            },
            "files": {
                "summary": {
                    "combined_recent_completion_signal": {
                        "rows_with_postal": 976,
                    },
                },
            },
            "missing_row_detail": {
                "missing_unique_postals": 8,
                "missing_postals": ["521400", "522400", "523400"],
                "missing_development_clusters": [
                    {
                        "development": "SUN PLAZA SPRING",
                        "source": "hdb_2021_2026_geocoded",
                        "missing_rows": 3,
                        "missing_postals": ["521400", "522400", "523400"],
                        "years": [2026],
                    }
                ],
            },
        },
    )
    monkeypatch.setattr(
        universe_status.p125,
        "status_report",
        lambda: {
            "measurement": "P125 20 Aug 2026 Overpass addr:postcode coverage cross-check",
            "will_call_apis": False,
            "will_write_files": False,
            "coverage": {
                "osm_valid_distinct_postcodes": 25879,
                "osm_valid_in_v1": 25873,
                "osm_valid_not_in_v1": 6,
                "v1_distinct_postals": 124443,
                "osm_coverage_of_v1_pct": 20.791045,
                "source_role": "geometry evidence and coverage cross-check",
                "registry_policy": "not the address registry",
                "verdict": "not sufficient as primary Singapore address registry",
            },
        },
    )

    report = universe_status.status_report()

    assert report["will_call_apis"] is False
    assert report["will_write_files"] is False
    assert (
        report["measurements"]["recent_public_source_gap_sample"][
            "confirmed_missing_address_rows"
        ]
        == 6
    )
    assert (
        report["measurements"]["recent_public_source_gap_sample"][
            "source_quality_warning_rows"
        ]
        == 2
    )
    assert (
        report["measurements"]["osm_addr_postcode_coverage"]["osm_valid_not_in_v1"]
        == 6
    )
    assert (
        report["measurements"]["recent_public_source_gap_sample"][
            "sample_rows_with_postal"
        ]
        == 976
    )
    assert (
        report["measurements"]["recent_public_source_gap_sample"][
            "sample_missing_unique_postals"
        ]
        == 8
    )
    assert report["measurements"]["recent_public_source_gap_sample"][
        "sample_missing_postals"
    ] == ["521400", "522400", "523400"]
    assert report["measurements"]["recent_public_source_gap_sample"][
        "sample_missing_development_clusters"
    ] == [
        {
            "development": "SUN PLAZA SPRING",
            "source": "hdb_2021_2026_geocoded",
            "missing_rows": 3,
            "missing_postals": ["521400", "522400", "523400"],
            "years": [2026],
        }
    ]
    assert (
        report["measurements"]["recent_public_source_gap_sample"][
            "confirmed_missing_address_row_rate_pct"
        ]
        == 0.614754
    )
    assert (
        report["measurements"]["recent_public_source_gap_sample"][
            "missing_or_source_quality_warning_row_rate_pct"
        ]
        == 0.819672
    )
    assert report["measurements"]["recent_public_source_gap_sample"][
        "directional_if_sample_rate_applied_to_v1_distinct_postals"
    ] == {
        "basis": (
            "Directional scale only: applies recent-completion sample row rates "
            "to the frozen-v1 distinct postal count; it is not a measured full-universe gap."
        ),
        "v1_distinct_postals": 124443,
        "confirmed_missing_address_rows_estimate": 765,
        "missing_or_source_quality_warning_rows_estimate": 1020,
    }
    assert (
        report["measurements"]["osm_addr_postcode_coverage"][
            "osm_valid_not_in_v1_as_share_of_v1_pct"
        ]
        == 0.004821
    )
    assert "do not approve a v2 promotion" in report["decision_boundary"]


def test_p10_provenance_coverage_names_leaf_area_index_policy() -> None:
    source = (PROJECT_ROOT / "scripts" / "analysis" / "p10_provenance_coverage.py").read_text(
        encoding="utf-8"
    )

    assert "leaf_area_index is a freshness-only non-score reference" in source
    assert "path only in legacy published bundle; sha256,row_count,digest in P9+ manifests" in source
    assert "path only in legacy published bundle; sha256,row_count,digest in P10+ manifests" in source
    assert "path only in active bundle" not in source
    assert "hash-shipped but unconsumed" not in source


def test_p10_coordinate_identity_names_legacy_published_bundle() -> None:
    source = (PROJECT_ROOT / "scripts" / "analysis" / "p10_coordinate_identity.py").read_text(
        encoding="utf-8"
    )

    assert "Read-only P10 coordinate identity analysis for the legacy published bundle." in source
    assert "Read-only P10 coordinate identity analysis for the active bundle." not in source


def test_p10_unresolved_network_probe_writes_only_to_temporary_directory() -> None:
    source = (
        PROJECT_ROOT / "scripts" / "analysis" / "p10_unresolved_network_probe.py"
    ).read_text(encoding="utf-8")

    assert "tempfile.TemporaryDirectory" in source
    assert "qa/p10_network_provenance_20260813/unresolved_network_probe" not in source


def test_p10_analysis_scripts_resolve_default_inputs_from_project_root(
    tmp_path: Path, monkeypatch
) -> None:
    monkeypatch.chdir(tmp_path)

    for script_name in [
        "p10_compare_subset_outputs.py",
        "p10_manifest_network_block.py",
        "p10_network_payload_cost.py",
        "p10_provenance_coverage.py",
    ]:
        source = (PROJECT_ROOT / "scripts" / "analysis" / script_name).read_text(
            encoding="utf-8"
        )

        assert "PROJECT_ROOT = Path(__file__).resolve().parents[2]" in source

    compare_source = (
        PROJECT_ROOT / "scripts" / "analysis" / "p10_compare_subset_outputs.py"
    ).read_text(encoding="utf-8")
    assert 'BASE = Path("qa/p9_input_provenance_20260813/bundle")' not in compare_source
    assert 'NEW = Path("qa/p10_network_provenance_20260813/exported_bundle")' not in compare_source
    assert p10_compare.BASE == PROJECT_ROOT / "qa" / "p9_input_provenance_20260813" / "bundle"
    assert (
        p10_compare.NEW
        == PROJECT_ROOT / "qa" / "p10_network_provenance_20260813" / "exported_bundle"
    )
    assert (
        p10_network_block.BEFORE
        == PROJECT_ROOT / "qa" / "p9_input_provenance_20260813" / "bundle" / "manifest.json"
    )
    assert (
        p10_network_block.AFTER
        == PROJECT_ROOT
        / "qa"
        / "p10_network_provenance_20260813"
        / "exported_bundle"
        / "manifest.json"
    )
    assert (
        p10_payload_cost.BUNDLE
        == PROJECT_ROOT / "web" / "public" / "data" / "generated_20260805_prefer_scored_routed"
    )
    assert p10_provenance.SOURCES_CONFIG == PROJECT_ROOT / "pipeline" / "config" / "sources.yaml"
    assert p10_provenance.RAW_MANIFEST == PROJECT_ROOT / "raw" / "manifest.json"


def test_p19_cache_status_only_reports_existing_measurement_caches(
    tmp_path: Path, monkeypatch
) -> None:
    qa_dir = tmp_path / "qa" / "p19"
    hdb_cache = qa_dir / "hdb_2021_2026_onemap_geocode_cache.json"
    overpass_cache = qa_dir / "overpass_addr_postcodes_cache.json"
    summary = qa_dir / "universe_gap_measurement_summary.json"
    detail = qa_dir / "universe_gap_measurement_detail.json"
    p379_dir = tmp_path / "qa" / "p379"
    p379_report = p379_dir / "p19_mcst_missing_locations_report.json"
    p379_cache = p379_dir / "p19_mcst_missing_onemap_cache.json"
    qa_dir.mkdir(parents=True)
    p379_dir.mkdir(parents=True)
    hdb_cache.write_text(
        json.dumps(
            {
                "1 TEST ROAD": {"found": 1},
                "400A TAMPINES ST 41": {
                    "results": [
                        {
                            "POSTAL": "521400",
                            "LATITUDE": "1.3585795422464",
                            "LONGITUDE": "103.949531894985",
                        }
                    ]
                },
            }
        ),
        encoding="utf-8",
    )
    overpass_cache.write_text(
        json.dumps({"queried_at_utc": "2026-08-21T00:00:00+00:00", "postcodes": ["123456"]}),
        encoding="utf-8",
    )
    summary.write_text(
        json.dumps(
            {
                "generated_at_utc": "2026-08-21T00:01:00+00:00",
                "combined_recent_completion_signal": {
                    "rows_with_postal": 976,
                    "missing_rows": 8,
                },
                "hdb_2021_2026_geocoded": {
                    "missing_postals": ["521400", "522400"],
                },
                "mcst_2021_2026": {
                    "missing_postals": ["935456"],
                },
            }
        ),
        encoding="utf-8",
    )
    detail.write_text(
        json.dumps(
            {
                "hdb_rows": [
                    {
                        "blk_no": "400A",
                        "street": "TAMPINES ST 41",
                        "year_completed": 2026,
                        "total_dwelling_units": 110,
                        "postal": "521400",
                        "query": "400A TAMPINES ST 41",
                        "searchval": "SUN PLAZA SPRING",
                        "in_v1": False,
                    },
                    {"postal": "341111", "in_v1": True},
                ],
                "mcst_rows": [
                    {
                        "usr_mcno": "4918",
                        "development_name": "MYRA",
                        "development_location": "9 MEYAPPA CHETTIAR ROAD 935456",
                        "postal": "935456",
                        "mc_form_year": 2024,
                        "in_v1": False,
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    p379_cache.write_text(json.dumps({"queries": {}}), encoding="utf-8")
    p379_report.write_text(
        json.dumps(
            {
                "mcst_missing_rows": 1,
                "located_rows": 0,
                "unlocated_rows": 1,
                "will_score": False,
                "will_export": False,
                "will_mutate_p19": False,
                "unlocated": [
                    {
                        "development_name": "MYRA",
                        "postal": "935456",
                        "candidate_postals_by_query": {
                            "9 MEYAPPA CHETTIAR ROAD 935456": ["935999"],
                            "935456": [],
                        },
                    }
                ],
            }
        ),
        encoding="utf-8",
    )

    monkeypatch.setattr(p19, "QA_DIR", qa_dir)
    monkeypatch.setattr(p19, "HDB_GEOCODE_CACHE", hdb_cache)
    monkeypatch.setattr(p19, "OVERPASS_CACHE", overpass_cache)
    monkeypatch.setattr(p19, "SUMMARY_OUTPUT", summary)
    monkeypatch.setattr(p19, "DETAIL_OUTPUT", detail)
    monkeypatch.setattr(p19, "P379_MCST_LOCATION_REPORT", p379_report)
    monkeypatch.setattr(p19, "P379_MCST_LOCATION_CACHE", p379_cache)
    monkeypatch.setattr(p19, "PROJECT_ROOT", tmp_path)

    report = p19.cache_status_report(now=p19.dt.datetime(2026, 8, 22, 12, 0, tzinfo=p19.dt.UTC))

    assert report["mode"] == "cache_status_only"
    assert report["will_call_apis"] is False
    assert report["will_write_files"] is False
    assert report["files"]["hdb_onemap_geocode_cache"]["cached_query_count"] == 2
    assert report["files"]["hdb_onemap_geocode_cache"]["sample_cached_queries"] == [
        "1 TEST ROAD",
        "400A TAMPINES ST 41",
    ]
    assert "top_level_keys" not in report["files"]["hdb_onemap_geocode_cache"]
    assert report["files"]["overpass_addr_postcodes_cache"]["cached_postcode_count"] == 1
    assert report["files"]["overpass_addr_postcodes_cache"]["age_days"] == 1.5
    assert report["files"]["summary"]["combined_recent_completion_signal"] == {
        "rows_with_postal": 976,
        "missing_rows": 8,
    }
    assert report["files"]["summary"]["missing_postals_by_source"] == {
        "hdb_2021_2026_geocoded": ["521400", "522400"],
        "mcst_2021_2026": ["935456"],
    }
    assert report["files"]["summary"]["age_days"] == 1.499
    assert report["files"]["detail"]["hdb_row_count"] == 2
    assert report["files"]["detail"]["mcst_row_count"] == 1
    assert report["missing_row_detail"] == {
        "detail_path": "qa/p19/universe_gap_measurement_detail.json",
        "detail_exists": True,
        "missing_rows": 2,
        "missing_unique_postals": 2,
        "missing_postals": ["521400", "935456"],
        "missing_development_clusters": [
            {
                "development": "MYRA",
                "source": "mcst_2021_2026",
                "missing_rows": 1,
                "missing_postals": ["935456"],
                "years": [2024],
            },
            {
                "development": "SUN PLAZA SPRING",
                "source": "hdb_2021_2026_geocoded",
                "missing_rows": 1,
                "missing_postals": ["521400"],
                "years": [2026],
                "coordinate_source": "cached_onemap_search_result",
                "coordinate_count": 1,
                "centroid": {"lat": 1.3585795, "lon": 103.9495319},
                "bbox": {
                    "min_lat": 1.3585795,
                    "min_lon": 103.9495319,
                    "max_lat": 1.3585795,
                    "max_lon": 103.9495319,
                },
            },
        ],
        "missing_rows_by_source": {
            "hdb_2021_2026_geocoded": [
                {
                    "postal": "521400",
                    "year_completed": 2026,
                    "blk_no": "400A",
                    "street": "TAMPINES ST 41",
                    "searchval": "SUN PLAZA SPRING",
                    "total_dwelling_units": 110,
                }
            ],
            "mcst_2021_2026": [
                {
                    "postal": "935456",
                    "mc_form_year": 2024,
                    "development_name": "MYRA",
                    "development_location": "9 MEYAPPA CHETTIAR ROAD 935456",
                    "usr_mcno": "4918",
                }
            ],
        },
        "missing_rows_by_year": {"2024": 1, "2026": 1},
    }
    assert report["mcst_proxy_location_probe"] == {
        "report_path": "qa/p379/p19_mcst_missing_locations_report.json",
        "report_exists": True,
        "cache_path": "qa/p379/p19_mcst_missing_onemap_cache.json",
        "cache_exists": True,
        "mcst_missing_rows": 1,
        "located_rows": 0,
        "unlocated_rows": 1,
        "unlocated_developments": ["MYRA"],
        "conflicting_candidate_postals": {
            "MYRA": {
                "recorded_postal": "935456",
                "candidate_postals": ["935999"],
            }
        },
        "will_score": False,
        "will_export": False,
        "will_mutate_p19": False,
    }
    assert report["evidence_split"] == {
        "detail_exists": True,
        "coordinate_backed_hdb_missing_rows": 1,
        "unvalidated_mcst_proxy_rows": 1,
        "confirmed_missing_address_rows": 1,
        "source_quality_warning_rows": 1,
    }
    assert report["release_policy"] == {
        "measurement_label": "16 Aug 2026 public-source sample",
        "status": "sample_classified",
        "confirmed_missing_address_rows": 1,
        "source_quality_warning_rows": 1,
        "summary": (
            "1 coordinate-backed HDB missing row confirmed as address-universe gap; "
            "1 MCST proxy row remains a source-quality warning"
        ),
    }


def test_p125_osm_status_reports_cached_overpass_coverage(tmp_path: Path) -> None:
    qa_dir = tmp_path / "qa" / "p125"
    qa_dir.mkdir(parents=True)
    overpass_output = qa_dir / "overpass_sg_addr_postcode.json"
    overpass_query = qa_dir / "overpass_sg_addr_postcode.query"
    universe_path = tmp_path / "processed" / "postal_universe.parquet"
    universe_path.parent.mkdir()
    overpass_query.write_text("[out:json];", encoding="utf-8")
    overpass_output.write_text(
        json.dumps(
            {
                "elements": [
                    {"type": "node", "tags": {"addr:postcode": "123456"}},
                    {"type": "way", "tags": {"addr:postcode": "234567"}},
                    {"type": "relation", "tags": {"addr:postcode": "bad"}},
                ]
            }
        ),
        encoding="utf-8",
    )
    os.utime(overpass_query, (1797768000, 1797768000))
    os.utime(overpass_output, (1797768000, 1797768000))
    pd = p125.pd
    pd.DataFrame({"POSTAL": ["123456", "345678"]}).to_parquet(universe_path, index=False)
    os.utime(universe_path, (1797768000, 1797768000))

    report = p125.status_report(
        overpass_output=overpass_output,
        overpass_query=overpass_query,
        universe_path=universe_path,
        now=p125.dt.datetime(2026, 12, 21, 12, 0, tzinfo=p125.dt.UTC),
    )

    assert report["mode"] == "p125_osm_status"
    assert report["measurement"] == "P125 20 Aug 2026 Overpass addr:postcode coverage cross-check"
    assert report["will_call_apis"] is False
    assert report["will_write_files"] is False
    assert report["files"]["overpass_output"]["overpass_elements"] == 3
    assert report["files"]["overpass_output"]["age_days"] == 1.0
    assert report["files"]["overpass_query"]["age_days"] == 1.0
    assert report["files"]["overpass_output"]["overpass_elements_by_type"] == {
        "node": 1,
        "relation": 1,
        "way": 1,
    }
    assert report["files"]["overpass_output"]["valid_distinct_postcodes"] == 2
    assert report["files"]["overpass_output"]["invalid_distinct_count"] == 1
    assert report["files"]["overpass_output"]["invalid_distinct_sample"] == ["bad"]
    assert report["files"]["v1_universe"]["row_count"] == 2
    assert report["files"]["v1_universe"]["age_days"] == 1.0
    assert report["files"]["v1_universe"]["postal_column"] == "POSTAL"
    assert report["coverage"] == {
        "osm_valid_distinct_postcodes": 2,
        "v1_distinct_postals": 2,
        "osm_valid_in_v1": 1,
        "osm_valid_not_in_v1": 1,
        "v1_not_in_osm_valid": 1,
        "osm_coverage_of_v1_pct": 50.0,
        "osm_only_sample": ["234567"],
        "v1_only_sample": ["345678"],
        "source_role": "geometry evidence and coverage cross-check",
        "registry_policy": "not the address registry",
        "verdict": "not sufficient as primary Singapore address registry",
    }


def test_p379_locates_mcst_missing_rows_from_onemap_cache(tmp_path: Path) -> None:
    detail_path = tmp_path / "qa" / "p19" / "universe_gap_measurement_detail.json"
    cache_path = tmp_path / "qa" / "p379" / "cache.json"
    report_path = tmp_path / "qa" / "p379" / "report.json"
    detail_path.parent.mkdir(parents=True)
    detail_path.write_text(
        json.dumps(
            {
                "mcst_rows": [
                    {
                        "usr_mcno": "4918",
                        "development_name": "MYRA",
                        "development_location": "9 MEYAPPA CHETTIAR ROAD 935456",
                        "postal": "935456",
                        "mc_form_year": 2024,
                        "in_v1": False,
                    },
                    {
                        "usr_mcno": "1000",
                        "development_name": "INSIDE",
                        "development_location": "1 TEST ROAD 123456",
                        "postal": "123456",
                        "mc_form_year": 2024,
                        "in_v1": True,
                    },
                ]
            }
        ),
        encoding="utf-8",
    )
    cache_path.parent.mkdir(parents=True)
    cache_path.write_text(
        json.dumps(
            {
                "9 MEYAPPA CHETTIAR ROAD 935456": {
                    "status_code": 200,
                    "found": 1,
                    "results": [
                        {
                            "POSTAL": "935456",
                            "SEARCHVAL": "MYRA",
                            "ADDRESS": "9 MEYAPPA CHETTIAR ROAD MYRA SINGAPORE 935456",
                            "LATITUDE": "1.331234567",
                            "LONGITUDE": "103.882345678",
                        }
                    ],
                },
                "935456": {"status_code": 200, "found": 0, "results": []},
            }
        ),
        encoding="utf-8",
    )

    report = p379.build_report(
        detail_path=detail_path,
        cache_path=cache_path,
        report_path=report_path,
        delay_sec=0.0,
    )

    assert report["mode"] == "p379_p19_mcst_missing_locations"
    assert report["will_score"] is False
    assert report["will_export"] is False
    assert report["will_mutate_p19"] is False
    assert report["mcst_missing_rows"] == 1
    assert report["located_rows"] == 1
    assert report["unlocated_rows"] == 0
    assert report["cache_written"] is False
    assert report["located"] == [
        {
            "postal": "935456",
            "development_name": "MYRA",
            "development_location": "9 MEYAPPA CHETTIAR ROAD 935456",
            "mc_form_year": 2024,
            "usr_mcno": "4918",
            "queries": ["9 MEYAPPA CHETTIAR ROAD 935456", "935456"],
            "matched_query": "9 MEYAPPA CHETTIAR ROAD 935456",
            "status_code": 200,
            "found": 1,
            "candidate_postals_by_query": {
                "9 MEYAPPA CHETTIAR ROAD 935456": ["935456"],
                "935456": [],
            },
            "matched_postal": "935456",
            "searchval": "MYRA",
            "address": "9 MEYAPPA CHETTIAR ROAD MYRA SINGAPORE 935456",
            "coordinate": {"lat": 1.3312346, "lon": 103.8823457},
        }
    ]
    assert report_path.is_file()


def test_p379_cache_status_only_reports_existing_probe_without_writes(tmp_path: Path) -> None:
    detail_path = tmp_path / "qa" / "p19" / "universe_gap_measurement_detail.json"
    cache_path = tmp_path / "qa" / "p379" / "cache.json"
    report_path = tmp_path / "qa" / "p379" / "report.json"
    detail_path.parent.mkdir(parents=True)
    cache_path.parent.mkdir(parents=True)
    detail_path.write_text(
        json.dumps(
            {
                "mcst_rows": [
                    {
                        "usr_mcno": "4918",
                        "development_name": "MYRA",
                        "development_location": "9 MEYAPPA CHETTIAR ROAD 935456",
                        "postal": "935456",
                        "mc_form_year": 2024,
                        "in_v1": False,
                    }
                ]
            }
        ),
        encoding="utf-8",
    )
    cache_path.write_text(
        json.dumps(
            {
                "9 MEYAPPA CHETTIAR ROAD 935456": {"status_code": 200, "found": 1},
                "935456": {"status_code": 200, "found": 0},
            }
        ),
        encoding="utf-8",
    )
    report_path.write_text(
        json.dumps(
            {
                "mcst_missing_rows": 1,
                "located_rows": 0,
                "unlocated_rows": 1,
                "unlocated": [
                    {
                        "development_name": "MYRA",
                        "postal": "935456",
                        "candidate_postals_by_query": {
                            "9 MEYAPPA CHETTIAR ROAD 935456": ["935999"],
                            "935456": [],
                        },
                    }
                ],
            }
        ),
        encoding="utf-8",
    )

    before = {
        path: path.read_text(encoding="utf-8")
        for path in (detail_path, cache_path, report_path)
    }
    report = p379.cache_status_report(
        detail_path=detail_path,
        cache_path=cache_path,
        report_path=report_path,
    )
    after = {
        path: path.read_text(encoding="utf-8")
        for path in (detail_path, cache_path, report_path)
    }

    assert after == before
    assert report["mode"] == "p379_cache_status_only"
    assert report["will_call_apis"] is False
    assert report["will_write_files"] is False
    assert report["will_score"] is False
    assert report["will_export"] is False
    assert report["will_mutate_p19"] is False
    assert report["mcst_missing_rows_from_detail"] == 1
    assert report["mcst_missing_rows"] == 1
    assert report["located_rows"] == 0
    assert report["unlocated_rows"] == 1
    assert report["cache_query_count"] == 2
    assert report["cache_queries"] == ["9 MEYAPPA CHETTIAR ROAD 935456", "935456"]
    assert report["unlocated_developments"] == ["MYRA"]
    assert report["conflicting_candidate_postals"] == {
        "MYRA": {
            "recorded_postal": "935456",
            "candidate_postals": ["935999"],
        }
    }


def test_p379_main_defaults_to_cache_status_only(monkeypatch, capsys) -> None:
    calls: list[str] = []

    def fake_cache_status_report() -> dict[str, object]:
        calls.append("status")
        return {"mode": "p379_cache_status_only", "will_call_apis": False, "will_write_files": False}

    def fake_build_report(**_: object) -> dict[str, object]:
        calls.append("probe")
        return {"mode": "p379_p19_mcst_missing_locations"}

    monkeypatch.setattr(p379, "cache_status_report", fake_cache_status_report)
    monkeypatch.setattr(p379, "build_report", fake_build_report)

    assert p379.main([]) == 0

    assert calls == ["status"]
    assert '"mode": "p379_cache_status_only"' in capsys.readouterr().out


def test_p379_main_requires_explicit_probe_for_write_capable_mode(monkeypatch, capsys) -> None:
    calls: list[dict[str, object]] = []

    def fake_cache_status_report() -> dict[str, object]:
        calls.append({"kind": "status"})
        return {"mode": "p379_cache_status_only"}

    def fake_build_report(**kwargs: object) -> dict[str, object]:
        calls.append({"kind": "probe", **kwargs})
        return {"mode": "p379_p19_mcst_missing_locations"}

    monkeypatch.setattr(p379, "cache_status_report", fake_cache_status_report)
    monkeypatch.setattr(p379, "build_report", fake_build_report)

    assert p379.main(["--probe", "--refresh-cache", "--delay-sec", "0"]) == 0

    assert calls == [{"kind": "probe", "delay_sec": 0.0, "refresh_cache": True}]
    assert '"mode": "p379_p19_mcst_missing_locations"' in capsys.readouterr().out
