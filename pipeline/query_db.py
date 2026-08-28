import sqlite3
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
GEOCODE_DB_PATH = PROJECT_ROOT / "raw" / "geocode_cache.db"


def readonly_sqlite_uri(path: Path) -> str:
    return f"{path.resolve().as_uri()}?mode=ro"


def query_samples(
    db_path: Path = GEOCODE_DB_PATH,
    limit: int = 3,
) -> list[tuple[str, float, float]]:
    with sqlite3.connect(readonly_sqlite_uri(db_path), uri=True) as conn:
        c = conn.cursor()
        c.execute(
            "SELECT postal_code, lat, lon FROM postcodes WHERE status='SUCCESS' LIMIT ?",
            (limit,),
        )
        rows = c.fetchall()
    return [(str(row[0]), float(row[1]), float(row[2])) for row in rows]


def main() -> int:
    for row in query_samples():
        print(f"Postal: {row[0]} -> Lat: {row[1]}, Lon: {row[2]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
