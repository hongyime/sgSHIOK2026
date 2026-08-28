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
