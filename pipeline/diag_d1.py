from __future__ import annotations


def main() -> int:
    print(
        "pipeline.diag_d1 is retired because it read raw OSM and planning-area "
        "inputs at import time from a relative raw/ path. Use maintained "
        "read-only QA/status commands or an approved new-version diagnostic with "
        "explicit output paths."
    )
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
