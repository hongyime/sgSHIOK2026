import sqlite3
from pathlib import Path

import pytest

from pipeline.query_db import query_samples


def test_query_samples_reads_geocode_cache_without_writing(tmp_path: Path) -> None:
    db_path = tmp_path / "geocode_cache.db"
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE postcodes (
                postal_code TEXT PRIMARY KEY,
                status TEXT,
                lat REAL,
                lon REAL
            )
            """
        )
        conn.executemany(
            "INSERT INTO postcodes (postal_code, status, lat, lon) VALUES (?, ?, ?, ?)",
            [
                ("123456", "SUCCESS", 1.3, 103.8),
                ("654321", "NOT_FOUND", None, None),
                ("111111", "SUCCESS", 1.4, 103.9),
            ],
        )

    assert query_samples(db_path, limit=5) == [
        ("123456", 1.3, 103.8),
        ("111111", 1.4, 103.9),
    ]


def test_query_samples_does_not_create_missing_cache(tmp_path: Path) -> None:
    missing_path = tmp_path / "missing" / "geocode_cache.db"

    with pytest.raises(sqlite3.OperationalError):
        query_samples(missing_path)

    assert not missing_path.exists()
