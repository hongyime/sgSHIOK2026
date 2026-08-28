# P747 legacy geocode guard

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Command output

```text
PS C:\sgSHIOK2026> rg -n "pipeline\.geocode|geocode_postal|init_db|INSERT|UPDATE|DB_PATH|raw\\geocode_cache|raw/geocode_cache" 'C:\sgSHIOK2026\run.py' 'C:\sgSHIOK2026\pipeline' 'C:\sgSHIOK2026\scripts' 'C:\sgSHIOK2026\tests'
C:\sgSHIOK2026\run.py:382:        return run_module("pipeline.geocode_universe")
C:\sgSHIOK2026\pipeline\geocode.py:11:DB_PATH = RAW_DIR / "geocode_cache.db"
C:\sgSHIOK2026\pipeline\geocode.py:14:def init_db():
C:\sgSHIOK2026\pipeline\geocode.py:15:    conn = sqlite3.connect(DB_PATH)
C:\sgSHIOK2026\pipeline\geocode.py:105:    conn = init_db()
C:\sgSHIOK2026\pipeline\geocode.py:111:            "INSERT OR IGNORE INTO postcodes (postal_code, status) VALUES (?, ?)", (pc, "PENDING")
C:\sgSHIOK2026\pipeline\geocode.py:147:                    UPDATE postcodes SET status='SUCCESS', lat=?, lon=?, response=? WHERE postal_code=?
C:\sgSHIOK2026\pipeline\geocode.py:152:                c.execute("UPDATE postcodes SET status='NOT_FOUND' WHERE postal_code=?", (pc,))
C:\sgSHIOK2026\pipeline\geocode.py:156:            c.execute("UPDATE postcodes SET status='ERROR' WHERE postal_code=?", (pc,))
C:\sgSHIOK2026\pipeline\geocode_universe.py:31:GEOCODE_DB_PATH = RAW_DIR / "geocode_cache.db"
C:\sgSHIOK2026\pipeline\geocode_universe.py:99:def init_cache(db_path: Path = GEOCODE_DB_PATH) -> sqlite3.Connection:
C:\sgSHIOK2026\pipeline\geocode_universe.py:125:        INSERT INTO postcodes (postal_code, status, lat, lon, response)
C:\sgSHIOK2026\pipeline\geocode_universe.py:127:        ON CONFLICT(postal_code) DO UPDATE SET
C:\sgSHIOK2026\pipeline\geocode_universe.py:290:    db_path: Path = GEOCODE_DB_PATH,
C:\sgSHIOK2026\pipeline\geocode_universe.py:448:        default=GEOCODE_DB_PATH,
C:\sgSHIOK2026\pipeline\geocode_universe.py:449:        help="Versioned geocode cache path for non-dry runs, for example raw/geocode_cache_v2.db.",
C:\sgSHIOK2026\tests\test_batch_plan.py:424:                "cache_db": r"C:\shiok\raw\geocode_cache.db",
C:\sgSHIOK2026\tests\test_batch_plan.py:469:    assert report["bounded_geocoding"]["completed_fill"]["cache_db"] == r"raw\geocode_cache.db"
C:\sgSHIOK2026\tests\test_query_db.py:23:            "INSERT INTO postcodes (postal_code, status, lat, lon) VALUES (?, ?, ?, ?)",
C:\sgSHIOK2026\tests\test_run.py:1593:                "pipeline.geocode_universe",
C:\sgSHIOK2026\pipeline\query_db.py:6:GEOCODE_DB_PATH = PROJECT_ROOT / "raw" / "geocode_cache.db"
C:\sgSHIOK2026\pipeline\query_db.py:14:    db_path: Path = GEOCODE_DB_PATH,
C:\sgSHIOK2026\pipeline\scoring_integration.py:49:GEOCODE_DB_PATH = RAW_DIR / "geocode_cache.db"
C:\sgSHIOK2026\pipeline\scoring_integration.py:414:    db_path: Path = GEOCODE_DB_PATH,
C:\sgSHIOK2026\pipeline\scoring_integration.py:2226:                else "raw/geocode_cache.db"
C:\sgSHIOK2026\scripts\prepare-postal-universe.ps1:20:$GeocodeCachePath = "raw\geocode_cache_${Version}.db"
```

```text
PS C:\sgSHIOK2026> python -m pipeline.geocode; Write-Output "exit_code=$LASTEXITCODE"
pipeline.geocode is retired because it writes raw/geocode_cache.db directly. Use `uv run python run.py geocode-universe --dry-run` for planning, or the guarded `run.py geocode-universe --confirm-bounded-geocode --db raw/geocode_cache_vN.db` path after owner approval.
exit_code=2
```

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_run.py tests/test_legacy_geocode.py tests/test_geocode_universe.py -q
...................................................................      [100%]
67 passed in 10.41s
```

## FINDINGS

1. `pipeline/geocode.py` was still an unguarded direct entry point that could write `raw/geocode_cache.db` and call OneMap outside the versioned bounded-geocode path.
2. `run.py geocode-universe` checked for `--confirm-bounded-geocode` but did not forward user arguments to `pipeline.geocode_universe`, so the documented wrapper command could not reach its intended input/output/cache arguments.

## DISAGREEMENTS

1. None.
