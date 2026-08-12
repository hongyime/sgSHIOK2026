import httpx
import json
from pathlib import Path

import pytest

import pipeline.fetch as fetch
from pipeline.fetch import (
    datagov_raw_filename,
    select_sources,
    stable_manifest_url,
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
