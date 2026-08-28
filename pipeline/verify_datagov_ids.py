"""Verify correct data.gov.sg dataset IDs via initiate-download API."""

import argparse
import json
import time
import httpx

CONFIRM_DATAGOV_PROBE_FLAG = "--confirm-datagov-probe"

DATASETS = {
    "mrt_lrt_exits": "d_b39d3a0871985372d7e1637193335da5",
    "traffic_signals": "d_f40071375d045d94726e2570075d5069",
    "lamp_posts": "d_ca109de3e83efdd9a10bc5f3dda70a98",
    "building_points": "d_16b157c52ed637edd6ba1232e026258d",
    "planning_area_boundary": "d_4765db0e87b9c86336792efe8a1f7a66",
}


def verify_datagov_ids() -> None:
    client = httpx.Client(timeout=30.0)

    for key, dataset_id in DATASETS.items():
        time.sleep(3.0)
        url = f"https://api-open.data.gov.sg/v1/public/api/datasets/{dataset_id}/initiate-download"
        try:
            resp = client.get(url)
            if resp.status_code == 429:
                print(f"[{key}] 429 Too Many Requests, retrying in 10s...")
                time.sleep(10.0)
                resp = client.get(url)

            data = resp.json()
            download_url = data.get("data", {}).get("url", "")
            message = data.get("data", {}).get("message", "")
            print(f"[{key}] {dataset_id}: status={resp.status_code}")
            if download_url:
                print(f"  download_url={download_url[:120]}")
            if message:
                print(f"  message={message}")
        except Exception as e:
            print(f"[{key}] Error: {e}")

    client.close()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Verify data.gov.sg dataset IDs via the live initiate-download API."
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

    verify_datagov_ids()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
