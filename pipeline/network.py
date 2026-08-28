"""Network build entry point for run.py."""

from __future__ import annotations

import argparse

from scripts.run_network_build import run_build


CONFIRM_NETWORK_BUILD_FLAG = "--confirm-network-build"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build the pedestrian network.")
    parser.add_argument(
        "--area",
        default="pilot",
        choices=["pilot", "island"],
        help="Network scope to build.",
    )
    parser.add_argument(
        CONFIRM_NETWORK_BUILD_FLAG,
        action="store_true",
        help=(
            "Confirm this invocation may write processed network artifacts and QA outputs. "
            "Do not use this to repair frozen-v1 input hash mismatches."
        ),
    )
    args = parser.parse_args(argv)

    if not args.confirm_network_build:
        parser.error(
            "network build writes processed network artifacts and QA outputs; "
            f"pass {CONFIRM_NETWORK_BUILD_FLAG} only after owner approval"
        )

    run_build(args.area)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
