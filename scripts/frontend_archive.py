"""Explicit capture of already-built frontend bytes, never a build or data export."""

import argparse
import json
from pathlib import Path

from scripts.release_staging import capture_frontend_archive


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--build-web-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--expected-build-id", required=True)
    parser.add_argument("--maplibre-version", action="append", required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    if Path.cwd() != root:
        parser.error("run from the canonical repository root")
    try:
        report = capture_frontend_archive(root, args.build_web_root, args.output,
                                          expected_build_id=args.expected_build_id,
                                          maplibre_versions=args.maplibre_version)
    except (ValueError, OSError) as error:
        print(json.dumps({"ok": False, "error": str(error)}))
        return 1
    print(json.dumps({"ok": True, **report}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
