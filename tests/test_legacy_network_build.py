from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def test_legacy_network_build_direct_entrypoint_requires_confirm() -> None:
    source = (PROJECT_ROOT / "scripts" / "run_network_build.py").read_text(encoding="utf-8")

    assert 'if "--confirm-network-build" not in args:' in source
    assert "requires --confirm-network-build" in source
    assert 'if __name__ == "__main__":' in source
    assert "raise SystemExit(main())" in source


def test_legacy_network_build_import_does_not_create_output_dirs() -> None:
    source = (PROJECT_ROOT / "scripts" / "run_network_build.py").read_text(encoding="utf-8")
    import_region = source[: source.index("def run_build")]

    assert "QA_DIR.mkdir" not in import_region
    assert "PROCESSED_DIR.mkdir" not in import_region
