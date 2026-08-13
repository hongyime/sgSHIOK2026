from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

EXPECTED_NOTICE_GIT_BLOB_SHA1 = "116404a4b4192d6fd737e54f66f647f7d73fa22d"
AGENTS_REQUIRED_TEXT = (
    "durable project decisions live in `decisions.md`, not in `.agents/JOURNAL.md`",
    "ignores dot-directories unless they are explicitly allowlisted",
    "Do not put durable product decisions only in `.agents/`.",
)
VERCELIGNORE_REQUIRED_TEXT = (
    "web/public/data/generated_*/",
    "!web/public/data/generated_20260805_prefer_scored_routed/",
    "!web/public/data/generated_20260805_prefer_scored_routed/**",
)


def git_blob_sha1(path: Path) -> str:
    data = path.read_bytes()
    return hashlib.sha1(f"blob {len(data)}\0".encode("utf-8") + data).hexdigest()


def normalized_text(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


def check_repo_integrity(root: Path) -> list[str]:
    errors: list[str] = []

    notice = root / "NOTICE"
    if not notice.is_file():
        errors.append("NOTICE is missing")
    else:
        actual = git_blob_sha1(notice)
        if actual != EXPECTED_NOTICE_GIT_BLOB_SHA1:
            errors.append(
                "NOTICE attribution block changed: "
                f"expected git blob {EXPECTED_NOTICE_GIT_BLOB_SHA1}, got {actual}"
            )

    agents = root / "AGENTS.md"
    if not agents.is_file():
        errors.append("AGENTS.md is missing")
    else:
        text = normalized_text(agents)
        for required in AGENTS_REQUIRED_TEXT:
            if required not in text:
                errors.append(f"AGENTS.md missing required override text: {required}")

    vercelignore = root / ".vercelignore"
    if not vercelignore.is_file():
        errors.append(".vercelignore is missing")
    else:
        lines = set(vercelignore.read_text(encoding="utf-8").splitlines())
        for required in VERCELIGNORE_REQUIRED_TEXT:
            if required not in lines:
                errors.append(f".vercelignore missing required line: {required}")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Check sgSHIOK repo-specific sync tripwires.")
    parser.add_argument("--root", type=Path, default=Path.cwd())
    args = parser.parse_args()

    root = args.root.resolve()
    errors = check_repo_integrity(root)
    if errors:
        for error in errors:
            print(f"FAIL {error}")
        return 1
    print("repo_integrity=ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
