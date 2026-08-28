from pathlib import Path


def test_legacy_import_time_diag_scripts_are_retired():
    retired_modules = [
        "pipeline/diag_c.py",
        "pipeline/diag_c_fast.py",
        "pipeline/diag_c_fix.py",
        "pipeline/diag_c2.py",
        "pipeline/diag_d1.py",
        "pipeline/diag_d3.py",
        "pipeline/diag_d6.py",
        "pipeline/diag_f3.py",
        "pipeline/diag_linkway_length.py",
        "pipeline/diag_traffic_signals.py",
    ]

    for module in retired_modules:
        source = Path(module).read_text(encoding="utf-8")
        stem = Path(module).stem
        assert f"pipeline.{stem} is retired" in source
        assert "raise SystemExit(main())" in source
        assert "pyrosm" not in source
        assert "get_data_by_custom_criteria" not in source
        assert "gpd.read_file" not in source
        assert ".rglob(" not in source
