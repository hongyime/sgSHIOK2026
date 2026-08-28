"""Parse geospatial static dataset URLs from LTA DataMall static-data.html."""

import argparse
import json
import re
import httpx

CONFIRM_DATAMALL_STATIC_PARSE_FLAG = "--confirm-datamall-static-parse"


def parse_datamall_static_links() -> None:
    url = "https://datamall.lta.gov.sg/content/datamall/en/static-data.html"
    resp = httpx.get(url, follow_redirects=True, timeout=15)
    print("Page status:", resp.status_code)

    # Search for zip file links in page HTML
    zip_links = re.findall(r'href=["\']([^"\']+\.zip)["\']', resp.text, re.IGNORECASE)
    print(f"Found {len(zip_links)} zip links:")
    for link in zip_links:
        if (
            "linkway" in link.lower()
            or "bridge" in link.lower()
            or "overhead" in link.lower()
            or "geospatial" in link.lower()
        ):
            full_url = link if link.startswith("http") else f"https://datamall.lta.gov.sg{link}"
            print(" -", full_url)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Parse geospatial static dataset URLs from the live LTA DataMall page."
    )
    parser.add_argument(
        CONFIRM_DATAMALL_STATIC_PARSE_FLAG,
        action="store_true",
        help="Required before calling the live DataMall static-data page.",
    )
    args = parser.parse_args(argv)

    if not args.confirm_datamall_static_parse:
        print(
            json.dumps(
                {
                    "errors": [
                        "DataMall static parser requires --confirm-datamall-static-parse after owner approval"
                    ],
                    "ok": False,
                },
                indent=2,
                sort_keys=True,
            )
        )
        return 1

    parse_datamall_static_links()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
