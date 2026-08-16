"""Measure current postal-universe coverage from public address signals.

This script is read/measurement only: it does not mutate raw/, processed/, or
web/public/data/. It writes resumable API caches under qa/p19/.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import time
from pathlib import Path
from typing import Any

import httpx
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[2]
QA_DIR = PROJECT_ROOT / "qa" / "p19"
V1_UNIVERSE = PROJECT_ROOT / "processed" / "postal_universe_candidate_full_registered_geocoded.parquet"

DATASTORE_URL = "https://data.gov.sg/api/action/datastore_search"
ONEMAP_SEARCH_URL = "https://www.onemap.gov.sg/api/common/elastic/search"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

HDB_PROPERTY_INFO_ID = "d_17f5382f26140b1fdae0ba2ef6239d2f"
BCA_MCST_ID = "d_1f9391a2f1476cdaf4f05a8d3a05c257"

USER_AGENT = "sgSHIOK-P19-universe-gap-measurement/1.0"
POSTAL_RE = re.compile(r"^\d{6}$")

ROAD_ABBREVIATIONS = {
    "AVE": "AVENUE",
    "AV": "AVENUE",
    "BLVD": "BOULEVARD",
    "BT": "BUKIT",
    "C'WEALTH": "COMMONWEALTH",
    "CL": "CLOSE",
    "CRES": "CRESCENT",
    "CTRL": "CENTRAL",
    "DR": "DRIVE",
    "GDN": "GARDEN",
    "GDNS": "GARDENS",
    "HTS": "HEIGHTS",
    "JLN": "JALAN",
    "KG": "KAMPONG",
    "LOR": "LORONG",
    "NTH": "NORTH",
    "PK": "PARK",
    "PL": "PLACE",
    "RD": "ROAD",
    "ST": "STREET",
    "STH": "SOUTH",
    "TER": "TERRACE",
    "UPP": "UPPER",
}


def normalize_postal(value: Any) -> str | None:
    text = str(value or "").strip()
    if text.isdigit() and len(text) <= 6:
        text = text.zfill(6)
    return text if POSTAL_RE.fullmatch(text) and text != "000000" else None


def normalize_road(value: Any) -> str:
    words = re.sub(r"[^A-Z0-9' ]+", " ", str(value or "").upper()).split()
    return " ".join(ROAD_ABBREVIATIONS.get(word, word) for word in words)


def fetch_datastore(resource_id: str) -> dict[str, Any]:
    records: list[dict[str, Any]] = []
    fields: list[dict[str, Any]] = []
    total = 0
    limit = 5000
    offset = 0
    with httpx.Client(timeout=60.0, headers={"User-Agent": USER_AGENT}) as client:
        while True:
            response = client.get(
                DATASTORE_URL,
                params={"resource_id": resource_id, "limit": limit, "offset": offset},
            )
            response.raise_for_status()
            data = response.json()
            if not data.get("success"):
                raise RuntimeError(f"data.gov.sg datastore_search failed for {resource_id}: {data}")
            result = data["result"]
            total = int(result["total"])
            fields = result.get("fields", fields)
            page = result.get("records", [])
            records.extend(page)
            if offset + len(page) >= total or not page:
                break
            offset += len(page)
    return {"resource_id": resource_id, "total": total, "fields": fields, "records": records}


def recent_hdb_rows(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for record in records:
        try:
            year = int(record.get("year_completed") or 0)
            units = int(record.get("total_dwelling_units") or 0)
        except ValueError:
            continue
        if 2021 <= year <= 2026 and record.get("residential") == "Y" and units > 0:
            rows.append(record)
    return sorted(rows, key=lambda row: (int(row["year_completed"]), row["street"], row["blk_no"]))


def parse_mcst_date(value: Any) -> dt.date | None:
    try:
        return dt.datetime.strptime(str(value), "%d/%m/%Y").date()
    except ValueError:
        return None


def recent_mcst_rows(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for record in records:
        date = parse_mcst_date(record.get("mc_form_date"))
        postal = normalize_postal(record.get("mcst_postalcode"))
        if (
            date is not None
            and 2021 <= date.year <= 2026
            and postal is not None
            and record.get("ust_status") == "ACTIVE"
        ):
            record = dict(record)
            record["normalized_postal"] = postal
            record["mc_form_year"] = date.year
            rows.append(record)
    return sorted(rows, key=lambda row: (row["mc_form_year"], row["mcst_postalcode"], row["usr_mcno"]))


def load_json(path: Path, default: Any) -> Any:
    if not path.is_file():
        return default
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, sort_keys=True)
        f.write("\n")


def hdb_query_variants(row: dict[str, Any]) -> list[str]:
    original = f"{row['blk_no']} {row['street']}"
    expanded = f"{row['blk_no']} {normalize_road(row['street'])}"
    return list(dict.fromkeys([original, expanded]))


def fetch_onemap_search(client: httpx.Client, query: str, delay_sec: float) -> dict[str, Any]:
    for attempt in range(4):
        started = time.perf_counter()
        response = client.get(
            ONEMAP_SEARCH_URL,
            params={
                "searchVal": query,
                "returnGeom": "Y",
                "getAddrDetails": "Y",
                "pageNum": 1,
            },
        )
        elapsed = time.perf_counter() - started
        payload: dict[str, Any] = {
            "query": query,
            "status_code": response.status_code,
            "elapsed_sec": round(elapsed, 3),
            "attempts": attempt + 1,
        }
        if response.status_code == 200:
            body = response.json()
            payload["api_error"] = body.get("error")
            payload["found"] = body.get("found")
            payload["totalNumPages"] = body.get("totalNumPages")
            payload["results"] = body.get("results", [])[:3]
            time.sleep(delay_sec)
            return payload
        payload["retry_after"] = response.headers.get("Retry-After")
        payload["body"] = response.text[:500]
        if response.status_code != 429:
            time.sleep(delay_sec)
            return payload
        wait_sec = float(response.headers.get("Retry-After") or min(60, 10 * (attempt + 1)))
        time.sleep(wait_sec)
    return payload


def cached_block_road_match(cached: dict[str, Any], row: dict[str, Any]) -> bool:
    target_blk = str(row["blk_no"]).strip().upper()
    target_road = normalize_road(row["street"])
    return any(
        str(result.get("BLK_NO", "")).strip().upper() == target_blk
        and normalize_road(result.get("ROAD_NAME")) == target_road
        for result in cached.get("results") or []
    )


def geocode_hdb_rows(rows: list[dict[str, Any]], delay_sec: float) -> list[dict[str, Any]]:
    cache_path = QA_DIR / "hdb_2021_2026_onemap_geocode_cache.json"
    cache: dict[str, Any] = load_json(cache_path, {})
    changed = False
    with httpx.Client(timeout=30.0, headers={"User-Agent": USER_AGENT}) as client:
        for index, row in enumerate(rows, start=1):
            if any(
                query in cache
                and cache[query].get("status_code") != 429
                and cached_block_road_match(cache[query], row)
                for query in hdb_query_variants(row)
            ):
                continue
            for query in hdb_query_variants(row):
                cached = cache.get(query)
                if cached and cached.get("status_code") != 429 and cached.get("results"):
                    continue
                cache[query] = fetch_onemap_search(client, query, delay_sec)
                changed = True
                if cached_block_road_match(cache[query], row):
                    break
            if index % 25 == 0:
                write_json(cache_path, cache)
    if changed:
        write_json(cache_path, cache)

    measured: list[dict[str, Any]] = []
    for row in rows:
        target_blk = str(row["blk_no"]).strip().upper()
        target_road = normalize_road(row["street"])
        chosen = None
        match_method = "none"
        query_used = None
        cached_used: dict[str, Any] = {}
        for query in hdb_query_variants(row):
            cached = cache.get(query, {})
            results = cached.get("results") or []
            for result in results:
                if (
                    str(result.get("BLK_NO", "")).strip().upper() == target_blk
                    and normalize_road(result.get("ROAD_NAME")) == target_road
                ):
                    chosen = result
                    match_method = "block_road"
                    query_used = query
                    cached_used = cached
                    break
            if chosen is not None:
                break
            if results and chosen is None:
                chosen = results[0]
                match_method = "first_result"
                query_used = query
                cached_used = cached
        postal = normalize_postal(chosen.get("POSTAL") if chosen else None)
        measured.append(
            {
                "blk_no": row["blk_no"],
                "street": row["street"],
                "year_completed": int(row["year_completed"]),
                "total_dwelling_units": int(row["total_dwelling_units"]),
                "query": query_used or hdb_query_variants(row)[0],
                "match_method": match_method,
                "postal": postal,
                "searchval": chosen.get("SEARCHVAL") if chosen else None,
                "address": chosen.get("ADDRESS") if chosen else None,
                "api_error": cached_used.get("api_error"),
                "status_code": cached_used.get("status_code"),
            }
        )
    return measured


def overpass_postcodes() -> dict[str, Any]:
    cache_path = QA_DIR / "overpass_addr_postcodes_cache.json"
    cached = load_json(cache_path, None)
    if cached is not None:
        return cached
    query = """
[out:json][timeout:120];
area["ISO3166-1"="SG"][admin_level=2]->.searchArea;
(
  node["addr:postcode"](area.searchArea);
  way["addr:postcode"](area.searchArea);
  relation["addr:postcode"](area.searchArea);
);
out tags qt;
"""
    started = time.perf_counter()
    response = httpx.post(
        OVERPASS_URL,
        data={"data": query},
        timeout=180.0,
        headers={"User-Agent": USER_AGENT},
    )
    elapsed = time.perf_counter() - started
    response.raise_for_status()
    body = response.json()
    postcodes = sorted(
        {
            postal
            for element in body.get("elements", [])
            for postal in [normalize_postal(element.get("tags", {}).get("addr:postcode"))]
            if postal is not None
        }
    )
    payload = {
        "queried_at_utc": dt.datetime.now(dt.UTC).isoformat(),
        "elapsed_sec": round(elapsed, 3),
        "status_code": response.status_code,
        "bytes": len(response.content),
        "generator": body.get("generator"),
        "osm3s": body.get("osm3s", {}),
        "element_count": len(body.get("elements", [])),
        "postcodes": postcodes,
    }
    write_json(cache_path, payload)
    return payload


def by_year(rows: list[dict[str, Any]], field: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for row in rows:
        key = str(row[field])
        counts[key] = counts.get(key, 0) + 1
    return dict(sorted(counts.items()))


def summarise_group(rows: list[dict[str, Any]], postal_field: str, v1_postals: set[str]) -> dict[str, Any]:
    geocoded = [row for row in rows if normalize_postal(row.get(postal_field)) is not None]
    unique_postals = sorted({normalize_postal(row.get(postal_field)) for row in geocoded})
    unique_postals = [postal for postal in unique_postals if postal is not None]
    missing_rows = [row for row in geocoded if row[postal_field] not in v1_postals]
    missing_unique = sorted({row[postal_field] for row in missing_rows})
    return {
        "rows": len(rows),
        "rows_with_postal": len(geocoded),
        "unique_postals": len(unique_postals),
        "missing_rows": len(missing_rows),
        "missing_unique_postals": len(missing_unique),
        "row_miss_rate": round(len(missing_rows) / len(geocoded), 6) if geocoded else None,
        "unique_miss_rate": round(len(missing_unique) / len(unique_postals), 6) if unique_postals else None,
        "missing_postals": missing_unique,
        "sample_missing_postals": missing_unique[:25],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--delay-sec", type=float, default=0.25)
    args = parser.parse_args()

    v1 = pd.read_parquet(V1_UNIVERSE, columns=["postal_code", "status"])
    v1_postals = set(v1["postal_code"].astype(str))

    hdb_data = fetch_datastore(HDB_PROPERTY_INFO_ID)
    mcst_data = fetch_datastore(BCA_MCST_ID)
    hdb_recent = recent_hdb_rows(hdb_data["records"])
    mcst_recent = recent_mcst_rows(mcst_data["records"])
    hdb_measured = geocode_hdb_rows(hdb_recent, args.delay_sec)
    overpass = overpass_postcodes()

    for row in hdb_measured:
        row["in_v1"] = row["postal"] in v1_postals if row["postal"] else None
    for row in mcst_recent:
        row["in_v1"] = row["normalized_postal"] in v1_postals

    hdb_summary = summarise_group(hdb_measured, "postal", v1_postals)
    mcst_summary = summarise_group(mcst_recent, "normalized_postal", v1_postals)

    osm_postals = set(overpass["postcodes"])
    osm_missing_from_v1 = sorted(osm_postals - v1_postals)
    v1_missing_from_osm = sorted(v1_postals - osm_postals)

    summary = {
        "generated_at_utc": dt.datetime.now(dt.UTC).isoformat(),
        "working_root": str(PROJECT_ROOT),
        "sources": {
            "hdb_property_info": {
                "dataset_id": HDB_PROPERTY_INFO_ID,
                "total_rows": hdb_data["total"],
                "recent_filter": "residential == Y, total_dwelling_units > 0, 2021 <= year_completed <= 2026",
                "recent_rows_by_year": by_year(hdb_recent, "year_completed"),
            },
            "bca_mcst": {
                "dataset_id": BCA_MCST_ID,
                "total_rows": mcst_data["total"],
                "recent_filter": "ACTIVE, six-digit postal, 2021 <= Date of MC Constitution <= 2026",
                "recent_rows_by_year": by_year(mcst_recent, "mc_form_year"),
            },
            "overpass": {
                "url": OVERPASS_URL,
                "generator": overpass.get("generator"),
                "osm_base": overpass.get("osm3s", {}).get("timestamp_osm_base"),
                "areas_base": overpass.get("osm3s", {}).get("timestamp_areas_base"),
                "element_count": overpass.get("element_count"),
                "elapsed_sec": overpass.get("elapsed_sec"),
                "bytes": overpass.get("bytes"),
            },
        },
        "v1_universe": {
            "path": "processed/postal_universe_candidate_full_registered_geocoded.parquet",
            "rows": int(len(v1)),
            "unique_postals": len(v1_postals),
            "status_counts": v1["status"].value_counts(dropna=False).to_dict(),
        },
        "hdb_2021_2026_geocoded": hdb_summary,
        "mcst_2021_2026": mcst_summary,
        "combined_recent_completion_signal": {
            "rows_with_postal": hdb_summary["rows_with_postal"] + mcst_summary["rows_with_postal"],
            "missing_rows": hdb_summary["missing_rows"] + mcst_summary["missing_rows"],
            "row_miss_rate": round(
                (hdb_summary["missing_rows"] + mcst_summary["missing_rows"])
                / (hdb_summary["rows_with_postal"] + mcst_summary["rows_with_postal"]),
                6,
            ),
            "missing_unique_postals": len(
                set(hdb_summary["missing_postals"])
                | set(mcst_summary["missing_postals"])
            ),
        },
        "overpass_addr_postcode": {
            "unique_postcodes": len(osm_postals),
            "missing_from_v1": len(osm_missing_from_v1),
            "v1_missing_from_overpass": len(v1_missing_from_osm),
            "intersection": len(osm_postals & v1_postals),
            "sample_missing_from_v1": osm_missing_from_v1[:50],
            "sample_v1_missing_from_overpass": v1_missing_from_osm[:50],
        },
        "method_limits": [
            "HDB Property Information has completion year but no postal code; this run geocodes each block/street through OneMap search and counts only rows with a six-digit returned postal.",
            "BCA MCST constitution date is a proxy for private strata completion/onboarding, not a TOP date.",
            "Overpass counts only OSM objects currently tagged with addr:postcode in Singapore, not an authoritative national address register.",
        ],
    }

    detail = {
        "hdb_rows": hdb_measured,
        "mcst_rows": [
            {
                "usr_mcno": row.get("usr_mcno"),
                "development_name": row.get("usr_devtname"),
                "development_location": row.get("devt_location"),
                "postal": row.get("normalized_postal"),
                "mc_form_date": row.get("mc_form_date"),
                "mc_form_year": row.get("mc_form_year"),
                "in_v1": row.get("in_v1"),
            }
            for row in mcst_recent
        ],
    }
    write_json(QA_DIR / "universe_gap_measurement_summary.json", summary)
    write_json(QA_DIR / "universe_gap_measurement_detail.json", detail)
    print(json.dumps(summary, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
