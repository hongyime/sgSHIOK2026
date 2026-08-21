from pathlib import Path
import json

from scripts.analysis import p19_universe_gap_measurement as p19
from scripts.analysis import p125_osm_postcode_status as p125


PROJECT_ROOT = Path(__file__).resolve().parents[1]


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


def test_p19_cache_status_only_reports_existing_measurement_caches(
    tmp_path: Path, monkeypatch
) -> None:
    qa_dir = tmp_path / "qa" / "p19"
    hdb_cache = qa_dir / "hdb_2021_2026_onemap_geocode_cache.json"
    overpass_cache = qa_dir / "overpass_addr_postcodes_cache.json"
    summary = qa_dir / "universe_gap_measurement_summary.json"
    detail = qa_dir / "universe_gap_measurement_detail.json"
    qa_dir.mkdir(parents=True)
    hdb_cache.write_text(json.dumps({"1 TEST ROAD": {"found": 1}}), encoding="utf-8")
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
    detail.write_text(json.dumps({"hdb_rows": [{}, {}], "mcst_rows": [{}]}), encoding="utf-8")

    monkeypatch.setattr(p19, "QA_DIR", qa_dir)
    monkeypatch.setattr(p19, "HDB_GEOCODE_CACHE", hdb_cache)
    monkeypatch.setattr(p19, "OVERPASS_CACHE", overpass_cache)
    monkeypatch.setattr(p19, "SUMMARY_OUTPUT", summary)
    monkeypatch.setattr(p19, "DETAIL_OUTPUT", detail)
    monkeypatch.setattr(p19, "PROJECT_ROOT", tmp_path)

    report = p19.cache_status_report(now=p19.dt.datetime(2026, 8, 22, 12, 0, tzinfo=p19.dt.UTC))

    assert report["mode"] == "cache_status_only"
    assert report["will_call_apis"] is False
    assert report["will_write_files"] is False
    assert report["files"]["hdb_onemap_geocode_cache"]["cached_query_count"] == 1
    assert report["files"]["hdb_onemap_geocode_cache"]["sample_cached_queries"] == [
        "1 TEST ROAD"
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
    pd = p125.pd
    pd.DataFrame({"POSTAL": ["123456", "345678"]}).to_parquet(universe_path, index=False)

    report = p125.status_report(
        overpass_output=overpass_output,
        overpass_query=overpass_query,
        universe_path=universe_path,
    )

    assert report["mode"] == "p125_osm_status"
    assert report["measurement"] == "P125 live Overpass addr:postcode coverage"
    assert report["will_call_apis"] is False
    assert report["will_write_files"] is False
    assert report["files"]["overpass_output"]["overpass_elements"] == 3
    assert report["files"]["overpass_output"]["overpass_elements_by_type"] == {
        "node": 1,
        "relation": 1,
        "way": 1,
    }
    assert report["files"]["overpass_output"]["valid_distinct_postcodes"] == 2
    assert report["files"]["overpass_output"]["invalid_distinct_count"] == 1
    assert report["files"]["overpass_output"]["invalid_distinct_sample"] == ["bad"]
    assert report["files"]["v1_universe"]["row_count"] == 2
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
        "verdict": "not sufficient as primary Singapore address registry",
    }
