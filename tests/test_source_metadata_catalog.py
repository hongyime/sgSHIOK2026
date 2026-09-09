import pytest

from scripts.build_source_metadata_catalog import make_catalog


def test_catalog_reuses_policy_and_never_substitutes_fetch_time():
    config = {"freshness_defaults": {"datagov_polldownload": {"stale_after_days": 120, "expected_cadence": "quarterly"}},
              "sources": {"rail": {"name": "Rail", "kind": "datagov_polldownload", "dataset_id": "d_abc"}}}
    raw = {"sources": {"rail": {"fetched_at": "2026-09-09T00:00:00Z", "sha256": "a" * 64}}}
    result = make_catalog(config, raw, {}, "2026-09-09T00:00:00Z")
    source = result["sources"][0]
    assert source["baseline"]["publisherUpdatedAt"] is None
    assert source["staleAfterDays"] == 120
    assert source["adapter"] == "datagov_metadata"


def test_catalog_preserves_manual_unsupported_and_absent_baseline():
    config = {"sources": {"osm": {"kind": "osm_pbf", "refresh": "manual"}, "bus": {"kind": "datamall_api_paginated"}}}
    sources = make_catalog(config, {"sources": {}}, {}, "now")["sources"]
    assert [s["adapter"] for s in sources] == ["manual", "unsupported"]
    assert all(not s["baseline"]["present"] for s in sources)


def test_recorded_http_date_is_preserved_as_an_instant():
    config = {"sources": {"shelter": {"kind": "datamall_geospatial_listing", "search_keyword": "CoveredLinkWay"}}}
    raw = {"sources": {"shelter": {"last_modified": "Fri, 06 Mar 2026 08:24:22 GMT"}}}
    source = make_catalog(config, raw, {}, "now")["sources"][0]
    assert source["baseline"]["publisherUpdatedAt"] == "2026-03-06T08:24:22+00:00"
    assert source["keyword"] == "CoveredLinkWay"


@pytest.mark.parametrize("kind,field,value", [("datagov_polldownload", "dataset_id", "../download"), ("datamall_geospatial_listing", "search_keyword", "x&payload=1")])
def test_unsafe_endpoint_identifiers_are_rejected(kind, field, value):
    with pytest.raises(ValueError):
        make_catalog({"sources": {"x": {"kind": kind, field: value}}}, {"sources": {}}, {}, "now")


@pytest.mark.parametrize("date", ["2026-09-09", "2026-09-09T01:00:00", "bad", None])
def test_ambiguous_recorded_dates_stay_unknown(date):
    result = make_catalog({"sources": {"x": {"kind": "other"}}}, {"sources": {"x": {"last_modified": date}}}, {}, "now")
    assert result["sources"][0]["baseline"]["publisherUpdatedAt"] is None
