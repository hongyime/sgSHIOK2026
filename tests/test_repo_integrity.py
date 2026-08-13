from __future__ import annotations

import shutil
from pathlib import Path

from scripts.check_repo_integrity import check_repo_integrity


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def write_fixture(root: Path) -> None:
    shutil.copyfile(PROJECT_ROOT / "NOTICE", root / "NOTICE")
    shutil.copyfile(PROJECT_ROOT / "AGENTS.md", root / "AGENTS.md")
    shutil.copyfile(PROJECT_ROOT / ".vercelignore", root / ".vercelignore")


def test_repo_integrity_accepts_current_tripwire_files(tmp_path: Path):
    write_fixture(tmp_path)

    assert check_repo_integrity(tmp_path) == []


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


def test_repo_integrity_rejects_vercelignore_allowlist_revert(tmp_path: Path):
    write_fixture(tmp_path)
    (tmp_path / ".vercelignore").write_text("web/public/data/generated_*/\n", encoding="utf-8")

    errors = check_repo_integrity(tmp_path)

    assert any(".vercelignore missing required line" in error for error in errors)
