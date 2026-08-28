"""Retired legacy diagnostic entrypoint.

The original script extracted and read the raw traffic-signal shapefile at
import time. Use guarded runner tasks or tracked QA evidence instead.
"""


def main() -> int:
    print(
        "pipeline.diag_traffic_signals is retired; use guarded runner tasks or tracked QA evidence instead."
    )
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
