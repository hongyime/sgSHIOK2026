from pathlib import Path


def test_legacy_geocode_direct_entrypoint_is_retired():
    source = Path("pipeline/geocode.py").read_text(encoding="utf-8")

    assert 'DB_PATH = RAW_DIR / "geocode_cache.db"' in source
    assert "pipeline.geocode is retired" in source
    assert "raw/geocode_cache_vN.db" in source
    assert 'raise SystemExit(main())' in source
