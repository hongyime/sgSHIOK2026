import pytest

from scripts.build_source_metadata_catalog import make_catalog, metadata_identity


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


@pytest.mark.parametrize("path", ["raw/manifest.json", "pipeline/config/sources.yaml"])
def test_metadata_identity_records_both_hashes_without_mutating_crlf_bytes(path):
    import hashlib
    committed, local = b'{"sources":{}}\n', b'{"sources":{}}\r\n'
    before = (committed, local)
    result = metadata_identity(path, committed, local)
    assert result == {"committedSha256": hashlib.sha256(committed).hexdigest(),
                      "localSha256": hashlib.sha256(local).hexdigest(), "comparison": "lf_crlf_only",
                      "committedBytes": len(committed), "localBytes": len(local)}
    assert before == (committed, local)


def test_identical_metadata_keeps_identical_raw_hashes():
    result = metadata_identity("raw/manifest.json", b'{}\n', b'{}\n')
    assert result["comparison"] == "identical"
    assert result["committedSha256"] == result["localSha256"]


@pytest.mark.parametrize("local", [b'{ }\n', b'{}\r', b'{}', b'{}\n\n', b'\xef\xbb\xbf{}\n', b'{"sources":null}\n', b'\xff\n'])
def test_semantic_or_other_byte_differences_are_not_line_ending_exceptions(local):
    with pytest.raises(RuntimeError, match="STOP_INPUT_MISMATCH"):
        metadata_identity("raw/manifest.json", b'{}\n', local)


@pytest.mark.parametrize("path", ["pipeline/config/weights.yaml", "raw/shelter.zip", "processed/network_island.parquet", "qa/releases/manifest.json", "../raw/manifest.json"])
def test_metadata_exception_cannot_be_applied_to_any_other_input(path):
    with pytest.raises(ValueError, match="not an allowlisted textual"):
        metadata_identity(path, b'{}\n', b'{}\r\n')


def test_same_json_with_reordered_keys_is_not_accepted():
    with pytest.raises(RuntimeError, match="STOP_INPUT_MISMATCH"):
        metadata_identity("raw/manifest.json", b'{"a":1,"b":2}\n', b'{"b":2,"a":1}\n')


@pytest.mark.parametrize("content", [b'{}\r\n', b'{}\r', b'\xef\xbb\xbf{}\n', b'\x00\n', b'\xff\n'])
def test_invalid_committed_text_is_not_silently_normalized(content):
    with pytest.raises(ValueError, match="committed metadata"):
        metadata_identity("raw/manifest.json", content, content)


def test_catalog_retains_distinct_git_and_local_anchor_identities():
    local = {"raw/manifest.json": "a" * 64}
    committed = {"raw/manifest.json": "b" * 64}
    result = make_catalog({"sources": {}}, {"sources": {}}, local, "now", git_anchors=committed)
    assert result["anchors"] == local and result["gitAnchors"] == committed
