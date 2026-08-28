from pathlib import Path


def test_legacy_script_diagnostics_are_retired():
    retired_scripts = [
        "scripts/classify_residuals.py",
        "scripts/diagnostic_battery.py",
        "scripts/diagnostic_coord.py",
        "scripts/diagnostic_gap.py",
        "scripts/diagnostic_snapping.py",
        "scripts/diagnostic_sportshub.py",
    ]

    for script in retired_scripts:
        source = Path(script).read_text(encoding="utf-8")
        module_name = Path(script).stem
        assert f"scripts.{module_name} is retired" in source
        assert "raise SystemExit(main())" in source
        assert "pyrosm" not in source
        assert "gpd.read_file" not in source
        assert "ZipFile" not in source
        assert ".rglob(" not in source
        assert "to_file(" not in source
