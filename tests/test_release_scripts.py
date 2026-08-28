from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def test_deploy_production_script_passes_runner_and_module_publish_confirms() -> None:
    source = (PROJECT_ROOT / "scripts" / "deploy-production.ps1").read_text(encoding="utf-8")

    command_line = next(
        line.strip()
        for line in source.splitlines()
        if "uv run python run.py publish" in line
    )
    assert "--confirm-publish" in command_line
    assert "--confirm-production" in command_line


def test_prepare_postal_universe_script_passes_runner_confirms_and_versioned_cache() -> None:
    source = (PROJECT_ROOT / "scripts" / "prepare-postal-universe.ps1").read_text(encoding="utf-8")

    assert '$GeocodeCachePath = "raw\\geocode_cache_${Version}.db"' in source
    assert '"--confirm-postal-universe"' in source
    assert '"--db", $GeocodeCachePath' in source
    assert '"--cache-db", $GeocodeCachePath' not in source
    assert '"--confirm-bounded-geocode"' in source


def test_activate_data_bundle_script_requires_direct_activation_confirm() -> None:
    source = (PROJECT_ROOT / "scripts" / "activate-data-bundle.ps1").read_text(encoding="utf-8")

    assert "[switch]$ConfirmActivation" in source
    assert "confirm_activation_not_set" in source
    assert "Write-ActivationPlan" in source
    assert '[System.IO.File]::WriteAllText(' in source

    confirm_check = source.index("if (-not $ConfirmActivation)")
    first_write = source.index("[System.IO.File]::WriteAllText(")
    assert confirm_check < first_write


def test_release_data_bundle_script_passes_activation_confirm() -> None:
    source = (PROJECT_ROOT / "scripts" / "release-data-bundle.ps1").read_text(encoding="utf-8")

    activation_line = next(
        line.strip()
        for line in source.splitlines()
        if "activate-data-bundle.ps1" in line and "-DataBundle $DataBundle" in line
    )
    assert "-ConfirmActivation" in activation_line
