from pathlib import Path


def test_legacy_geocode_direct_entrypoint_is_retired():
    source = Path("pipeline/geocode.py").read_text(encoding="utf-8")

    assert 'DB_PATH = RAW_DIR / "geocode_cache.db"' in source
    assert "pipeline.geocode is retired" in source
    assert "raw/geocode_cache_vN.db" in source
    assert 'raise SystemExit(main())' in source


def test_legacy_rescope_import_time_osm_extraction_is_retired():
    source = Path("pipeline/rescope.py").read_text(encoding="utf-8")

    assert "pipeline.rescope is retired" in source
    assert "performed OSM/HDB raw-data reads" in source
    assert "at import time from a relative raw/ path" in source
    assert "Path(\"raw\")" not in source
    assert "pyrosm" not in source
    assert "get_data_by_custom_criteria" not in source
    assert "p125-osm-status" in source
    assert "--confirm-postal-universe" in source
