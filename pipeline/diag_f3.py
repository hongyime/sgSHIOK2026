"""Retired legacy diagnostic entrypoint.

The original script read raw HDB building-point input at import time. Use
guarded runner tasks or tracked QA evidence instead.
"""


def main() -> int:
    print(
        "pipeline.diag_f3 is retired; use guarded runner tasks or tracked QA evidence instead."
    )
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
