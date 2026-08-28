"""Retired legacy diagnostic entrypoint.

The original script read raw geospatial inputs directly. Use guarded runner
tasks or tracked QA evidence instead.
"""


def main() -> int:
    print(
        "pipeline.diag_c_fix is retired; use guarded runner tasks or tracked QA evidence instead."
    )
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
