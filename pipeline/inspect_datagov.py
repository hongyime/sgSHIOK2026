"""Search for api-production.data.gov.sg routes in JS files."""

import argparse
import json
import re
import httpx

CONFIRM_DATAGOV_PROBE_FLAG = "--confirm-datagov-probe"


def search_api_routes() -> None:
    url = "https://data.gov.sg/datasets?query=MRT"
    resp = httpx.get(url, follow_redirects=True, timeout=10)
    scripts = re.findall(r'src="(/_next/static/[^"]+)"', resp.text)

    for s in scripts:
        s_url = f"https://data.gov.sg{s}"
        try:
            r = httpx.get(s_url, timeout=5)
            if "api-production.data.gov.sg" in r.text or "datasets" in r.text:
                routes = re.findall(
                    r"https://api-production\.data\.gov\.sg/[a-zA-Z0-9_/.-]+", r.text
                )
                if routes:
                    print(f"Script {s[-20:]} routes:", set(routes))
        except Exception:
            pass


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Search live data.gov.sg pages for API route references."
    )
    parser.add_argument(
        CONFIRM_DATAGOV_PROBE_FLAG,
        action="store_true",
        help="Required before calling live data.gov.sg endpoints.",
    )
    args = parser.parse_args(argv)

    if not args.confirm_datagov_probe:
        print(
            json.dumps(
                {
                    "errors": [
                        "data.gov.sg probe requires --confirm-datagov-probe after owner approval"
                    ],
                    "ok": False,
                },
                indent=2,
                sort_keys=True,
            )
        )
        return 1

    search_api_routes()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
