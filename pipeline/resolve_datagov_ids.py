"""Resolve correct data.gov.sg dataset IDs for S.H.I.O.K. sources."""

import argparse
import json
import time

import httpx

CONFIRM_DATAGOV_PROBE_FLAG = "--confirm-datagov-probe"

SEARCH_QUERIES = [
    ("mrt_lrt_exits", "train station exit point"),
    ("traffic_signals", "traffic signal"),
    ("lamp_posts", "lamp post"),
    ("building_points", "hdb property information"),
    ("planning_area_boundary", "master plan 2019 planning area boundary"),
]

API_BASE = "https://api-open.data.gov.sg/v1/public/api/datasets"


def resolve_datagov_ids() -> None:
    client = httpx.Client(timeout=30.0)

    for key, query in SEARCH_QUERIES:
        time.sleep(3.0)  # Politeness throttle
        try:
            url = f"{API_BASE}?query={query}"
            resp = client.get(url)
            if resp.status_code == 429:
                print(f"[{key}] 429 Too Many Requests, waiting 10s...")
                time.sleep(10.0)
                resp = client.get(url)

            resp.raise_for_status()
            data = resp.json()
            datasets = data.get("data", {}).get("datasets", [])

            print(f"\n--- [{key}] query='{query}' ---")
            for ds in datasets[:5]:
                name = ds.get("name", "")
                ds_id = ds.get("datasetId", "")
                print(f"  {ds_id}  {name}")

        except Exception as e:
            print(f"[{key}] Error: {e}")

    client.close()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Resolve data.gov.sg dataset IDs via the live public API."
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

    resolve_datagov_ids()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
