"""Locate cached P19 MCST proxy misses through bounded OneMap Search.

This is a two-row measurement for the P19 MCST proxy rows that are absent from
frozen v1. It writes a new numbered P379 cache/report and never mutates the
original P19 measurement files.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import time
from pathlib import Path
from typing import Any

import httpx

from scripts.analysis.p19_universe_gap_measurement import DETAIL_OUTPUT, PROJECT_ROOT, normalize_postal

QA_DIR = PROJECT_ROOT / "qa" / "p379"
CACHE_OUTPUT = QA_DIR / "p19_mcst_missing_onemap_cache.json"
REPORT_OUTPUT = QA_DIR / "p19_mcst_missing_locations_report.json"
ONEMAP_SEARCH_URL = "https://www.onemap.gov.sg/api/common/elastic/search"
USER_AGENT = "sgSHIOK-P379-mcst-missing-location/1.0"


def load_json(path: Path, default: Any) -> Any:
    if not path.is_file():
        return default
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as f:
        json.dump(payload, f, indent=2, sort_keys=True)
        f.write("\n")


def relative_path(path: Path) -> str:
    try:
        return str(path.relative_to(PROJECT_ROOT)).replace("\\", "/")
    except ValueError:
        return str(path)


def p19_mcst_missing_rows(detail_path: Path = DETAIL_OUTPUT) -> list[dict[str, Any]]:
    payload = load_json(detail_path, {})
    return [
        row
        for row in payload.get("mcst_rows", [])
        if row.get("in_v1") is False and normalize_postal(row.get("postal")) is not None
    ]


def search_queries_for_row(row: dict[str, Any]) -> list[str]:
    location = str(row.get("development_location") or "").strip()
    postal = normalize_postal(row.get("postal"))
    queries = [query for query in (location, postal) if query]
    return list(dict.fromkeys(str(query) for query in queries))


def fetch_onemap_search(client: httpx.Client, query: str) -> dict[str, Any]:
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
    }
    if response.status_code == 200:
        body = response.json()
        payload["api_error"] = body.get("error")
        payload["found"] = body.get("found")
        payload["totalNumPages"] = body.get("totalNumPages")
        payload["results"] = body.get("results", [])[:5]
        return payload
    payload["retry_after"] = response.headers.get("Retry-After")
    payload["body"] = response.text[:500]
    return payload


def best_postal_match(row: dict[str, Any], cached: dict[str, Any]) -> dict[str, Any] | None:
    target_postal = normalize_postal(row.get("postal"))
    if target_postal is None:
        return None
    for result in cached.get("results") or []:
        if normalize_postal(result.get("POSTAL")) == target_postal:
            return result
    return None


def coordinate_from_result(result: dict[str, Any]) -> dict[str, float] | None:
    try:
        return {
            "lat": round(float(result["LATITUDE"]), 7),
            "lon": round(float(result["LONGITUDE"]), 7),
        }
    except (KeyError, TypeError, ValueError):
        return None


def candidate_postals_by_query(
    queries: list[str],
    cached_payloads: list[dict[str, Any]],
) -> dict[str, list[str]]:
    candidates: dict[str, list[str]] = {}
    for query, cached in zip(queries, cached_payloads, strict=True):
        postals = sorted(
            {
                postal
                for result in cached.get("results") or []
                for postal in [normalize_postal(result.get("POSTAL"))]
                if postal is not None
            }
        )
        candidates[query] = postals
    return candidates


def build_report(
    *,
    detail_path: Path = DETAIL_OUTPUT,
    cache_path: Path = CACHE_OUTPUT,
    report_path: Path = REPORT_OUTPUT,
    delay_sec: float = 0.25,
    refresh_cache: bool = False,
) -> dict[str, Any]:
    rows = p19_mcst_missing_rows(detail_path)
    cache: dict[str, Any] = load_json(cache_path, {})
    cache_changed = False
    row_queries = {normalize_postal(row.get("postal")): search_queries_for_row(row) for row in rows}
    pending = [
        query
        for row in rows
        for query in row_queries.get(normalize_postal(row.get("postal")), [])
        if refresh_cache or query not in cache
    ]
    if pending:
        with httpx.Client(timeout=30.0, headers={"User-Agent": USER_AGENT}) as client:
            for query in pending:
                cache[query] = fetch_onemap_search(client, query)
                cache_changed = True
                time.sleep(delay_sec)
    if cache_changed:
        write_json(cache_path, cache)

    located_rows: list[dict[str, Any]] = []
    unlocated_rows: list[dict[str, Any]] = []
    for row in rows:
        queries = row_queries.get(normalize_postal(row.get("postal")), [])
        cached_payloads = [cache.get(query, {}) for query in queries]
        match = next(
            (
                candidate
                for cached in cached_payloads
                for candidate in [best_postal_match(row, cached)]
                if candidate is not None
            ),
            None,
        )
        matched_query = next(
            (
                query
                for query, cached in zip(queries, cached_payloads, strict=True)
                if best_postal_match(row, cached) is not None
            ),
            None,
        )
        primary_cached = cached_payloads[0] if cached_payloads else {}
        coordinate = coordinate_from_result(match) if match is not None else None
        output_row = {
            "postal": normalize_postal(row.get("postal")),
            "development_name": row.get("development_name"),
            "development_location": row.get("development_location"),
            "mc_form_year": row.get("mc_form_year"),
            "usr_mcno": row.get("usr_mcno"),
            "queries": queries,
            "matched_query": matched_query,
            "status_code": primary_cached.get("status_code"),
            "found": primary_cached.get("found"),
            "candidate_postals_by_query": candidate_postals_by_query(queries, cached_payloads),
            "matched_postal": normalize_postal(match.get("POSTAL")) if match else None,
            "searchval": match.get("SEARCHVAL") if match else None,
            "address": match.get("ADDRESS") if match else None,
            "coordinate": coordinate,
        }
        if coordinate is None:
            unlocated_rows.append(output_row)
        else:
            located_rows.append(output_row)

    report = {
        "mode": "p379_p19_mcst_missing_locations",
        "generated_at_utc": dt.datetime.now(dt.UTC).isoformat(),
        "will_score": False,
        "will_export": False,
        "will_mutate_p19": False,
        "detail_path": relative_path(detail_path),
        "cache_path": relative_path(cache_path),
        "report_path": relative_path(report_path),
        "mcst_missing_rows": len(rows),
        "located_rows": len(located_rows),
        "unlocated_rows": len(unlocated_rows),
        "cache_queries": sorted(cache),
        "cache_written": cache_changed,
        "located": located_rows,
        "unlocated": unlocated_rows,
    }
    write_json(report_path, report)
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--delay-sec", type=float, default=0.25)
    parser.add_argument("--refresh-cache", action="store_true")
    args = parser.parse_args(argv)
    print(
        json.dumps(
            build_report(delay_sec=args.delay_sec, refresh_cache=args.refresh_cache),
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
