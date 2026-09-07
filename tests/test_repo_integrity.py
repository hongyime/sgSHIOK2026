from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

import pytest

from scripts.check_repo_integrity import (
    GITIGNORE_REQUIRED_LINES,
    SYNC_BLOCK_END,
    check_repo_integrity,
)

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def write_fixture(root: Path) -> None:
    shutil.copyfile(PROJECT_ROOT / "NOTICE", root / "NOTICE")
    shutil.copyfile(PROJECT_ROOT / "AGENTS.md", root / "AGENTS.md")
    shutil.copyfile(PROJECT_ROOT / ".vercelignore", root / ".vercelignore")
    shutil.copyfile(PROJECT_ROOT / ".gitignore", root / ".gitignore")


def test_repo_integrity_accepts_current_tripwire_files(tmp_path: Path):
    write_fixture(tmp_path)

    assert check_repo_integrity(tmp_path) == []


def test_notice_names_shelter_map_and_lamp_posts() -> None:
    text = (PROJECT_ROOT / "NOTICE").read_text(encoding="utf-8")

    assert text.startswith("S.H.I.O.K. Shelter Map")
    assert "S.H.I.O.K. Index" not in text
    assert "lamp_posts, published by the Land Transport Authority" in text


def test_repo_integrity_rejects_notice_revert(tmp_path: Path):
    write_fixture(tmp_path)
    (tmp_path / "NOTICE").write_text("Copyright (c) 2026 sgSHIOK contributors\n", encoding="utf-8")

    errors = check_repo_integrity(tmp_path)

    assert any("NOTICE attribution block changed" in error for error in errors)


def test_repo_integrity_rejects_agents_override_revert(tmp_path: Path):
    write_fixture(tmp_path)
    (tmp_path / "AGENTS.md").write_text(
        "Durable decisions live in .agents/JOURNAL.md.\n",
        encoding="utf-8",
    )

    errors = check_repo_integrity(tmp_path)

    assert any("AGENTS.md missing required override text" in error for error in errors)


def test_repo_integrity_rejects_combined_sync_damage_without_deleting_files(tmp_path: Path):
    # Reproduce the observed shape in a fresh fixture; .vercelignore never exists.
    (tmp_path / "NOTICE").write_text("Copyright 2026 The Prawn Organisation\n", encoding="utf-8")
    (tmp_path / "AGENTS.md").write_text("Durable decisions live in .agents/JOURNAL.md.\n", encoding="utf-8")
    lines = (PROJECT_ROOT / ".gitignore").read_text(encoding="utf-8").splitlines()
    (tmp_path / ".gitignore").write_text(
        "\n".join(line for line in lines if line not in GITIGNORE_REQUIRED_LINES) + "\n",
        encoding="utf-8",
    )

    errors = check_repo_integrity(tmp_path)

    assert any("NOTICE attribution block changed" in error for error in errors)
    assert sum("AGENTS.md missing required override text" in error for error in errors) == 3
    assert ".vercelignore is missing" in errors
    for required in GITIGNORE_REQUIRED_LINES:
        assert f".gitignore missing required line: {required}" in errors


def test_repo_integrity_rejects_vercelignore_allowlist_revert(tmp_path: Path):
    write_fixture(tmp_path)
    (tmp_path / ".vercelignore").write_text("web/public/data/generated_*/\n", encoding="utf-8")

    errors = check_repo_integrity(tmp_path)

    assert any(".vercelignore missing required line" in error for error in errors)


@pytest.mark.parametrize("required", GITIGNORE_REQUIRED_LINES)
def test_repo_integrity_rejects_removed_project_ignore_rule(tmp_path: Path, required: str):
    write_fixture(tmp_path)
    text = (tmp_path / ".gitignore").read_text(encoding="utf-8")
    (tmp_path / ".gitignore").write_text(
        "\n".join(line for line in text.splitlines() if line != required) + "\n",
        encoding="utf-8",
    )

    errors = check_repo_integrity(tmp_path)

    assert f".gitignore missing required line: {required}" in errors


@pytest.mark.parametrize("required", GITIGNORE_REQUIRED_LINES)
def test_repo_integrity_rejects_project_rule_only_inside_sync_block(tmp_path: Path, required: str):
    write_fixture(tmp_path)
    ignore = tmp_path / ".gitignore"
    lines = [line for line in ignore.read_text(encoding="utf-8").splitlines() if line != required]
    lines.insert(lines.index(SYNC_BLOCK_END), required)
    ignore.write_text("\n".join(lines) + "\n", encoding="utf-8")

    assert f".gitignore project rule is inside replaceable sync block: {required}" in check_repo_integrity(tmp_path)


@pytest.mark.parametrize(
    ("path", "ignored"),
    [
        (".env.local", True),
        ("web/.env.production", True),
        ("venv/Lib/example.py", True),
        ("web/dist/bundle.js", True),
        ("build/generated.js", True),
        ("coverage/lcov.info", True),
        (".vercelignore", False),
        (".agents/STATE.md", False),
        ("web/app/page.tsx", False),
        ("web/lib/__tests__/fixtures/published-walks.json", False),
    ],
)
def test_project_ignore_behavior_with_git(tmp_path: Path, path: str, ignored: bool):
    # Nonexistent candidate paths: no credentials or production payload needed.
    shutil.copyfile(PROJECT_ROOT / ".gitignore", tmp_path / ".gitignore")
    subprocess.run(["git", "init", "--quiet", str(tmp_path)], check=True, capture_output=True)
    result = subprocess.run(
        ["git", "-C", str(tmp_path), "check-ignore", "--quiet", "--no-index", path],
        capture_output=True,
        text=True,
    )
    assert result.returncode in (0, 1), result.stderr
    assert (result.returncode == 0) is ignored


def test_repo_integrity_workflow_has_schedule_trigger():
    workflow = (PROJECT_ROOT / ".github" / "workflows" / "repo-integrity.yml").read_text(
        encoding="utf-8"
    )

    assert "schedule:" in workflow
    assert 'cron: "31 9 * * *"' in workflow
