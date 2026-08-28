import json
from pathlib import Path

import pytest
import pyarrow.parquet as pq

import pipeline.overture_addresses as overture_addresses
from pipeline.overture_addresses import (
    CONFIRM_OVERTURE_ADDRESSES_FLAG,
    archive_overture_postcode_rows,
    compare_coordinate_deltas,
    compare_postcode_sets,
    coordinate_outlier_geojson,
    normalize_postcode,
    wgs84_to_xy_transformer,
)


def test_overture_help_names_candidate_only_boundary(
    capsys: pytest.CaptureFixture[str],
) -> None:
    with pytest.raises(SystemExit) as excinfo:
        overture_addresses.main(["--help"])

    assert excinfo.value.code == 0
    out = " ".join(capsys.readouterr().out.split())
    assert "candidate-only postal-universe evidence" in out
    assert "does not approve scoring or address-registry use" in out
    assert "as a postal-universe candidate" not in out


def test_normalize_postcode_accepts_only_six_digits():
    assert normalize_postcode("018895") == "018895"
    assert normalize_postcode(" 718788 ") == "718788"
    assert normalize_postcode("71878") is None
    assert normalize_postcode("718788-0001") is None
    assert normalize_postcode(None) is None


def test_compare_postcode_sets_reports_overlap_and_samples():
    report = compare_postcode_sets(
        overture_postcodes={"100000", "200000", "300000"},
        current_postcodes={"200000", "300000", "400000"},
    )

    assert report == {
        "overture_unique_postcodes": 3,
        "current_unique_postcodes": 3,
        "intersection": 2,
        "new_from_overture": 1,
        "current_missing_from_overture": 1,
        "sample_new_from_overture": ["100000"],
        "sample_current_missing_from_overture": ["400000"],
    }


def test_compare_coordinate_deltas_reports_current_overlap():
    x, y = wgs84_to_xy_transformer().transform(103.8, 1.3)
    report = compare_coordinate_deltas(
        overture_rows=[
            {
                "postcode": "018895",
                "representative_lon": 103.8,
                "representative_lat": 1.3,
                "source_dataset": "OpenAddresses/Singapore Land Authority",
                "address_rows": 1,
            },
            {
                "postcode": "999999",
                "representative_lon": 103.9,
                "representative_lat": 1.4,
            },
        ],
        current_coordinates={
            "018895": {
                "x": x,
                "y": y,
                "coordinate_source": "current",
            }
        },
    )

    assert report["overlap_with_current_coordinates"] == 1
    assert report["delta_m"]["count"] == 1
    assert report["delta_m"]["p50"] < 0.1
    assert report["within_10m"] == 1
    assert report["over_100m"] == 0
    assert report["over_250m"] == 0
    assert report["over_1000m"] == 0
    assert report["largest_deltas"][0]["postcode"] == "018895"


def test_coordinate_outlier_geojson_exports_review_lines():
    report = {
        "outliers_over_100m": [
            {
                "postcode": "079000",
                "delta_m": 26004.4,
                "current_source": "osm_addr_postcode",
                "current_address": "Current address",
                "current_lon": 103.7,
                "current_lat": 1.2,
                "overture_lon": 103.9,
                "overture_lat": 1.4,
                "overture_source": "OpenAddresses/Singapore Land Authority",
                "address_rows": 1,
            },
            {
                "postcode": "018895",
                "delta_m": 99.9,
                "current_lon": 103.8,
                "current_lat": 1.3,
                "overture_lon": 103.8001,
                "overture_lat": 1.3001,
            },
        ]
    }

    geojson = coordinate_outlier_geojson(report, min_delta_m=100.0)

    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) == 1
    feature = geojson["features"][0]
    assert feature["properties"]["postcode"] == "079000"
    assert feature["properties"]["evidence_status"] == "coordinate_outlier_review_not_scoring"
    assert feature["geometry"] == {
        "type": "LineString",
        "coordinates": [[103.7, 1.2], [103.9, 1.4]],
    }


def test_archive_overture_postcode_rows_writes_hashed_parquet(tmp_path: Path):
    rows = [
        {
            "postcode": "018895",
            "address_rows": 2,
            "source_dataset": "OpenAddresses/Singapore Land Authority",
            "representative_lon": 103.8,
            "representative_lat": 1.3,
            "min_lon": 103.8,
            "min_lat": 1.3,
            "max_lon": 103.8,
            "max_lat": 1.3,
        }
    ]

    archive = archive_overture_postcode_rows(rows, raw_dir=tmp_path)

    path = Path(archive["path"])
    assert path.is_file()
    assert path.parent.name == archive["sha256"]
    table = pq.read_table(path)
    assert table.column("postcode").to_pylist() == ["018895"]
    assert table.column("representative_lon").to_pylist() == [103.8]


def test_overture_cli_refuses_existing_output_before_query(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    def fail_build(*_args, **_kwargs):
        raise AssertionError("Overture query should not run before output preflight")

    monkeypatch.setattr(overture_addresses, "build_overture_candidate_report", fail_build)
    output = tmp_path / "overture-report.json"
    output.write_text("{}\n", encoding="utf-8")

    assert overture_addresses.main(["--output", str(output)]) == 1

    report = json.loads(capsys.readouterr().out)
    assert report == {
        "errors": [f"refusing to overwrite existing Overture output: {output}"],
        "ok": False,
    }


def test_overture_cli_requires_confirm_before_query(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    def fail_build(*_args, **_kwargs):
        raise AssertionError("Overture query should not run before confirmation")

    monkeypatch.setattr(overture_addresses, "build_overture_candidate_report", fail_build)
    output = tmp_path / "overture-report.json"

    assert overture_addresses.main(["--output", str(output)]) == 1

    report = json.loads(capsys.readouterr().out)
    assert report == {
        "errors": [
            "Overture address probe requires --confirm-overture-addresses after owner approval"
        ],
        "ok": False,
    }
    assert not output.exists()


def test_overture_cli_runs_confirmed_probe(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    output = tmp_path / "overture-report.json"

    monkeypatch.setattr(
        overture_addresses,
        "build_overture_candidate_report",
        lambda **_kwargs: (True, {"ok": True, "source": {"status": "candidate_not_scoring"}}),
    )

    assert (
        overture_addresses.main(
            ["--output", str(output), CONFIRM_OVERTURE_ADDRESSES_FLAG]
        )
        == 0
    )

    report = json.loads(capsys.readouterr().out)
    assert report == {"ok": True, "source": {"status": "candidate_not_scoring"}}
    assert json.loads(output.read_text(encoding="utf-8")) == report


def test_overture_cli_refuses_existing_outlier_geojson_before_query(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    def fail_build(*_args, **_kwargs):
        raise AssertionError("Overture query should not run before output preflight")

    monkeypatch.setattr(overture_addresses, "build_overture_candidate_report", fail_build)
    output = tmp_path / "outliers.geojson"
    output.write_text("{}\n", encoding="utf-8")

    assert overture_addresses.main(["--outlier-geojson", str(output)]) == 1

    report = json.loads(capsys.readouterr().out)
    assert report == {
        "errors": [f"refusing to overwrite existing Overture output: {output}"],
        "ok": False,
    }
