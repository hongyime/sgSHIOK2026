from pathlib import Path
import json

from scripts.analysis import p19_universe_gap_measurement as p19


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def test_p10_provenance_coverage_names_leaf_area_index_policy() -> None:
    source = (PROJECT_ROOT / "scripts" / "analysis" / "p10_provenance_coverage.py").read_text(
        encoding="utf-8"
    )

    assert "leaf_area_index is a freshness-only non-score reference" in source
    assert "hash-shipped but unconsumed" not in source


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

    report = p19.cache_status_report()

    assert report["mode"] == "cache_status_only"
    assert report["will_call_apis"] is False
    assert report["will_write_files"] is False
    assert report["files"]["hdb_onemap_geocode_cache"]["cached_query_count"] == 1
    assert report["files"]["hdb_onemap_geocode_cache"]["sample_cached_queries"] == [
        "1 TEST ROAD"
    ]
    assert "top_level_keys" not in report["files"]["hdb_onemap_geocode_cache"]
    assert report["files"]["overpass_addr_postcodes_cache"]["cached_postcode_count"] == 1
    assert report["files"]["summary"]["combined_recent_completion_signal"] == {
        "rows_with_postal": 976,
        "missing_rows": 8,
    }
    assert report["files"]["detail"]["hdb_row_count"] == 2
    assert report["files"]["detail"]["mcst_row_count"] == 1
