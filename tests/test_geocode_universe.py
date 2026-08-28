import sqlite3
from pathlib import Path

import pandas as pd
import pytest

from pipeline.geocode_universe import (
    cached_selection,
    geocode_universe_gaps,
    init_cache,
    selection_from_payload,
)


def write_universe(path: Path) -> None:
    pd.DataFrame(
        [
            {
                "postal_code": "123456",
                "status": "READY_TO_SCORE",
                "lat": 1.3,
                "lon": 103.8,
                "x": 100.0,
                "y": 200.0,
                "coordinate_source": "test",
                "address": None,
                "building": None,
                "road_name": None,
                "sources": ["test"],
            },
            {
                "postal_code": "654321",
                "status": "NEEDS_GEOCODE",
                "lat": None,
                "lon": None,
                "x": None,
                "y": None,
                "coordinate_source": None,
                "address": None,
                "building": None,
                "road_name": None,
                "sources": ["acra_registered_entities"],
            },
            {
                "postal_code": "111111",
                "status": "NEEDS_GEOCODE",
                "lat": None,
                "lon": None,
                "x": None,
                "y": None,
                "coordinate_source": None,
                "address": None,
                "building": None,
                "road_name": None,
                "sources": ["acra_registered_entities"],
            },
        ]
    ).to_parquet(path, index=False)


def test_selection_from_payload_requires_exact_postal_match():
    exact = selection_from_payload(
        "654321",
        {
            "found": 1,
            "results": [
                {"POSTAL": "654321", "LATITUDE": "1.31", "LONGITUDE": "103.81"},
            ],
        },
    )
    mismatch = selection_from_payload(
        "654321",
        {
            "found": 1,
            "results": [
                {"POSTAL": "654322", "LATITUDE": "1.31", "LONGITUDE": "103.81"},
            ],
        },
    )

    assert exact.status == "SUCCESS"
    assert exact.lat == 1.31
    assert exact.lon == 103.81
    assert mismatch.status == "NO_EXACT_POSTAL"


def test_geocode_universe_fills_only_source_derived_needs_geocode_rows(tmp_path: Path):
    input_path = tmp_path / "postal_universe_candidate_full_registered.parquet"
    output_path = tmp_path / "postal_universe_candidate_full_registered_geocoded_v2.parquet"
    summary_path = tmp_path / "postal_universe_candidate_full_registered_geocoded_v2_summary.json"
    db_path = tmp_path / "geocode_cache_v2.db"
    write_universe(input_path)

    def fake_fetch(postal: str):
        if postal == "111111":
            return {"found": 0, "results": []}
        return {
            "found": 1,
            "results": [
                {
                    "POSTAL": postal,
                    "LATITUDE": "1.310000",
                    "LONGITUDE": "103.810000",
                    "ADDRESS": "TEST ADDRESS SINGAPORE 654321",
                    "BUILDING": "TEST BUILDING",
                    "ROAD_NAME": "TEST ROAD",
                }
            ],
        }

    ok, report = geocode_universe_gaps(
        input_path=input_path,
        output_path=output_path,
        summary_path=summary_path,
        db_path=db_path,
        delay_sec=0,
        confirm_bounded_geocode=True,
        fetcher=fake_fetch,
    )

    assert ok, report
    assert report["queued_postals"] == 2
    assert report["http_requests"] == 2
    assert report["filled_successes"] == 1
    assert report["status_counts"] == {"SUCCESS": 1, "NOT_FOUND": 1}
    assert output_path.is_file()
    assert summary_path.is_file()

    output = pd.read_parquet(output_path).set_index("postal_code")
    assert output.loc["654321", "status"] == "READY_TO_SCORE"
    assert output.loc["654321", "coordinate_source"] == "onemap_search_bounded_geocode"
    assert output.loc["111111", "status"] == "NEEDS_GEOCODE"

    conn = sqlite3.connect(db_path)
    try:
        cached = cached_selection(conn, "654321")
    finally:
        conn.close()
    assert cached is not None
    assert cached.status == "SUCCESS"


def test_geocode_universe_reuses_success_cache_without_http(tmp_path: Path):
    input_path = tmp_path / "postal_universe_candidate_full_registered.parquet"
    output_path = tmp_path / "postal_universe_candidate_full_registered_geocoded_v2.parquet"
    db_path = tmp_path / "geocode_cache_v2.db"
    write_universe(input_path)

    conn = init_cache(db_path)
    try:
        conn.execute(
            """
            INSERT INTO postcodes (postal_code, status, lat, lon, response)
            VALUES (?, ?, ?, ?, ?)
            """,
            ("654321", "SUCCESS", 1.31, 103.81, "{}"),
        )
        conn.commit()
    finally:
        conn.close()

    ok, report = geocode_universe_gaps(
        input_path=input_path,
        output_path=output_path,
        db_path=db_path,
        delay_sec=0,
        limit=1,
        confirm_bounded_geocode=True,
        fetcher=lambda postal: (_ for _ in ()).throw(AssertionError(postal)),
    )

    assert ok, report
    assert report["http_requests"] == 0
    assert report["cache_successes"] == 1
    assert report["filled_successes"] == 1


def test_geocode_universe_rejects_unversioned_non_dry_output_before_http(tmp_path: Path):
    input_path = tmp_path / "postal_universe_candidate_full_registered.parquet"
    output_path = tmp_path / "postal_universe_candidate_full_registered_geocoded.parquet"
    write_universe(input_path)

    ok, report = geocode_universe_gaps(
        input_path=input_path,
        output_path=output_path,
        delay_sec=0,
        confirm_bounded_geocode=True,
        fetcher=lambda postal: (_ for _ in ()).throw(AssertionError(postal)),
    )

    assert ok is False
    assert "numeric version tag" in report["errors"][0]


def test_geocode_universe_rejects_existing_non_dry_output_before_http(tmp_path: Path):
    input_path = tmp_path / "postal_universe_candidate_full_registered.parquet"
    output_path = tmp_path / "postal_universe_candidate_full_registered_geocoded_v2.parquet"
    output_path.write_bytes(b"existing")
    write_universe(input_path)

    ok, report = geocode_universe_gaps(
        input_path=input_path,
        output_path=output_path,
        delay_sec=0,
        confirm_bounded_geocode=True,
        fetcher=lambda postal: (_ for _ in ()).throw(AssertionError(postal)),
    )

    assert ok is False
    assert "refusing to overwrite" in report["errors"][0]


def test_geocode_universe_rejects_unversioned_cache_before_http(tmp_path: Path):
    input_path = tmp_path / "postal_universe_candidate_full_registered.parquet"
    output_path = tmp_path / "postal_universe_candidate_full_registered_geocoded_v2.parquet"
    db_path = tmp_path / "geocode_cache.db"
    write_universe(input_path)

    ok, report = geocode_universe_gaps(
        input_path=input_path,
        output_path=output_path,
        db_path=db_path,
        delay_sec=0,
        confirm_bounded_geocode=True,
        fetcher=lambda postal: (_ for _ in ()).throw(AssertionError(postal)),
    )

    assert ok is False
    assert "geocode cache path must include a numeric version tag" in report["errors"][0]
    assert not db_path.exists()
    assert not output_path.exists()


def test_geocode_universe_help_names_versioned_output_boundary(
    capsys: pytest.CaptureFixture[str],
):
    from pipeline import geocode_universe

    with pytest.raises(SystemExit) as excinfo:
        geocode_universe.main(["--help"])

    assert excinfo.value.code == 0
    out = " ".join(capsys.readouterr().out.split())
    assert "Non-dry runs require fresh numeric-version output artifacts" in out
    assert "never repair frozen v1 in place" in out
    assert "mutable geocode cache must also be explicitly versioned" in out
    assert "refuse unversioned or existing outputs" in out
    assert "raw/geocode_cache_v2.db" in out
