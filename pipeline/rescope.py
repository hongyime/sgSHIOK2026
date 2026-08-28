from __future__ import annotations


def main() -> int:
    retirement_reason = (
        "pipeline.rescope is retired because it performed OSM/HDB raw-data reads "
        "at import time from a relative raw/ path."
    )
    print(
        f"{retirement_reason} Use the cached read-only "
        "`uv run python run.py p125-osm-status` and `uv run python run.py "
        "universe-status` reports for current postal-universe evidence. Any new "
        "postal-universe build must use the guarded `run.py postal-universe "
        "--confirm-postal-universe` path after owner approval."
    )
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
