# P748 postal wrapper geocode db flag

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Command output

```text
PS C:\sgSHIOK2026> rg -n "cache-db|--db|geocode_cache_\$\{Version\}|geocode-universe" 'C:\sgSHIOK2026\README.md' 'C:\sgSHIOK2026\CLAUDE.md' 'C:\sgSHIOK2026\scripts' 'C:\sgSHIOK2026\tests' 'C:\sgSHIOK2026\qa\verification\P746-postal-universe-prep-wrapper.md' 'C:\sgSHIOK2026\qa\verification\P747-legacy-geocode-guard.md'
C:\sgSHIOK2026\qa\verification\P747-legacy-geocode-guard.md:35:C:\sgSHIOK2026\scripts\prepare-postal-universe.ps1:20:$GeocodeCachePath = "raw\geocode_cache_${Version}.db"
C:\sgSHIOK2026\qa\verification\P747-legacy-geocode-guard.md:40:pipeline.geocode is retired because it writes raw/geocode_cache.db directly. Use `uv run python run.py geocode-universe --dry-run` for planning, or the guarded `run.py geocode-universe --confirm-bounded-geocode --db raw/geocode_cache_vN.db` path after owner approval.
C:\sgSHIOK2026\qa\verification\P747-legacy-geocode-guard.md:53:2. `run.py geocode-universe` checked for `--confirm-bounded-geocode` but did not forward user arguments to `pipeline.geocode_universe`, so the documented wrapper command could not reach its intended input/output/cache arguments.
C:\sgSHIOK2026\README.md:124:  `score-batch`, `postal-universe`, `geocode-universe`, `export`,
C:\sgSHIOK2026\qa\verification\P746-postal-universe-prep-wrapper.md:15:- `run.py geocode-universe` requires non-dry bounded fills to use a versioned cache such as `raw/geocode_cache_v2.db`.
C:\sgSHIOK2026\qa\verification\P746-postal-universe-prep-wrapper.md:17:The wrapper now passes `--confirm-postal-universe` and derives `raw\geocode_cache_${Version}.db` for `--cache-db`.
C:\sgSHIOK2026\scripts\prepare-postal-universe.ps1:20:$GeocodeCachePath = "raw\geocode_cache_${Version}.db"
C:\sgSHIOK2026\scripts\prepare-postal-universe.ps1:84:        "run", "python", "run.py", "geocode-universe",
C:\sgSHIOK2026\scripts\prepare-postal-universe.ps1:88:        "--cache-db", $GeocodeCachePath,
C:\sgSHIOK2026\scripts\prepare-postal-universe.ps1:93:    if ($LASTEXITCODE -ne 0) { throw "geocode-universe failed" }
C:\sgSHIOK2026\tests\test_readme.py:135:    assert "and gated pipeline tasks (`ingest`, `lamp-overlay`, `network`, `score`, `score-batch`, `postal-universe`, `geocode-universe`, `export`, `export-transit`, `publish`)" in normalized
C:\sgSHIOK2026\tests\test_release_scripts.py:22:    assert '$GeocodeCachePath = "raw\\geocode_cache_${Version}.db"' in source
C:\sgSHIOK2026\tests\test_release_scripts.py:24:    assert '"--cache-db", $GeocodeCachePath' in source
C:\sgSHIOK2026\tests\test_run.py:53:        "overture-addresses | compare-targeted | geocode-universe"
C:\sgSHIOK2026\tests\test_run.py:124:        "geocode-universe can call OneMap and write a bounded geocode-fill parquet, "
C:\sgSHIOK2026\tests\test_run.py:179:        "overture-addresses | compare-targeted | geocode-universe"
C:\sgSHIOK2026\tests\test_run.py:250:        "geocode-universe can call OneMap and write a bounded geocode-fill parquet, "
C:\sgSHIOK2026\tests\test_run.py:338:    assert run.STUBS["geocode-universe"] == (
C:\sgSHIOK2026\tests\test_run.py:1491:        "geocode-universe",
C:\sgSHIOK2026\tests\test_run.py:1498:        "run.py geocode-universe can call OneMap",
C:\sgSHIOK2026\tests\test_run.py:1517:            "geocode-universe",
C:\sgSHIOK2026\tests\test_run.py:1523:                "--db",
C:\sgSHIOK2026\tests\test_run.py:1541:                "--db",
C:\sgSHIOK2026\tests\test_run.py:1624:            "geocode-universe",
```

## FINDINGS

1. `scripts/prepare-postal-universe.ps1` passed `--cache-db` to `run.py geocode-universe`, but `pipeline.geocode_universe` accepts `--db`; the wrapper would fail before the bounded geocode module could use the intended versioned cache path.
2. The prior P746 evidence remains append-only and records the stale flag as historical command output; P748 corrects the wrapper and adds a regression assertion that the stale flag is absent.

## DISAGREEMENTS

1. None.
