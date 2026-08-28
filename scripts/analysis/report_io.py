from __future__ import annotations

from pathlib import Path


def assert_new_text_report_path(path: Path) -> None:
    if path.exists():
        raise FileExistsError(f"refusing to overwrite existing analysis output: {path}")


def write_new_text_report(path: Path, text: str) -> None:
    assert_new_text_report_path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
