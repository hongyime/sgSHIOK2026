from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def test_deploy_production_script_passes_runner_and_module_publish_confirms() -> None:
    source = (PROJECT_ROOT / "scripts" / "deploy-production.ps1").read_text(encoding="utf-8")

    assert "[switch]$ConfirmProduction" in source
    assert "confirm_production_not_set" in source
    assert "Write-DeployPlan" in source

    confirm_check = source.index("if (-not $ConfirmProduction)")
    publish_command = source.index("uv run python run.py publish")
    assert confirm_check < publish_command

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


def test_release_data_bundle_script_passes_deploy_confirm() -> None:
    source = (PROJECT_ROOT / "scripts" / "release-data-bundle.ps1").read_text(encoding="utf-8")

    deploy_call = source.index('deploy-production.ps1") @DeployArgs')
    confirm_arg = source.index("$DeployArgs.ConfirmProduction = $true")
    assert confirm_arg < deploy_call


def test_production_preflight_requires_confirmation_before_checks() -> None:
    source = (PROJECT_ROOT / "scripts" / "preflight-production.ps1").read_text(encoding="utf-8")

    assert "[switch]$ConfirmProductionPreflight" in source
    assert "confirm_production_preflight_not_set" in source
    assert "Write-PreflightPlan" in source

    confirm_check = source.index("if (-not $ConfirmProductionPreflight)")
    git_status = source.index("git status --short --branch")
    npm_ci_note = source.index("npm ci if required bins are missing")
    assert npm_ci_note < confirm_check
    assert confirm_check < git_status


def test_release_data_bundle_script_passes_preflight_confirm() -> None:
    source = (PROJECT_ROOT / "scripts" / "release-data-bundle.ps1").read_text(encoding="utf-8")

    preflight_line = next(
        line.strip()
        for line in source.splitlines()
        if "preflight-production.ps1" in line and "-DataBundle $DataBundle" in line
    )
    assert "-ConfirmProductionPreflight" in preflight_line
    assert "-SkipNetworkPreflight" in preflight_line


def test_full_rescore_script_requires_distinct_production_deploy_confirm() -> None:
    source = (PROJECT_ROOT / "scripts" / "full-rescore-production.ps1").read_text(encoding="utf-8")

    assert "[switch]$ConfirmProductionDeploy" in source
    assert "Full-batch approval is not production publish approval." in source

    deploy_gate = source.index("if ($Deploy -and -not $ConfirmProductionDeploy)")
    export_command = source.index("uv run python run.py export")
    deploy_command = source.index('deploy-production.ps1") -DataBundle $BundleName -ConfirmProduction')
    assert deploy_gate < export_command
    assert export_command < deploy_command


def test_full_rescore_script_requires_distinct_activation_confirm() -> None:
    source = (PROJECT_ROOT / "scripts" / "full-rescore-production.ps1").read_text(encoding="utf-8")

    assert "[switch]$ConfirmActivation" in source
    assert "Full-batch approval is not bundle activation approval." in source

    activation_gate = source.index("if (-not $SkipActivateBundle -and -not $ConfirmActivation)")
    export_command = source.index("uv run python run.py export")
    activation_write = source.index("[System.IO.File]::WriteAllText(")
    assert activation_gate < export_command
    assert export_command < activation_write


def test_full_onemap_validation_wrapper_requires_confirmation_before_writes() -> None:
    source = (PROJECT_ROOT / "scripts" / "full-onemap-validation.ps1").read_text(encoding="utf-8")

    assert "[switch]$ConfirmFullOnemapValidation" in source
    assert "confirm_full_onemap_validation_not_set" in source

    confirm_gate = source.index("if (-not $ConfirmFullOnemapValidation)")
    first_write = source.index("New-Item -ItemType Directory")
    collect_confirm = source.index('"--confirm-onemap-collection"')
    assert confirm_gate < first_write
    assert first_write < collect_confirm


def test_full_onemap_watch_wrapper_requires_confirmation_and_forwards_it() -> None:
    source = (PROJECT_ROOT / "scripts" / "watch-full-onemap-validation.ps1").read_text(encoding="utf-8")

    assert "[switch]$ConfirmFullOnemapValidation" in source
    assert "confirm_full_onemap_validation_not_set" in source

    confirm_gate = source.index("if (-not $ConfirmFullOnemapValidation)")
    first_write = source.index("New-Item -ItemType Directory")
    forwarded = source.index('"-ConfirmFullOnemapValidation"')
    start_process = source.index("Start-Process")
    assert confirm_gate < first_write
    assert forwarded < start_process
