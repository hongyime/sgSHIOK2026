"""Fetch and hash pipeline module for S.H.I.O.K. Shelter Map (T0.3)."""

import argparse
import csv
import hashlib
import io
import json
import os
import re
import struct
import sys
import time
import zipfile
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl, unquote, urlsplit, urlunsplit
from xml.etree import ElementTree

import httpx
import yaml  # type: ignore[import-untyped]
from dotenv import load_dotenv

from pipeline.bus import fetch_paginated

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = PROJECT_ROOT / "pipeline" / "config" / "sources.yaml"
RAW_DIR = PROJECT_ROOT / "raw"
MANIFEST_PATH = RAW_DIR / "manifest.json"
TMP_DIR = RAW_DIR / "tmp"

USER_AGENT = "sgSHIOK-Shelter-Map-Pipeline/1.0 (S.H.I.O.K. Shelter Map)"
MAX_SIZE_BYTES = 500 * 1024 * 1024  # 500 MB limit
DATAGOV_EXTENSION_BY_CONTENT_TYPE = {
    "application/geo+json": ".geojson",
    "application/json": ".json",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.ms-excel": ".xls",
    "text/csv": ".csv",
    "application/zip": ".zip",
}
DATAGOV_ALLOWED_EXTENSIONS = set(DATAGOV_EXTENSION_BY_CONTENT_TYPE.values()) | {
    ".geojson",
    ".json",
}
SIGNED_URL_QUERY_KEYS = {
    "awsaccesskeyid",
    "expires",
    "signature",
    "x-amz-algorithm",
    "x-amz-credential",
    "x-amz-date",
    "x-amz-expires",
    "x-amz-security-token",
    "x-amz-signature",
    "x-amz-signedheaders",
}
STALE_FRESHNESS_ACTION = (
    "Stale freshness action: report and plan a versioned refresh; "
    "do not mutate frozen v1 in place."
)
GEOSPATIAL_DISCOVERY_CHANGE_ACTION = (
    "Geospatial discovery action: report and plan a new numbered input version; "
    "do not repair frozen v1 in place."
)
SHAPE_TYPES = {
    0: "Null",
    1: "Point",
    3: "LineString",
    5: "Polygon",
    8: "MultiPoint",
    11: "PointZ",
    13: "LineStringZ",
    15: "PolygonZ",
    18: "MultiPointZ",
    21: "PointM",
    23: "LineStringM",
    25: "PolygonM",
    28: "MultiPointM",
    31: "MultiPatch",
}


def get_headers(extra: dict[str, str] | None = None) -> dict[str, str]:
    headers = {"User-Agent": USER_AGENT}
    if extra:
        headers.update(extra)
    return headers


def get_datamall_headers() -> dict[str, str]:
    headers = get_headers()
    account_key = os.getenv("LTA_DATAMALL_ACCOUNT_KEY", "")
    if account_key:
        headers["AccountKey"] = account_key
    return headers


def load_source_config() -> dict[str, Any]:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        data: dict[str, Any] = yaml.safe_load(f) or {}
    return data


def load_sources() -> dict[str, Any]:
    data = load_source_config()
    sources: dict[str, Any] = data.get("sources", {})
    return sources


def load_ingest_validation_config() -> dict[str, Any]:
    data = load_source_config()
    config: dict[str, Any] = data.get("ingest_validation", {})
    return config


def load_freshness_defaults() -> dict[str, Any]:
    data = load_source_config()
    defaults: dict[str, Any] = data.get("freshness_defaults", {})
    return defaults


def select_sources(sources: dict[str, Any], source_keys: list[str]) -> dict[str, Any]:
    requested = list(dict.fromkeys(key.strip() for key in source_keys if key.strip()))
    if not requested:
        return sources
    missing = [key for key in requested if key not in sources]
    if missing:
        raise ValueError(f"unknown source key(s): {', '.join(missing)}")
    return {key: sources[key] for key in requested}


def load_manifest() -> dict[str, Any]:
    if MANIFEST_PATH.is_file():
        try:
            with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
                manifest_data: dict[str, Any] = json.load(f)
                return manifest_data
        except (json.JSONDecodeError, OSError) as e:
            print(f"Warning: Failed to load manifest from {MANIFEST_PATH}: {e}")
    return {"generated_at": None, "sources": {}}


def save_manifest(manifest: dict[str, Any]) -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    manifest["generated_at"] = datetime.now(UTC).isoformat()
    for source in manifest.get("sources", {}).values():
        if isinstance(source, dict) and "url_as_discovered" in source:
            source["url_as_discovered"] = stable_manifest_url(str(source["url_as_discovered"]))
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, sort_keys=True)


def stable_manifest_url(url: str) -> str:
    """Strip expiring signed-download query params while keeping the source path traceable."""
    parsed = urlsplit(url)
    query_keys = {key.lower() for key, _ in parse_qsl(parsed.query, keep_blank_values=True)}
    if query_keys & SIGNED_URL_QUERY_KEYS:
        return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", parsed.fragment))
    return url


def parse_manifest_timestamp(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    text = value.strip()
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        try:
            parsed = parsedate_to_datetime(text)
        except (TypeError, ValueError, IndexError, OverflowError):
            return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def _positive_int(value: Any) -> int | None:
    if isinstance(value, bool):
        return None
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return None
    return parsed if parsed > 0 else None


def freshness_policy_for_source(
    spec: dict[str, Any],
    freshness_defaults: dict[str, Any] | None = None,
) -> dict[str, Any]:
    policy: dict[str, Any] = {}
    defaults = freshness_defaults or {}
    default_policy = defaults.get(spec.get("kind"))
    if isinstance(default_policy, dict):
        policy.update(default_policy)
    source_policy = spec.get("freshness")
    if isinstance(source_policy, dict):
        policy.update(source_policy)
    if spec.get("refresh") == "manual" and "mode" not in policy:
        policy["mode"] = "manual"
    return policy


def source_freshness_status(
    key: str,
    spec: dict[str, Any],
    manifest_entry: dict[str, Any],
    freshness_defaults: dict[str, Any] | None = None,
    now: datetime | None = None,
) -> dict[str, Any]:
    policy = freshness_policy_for_source(spec, freshness_defaults)
    name = str(spec.get("name") or key)
    now_utc = (now or datetime.now(UTC)).astimezone(UTC)

    if policy.get("mode") == "manual" or policy.get("expected_cadence") == "manual":
        return {
            "source_key": key,
            "name": name,
            "status": "manual",
            "expected_cadence": policy.get("expected_cadence", "manual"),
            "stale_after_days": None,
            "age_days": None,
            "age_basis": None,
        }

    stale_after_days = _positive_int(policy.get("stale_after_days"))
    expected_cadence = policy.get("expected_cadence")
    if stale_after_days is None:
        return {
            "source_key": key,
            "name": name,
            "status": "unknown_policy",
            "expected_cadence": expected_cadence,
            "stale_after_days": None,
            "age_days": None,
            "age_basis": None,
        }

    timestamp_fields = ("last_modified", "fetched_at")
    source_time = None
    age_basis = None
    for field in timestamp_fields:
        parsed = parse_manifest_timestamp(manifest_entry.get(field))
        if parsed is not None:
            source_time = parsed
            age_basis = field
            break

    if source_time is None:
        return {
            "source_key": key,
            "name": name,
            "status": "unknown_age",
            "expected_cadence": expected_cadence,
            "stale_after_days": stale_after_days,
            "age_days": None,
            "age_basis": None,
        }

    age_days = max(0.0, (now_utc - source_time).total_seconds() / 86400.0)
    days_until_stale = max(0.0, float(stale_after_days) - age_days)
    days_past_stale = max(0.0, age_days - float(stale_after_days))
    return {
        "source_key": key,
        "name": name,
        "status": "stale" if age_days > stale_after_days else "current",
        "expected_cadence": expected_cadence,
        "stale_after_days": stale_after_days,
        "age_days": age_days,
        "days_until_stale": days_until_stale,
        "days_past_stale": days_past_stale,
        "age_basis": age_basis,
    }


def source_freshness_line(status: dict[str, Any]) -> str:
    key = status["source_key"]
    name = status["name"]
    if status["status"] == "stale":
        age_days = float(status["age_days"])
        return (
            f"[{key}] {name}: STALE — {status['age_basis']} age {age_days:.1f}d "
            f"exceeds {status['stale_after_days']}d threshold "
            f"by {float(status.get('days_past_stale') or 0.0):.1f}d "
            f"({status.get('expected_cadence') or 'cadence unspecified'})"
        )
    if status["status"] == "manual":
        return f"[{key}] {name}: freshness manual"
    if status["status"] == "current" and status.get("age_days") is not None:
        age_days = float(status["age_days"])
        return (
            f"[{key}] {name}: freshness current — {status['age_basis']} age {age_days:.1f}d "
            f"within {status['stale_after_days']}d threshold "
            f"with {float(status.get('days_until_stale') or 0.0):.1f}d until stale "
            f"({status.get('expected_cadence') or 'cadence unspecified'})"
        )
    return (
        f"[{key}] {name}: freshness {status['status']} "
        f"({status.get('expected_cadence') or 'cadence unspecified'})"
    )


def freshness_key_summary(label: str, statuses: list[dict[str, Any]]) -> str | None:
    source_labels = [
        f"{status['source_key']} ({status['name']})"
        for status in statuses
    ]
    if not source_labels:
        return None
    return f"{label}: {', '.join(source_labels)}"


def oldest_current_freshness_summary(statuses: list[dict[str, Any]]) -> str | None:
    aged_current = [
        status
        for status in statuses
        if status.get("status") == "current" and status.get("age_days") is not None
    ]
    if not aged_current:
        return None
    oldest = max(aged_current, key=lambda status: float(status["age_days"]))
    return (
        f"Oldest current source: {oldest['source_key']} "
        f"({oldest['name']}, {float(oldest['age_days']):.1f}d "
        f"of {oldest['stale_after_days']}d threshold)"
    )


def run_freshness_report(
    sources: dict[str, Any],
    freshness_defaults: dict[str, Any] | None = None,
    now: datetime | None = None,
) -> int:
    """Report manifest-only source freshness without probing upstream URLs."""
    checked_at = now or datetime.now(UTC)
    manifest = load_manifest()
    existing_sources: dict[str, Any] = manifest.get("sources", {})
    freshness_defaults = freshness_defaults if freshness_defaults is not None else load_freshness_defaults()
    freshness_counts = {
        "current": 0,
        "stale": 0,
        "manual": 0,
        "unknown_policy": 0,
        "unknown_age": 0,
    }
    freshness_by_status: dict[str, list[dict[str, Any]]] = {
        "current": [],
        "stale": [],
        "manual": [],
        "unknown_policy": [],
        "unknown_age": [],
    }

    print(f"Source freshness from raw/manifest.json at {checked_at.isoformat()}...")
    print("Manifest-only check: no upstream URLs were probed.")
    for key, spec in sources.items():
        current_entry: dict[str, Any] = existing_sources.get(key, {})
        freshness = source_freshness_status(
            key,
            spec,
            current_entry,
            freshness_defaults=freshness_defaults,
            now=checked_at,
        )
        freshness_status = str(freshness["status"])
        freshness_counts[freshness_status] = freshness_counts.get(freshness_status, 0) + 1
        if freshness_status in freshness_by_status:
            freshness_by_status[freshness_status].append(freshness)
        print(source_freshness_line(freshness))

    print(
        "Freshness: "
        f"current {freshness_counts.get('current', 0)}, "
        f"stale {freshness_counts.get('stale', 0)}, "
        f"manual {freshness_counts.get('manual', 0)}, "
        f"unknown_policy {freshness_counts.get('unknown_policy', 0)}, "
        f"unknown_age {freshness_counts.get('unknown_age', 0)}"
    )
    oldest_current = oldest_current_freshness_summary(freshness_by_status["current"])
    if oldest_current:
        print(oldest_current)
    for label, status_key in (
        ("Stale sources", "stale"),
        ("Manual sources", "manual"),
        ("Unknown-policy sources", "unknown_policy"),
        ("Unknown-age sources", "unknown_age"),
    ):
        summary = freshness_key_summary(label, freshness_by_status[status_key])
        if summary:
            print(summary)
    if freshness_by_status["stale"]:
        print(STALE_FRESHNESS_ACTION)
    return 0


def run_geospatial_discovery_report(sources: dict[str, Any]) -> int:
    """Compare manifest DataMall geospatial discovery URLs without downloading payloads."""
    manifest = load_manifest()
    manifest_sources: dict[str, Any] = manifest.get("sources", {})
    geospatial_sources = {
        key: spec
        for key, spec in sources.items()
        if spec.get("kind") == "datamall_geospatial_listing"
    }

    print("DataMall geospatial discovery check...")
    print("Discovery-only check: no payloads are downloaded and no manifest files are written.")
    if not geospatial_sources:
        print("No datamall_geospatial_listing sources selected.")
        return 0

    matched_count = 0
    changed_count = 0
    error_count = 0
    for key, spec in geospatial_sources.items():
        name = str(spec.get("name") or key)
        keyword = str(spec.get("search_keyword") or "").strip()
        current_entry: dict[str, Any] = manifest_sources.get(key, {})
        manifest_url = stable_manifest_url(str(current_entry.get("url_as_discovered") or ""))
        if not keyword:
            error_count += 1
            print(f"[{key}] {name}: ERROR missing search_keyword")
            continue
        try:
            discovered_url = stable_manifest_url(resolve_datamall_geospatial_url(keyword))
        except (httpx.HTTPError, ValueError, OSError) as exc:
            error_count += 1
            print(f"[{key}] {name}: ERROR {exc}")
            continue

        matches = bool(manifest_url) and manifest_url == discovered_url
        if matches:
            matched_count += 1
        else:
            changed_count += 1
        print(
            f"[{key}] {name}: "
            f"keyword={keyword} "
            f"match={'true' if matches else 'false'} "
            f"manifest_url={manifest_url or '<missing>'} "
            f"discovered_url={discovered_url}"
        )

    print(
        "DataMall geospatial discovery: "
        f"matched {matched_count}, changed {changed_count}, errors {error_count}"
    )
    if changed_count or error_count:
        print(GEOSPATIAL_DISCOVERY_CHANGE_ACTION)
    return 1 if changed_count or error_count else 0


def resolve_datagov_download_url(dataset_id: str) -> str:
    """Resolve data.gov.sg dataset download URL via initiate-download API with retry logic."""
    url = f"https://api-open.data.gov.sg/v1/public/api/datasets/{dataset_id}/initiate-download"
    headers = get_headers()
    client = httpx.Client(timeout=30.0, follow_redirects=True)

    for attempt in range(1, 4):
        time.sleep(2.5 * attempt)
        try:
            resp = client.get(url, headers=headers)
            if resp.status_code == 429:
                print(
                    f"Rate limited (429) on data.gov.sg, retrying in {3.0 * attempt}s (attempt {attempt}/3)..."
                )
                continue
            resp.raise_for_status()
            res_json = resp.json()
            download_url: str = str(res_json.get("data", {}).get("url", ""))
            if not download_url:
                raise ValueError(f"No download URL returned for dataset {dataset_id}")
            return download_url
        except (httpx.HTTPError, ValueError, OSError):
            if attempt == 3:
                client.close()
                raise
    client.close()
    raise ValueError(f"Failed to initiate download for dataset {dataset_id} after 3 attempts")


def datagov_raw_filename(
    source_key: str,
    download_url: str,
    headers: httpx.Headers | dict[str, str],
) -> str:
    """Return a deterministic raw filename while preserving the actual data.gov file type."""
    content_disposition = str(headers.get("content-disposition", ""))
    match = re.search(
        r"filename\*?=(?:UTF-8'')?\"?([^\";]+)\"?",
        content_disposition,
        re.IGNORECASE,
    )
    if match:
        suffix = Path(unquote(match.group(1))).suffix.lower()
        if suffix in DATAGOV_ALLOWED_EXTENSIONS:
            return f"{source_key}{suffix}"

    suffix = Path(unquote(urlsplit(download_url).path)).suffix.lower()
    if suffix in DATAGOV_ALLOWED_EXTENSIONS:
        return f"{source_key}{suffix}"

    content_type = str(headers.get("content-type", "")).split(";", maxsplit=1)[0].lower()
    suffix_by_type = DATAGOV_EXTENSION_BY_CONTENT_TYPE.get(content_type)
    if suffix_by_type:
        return f"{source_key}{suffix_by_type}"

    return f"{source_key}.geojson"


def static_raw_filename(source_key: str, url: str, spec: dict[str, Any]) -> str:
    filename = str(spec.get("filename", "")).strip()
    if filename:
        return filename
    suffix = Path(unquote(urlsplit(url).path)).suffix.lower()
    return f"{source_key}{suffix or '.bin'}"


def json_content_metrics(payload: Any) -> dict[str, Any]:
    if isinstance(payload, dict) and isinstance(payload.get("features"), list):
        features = payload["features"]
        geometry_types = sorted(
            {
                str(feature.get("geometry", {}).get("type"))
                for feature in features
                if isinstance(feature, dict)
                and isinstance(feature.get("geometry"), dict)
                and feature.get("geometry", {}).get("type")
            }
        )
        return {
            "payload_type": "geojson_feature_collection",
            "count_field": "feature_count",
            "feature_count": len(features),
            "record_count": len(features),
            "geometry_types": geometry_types,
        }
    if isinstance(payload, dict) and isinstance(payload.get("value"), list):
        return {
            "payload_type": "json_value_array",
            "count_field": "record_count",
            "record_count": len(payload["value"]),
        }
    if isinstance(payload, list):
        return {
            "payload_type": "json_array",
            "count_field": "record_count",
            "record_count": len(payload),
        }
    if isinstance(payload, dict):
        return {
            "payload_type": "json_object",
            "count_field": "record_count",
            "record_count": len(payload),
        }
    return {"payload_type": "json", "count_field": None}


def csv_content_metrics(content: bytes) -> dict[str, Any]:
    text = content.decode("utf-8-sig")
    reader = csv.reader(io.StringIO(text))
    rows = list(reader)
    row_count = max(0, len(rows) - 1)
    return {
        "payload_type": "csv",
        "count_field": "row_count",
        "row_count": row_count,
        "record_count": row_count,
    }


def xlsx_content_metrics(content: bytes) -> dict[str, Any]:
    with zipfile.ZipFile(io.BytesIO(content)) as archive:
        worksheet_names = sorted(
            name for name in archive.namelist() if name.startswith("xl/worksheets/sheet")
        )
        if not worksheet_names:
            return {"payload_type": "xlsx", "count_field": None, "sheet_count": 0}
        sheet_xml = archive.read(worksheet_names[0])
    row_count = 0
    for _event, elem in ElementTree.iterparse(io.BytesIO(sheet_xml), events=("end",)):
        if elem.tag.endswith("}row") or elem.tag == "row":
            row_count += 1
        elem.clear()
    data_rows = max(0, row_count - 1)
    return {
        "payload_type": "xlsx",
        "count_field": "row_count",
        "row_count": data_rows,
        "record_count": data_rows,
        "sheet_count": len(worksheet_names),
    }


def shapefile_metrics_from_zip(content: bytes) -> dict[str, Any]:
    with zipfile.ZipFile(io.BytesIO(content)) as archive:
        names = archive.namelist()
        shp_names = sorted(name for name in names if name.lower().endswith(".shp"))
        dbf_names = sorted(name for name in names if name.lower().endswith(".dbf"))
        shx_names = sorted(name for name in names if name.lower().endswith(".shx"))
        metrics: dict[str, Any] = {
            "payload_type": "zip",
            "zip_entry_count": len(names),
            "count_field": None,
        }
        if shp_names:
            shp_header = archive.read(shp_names[0])[:100]
            if len(shp_header) >= 36:
                shape_type = struct.unpack("<i", shp_header[32:36])[0]
                metrics["geometry_types"] = [SHAPE_TYPES.get(shape_type, f"ShapeType{shape_type}")]
        record_count: int | None = None
        if dbf_names:
            dbf_header = archive.read(dbf_names[0])[:8]
            if len(dbf_header) >= 8:
                record_count = struct.unpack("<I", dbf_header[4:8])[0]
        elif shx_names:
            shx_header = archive.read(shx_names[0])[:100]
            if len(shx_header) >= 28:
                file_length_words = struct.unpack(">i", shx_header[24:28])[0]
                record_count = max(0, ((file_length_words * 2) - 100) // 8)
        if record_count is not None:
            metrics["count_field"] = "feature_count"
            metrics["feature_count"] = record_count
            metrics["record_count"] = record_count
        return metrics


def content_metrics(content: bytes, filename: str) -> dict[str, Any]:
    suffix = Path(filename).suffix.lower()
    if suffix in {".json", ".geojson"}:
        return json_content_metrics(json.loads(content.decode("utf-8")))
    if suffix == ".csv":
        return csv_content_metrics(content)
    if suffix == ".xlsx":
        return xlsx_content_metrics(content)
    if suffix == ".zip":
        return shapefile_metrics_from_zip(content)
    if suffix == ".pbf":
        return {"payload_type": "osm_pbf", "count_field": None}
    return {"payload_type": suffix.lstrip(".") or "binary", "count_field": None}


def validation_count(metrics: dict[str, Any]) -> int | None:
    count_field = metrics.get("count_field")
    if isinstance(count_field, str) and isinstance(metrics.get(count_field), int):
        return int(metrics[count_field])
    if isinstance(metrics.get("record_count"), int):
        return int(metrics["record_count"])
    return None


def validation_threshold(spec: dict[str, Any]) -> float:
    source_validation = spec.get("ingest_validation", {})
    if isinstance(source_validation, dict) and "max_count_delta_ratio" in source_validation:
        return float(source_validation["max_count_delta_ratio"])
    config = load_ingest_validation_config()
    if "max_count_delta_ratio" not in config:
        raise ValueError("ingest_validation.max_count_delta_ratio missing from sources.yaml")
    return float(config["max_count_delta_ratio"])


def attach_and_validate_metrics(
    key: str,
    name: str,
    spec: dict[str, Any],
    current_entry: dict[str, Any],
    new_entry: dict[str, Any],
    metrics: dict[str, Any],
) -> None:
    threshold = validation_threshold(spec)
    count = validation_count(metrics)
    previous_validation = current_entry.get("validation", {})
    previous_count = (
        validation_count(previous_validation) if isinstance(previous_validation, dict) else None
    )

    validation = {
        **metrics,
        "max_count_delta_ratio": threshold,
    }
    if count is None:
        validation["baseline_status"] = "no_count_available"
    elif previous_count is None:
        validation["baseline_status"] = "new_baseline"
    elif previous_count == 0:
        delta_ratio = 0.0 if count == 0 else 1.0
        validation["previous_record_count"] = previous_count
        validation["count_delta_ratio"] = delta_ratio
        validation["baseline_status"] = "within_threshold" if delta_ratio <= threshold else "failed"
    else:
        delta_ratio = abs(count - previous_count) / previous_count
        validation["previous_record_count"] = previous_count
        validation["count_delta_ratio"] = round(delta_ratio, 6)
        validation["baseline_status"] = "within_threshold" if delta_ratio <= threshold else "failed"

    new_entry["validation"] = validation
    if validation.get("baseline_status") == "failed":
        raise ValueError(
            f"content validation failed for {key} ({name}): count changed from "
            f"{previous_count} to {count}, exceeding max_count_delta_ratio {threshold}"
        )


def datamall_api_content(
    source_key: str, source_name: str, endpoint: str, records: list[dict[str, Any]]
) -> bytes:
    payload = {
        "source_key": source_key,
        "source_name": source_name,
        "endpoint": endpoint,
        "value": records,
    }
    return json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode(
        "utf-8"
    )


def resolve_datamall_static_url(keyword: str) -> str:
    from datetime import timedelta

    # Prefix discovery: try current month, then previous months up to 6 months back
    now = datetime.now(UTC)
    client = httpx.Client(timeout=10.0, follow_redirects=True)

    for i in range(6):
        d = now - timedelta(days=30 * i)
        suffix = d.strftime("%b%Y")  # e.g. Jul2026
        url = f"https://datamall.lta.gov.sg/content/dam/datamall/datasets/Geospatial/{keyword}_{suffix}.zip"
        try:
            resp = client.head(url, headers=get_headers())
            if resp.status_code == 200:
                client.close()
                return url
        except httpx.RequestError:
            pass

    client.close()
    raise ValueError(f"Unauthenticated static prefix discovery failed for keyword: {keyword}")


def resolve_datamall_geospatial_url(keyword: str) -> str:
    try:
        url = resolve_datamall_static_url(keyword)
        print(f"Discovered unauthenticated static URL for {keyword}: {url}")
        return url
    except (ValueError, httpx.HTTPError, OSError) as e:
        print(
            f"Unauthenticated static discovery failed for {keyword}: {e}. Falling back to Authenticated GeospatialWholeIsland API."
        )

    url = f"https://datamall2.mytransport.sg/ltaodataservice/GeospatialWholeIsland?ID={keyword}"
    headers = get_datamall_headers()
    if "AccountKey" not in headers:
        raise ValueError("LTA_DATAMALL_ACCOUNT_KEY missing for geospatial discovery")

    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
        resp = client.get(url, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        value = data.get("value", [])
        if not value:
            raise ValueError(f"No geospatial link found for keyword: {keyword}")
        return str(value[0].get("Link", ""))


def run_check(
    sources: dict[str, Any],
    freshness_defaults: dict[str, Any] | None = None,
    now: datetime | None = None,
) -> int:
    manifest = load_manifest()
    existing_sources: dict[str, Any] = manifest.get("sources", {})
    freshness_defaults = freshness_defaults if freshness_defaults is not None else load_freshness_defaults()

    total_sources = len(sources)
    checked_count = 0
    unchanged_count = 0
    changed_count = 0
    error_count = 0
    unresolved_count = 0
    blocked_count = 0
    freshness_counts = {
        "current": 0,
        "stale": 0,
        "manual": 0,
        "unknown_policy": 0,
        "unknown_age": 0,
    }
    freshness_by_status: dict[str, list[dict[str, Any]]] = {
        "current": [],
        "stale": [],
        "manual": [],
        "unknown_policy": [],
        "unknown_age": [],
    }

    account_key = os.getenv("LTA_DATAMALL_ACCOUNT_KEY", "")

    print("Checking upstream datasets for changes...")

    for key, spec in sources.items():
        kind = spec.get("kind")
        name = spec.get("name")
        current_entry: dict[str, Any] = existing_sources.get(key, {})
        freshness = source_freshness_status(
            key,
            spec,
            current_entry,
            freshness_defaults=freshness_defaults,
            now=now,
        )
        freshness_status = str(freshness["status"])
        freshness_counts[freshness_status] = freshness_counts.get(freshness_status, 0) + 1
        if freshness_status in freshness_by_status:
            freshness_by_status[freshness_status].append(freshness)
        if freshness_status == "stale":
            print(source_freshness_line(freshness))

        if kind == "datamall_api_paginated":
            if not account_key:
                blocked_count += 1
                print(
                    f"[{key}] {name}: BLOCKED — owner key pending (no LTA_DATAMALL_ACCOUNT_KEY in .env)"
                )
                continue

            endpoint = spec.get("endpoint", "")
            try:
                with httpx.Client(timeout=10.0, follow_redirects=True) as client:
                    resp = client.get(endpoint, headers=get_datamall_headers())
                    if resp.status_code == 401:
                        blocked_count += 1
                        print(
                            f"[{key}] {name}: BLOCKED — owner key pending (401 Unauthorized from DataMall)"
                        )
                        continue
                    elif resp.status_code == 404:
                        blocked_count += 1
                        print(
                            f"[{key}] {name}: BLOCKED — owner key pending (404 Not Found from DataMall)"
                        )
                        continue
                    resp.raise_for_status()
            except (httpx.HTTPError, ValueError, OSError):
                blocked_count += 1
                print(f"[{key}] {name}: BLOCKED — owner key pending")
                continue

            checked_count += 1
            unchanged_count += 1

        elif kind == "datamall_geospatial_listing":
            keyword = spec.get("search_keyword", "")
            try:
                url = resolve_datamall_geospatial_url(keyword)
            except ValueError as e:
                if "LTA_DATAMALL_ACCOUNT_KEY missing" in str(e):
                    blocked_count += 1
                    print(
                        f"[{key}] {name}: BLOCKED — owner key pending (no LTA_DATAMALL_ACCOUNT_KEY in .env)"
                    )
                    continue
                else:
                    error_count += 1
                    print(f"[{key}] {name}: Error discovering url: {e}")
                    continue
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 401:
                    blocked_count += 1
                    print(
                        f"[{key}] {name}: BLOCKED — owner key pending (401 Unauthorized from DataMall)"
                    )
                    continue
                error_count += 1
                print(f"[{key}] {name}: Error discovering url: {e}")
                continue
            except httpx.HTTPError as e:
                error_count += 1
                print(f"[{key}] {name}: Error discovering url: {e}")
                continue

            checked_count += 1
            try:
                with httpx.Client(timeout=30.0, follow_redirects=True) as client:
                    headers = get_headers()
                    if current_entry.get("etag"):
                        headers["If-None-Match"] = current_entry["etag"]
                    if current_entry.get("last_modified"):
                        headers["If-Modified-Since"] = current_entry["last_modified"]

                    resp = client.get(url, headers=headers)
                    if resp.status_code == 304:
                        unchanged_count += 1
                        print(f"[{key}] {name}: unchanged (304 Not Modified)")
                        continue

                    resp.raise_for_status()
                    content = resp.content

                    sha256 = hashlib.sha256(content).hexdigest()
                    if current_entry.get("sha256") != sha256:
                        changed_count += 1
                        print(f"[{key}] {name}: CHANGED (hash mismatch)")
                    else:
                        unchanged_count += 1
                        print(f"[{key}] {name}: unchanged")
            except (httpx.HTTPError, ValueError, OSError) as e:
                error_count += 1
                print(f"[{key}] {name}: Error during check: {e}")

        elif kind == "datagov_polldownload":
            dataset_id = spec.get("dataset_id")
            if not dataset_id or dataset_id.startswith("UNRESOLVED"):
                unresolved_count += 1
                print(f"[{key}] {name}: Skipped (runtime discovery unresolved)")
                continue

            checked_count += 1
            try:
                download_url = resolve_datagov_download_url(dataset_id)
                headers = get_headers()
                if current_entry.get("etag"):
                    headers["If-None-Match"] = current_entry["etag"]
                if current_entry.get("last_modified"):
                    headers["If-Modified-Since"] = current_entry["last_modified"]

                with httpx.Client(timeout=60.0, follow_redirects=True) as client:
                    resp = client.get(download_url, headers=headers)
                    if resp.status_code == 304:
                        unchanged_count += 1
                        print(f"[{key}] {name}: unchanged (304 Not Modified)")
                        continue

                    resp.raise_for_status()
                    content = resp.content

                    sha256 = hashlib.sha256(content).hexdigest()
                    if current_entry.get("sha256") != sha256:
                        changed_count += 1
                        print(f"[{key}] {name}: CHANGED (hash mismatch)")
                    else:
                        unchanged_count += 1
                        print(f"[{key}] {name}: unchanged")
            except (httpx.HTTPError, ValueError, OSError) as e:
                error_count += 1
                print(f"[{key}] {name}: Error during check: {e}")

        elif kind == "datamall_static_file":
            url = str(spec.get("url", "")).strip()
            if not url:
                unresolved_count += 1
                print(f"[{key}] {name}: Skipped (static URL missing)")
                continue

            checked_count += 1
            try:
                with httpx.Client(timeout=60.0, follow_redirects=True) as client:
                    resp = client.get(url, headers=get_headers())
                    resp.raise_for_status()
                    content = resp.content

                sha256 = hashlib.sha256(content).hexdigest()
                if current_entry.get("sha256") != sha256:
                    changed_count += 1
                    print(f"[{key}] {name}: CHANGED (hash mismatch)")
                else:
                    unchanged_count += 1
                    print(f"[{key}] {name}: unchanged")
            except (httpx.HTTPError, ValueError, OSError) as e:
                error_count += 1
                print(f"[{key}] {name}: Error during check: {e}")

        else:
            unresolved_count += 1
            print(f"[{key}] {name}: Stub check (listing/probe required)")

    print(
        f"Summary: checked {checked_count}/{total_sources}, unchanged {unchanged_count}, changed {changed_count}, errors {error_count}, unresolved {unresolved_count}, blocked {blocked_count}"
    )
    print(
        "Freshness: "
        f"current {freshness_counts.get('current', 0)}, "
        f"stale {freshness_counts.get('stale', 0)}, "
        f"manual {freshness_counts.get('manual', 0)}, "
        f"unknown_policy {freshness_counts.get('unknown_policy', 0)}, "
        f"unknown_age {freshness_counts.get('unknown_age', 0)}"
    )
    oldest_current = oldest_current_freshness_summary(freshness_by_status["current"])
    if oldest_current:
        print(oldest_current)
    for label, status_key in (
        ("Stale sources", "stale"),
        ("Manual sources", "manual"),
        ("Unknown-policy sources", "unknown_policy"),
        ("Unknown-age sources", "unknown_age"),
    ):
        summary = freshness_key_summary(label, freshness_by_status[status_key])
        if summary:
            print(summary)
    if freshness_by_status["stale"]:
        print(STALE_FRESHNESS_ACTION)

    if error_count > 0 or changed_count > 0:
        return 1
    return 0


def run_ingest(sources: dict[str, Any]) -> int:
    manifest = load_manifest()
    manifest_sources: dict[str, Any] = manifest.setdefault("sources", {})
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    errors: list[str] = []

    print("Ingesting upstream datasets...")

    for key, spec in sources.items():
        kind = spec.get("kind")
        name = spec.get("name")

        if kind == "datamall_api_paginated":
            endpoint = spec.get("endpoint", "")
            if not endpoint:
                continue
            current_entry = manifest_sources.get(key, {})
            try:
                records = fetch_paginated(endpoint)
                content = datamall_api_content(key, name, endpoint, records)
                sha256 = hashlib.sha256(content).hexdigest()
                new_entry = {
                    "source_name": name,
                    "url_as_discovered": endpoint,
                    "sha256": sha256,
                    "bytes": len(content),
                    "etag": None,
                    "last_modified": None,
                    "fetched_at": datetime.now(UTC).isoformat(),
                }
                attach_and_validate_metrics(
                    key,
                    str(name),
                    spec,
                    current_entry,
                    new_entry,
                    content_metrics(content, f"{key}.json"),
                )
                target_dir = RAW_DIR / sha256
                target_dir.mkdir(parents=True, exist_ok=True)
                target_path = target_dir / f"{key}.json"
                with open(target_path, "wb") as f:
                    f.write(content)
                manifest_sources[key] = new_entry
                print(
                    f"[{key}] Ingested {name} -> raw/{sha256[:8]}.../{key}.json ({len(records)} records)"
                )
            except (httpx.HTTPError, ValueError, OSError) as e:
                message = f"[{key}] Error ingesting {name}: {e}"
                errors.append(message)
                print(message)

        elif kind == "datamall_geospatial_listing":
            keyword = spec.get("search_keyword", "")
            current_entry = manifest_sources.get(key, {})
            try:
                url = resolve_datamall_geospatial_url(keyword)
            except (ValueError, httpx.HTTPError, OSError) as e:
                message = f"[{key}] Error discovering url for {name}: {e}"
                errors.append(message)
                print(message)
                continue

            try:
                headers = get_headers()
                if current_entry.get("etag"):
                    headers["If-None-Match"] = current_entry["etag"]
                if current_entry.get("last_modified"):
                    headers["If-Modified-Since"] = current_entry["last_modified"]

                with httpx.Client(timeout=60.0, follow_redirects=True) as client:
                    resp = client.get(url, headers=headers)
                    if resp.status_code == 304:
                        print(f"[{key}] {name}: unchanged (304 Not Modified), skipping ingest.")
                        continue
                    resp.raise_for_status()
                    content = resp.content

                    sha256 = hashlib.sha256(content).hexdigest()
                    etag = resp.headers.get("ETag", "")
                    last_modified = resp.headers.get("Last-Modified", "")
                    filename = f"{key}.zip"
                    new_entry = {
                        "source_name": name,
                        "url_as_discovered": stable_manifest_url(url),
                        "sha256": sha256,
                        "bytes": len(content),
                        "etag": etag,
                        "last_modified": last_modified,
                        "fetched_at": datetime.now(UTC).isoformat(),
                    }
                    attach_and_validate_metrics(
                        key,
                        str(name),
                        spec,
                        current_entry,
                        new_entry,
                        content_metrics(content, filename),
                    )
                    target_dir = RAW_DIR / sha256
                    target_dir.mkdir(parents=True, exist_ok=True)
                    target_path = target_dir / filename
                    with open(target_path, "wb") as f:
                        f.write(content)
                    manifest_sources[key] = new_entry
                    print(
                        f"[{key}] Ingested {name} -> raw/{sha256[:8]}.../{filename} ({len(content)} bytes)"
                    )
            except (httpx.HTTPError, ValueError, OSError) as e:
                message = f"[{key}] Error ingesting {name}: {e}"
                errors.append(message)
                print(message)

        elif kind == "datagov_polldownload":
            dataset_id = spec.get("dataset_id")
            if not dataset_id or dataset_id.startswith("UNRESOLVED"):
                continue

            current_entry = manifest_sources.get(key, {})
            try:
                download_url = resolve_datagov_download_url(dataset_id)
                headers = get_headers()
                if current_entry.get("etag"):
                    headers["If-None-Match"] = current_entry["etag"]
                if current_entry.get("last_modified"):
                    headers["If-Modified-Since"] = current_entry["last_modified"]

                with httpx.Client(timeout=60.0, follow_redirects=True) as client:
                    resp = client.get(download_url, headers=headers)
                    if resp.status_code == 304:
                        print(f"[{key}] {name}: unchanged (304 Not Modified), skipping ingest.")
                        continue

                    resp.raise_for_status()
                    content = resp.content

                    sha256 = hashlib.sha256(content).hexdigest()
                    etag = resp.headers.get("ETag", "")
                    last_modified = resp.headers.get("Last-Modified", "")

                    filename = datagov_raw_filename(key, download_url, resp.headers)
                    new_entry = {
                        "source_name": name,
                        "url_as_discovered": stable_manifest_url(download_url),
                        "sha256": sha256,
                        "bytes": len(content),
                        "etag": etag,
                        "last_modified": last_modified,
                        "fetched_at": datetime.now(UTC).isoformat(),
                    }
                    attach_and_validate_metrics(
                        key,
                        str(name),
                        spec,
                        current_entry,
                        new_entry,
                        content_metrics(content, filename),
                    )
                    target_dir = RAW_DIR / sha256
                    target_dir.mkdir(parents=True, exist_ok=True)
                    target_path = target_dir / filename
                    with open(target_path, "wb") as f:
                        f.write(content)
                    manifest_sources[key] = new_entry
                    print(
                        f"[{key}] Ingested {name} -> raw/{sha256[:8]}.../{filename} ({len(content)} bytes)"
                    )
            except (httpx.HTTPError, ValueError, OSError) as e:
                message = f"[{key}] Error ingesting {name}: {e}"
                errors.append(message)
                print(message)

        elif kind == "datamall_static_file":
            url = str(spec.get("url", "")).strip()
            if not url:
                continue

            current_entry = manifest_sources.get(key, {})
            try:
                headers = get_headers()
                if current_entry.get("etag"):
                    headers["If-None-Match"] = current_entry["etag"]
                if current_entry.get("last_modified"):
                    headers["If-Modified-Since"] = current_entry["last_modified"]

                with httpx.Client(timeout=60.0, follow_redirects=True) as client:
                    resp = client.get(url, headers=headers)
                    if resp.status_code == 304:
                        print(f"[{key}] {name}: unchanged (304 Not Modified), skipping ingest.")
                        continue

                    resp.raise_for_status()
                    content = resp.content

                sha256 = hashlib.sha256(content).hexdigest()
                etag = resp.headers.get("ETag", "")
                last_modified = resp.headers.get("Last-Modified", "")

                filename = static_raw_filename(key, url, spec)
                new_entry = {
                    "source_name": name,
                    "url_as_discovered": stable_manifest_url(url),
                    "sha256": sha256,
                    "bytes": len(content),
                    "etag": etag,
                    "last_modified": last_modified,
                    "fetched_at": datetime.now(UTC).isoformat(),
                }
                attach_and_validate_metrics(
                    key,
                    str(name),
                    spec,
                    current_entry,
                    new_entry,
                    content_metrics(content, filename),
                )
                target_dir = RAW_DIR / sha256
                target_dir.mkdir(parents=True, exist_ok=True)
                target_path = target_dir / filename
                with open(target_path, "wb") as f:
                    f.write(content)
                manifest_sources[key] = new_entry
                print(
                    f"[{key}] Ingested {name} -> raw/{sha256[:8]}.../{filename} ({len(content)} bytes)"
                )
            except (httpx.HTTPError, ValueError, OSError) as e:
                message = f"[{key}] Error ingesting {name}: {e}"
                errors.append(message)
                print(message)

        elif kind == "osm_pbf":
            url = spec.get("url")
            if not url:
                continue

            refresh = spec.get("refresh", "auto")
            if refresh == "manual" and key in manifest_sources:
                print(f"[{key}] {name}: unchanged (refresh: manual), skipping ingest.")
                continue

            max_bytes = spec.get("max_bytes")
            if max_bytes == "2GB":
                limit = 2 * 1024 * 1024 * 1024
            else:
                limit = MAX_SIZE_BYTES

            try:
                with httpx.Client(timeout=300.0, follow_redirects=True) as client:
                    print(f"[{key}] Downloading {name} ({url}) ...")
                    resp = client.get(url, headers=get_headers())
                    resp.raise_for_status()
                    content = resp.content
                    if len(content) > limit:
                        message = f"[{key}] Error: downloaded file exceeds max_bytes"
                        errors.append(message)
                        print(message)
                        continue

                    sha256 = hashlib.sha256(content).hexdigest()
                    last_modified = resp.headers.get("Last-Modified", "")
                    filename = f"{key}.osm.pbf"
                    current_entry = manifest_sources.get(key, {})
                    new_entry = {
                        "source_name": name,
                        "url_as_discovered": stable_manifest_url(url),
                        "sha256": sha256,
                        "bytes": len(content),
                        "last_modified": last_modified,
                        "fetched_at": datetime.now(UTC).isoformat(),
                    }
                    attach_and_validate_metrics(
                        key,
                        str(name),
                        spec,
                        current_entry,
                        new_entry,
                        content_metrics(content, filename),
                    )
                    target_dir = RAW_DIR / sha256
                    target_dir.mkdir(parents=True, exist_ok=True)
                    target_path = target_dir / filename
                    with open(target_path, "wb") as f:
                        f.write(content)
                    manifest_sources[key] = new_entry
                    print(
                        f"[{key}] Ingested {name} -> raw/{sha256[:8]}.../{filename} ({len(content)} bytes)"
                    )
            except (httpx.HTTPError, ValueError, OSError) as e:
                message = f"[{key}] Error ingesting {name}: {e}"
                errors.append(message)
                print(message)

    save_manifest(manifest)
    print("Manifest updated successfully.")
    if errors:
        print("Ingest completed with errors:")
        for error in errors:
            print(f"  - {error}")
        return 1
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Fetch/check upstream S.H.I.O.K. Shelter Map sources.")
    parser.add_argument("action", choices=["check", "ingest"])
    parser.add_argument(
        "--freshness-only",
        action="store_true",
        help=(
            "For check: read raw/manifest.json and report source freshness "
            "without probing upstream URLs or writing the manifest; grouped "
            "action summaries include source names and stale sources require "
            "a versioned refresh."
        ),
    )
    parser.add_argument(
        "--geospatial-discovery-only",
        action="store_true",
        help=(
            "For check: resolve DataMall geospatial listing URLs without "
            "downloading payloads or writing the manifest; changed discovery "
            "URLs require new-version inputs."
        ),
    )
    parser.add_argument(
        "--source",
        action="append",
        default=[],
        help="Restrict to one source key. Can be passed multiple times.",
    )
    args = parser.parse_args(argv)

    try:
        sources = select_sources(load_sources(), args.source)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    if args.freshness_only and args.geospatial_discovery_only:
        print(
            "--freshness-only and --geospatial-discovery-only are mutually exclusive",
            file=sys.stderr,
        )
        return 2
    if args.action == "check" and args.freshness_only:
        return run_freshness_report(sources)
    if args.action == "check" and args.geospatial_discovery_only:
        return run_geospatial_discovery_report(sources)
    if args.action == "check":
        return run_check(sources)
    elif args.action == "ingest":
        if args.freshness_only or args.geospatial_discovery_only:
            print(
                "--freshness-only and --geospatial-discovery-only are only valid with check",
                file=sys.stderr,
            )
            return 2
        return run_ingest(sources)
    else:
        print(f"Unknown action: {args.action}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
