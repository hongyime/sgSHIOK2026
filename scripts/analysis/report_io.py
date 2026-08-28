from __future__ import annotations

from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
PROTECTED_OUTPUT_ROOTS = (
    PROJECT_ROOT / "web" / "public" / "data",
    PROJECT_ROOT / "qa" / "releases",
)
PROTECTED_OUTPUT_FILES = (PROJECT_ROOT / "checksums.json",)
PROTECTED_QA_PREFIXES = ("p6_", "p7_", "p8_", "p9_", "p10_")


def resolve_report_path(path: Path) -> Path:
    if path.is_absolute():
        return path.resolve(strict=False)
    return (PROJECT_ROOT / path).resolve(strict=False)


def is_protected_report_path(path: Path) -> bool:
    resolved = resolve_report_path(path)
    if any(resolved == protected.resolve(strict=False) for protected in PROTECTED_OUTPUT_FILES):
        return True
    if any(
        resolved.is_relative_to(protected.resolve(strict=False))
        for protected in PROTECTED_OUTPUT_ROOTS
    ):
        return True
    try:
        relative = resolved.relative_to(PROJECT_ROOT.resolve(strict=False))
    except ValueError:
        return False
    parts = relative.parts
    return len(parts) >= 2 and parts[0] == "qa" and (
        parts[1] == "p11" or parts[1].startswith(PROTECTED_QA_PREFIXES)
    )


def assert_new_text_report_path(path: Path) -> None:
    if is_protected_report_path(path):
        raise ValueError(f"refusing protected analysis output path: {path}")
    if path.exists():
        raise FileExistsError(f"refusing to overwrite existing analysis output: {path}")


def write_new_text_report(path: Path, text: str) -> None:
    assert_new_text_report_path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
