from __future__ import annotations


def main() -> int:
    print(
        "pipeline.diag_c2 is retired because it read raw geospatial inputs at "
        "import time. Use maintained read-only QA/status commands or an approved "
        "new-version diagnostic with explicit output paths."
    )
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
