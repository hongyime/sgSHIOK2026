"""Read-only status for the cached P125 OSM addr:postcode measurement."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
from pathlib import Path
from typing import Any

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[2]
QA_DIR = PROJECT_ROOT / "qa" / "p125"
OVERPASS_OUTPUT = QA_DIR / "overpass_sg_addr_postcode.json"
OVERPASS_QUERY = QA_DIR / "overpass_sg_addr_postcode.query"
V1_UNIVERSE = PROJECT_ROOT / "processed" / "postal_universe_candidate_full_registered_geocoded.parquet"
POSTAL_RE = re.compile(r"^\d{6}$")


def normalize_postal(value: Any, *, zero_pad: bool = True) -> str | None:
    text = str(value or "").strip()
    if zero_pad and text.isdigit() and len(text) <= 6:
        text = text.zfill(6)
    return text if POSTAL_RE.fullmatch(text) and text != "000000" else None


def relative_path(path: Path) -> str:
    try:
        return str(path.relative_to(PROJECT_ROOT)).replace("\\", "/")
    except ValueError:
        return str(path)


def file_status(path: Path, *, now: dt.datetime | None = None) -> dict[str, Any]:
    status: dict[str, Any] = {
        "path": relative_path(path),
        "exists": path.is_file(),
        "bytes": path.stat().st_size if path.is_file() else 0,
    }
    if not path.is_file():
        return status
    if now is None:
        now = dt.datetime.now(dt.UTC)
    elif now.tzinfo is None:
        now = now.replace(tzinfo=dt.UTC)
    now = now.astimezone(dt.UTC)
    mtime = dt.datetime.fromtimestamp(path.stat().st_mtime, tz=dt.UTC)
    status["mtime_utc"] = mtime.isoformat()
    status["age_days"] = round(max(0.0, (now - mtime).total_seconds() / 86400.0), 3)
    return status


def overpass_postcode_status(path: Path, *, now: dt.datetime | None = None) -> dict[str, Any]:
    status = file_status(path, now=now)
    if not path.is_file():
        return status
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    elements = data.get("elements", [])
    by_type: dict[str, int] = {}
    raw_postcodes: list[str] = []
    invalid: list[str] = []
    for element in elements:
        element_type = str(element.get("type", "?"))
        by_type[element_type] = by_type.get(element_type, 0) + 1
        value = (element.get("tags") or {}).get("addr:postcode")
        normalized = normalize_postal(value, zero_pad=False)
        if value is None:
            continue
        text = str(value).strip()
        raw_postcodes.append(text)
        if normalized is None:
            invalid.append(text)
    valid = sorted(
        {
            postal
            for postal in (normalize_postal(value, zero_pad=False) for value in raw_postcodes)
            if postal
        }
    )
    status.update(
        {
            "overpass_elements": len(elements),
            "overpass_elements_by_type": by_type,
            "addr_postcode_values": len(raw_postcodes),
            "distinct_addr_postcode_all": len(set(raw_postcodes)),
            "valid_distinct_postcodes": len(valid),
            "invalid_distinct_count": len(set(invalid)),
            "invalid_distinct_sample": sorted(set(invalid))[:20],
            "valid_postcodes": valid,
        }
    )
    return status


def universe_postcode_status(path: Path, *, now: dt.datetime | None = None) -> dict[str, Any]:
    status = file_status(path, now=now)
    if not path.is_file():
        return status
    df = pd.read_parquet(path)
    postal_col = next((c for c in df.columns if c.lower() in ("postal", "postcode", "postal_code")), None)
    if postal_col is None:
        postal_col = next(c for c in df.columns if "postal" in c.lower() or "postcode" in c.lower())
    postals = sorted(
        {postal for value in df[postal_col].dropna() for postal in [normalize_postal(value)] if postal}
    )
    status.update(
        {
            "row_count": len(df),
            "postal_column": postal_col,
            "distinct_postals": len(postals),
            "postals": postals,
        }
    )
    return status


def status_report(
    *,
    overpass_output: Path = OVERPASS_OUTPUT,
    overpass_query: Path = OVERPASS_QUERY,
    universe_path: Path = V1_UNIVERSE,
    now: dt.datetime | None = None,
) -> dict[str, Any]:
    overpass = overpass_postcode_status(overpass_output, now=now)
    universe = universe_postcode_status(universe_path, now=now)
    valid_osm = set(overpass.get("valid_postcodes", []))
    universe_postals = set(universe.get("postals", []))
    overlap = valid_osm & universe_postals
    osm_only = valid_osm - universe_postals
    universe_only = universe_postals - valid_osm
    coverage = (len(overlap) / len(universe_postals) * 100.0) if universe_postals else 0.0
    overpass.pop("valid_postcodes", None)
    universe.pop("postals", None)
    return {
        "mode": "p125_osm_status",
        "measurement": "P125 20 Aug 2026 Overpass addr:postcode coverage",
        "will_call_apis": False,
        "will_write_files": False,
        "files": {
            "overpass_query": file_status(overpass_query, now=now),
            "overpass_output": overpass,
            "v1_universe": universe,
        },
        "coverage": {
            "osm_valid_distinct_postcodes": len(valid_osm),
            "v1_distinct_postals": len(universe_postals),
            "osm_valid_in_v1": len(overlap),
            "osm_valid_not_in_v1": len(osm_only),
            "v1_not_in_osm_valid": len(universe_only),
            "osm_coverage_of_v1_pct": round(coverage, 6),
            "osm_only_sample": sorted(osm_only)[:50],
            "v1_only_sample": sorted(universe_only)[:50],
            "source_role": "geometry evidence and coverage cross-check",
            "registry_policy": "not the address registry",
            "verdict": "not sufficient as primary Singapore address registry",
        },
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)
    print(json.dumps(status_report(), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
