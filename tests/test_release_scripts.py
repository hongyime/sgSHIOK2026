from pathlib import Path
import shutil
import subprocess

import pytest


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def read_script(name: str) -> str:
    return (PROJECT_ROOT / "scripts" / name).read_text(encoding="utf-8")


def test_deploy_production_script_requires_confirmation_and_installed_python() -> None:
    source = read_script("deploy-production.ps1")
    assert "confirm_production_not_set" in source
    assert "Write-DeployPlan" in source
    assert source.index("if (-not $ConfirmProduction)") < source.index('& $Python -B')
    assert '"--confirm-publish"' in source and '"--confirm-production"' in source
    assert "run.py" in source and "publish @PublishArgs" in source
    for forbidden in ("ensure-web-deps", "uv run", "npm ", "Remove-Item Env:", "$env:NEXT_PUBLIC_DATA_BASE ="):
        assert forbidden not in source
    assert 'ContainsKey("SkipWebTests")' in source


def test_preflight_requires_confirmation_and_never_installs_or_runs_network_pipeline() -> None:
    source = read_script("preflight-production.ps1")
    assert "confirm_production_preflight_not_set" in source
    assert "Write-PreflightPlan" in source
    assert source.index("if (-not $ConfirmProductionPreflight)") < source.index("& $Python -B")
    assert '"--prepare", "--confirm-preparation"' in source
    assert "-m pipeline.publish @PrepareArgs" in source
    for forbidden in ("ensure-web-deps", "uv run", "npm ", "run.py network", "run.py validate"):
        assert forbidden not in source


@pytest.mark.parametrize("name", ["release-data-bundle.ps1", "activate-data-bundle.ps1"])
def test_retired_data_commands_have_no_execution_body(name: str) -> None:
    source = read_script(name)
    for forbidden in ("WriteAllText", "Invoke-WebRequest", "Push-Location", "Get-Content", "git ", "uv ", "& "):
        assert forbidden not in source
    assert "PSBoundParameters.ContainsKey" in source
    assert "separately approved implementation" in source


@pytest.mark.parametrize("name,args,expected", [
    ("deploy-production.ps1", [], "deploy=not_started"),
    ("preflight-production.ps1", [], "preflight=not_started"),
    ("release-data-bundle.ps1", [], "release=not_started"),
    ("release-data-bundle.ps1", ["-DataBundle", "example", "-PlanOnly"], "release=not_started"),
    ("activate-data-bundle.ps1", [], "activation=not_started"),
    ("activate-data-bundle.ps1", ["-DataBundle", "example"], "activation=not_started"),
])
def test_powershell_plan_does_not_execute(name: str, args: list[str], expected: str) -> None:
    shell = shutil.which("powershell") or shutil.which("pwsh")
    if shell is None:
        pytest.skip("PowerShell plan execution requires PowerShell; static contracts run everywhere")
    result = subprocess.run(
        [shell, "-NoProfile", "-NonInteractive", "-File", str(PROJECT_ROOT / "scripts" / name), *args],
        cwd=PROJECT_ROOT, capture_output=True, text=True, timeout=45,
    )
    if name in {"deploy-production.ps1", "preflight-production.ps1"} and PROJECT_ROOT != Path("C:/sgSHIOK2026"):
        assert result.returncode != 0 and "Wrong working root" in result.stderr
        return
    assert result.returncode == 0, result.stderr
    assert "plan_only=true" in result.stdout and expected in result.stdout


@pytest.mark.parametrize("name,args", [
    ("release-data-bundle.ps1", ["-ConfirmProduction"]),
    ("release-data-bundle.ps1", ["-ConfirmProduction", "-PlanOnly"]),
    ("release-data-bundle.ps1", ["-SkipGitPush"]),
    ("release-data-bundle.ps1", ["-SkipWebTests"]),
    ("release-data-bundle.ps1", ["-RemoteWaitSeconds", "0"]),
    ("release-data-bundle.ps1", ["-RemotePollSeconds", "1"]),
    ("release-data-bundle.ps1", ["-CommitMessage", "ignored"]),
    ("activate-data-bundle.ps1", ["-ConfirmActivation"]),
    ("activate-data-bundle.ps1", ["-SkipRemoteCheck"]),
])
def test_retired_powershell_execution_intent_fails_before_any_action(name: str, args: list[str]) -> None:
    # Never invoke a legacy operational body even when testing the refusal gate.
    source = read_script(name)
    assert "WriteAllText" not in source and "uv run" not in source and "Invoke-WebRequest" not in source
    shell = shutil.which("powershell") or shutil.which("pwsh")
    if shell is None:
        pytest.skip("PowerShell refusal execution requires PowerShell; static contracts run everywhere")
    result = subprocess.run(
        [shell, "-NoProfile", "-NonInteractive", "-File", str(PROJECT_ROOT / "scripts" / name), *args],
        cwd=PROJECT_ROOT, capture_output=True, text=True, timeout=45,
    )
    assert result.returncode != 0
    assert "separately approved implementation" in result.stderr
    assert "plan_only=true" not in result.stdout

def test_prepare_postal_universe_script_passes_runner_confirms_and_versioned_cache() -> None:
    source = (PROJECT_ROOT / "scripts" / "prepare-postal-universe.ps1").read_text(encoding="utf-8")

    assert '$GeocodeCachePath = "raw\\geocode_cache_${Version}.db"' in source
    assert '"--confirm-postal-universe"' in source
    assert '"--db", $GeocodeCachePath' in source
    assert '"--cache-db", $GeocodeCachePath' not in source
    assert '"--confirm-bounded-geocode"' in source



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
