import httpx
import json
from datetime import UTC, datetime
from pathlib import Path

import pytest

import pipeline.fetch as fetch
from pipeline.fetch import (
    datagov_raw_filename,
    freshness_policy_for_source,
    load_source_config,
    select_sources,
    stable_manifest_url,
    source_freshness_line,
    source_freshness_status,
    static_raw_filename,
)


def test_datagov_raw_filename_uses_content_disposition_extension() -> None:
    headers = httpx.Headers(
        {
            "content-disposition": 'attachment; filename="LeafAreaIndexLAI.xlsx"',
            "content-type": "binary/octet-stream",
        }
    )

    assert datagov_raw_filename("leaf_area_index", "https://example.test/download", headers) == (
        "leaf_area_index.xlsx"
    )


def test_datagov_raw_filename_uses_url_extension() -> None:
    headers = httpx.Headers({"content-type": "binary/octet-stream"})

    assert datagov_raw_filename(
        "mrt_lrt_exits", "https://example.test/source.geojson?sig=1", headers
    ) == ("mrt_lrt_exits.geojson")


def test_datagov_raw_filename_falls_back_to_content_type() -> None:
    headers = httpx.Headers({"content-type": "text/csv; charset=utf-8"})

    assert datagov_raw_filename("sample", "https://example.test/download", headers) == "sample.csv"


def test_stable_manifest_url_strips_signed_s3_query() -> None:
    url = (
        "https://s3.ap-southeast-1.amazonaws.com/blobs.data.gov.sg/source.xlsx?"
        "AWSAccessKeyId=example&Expires=1785330614&Signature=abc"
    )

    assert stable_manifest_url(url) == (
        "https://s3.ap-southeast-1.amazonaws.com/blobs.data.gov.sg/source.xlsx"
    )


def test_stable_manifest_url_strips_datamall_x_amz_signature() -> None:
    url = (
        "https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/CoveredLinkWay.zip?"
        "X-Amz-Security-Token=token&X-Amz-Algorithm=AWS4-HMAC-SHA256&"
        "X-Amz-Date=20260821T001240Z&X-Amz-SignedHeaders=host&"
        "X-Amz-Expires=300&X-Amz-Credential=credential&X-Amz-Signature=signature"
    )

    assert stable_manifest_url(url) == (
        "https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/CoveredLinkWay.zip"
    )


def test_stable_manifest_url_preserves_normal_query() -> None:
    url = "https://example.test/api?searchVal=560234&returnGeom=Y"

    assert stable_manifest_url(url) == url


def test_select_sources_filters_requested_keys() -> None:
    sources = {"bus_stops": {"name": "Bus Stops"}, "train_station_codes": {"name": "Rail"}}

    assert select_sources(sources, ["train_station_codes"]) == {
        "train_station_codes": {"name": "Rail"}
    }
    assert select_sources(sources, []) == sources
    with pytest.raises(ValueError, match="unknown source key"):
        select_sources(sources, ["missing"])


def test_source_freshness_status_marks_stale_manifest_entry() -> None:
    status = source_freshness_status(
        "lamp_posts",
        {"name": "Lamp Posts", "kind": "datagov_polldownload"},
        {
            "last_modified": "Tue, 07 Jul 2026 02:06:48 GMT",
            "fetched_at": "2026-07-26T07:50:33.401278+00:00",
        },
        freshness_defaults={
            "datagov_polldownload": {
                "expected_cadence": "monthly",
                "stale_after_days": 30,
            }
        },
        now=datetime(2026, 8, 16, tzinfo=UTC),
    )

    assert status["status"] == "stale"
    assert status["age_basis"] == "last_modified"
    assert round(status["age_days"], 1) == 39.9
    assert source_freshness_line(status) == (
        "[lamp_posts] Lamp Posts: STALE — last_modified age 39.9d "
        "exceeds 30d threshold (monthly)"
    )


def test_source_freshness_line_reports_current_manifest_age() -> None:
    status = source_freshness_status(
        "covered_linkway",
        {"name": "Covered Linkway", "kind": "datamall_geospatial_listing"},
        {
            "last_modified": "Tue, 07 Jul 2026 02:06:48 GMT",
            "fetched_at": "2026-07-26T07:50:33.401278+00:00",
        },
        freshness_defaults={
            "datamall_geospatial_listing": {
                "expected_cadence": "quarterly",
                "stale_after_days": 120,
            }
        },
        now=datetime(2026, 8, 16, tzinfo=UTC),
    )

    assert status["status"] == "current"
    assert source_freshness_line(status) == (
        "[covered_linkway] Covered Linkway: freshness current — last_modified age 39.9d "
        "within 120d threshold (quarterly)"
    )


def test_source_freshness_status_respects_manual_sources() -> None:
    status = source_freshness_status(
        "osm_extract",
        {"name": "OSM", "kind": "osm_pbf", "refresh": "manual"},
        {"last_modified": "Mon, 01 Jan 2024 00:00:00 GMT"},
        freshness_defaults={},
        now=datetime(2026, 8, 16, tzinfo=UTC),
    )

    assert status["status"] == "manual"
    assert source_freshness_line(status) == "[osm_extract] OSM: freshness manual"


def test_source_config_has_freshness_policy_for_every_source() -> None:
    config = load_source_config()
    defaults = config["freshness_defaults"]
    sources = config["sources"]
    source_text = (
        Path(__file__).resolve().parents[1] / "pipeline" / "config" / "sources.yaml"
    ).read_text(encoding="utf-8")

    assert len(sources) == 21
    assert "S.H.I.O.K. Shelter Map" in source_text
    assert "S.H.I.O.K. Index" not in source_text
    assert "authenticated GeospatialWholeIsland fallback" in source_text
    assert "Refresh only as a new numbered input version." in source_text
    assert (
        "tracked freshness reference only, not route-level geometry, shade-proxy geometry, "
        "score provenance, or rain shelter geometry"
    ) in source_text
    assert "shade/heat calibration source only" not in source_text
    assert "unauthenticated public download" not in source_text
    for key, spec in sources.items():
        policy = freshness_policy_for_source(spec, defaults)
        assert policy.get("expected_cadence"), key
        if policy.get("mode") == "manual" or policy.get("expected_cadence") == "manual":
            assert policy.get("stale_after_days") is None, key
        else:
            assert isinstance(policy.get("stale_after_days"), int), key


def test_editable_pipeline_headers_use_shelter_map_frame() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    editable_headers = [
        repo_root / "pipeline" / "__init__.py",
        repo_root / "pipeline" / "fetch.py",
        repo_root / "pipeline" / "config" / "params.yaml",
    ]

    for path in editable_headers:
        text = path.read_text(encoding="utf-8")
        assert "S.H.I.O.K. Shelter Map" in text
        assert "S.H.I.O.K. Index" not in text


def test_maintained_pipeline_user_agents_use_shelter_map_frame() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    user_agent_files = [
        repo_root / "pipeline" / "bus.py",
        repo_root / "pipeline" / "fetch.py",
        repo_root / "pipeline" / "geocode_universe.py",
        repo_root / "pipeline" / "onemap_validation.py",
        repo_root / "pipeline" / "postal_universe.py",
        repo_root / "pipeline" / "probe_onemap.py",
        repo_root / "pipeline" / "resolve_datagov.py",
    ]

    for path in user_agent_files:
        text = path.read_text(encoding="utf-8")
        assert "sgSHIOK-Shelter-Map" in text
        assert "SHIOK-Index" not in text
        assert "Singapore Walk-to-Transit Index" not in text


def test_run_check_reports_stale_freshness_without_failing(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    monkeypatch.setattr(
        fetch,
        "load_manifest",
        lambda: {
            "sources": {
                "sample": {
                    "last_modified": "Tue, 07 Jul 2026 02:06:48 GMT",
                    "fetched_at": "2026-07-26T07:50:33.401278+00:00",
                }
            }
        },
    )
    sources = {"sample": {"name": "Sample", "kind": "manual_probe"}}

    assert (
        fetch.run_check(
            sources,
            freshness_defaults={
                "manual_probe": {
                    "expected_cadence": "monthly",
                    "stale_after_days": 30,
                }
            },
            now=datetime(2026, 8, 16, tzinfo=UTC),
        )
        == 0
    )
    out = capsys.readouterr().out
    assert "[sample] Sample: STALE" in out
    assert "[sample] Sample: Stub check (listing/probe required)" in out
    assert "Freshness: current 0, stale 1, manual 0, unknown_policy 0, unknown_age 0" in out
    assert "Oldest current source:" not in out
    assert "Stale sources: sample" in out


def test_run_freshness_report_does_not_probe_upstream(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    monkeypatch.setattr(
        fetch,
        "load_manifest",
        lambda: {
            "sources": {
                "fresh": {"fetched_at": "2026-08-15T00:00:00+00:00"},
                "stale": {"last_modified": "Tue, 07 Jul 2026 02:06:48 GMT"},
                "manual": {"last_modified": "Mon, 01 Jan 2024 00:00:00 GMT"},
                "unknown_age": {},
            }
        },
    )
    monkeypatch.setattr(
        fetch,
        "resolve_datagov_download_url",
        lambda _dataset_id: (_ for _ in ()).throw(AssertionError("unexpected network probe")),
    )
    sources = {
        "fresh": {"name": "Fresh", "kind": "datagov_polldownload", "dataset_id": "fresh"},
        "stale": {"name": "Stale", "kind": "datagov_polldownload", "dataset_id": "stale"},
        "manual": {"name": "Manual", "kind": "osm_pbf", "refresh": "manual"},
        "unknown_age": {
            "name": "Unknown Age",
            "kind": "datagov_polldownload",
            "dataset_id": "unknown-age",
        },
    }

    assert (
        fetch.run_freshness_report(
            sources,
            freshness_defaults={
                "datagov_polldownload": {
                    "expected_cadence": "monthly",
                    "stale_after_days": 30,
                }
            },
            now=datetime(2026, 8, 16, tzinfo=UTC),
        )
        == 0
    )

    out = capsys.readouterr().out
    assert "Source freshness from raw/manifest.json at 2026-08-16T00:00:00+00:00..." in out
    assert "Manifest-only check: no upstream URLs were probed." in out
    assert "[fresh] Fresh: freshness current — fetched_at age 1.0d within 30d threshold (monthly)" in out
    assert "[stale] Stale: STALE" in out
    assert "[manual] Manual: freshness manual" in out
    assert "[unknown_age] Unknown Age: freshness unknown_age (monthly)" in out
    assert "Freshness: current 1, stale 1, manual 1, unknown_policy 0, unknown_age 1" in out
    assert "Oldest current source: fresh (Fresh, 1.0d of 30d threshold)" in out
    assert "Stale sources: stale" in out
    assert "Unknown-age sources: unknown_age" in out


def test_run_geospatial_discovery_report_sanitizes_and_reports_drift(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    monkeypatch.setattr(
        fetch,
        "load_manifest",
        lambda: {
            "sources": {
                "covered_linkway": {
                    "url_as_discovered": (
                        "https://datamall.lta.gov.sg/content/dam/datamall/datasets/"
                        "Geospatial/CoveredLinkWay_Mar2026.zip"
                    )
                },
                "traffic_signals": {
                    "url_as_discovered": (
                        "https://datamall.lta.gov.sg/content/dam/datamall/datasets/"
                        "Geospatial/TrafficLight_Mar2026.zip"
                    )
                },
            }
        },
    )
    discovered = {
        "CoveredLinkWay": (
            "https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/CoveredLinkWay.zip?"
            "X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=secret"
        ),
        "TrafficLight": (
            "https://datamall.lta.gov.sg/content/dam/datamall/datasets/"
            "Geospatial/TrafficLight_Mar2026.zip"
        ),
    }
    monkeypatch.setattr(
        fetch,
        "resolve_datamall_geospatial_url",
        lambda keyword: discovered[keyword],
    )
    sources = {
        "covered_linkway": {
            "name": "Covered Linkway",
            "kind": "datamall_geospatial_listing",
            "search_keyword": "CoveredLinkWay",
        },
        "traffic_signals": {
            "name": "Traffic Signals",
            "kind": "datamall_geospatial_listing",
            "search_keyword": "TrafficLight",
        },
        "bus_stops": {
            "name": "Bus Stops",
            "kind": "datamall_api_paginated",
            "endpoint": "https://example.test",
        },
    }

    assert fetch.run_geospatial_discovery_report(sources) == 1

    out = capsys.readouterr().out
    assert "Discovery-only check: no payloads are downloaded and no manifest files are written." in out
    assert "[covered_linkway] Covered Linkway: keyword=CoveredLinkWay match=false" in out
    assert "discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/CoveredLinkWay.zip" in out
    assert "X-Amz-Signature" not in out
    assert "[traffic_signals] Traffic Signals: keyword=TrafficLight match=true" in out
    assert "[bus_stops]" not in out
    assert "DataMall geospatial discovery: matched 1, changed 1, errors 0" in out


def test_static_raw_filename_prefers_configured_filename() -> None:
    assert (
        static_raw_filename(
            "train_station_codes",
            "https://example.test/source.zip",
            {"filename": "train_station_codes.zip"},
        )
        == "train_station_codes.zip"
    )
    assert (
        static_raw_filename("train_station_codes", "https://example.test/source.xls", {})
        == "train_station_codes.xls"
    )


def _geojson_feature_collection(feature_count: int) -> bytes:
    payload = {
        "type": "FeatureCollection",
        "features": [
            {"type": "Feature", "geometry": {"type": "Point", "coordinates": [0, 0]}, "properties": {}}
            for _ in range(feature_count)
        ],
    }
    return json.dumps(payload).encode("utf-8")


class _FakeResponse:
    def __init__(self, content: bytes, status_code: int = 200) -> None:
        self.content = content
        self.status_code = status_code
        self.headers = httpx.Headers({})

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise httpx.HTTPStatusError(
                "failed",
                request=httpx.Request("GET", "https://example.test/source.geojson"),
                response=httpx.Response(self.status_code),
            )


class _FakeClient:
    def __init__(self, response: _FakeResponse | Exception) -> None:
        self.response = response

    def __enter__(self) -> "_FakeClient":
        return self

    def __exit__(self, *_args: object) -> None:
        return None

    def get(self, *_args: object, **_kwargs: object) -> _FakeResponse:
        if isinstance(self.response, Exception):
            raise self.response
        return self.response


def _patch_fetch_paths(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Path:
    raw_dir = tmp_path / "raw"
    manifest_path = raw_dir / "manifest.json"
    monkeypatch.setattr(fetch, "RAW_DIR", raw_dir)
    monkeypatch.setattr(fetch, "TMP_DIR", raw_dir / "tmp")
    monkeypatch.setattr(fetch, "MANIFEST_PATH", manifest_path)
    return manifest_path


def _static_source() -> dict[str, dict[str, object]]:
    return {
        "sample_geojson": {
            "name": "Sample GeoJSON",
            "kind": "datamall_static_file",
            "url": "https://example.test/source.geojson",
            "filename": "sample_geojson.geojson",
            "ingest_validation": {"max_count_delta_ratio": 0.2},
        }
    }


def test_ingest_validation_fails_on_large_count_shrink(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    manifest_path = _patch_fetch_paths(monkeypatch, tmp_path)
    manifest_path.parent.mkdir(parents=True)
    manifest_path.write_text(
        json.dumps(
            {
                "generated_at": "2026-08-12T00:00:00+00:00",
                "sources": {
                    "sample_geojson": {
                        "source_name": "Sample GeoJSON",
                        "sha256": "old",
                        "validation": {
                            "count_field": "feature_count",
                            "feature_count": 100,
                            "record_count": 100,
                        },
                    }
                },
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(fetch.httpx, "Client", lambda **_kwargs: _FakeClient(_FakeResponse(_geojson_feature_collection(70))))

    assert fetch.run_ingest(_static_source()) == 1
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert manifest["sources"]["sample_geojson"]["sha256"] == "old"


def test_ingest_validation_allows_small_count_change(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    manifest_path = _patch_fetch_paths(monkeypatch, tmp_path)
    manifest_path.parent.mkdir(parents=True)
    manifest_path.write_text(
        json.dumps(
            {
                "generated_at": "2026-08-12T00:00:00+00:00",
                "sources": {
                    "sample_geojson": {
                        "source_name": "Sample GeoJSON",
                        "sha256": "old",
                        "validation": {
                            "count_field": "feature_count",
                            "feature_count": 100,
                            "record_count": 100,
                        },
                    }
                },
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(fetch.httpx, "Client", lambda **_kwargs: _FakeClient(_FakeResponse(_geojson_feature_collection(90))))

    assert fetch.run_ingest(_static_source()) == 0
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    validation = manifest["sources"]["sample_geojson"]["validation"]
    assert validation["feature_count"] == 90
    assert validation["baseline_status"] == "within_threshold"


def test_ingest_returns_nonzero_when_source_errors(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    _patch_fetch_paths(monkeypatch, tmp_path)
    error = httpx.ConnectError("connection refused", request=httpx.Request("GET", "https://example.test/source.geojson"))
    monkeypatch.setattr(fetch.httpx, "Client", lambda **_kwargs: _FakeClient(error))

    assert fetch.run_ingest(_static_source()) == 1
