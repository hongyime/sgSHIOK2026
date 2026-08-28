from __future__ import annotations

import argparse
import json
import os
import sys
from collections.abc import Callable, Mapping
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import yaml

from pipeline.batch_plan import (
    DATAMALL_GEOSPATIAL_DISCOVERY_POLICY,
    FROZEN_V1_POLICY,
    NIGHT_LIGHTING_LAYER_POLICY,
    NON_SCORE_REFERENCE_SOURCE_POLICY,
    ONEMAP_SEARCH_CONTROLS,
    OSM_ADDR_POSTCODE_COVERAGE,
    PARAMS_PATH,
    POSTAL_UNIVERSE_V2_POLICY,
    RECENT_PUBLIC_SOURCE_GAP_SAMPLE,
    SOURCE_FRESHNESS_POLICY,
    build_batch_plan,
)
from pipeline.export import validate_static_artifacts
from pipeline.fetch import (
    STALE_FRESHNESS_ACTION,
    nearest_current_source_to_stale,
    oldest_current_freshness_summary,
    source_freshness_status,
)
from pipeline.network_qa import validate_network_qa
from pipeline.scoring_integration import SCORING_FINGERPRINT_FILES, SCORE_PROVENANCE_SOURCE_HASH_KEYS
from scripts.audit_current_bundle import active_bundle_dir, build_report, summarize_state_report

WEB_DIR = PROJECT_ROOT / "web"
QA_DIR = PROJECT_ROOT / "qa"
DEFAULT_NETWORK = PROJECT_ROOT / "processed" / "network_island.parquet"
DEFAULT_UNIVERSE = (
    PROJECT_ROOT / "processed" / "postal_universe_candidate_full_registered_geocoded.parquet"
)
DEFAULT_LAMP_OVERLAY_DIRNAME = "lamp_posts_v1"
REQUIRED_SUBSCORE_STATUS = {"access", "bus", "rain", "heat", "crossing"}
REQUIRED_SCORING_FINGERPRINTS = {
    rel_path.replace("/", "\\") for rel_path in SCORING_FINGERPRINT_FILES
}
NON_SCORE_REFERENCE_SOURCE_HASH_KEYS = {"leaf_area_index"}
SOURCE_HASH_WARNING_LABELS = {
    "leaf_area_index": "NParks Leaf Area Index",
}
BLOCKING_PROVENANCE_SIGNALS = {
    "scoring_fingerprint_changed_during_run": "scoring fingerprint changed during run",
    "mixed_scoring_fingerprint_digests": "mixed scoring fingerprint digests",
    "incomplete_scoring_fingerprint_provenance": "incomplete scoring fingerprint provenance",
    "incomplete_scoring_input_provenance": "incomplete scoring input provenance",
    "network_changed_during_run": "network changed during run",
    "mixed_network_digests": "mixed network digests",
    "incomplete_network_provenance": "incomplete network provenance",
}
WARNING_PROVENANCE_SIGNALS = {
    "scoring_input_changed_during_run": "scoring input changed during run",
    "mixed_scoring_input_digests": "mixed scoring input digests",
}
SCORING_FINGERPRINT_PROVENANCE_FIELDS = {
    "scoring_fingerprint_digest",
    "record_scoring_fingerprint_digest",
    "score_batch_start_scoring_fingerprint_digest",
    "export_scoring_fingerprint_digest",
    "scoring_fingerprint_digest_counts",
    "records_missing_scoring_fingerprint_digest",
    "scoring_fingerprint_provenance_complete",
    "scoring_fingerprints_by_digest",
}
SCORING_INPUT_PROVENANCE_FIELDS = {
    "scoring_input_digest",
    "scoring_input_digest_counts",
    "records_missing_scoring_input_digest",
    "scoring_input_provenance_complete",
    "scoring_inputs_by_digest",
}
NETWORK_PROVENANCE_FIELDS = {
    "network_digest",
    "network_digest_counts",
    "records_missing_network_digest",
    "network_provenance_complete",
    "networks_by_digest",
}


def source_hash_warning_label(source_key: str) -> str:
    label = SOURCE_HASH_WARNING_LABELS.get(source_key)
    return f"{source_key} ({label})" if label else source_key


def read_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        payload: Any = json.load(f)
    if not isinstance(payload, dict):
        raise TypeError(f"expected JSON object: {path}")
    return payload


def read_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        payload: Any = yaml.safe_load(f) or {}
    if not isinstance(payload, dict):
        raise TypeError(f"expected YAML object: {path}")
    return payload


def load_vercel_project(path: Path) -> dict[str, Any]:
    project_path = path / ".vercel" / "project.json"
    if not project_path.is_file():
        return {"linked": False, "path": str(project_path), "payload": None}
    return {
        "linked": True,
        "path": str(project_path),
        "payload": read_json(project_path),
    }


def vercel_readiness(project_root: Path, web_dir: Path) -> dict[str, Any]:
    root_link = load_vercel_project(project_root)
    web_link = load_vercel_project(web_dir)
    payload = root_link.get("payload") if root_link.get("linked") else web_link.get("payload")
    settings = payload.get("settings", {}) if isinstance(payload, dict) else {}
    root_directory = settings.get("rootDirectory") if isinstance(settings, dict) else None
    project_name = payload.get("projectName") if isinstance(payload, dict) else None
    project_id = payload.get("projectId") if isinstance(payload, dict) else None

    linked = bool(root_link.get("linked") or web_link.get("linked"))
    root_directory_ok = root_directory == "web" if linked else None
    blocking = bool(linked and not root_directory_ok)

    warnings: list[str] = []
    if not linked:
        warnings.append("local Vercel project is not linked; production deploy still requires owner approval")
    if root_link.get("linked") and web_link.get("linked"):
        root_payload = root_link.get("payload") or {}
        web_payload = web_link.get("payload") or {}
        if root_payload.get("projectId") != web_payload.get("projectId"):
            warnings.append("root and web Vercel project IDs differ")
        elif root_payload.get("projectName") != web_payload.get("projectName"):
            warnings.append("root and web Vercel project names differ but project ID matches")

    return {
        "linked": linked,
        "project_name": project_name,
        "project_id": project_id,
        "root_directory": root_directory,
        "root_directory_ok": root_directory_ok,
        "local_config_ok": not blocking,
        "blocking": blocking,
        "git_data_strategy": (
            "web build downloads configured bundle from production when local data is absent"
        ),
        "root_link": root_link,
        "web_link": web_link,
        "warnings": warnings,
    }


def environment_readiness(environment: Mapping[str, str] | None = None) -> dict[str, Any]:
    env = os.environ if environment is None else environment
    lta_present = bool(env.get("LTA_DATAMALL_ACCOUNT_KEY"))
    onemap_email_present = bool(env.get("ONEMAP_EMAIL"))
    onemap_password_present = bool(env.get("ONEMAP_PASSWORD"))
    missing = []
    if not lta_present:
        missing.append("LTA_DATAMALL_ACCOUNT_KEY")
    if not onemap_email_present:
        missing.append("ONEMAP_EMAIL")
    if not onemap_password_present:
        missing.append("ONEMAP_PASSWORD")

    warnings: list[str] = []
    if not lta_present:
        warnings.append(
            "LTA_DATAMALL_ACCOUNT_KEY missing; DataMall fetch, bus-arrival, and "
            "geospatial discovery tasks cannot call owner-key APIs"
        )
    if not (onemap_email_present and onemap_password_present):
        warnings.append(
            "ONEMAP_EMAIL/ONEMAP_PASSWORD missing; OneMap walk-validation collection "
            "cannot mint a routing token"
        )

    return {
        "ready_for_api_collection": not missing,
        "lta_datamall_account_key_present": lta_present,
        "onemap_email_present": onemap_email_present,
        "onemap_password_present": onemap_password_present,
        "onemap_credentials_present": onemap_email_present and onemap_password_present,
        "missing": missing,
        "warnings": warnings,
    }


def source_freshness_readiness(
    project_root: Path = PROJECT_ROOT,
    now: datetime | None = None,
) -> dict[str, Any]:
    """Summarize local source freshness without probing upstream APIs."""
    checked_at = now or datetime.now(UTC)
    config_path = project_root / "pipeline" / "config" / "sources.yaml"
    manifest_path = project_root / "raw" / "manifest.json"
    if not config_path.is_file() or not manifest_path.is_file():
        return {
            "ok": True,
            "state": "not_available",
            "config_path": str(config_path),
            "manifest_path": str(manifest_path),
            "checked_at": checked_at.isoformat(),
            "scope": "manifest_only",
            "upstream_urls_probed": False,
            "summary": "source freshness not reported; sources config or raw manifest is absent",
            "counts": {},
            "by_status": {},
            "warning": None,
        }

    try:
        config = read_yaml(config_path)
        manifest = read_json(manifest_path)
    except (OSError, TypeError, ValueError, yaml.YAMLError) as exc:
        return {
            "ok": True,
            "state": "unreadable",
            "config_path": str(config_path),
            "manifest_path": str(manifest_path),
            "checked_at": checked_at.isoformat(),
            "scope": "manifest_only",
            "upstream_urls_probed": False,
            "summary": "source freshness not reported; local freshness metadata is unreadable",
            "counts": {},
            "by_status": {},
            "warning": f"source freshness not reported: {exc}",
        }

    sources = config.get("sources", {})
    freshness_defaults = config.get("freshness_defaults", {})
    manifest_sources = manifest.get("sources", {})
    if not isinstance(sources, dict) or not isinstance(freshness_defaults, dict):
        return {
            "ok": True,
            "state": "unreadable",
            "config_path": str(config_path),
            "manifest_path": str(manifest_path),
            "checked_at": checked_at.isoformat(),
            "scope": "manifest_only",
            "upstream_urls_probed": False,
            "summary": "source freshness not reported; sources config has invalid shape",
            "counts": {},
            "by_status": {},
            "warning": "source freshness not reported: sources config has invalid shape",
        }
    if not isinstance(manifest_sources, dict):
        manifest_sources = {}

    counts = {
        "current": 0,
        "stale": 0,
        "manual": 0,
        "unknown_policy": 0,
        "unknown_age": 0,
    }
    by_status: dict[str, list[dict[str, Any]]] = {
        "current": [],
        "stale": [],
        "unknown_policy": [],
        "unknown_age": [],
    }
    for key, spec in sorted(sources.items()):
        if not isinstance(spec, dict):
            continue
        manifest_entry = manifest_sources.get(key, {})
        if not isinstance(manifest_entry, dict):
            manifest_entry = {}
        freshness = source_freshness_status(
            str(key),
            spec,
            manifest_entry,
            freshness_defaults=freshness_defaults,
            now=checked_at,
        )
        status_key = str(freshness["status"])
        counts[status_key] = counts.get(status_key, 0) + 1
        if status_key in by_status:
            by_status[status_key].append(freshness)

    notable = {
        status_key: [str(item["source_key"]) for item in statuses]
        for status_key, statuses in by_status.items()
    }
    warning_parts = [
        f"{status_key} sources: "
        + ", ".join(
            f"{item['source_key']} ({item['name']})" for item in by_status[status_key]
        )
        for status_key, keys in notable.items()
        if status_key != "current" and keys
    ]
    if by_status["stale"]:
        warning_parts.append(STALE_FRESHNESS_ACTION)
    summary = (
        f"manifest-only source freshness checked at {checked_at.isoformat()}: "
        f"current {counts.get('current', 0)}, "
        f"stale {counts.get('stale', 0)}, "
        f"manual {counts.get('manual', 0)}, "
        f"unknown_policy {counts.get('unknown_policy', 0)}, "
        f"unknown_age {counts.get('unknown_age', 0)}"
    )
    warning = f"source freshness warning: {'; '.join(warning_parts)}" if warning_parts else None
    oldest_current = oldest_current_freshness_summary(by_status["current"])
    nearest_current = nearest_current_source_to_stale(by_status["current"])
    stale_sources = sorted(
        [
            {
                "source_key": item["source_key"],
                "name": item["name"],
                "age_basis": item.get("age_basis"),
                "age_days": round(float(item["age_days"]), 6),
                "stale_after_days": item.get("stale_after_days"),
                "days_past_stale": round(float(item.get("days_past_stale") or 0.0), 6),
                "expected_cadence": item.get("expected_cadence"),
            }
            for item in by_status["stale"]
        ],
        key=lambda item: float(item["days_past_stale"]),
        reverse=True,
    )
    most_overdue_stale_source = stale_sources[0] if stale_sources else None
    return {
        "ok": True,
        "state": "reported",
        "config_path": str(config_path),
        "manifest_path": str(manifest_path),
        "checked_at": checked_at.isoformat(),
        "scope": "manifest_only",
        "upstream_urls_probed": False,
        "summary": summary,
        "oldest_current_source": oldest_current,
        "nearest_current_source_to_stale": nearest_current,
        "most_overdue_stale_source": most_overdue_stale_source,
        "stale_sources": stale_sources,
        "counts": counts,
        "by_status": notable,
        "warning": warning,
    }


def lamp_overlay_artifact_status(web_dir: Path = WEB_DIR) -> dict[str, Any]:
    artifact_dir = web_dir / "public" / "data" / DEFAULT_LAMP_OVERLAY_DIRNAME
    manifest_path = artifact_dir / "manifest.json"
    tiles_dir = artifact_dir / "tiles"
    warning = None
    if not manifest_path.is_file():
        return {
            "ok": False,
            "state": "missing",
            "artifact_dir": str(artifact_dir),
            "manifest_path": str(manifest_path),
            "tile_count": 0,
            "point_count": 0,
            "missing_tile_count": None,
            "size_mismatch_count": None,
            "warning": (
                "night lighting browser layer points at /data/lamp_posts_v1/, but the "
                "local deploy artifact manifest is missing"
            ),
        }

    try:
        manifest = read_json(manifest_path)
    except (OSError, TypeError, json.JSONDecodeError) as exc:
        return {
            "ok": False,
            "state": "unreadable",
            "artifact_dir": str(artifact_dir),
            "manifest_path": str(manifest_path),
            "tile_count": 0,
            "point_count": 0,
            "missing_tile_count": None,
            "size_mismatch_count": None,
            "warning": f"night lighting overlay manifest is unreadable: {exc}",
        }

    tiles = manifest.get("tiles")
    tile_index = tiles if isinstance(tiles, list) else []
    expected_tile_count = manifest.get("tile_count")
    point_count = manifest.get("point_count")
    tile_count_matches = isinstance(expected_tile_count, int) and expected_tile_count == len(
        tile_index
    )
    missing_tiles: list[str] = []
    size_mismatches: list[dict[str, Any]] = []
    total_tile_bytes = 0
    for tile in tile_index:
        if not isinstance(tile, dict):
            continue
        rel_path = tile.get("path")
        expected_bytes = tile.get("bytes")
        if not isinstance(rel_path, str):
            continue
        tile_path = artifact_dir / rel_path
        if not tile_path.is_file():
            missing_tiles.append(rel_path)
            continue
        actual_bytes = tile_path.stat().st_size
        total_tile_bytes += actual_bytes
        if isinstance(expected_bytes, int) and expected_bytes != actual_bytes:
            size_mismatches.append(
                {
                    "path": rel_path,
                    "expected_bytes": expected_bytes,
                    "actual_bytes": actual_bytes,
                }
            )

    manifest_tile_bytes = manifest.get("tile_bytes")
    tile_bytes_match = (
        isinstance(manifest_tile_bytes, int)
        and not missing_tiles
        and total_tile_bytes == manifest_tile_bytes
    )
    source = manifest.get("source")
    source_sha = source.get("sha256") if isinstance(source, dict) else None
    source_bytes = source.get("bytes") if isinstance(source, dict) else None
    source_identity_present = isinstance(source_sha, str) and len(source_sha) == 64 and isinstance(
        source_bytes, int
    )

    ok = (
        tiles_dir.is_dir()
        and tile_count_matches
        and isinstance(point_count, int)
        and point_count > 0
        and source_identity_present
        and not missing_tiles
        and not size_mismatches
        and tile_bytes_match
    )
    if not ok:
        reasons: list[str] = []
        if not tiles_dir.is_dir():
            reasons.append("tiles directory missing")
        if not tile_count_matches:
            reasons.append("manifest tile_count does not match tile index length")
        if not isinstance(point_count, int) or point_count <= 0:
            reasons.append("point_count missing or non-positive")
        if not source_identity_present:
            reasons.append("source sha256/bytes missing")
        if missing_tiles:
            reasons.append(f"{len(missing_tiles)} referenced tile file(s) missing")
        if size_mismatches:
            reasons.append(f"{len(size_mismatches)} referenced tile file size mismatch(es)")
        if not tile_bytes_match:
            reasons.append("manifest tile_bytes does not match local tile bytes")
        warning = "night lighting overlay artifact is not release-ready: " + "; ".join(reasons)

    return {
        "ok": ok,
        "state": "passed" if ok else "failed",
        "artifact_dir": str(artifact_dir),
        "manifest_path": str(manifest_path),
        "tile_count": expected_tile_count,
        "tile_index_count": len(tile_index),
        "point_count": point_count,
        "h3_resolution": manifest.get("h3_resolution"),
        "source_sha256": source_sha,
        "source_bytes": source_bytes,
        "tile_bytes": manifest_tile_bytes,
        "local_tile_bytes": total_tile_bytes,
        "missing_tile_count": len(missing_tiles),
        "missing_tiles_sample": missing_tiles[:20],
        "size_mismatch_count": len(size_mismatches),
        "size_mismatches_sample": size_mismatches[:20],
        "warning": warning,
    }


def file_mtime_iso(path: Path) -> str | None:
    if not path.is_file():
        return None
    return datetime.fromtimestamp(path.stat().st_mtime, UTC).isoformat()


def parse_iso_datetime(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def bundle_validation_floor(bundle_dir: Path) -> dict[str, Any]:
    manifest_path = bundle_dir / "manifest.json"
    manifest_payload = read_json(manifest_path) if manifest_path.is_file() else {}
    generated_at = parse_iso_datetime(manifest_payload.get("generated_at"))
    mtime = (
        datetime.fromtimestamp(manifest_path.stat().st_mtime, UTC)
        if manifest_path.is_file()
        else None
    )
    candidates = [item for item in [generated_at, mtime] if item is not None]
    floor = max(candidates) if candidates else None
    return {
        "manifest_path": str(manifest_path),
        "bundle_generated_at": manifest_payload.get("generated_at"),
        "manifest_mtime": file_mtime_iso(manifest_path),
        "fresh_after": floor.isoformat() if floor else None,
    }


def bundle_network_freshness(bundle_dir: Path, network_path: Path) -> dict[str, Any]:
    manifest_path = bundle_dir / "manifest.json"
    manifest_payload = read_json(manifest_path) if manifest_path.is_file() else {}
    bundle_mtime = manifest_path.stat().st_mtime if manifest_path.is_file() else None
    network_mtime = network_path.stat().st_mtime if network_path.is_file() else None
    stale_seconds: float | None = None
    if bundle_mtime is not None and network_mtime is not None:
        stale_seconds = max(0.0, network_mtime - bundle_mtime)

    stale = stale_seconds is not None and stale_seconds > 60.0
    warning = None
    if stale:
        warning = (
            "active bundle predates current network build; run targeted/full rescore/export "
            "before claiming latest network corrections are live"
        )

    return {
        "active_bundle_reflects_current_network": not stale,
        "bundle_manifest_path": str(manifest_path),
        "bundle_manifest_mtime": file_mtime_iso(manifest_path),
        "bundle_generated_at": manifest_payload.get("generated_at"),
        "network_path": str(network_path),
        "network_mtime": file_mtime_iso(network_path),
        "stale_seconds": round(stale_seconds, 3) if stale_seconds is not None else None,
        "warning": warning,
    }


def bundle_score_provenance_status(bundle_dir: Path) -> dict[str, Any]:
    manifest_path = bundle_dir / "manifest.json"
    if not manifest_path.is_file():
        return {
            "ok": False,
            "state": "failed",
            "manifest_path": str(manifest_path),
            "source_hash_count": 0,
            "scoring_fingerprint_count": 0,
            "subscore_status_keys": [],
            "missing_scoring_fingerprints": sorted(REQUIRED_SCORING_FINGERPRINTS),
            "missing_subscore_status": sorted(REQUIRED_SUBSCORE_STATUS),
            "legacy_missing_capabilities": [],
            "warning": "bundle manifest is missing",
        }

    manifest_payload = read_json(manifest_path)
    provenance = manifest_payload.get("provenance")
    if not isinstance(provenance, dict):
        return {
            "ok": False,
            "state": "failed",
            "manifest_path": str(manifest_path),
            "source_hash_count": 0,
            "scoring_fingerprint_count": 0,
            "subscore_status_keys": [],
            "missing_scoring_fingerprints": sorted(REQUIRED_SCORING_FINGERPRINTS),
            "missing_subscore_status": sorted(REQUIRED_SUBSCORE_STATUS),
            "legacy_missing_capabilities": [],
            "warning": "bundle manifest provenance block is missing",
        }

    source_hashes = provenance.get("source_hashes")
    scoring_fingerprints = provenance.get("scoring_fingerprints")
    subscore_status = provenance.get("subscore_status")
    mixed_fingerprints = provenance.get("mixed_scoring_fingerprint_digests") is True
    incomplete_fingerprint_provenance = (
        provenance.get("scoring_fingerprint_provenance_complete") is False
    )
    provenance_signals = {
        "scoring_fingerprint_changed_during_run": (
            provenance.get("scoring_fingerprint_changed_during_run") is True
        ),
        "mixed_scoring_fingerprint_digests": mixed_fingerprints,
        "incomplete_scoring_fingerprint_provenance": incomplete_fingerprint_provenance,
        "scoring_input_changed_during_run": (
            provenance.get("scoring_input_changed_during_run") is True
        ),
        "mixed_scoring_input_digests": provenance.get("mixed_scoring_input_digests") is True,
        "incomplete_scoring_input_provenance": (
            provenance.get("scoring_input_provenance_complete") is False
        ),
        "network_changed_during_run": provenance.get("network_changed_during_run") is True,
        "mixed_network_digests": provenance.get("mixed_network_digests") is True,
        "incomplete_network_provenance": provenance.get("network_provenance_complete")
        is False,
    }
    blocking_provenance_signals = [
        key for key, blocked in provenance_signals.items() if blocked
        and key in BLOCKING_PROVENANCE_SIGNALS
    ]
    warning_provenance_signals = [
        key for key, warned in provenance_signals.items() if warned
        and key in WARNING_PROVENANCE_SIGNALS
    ]
    source_hash_keys = sorted(source_hashes) if isinstance(source_hashes, dict) else []
    expected_source_hash_keys = sorted(SCORE_PROVENANCE_SOURCE_HASH_KEYS)
    missing_expected_source_hashes = sorted(
        set(expected_source_hash_keys) - set(source_hash_keys)
    )
    unexpected_source_hashes = sorted(set(source_hash_keys) - set(expected_source_hash_keys))
    non_score_reference_source_hashes = sorted(
        set(source_hash_keys) & NON_SCORE_REFERENCE_SOURCE_HASH_KEYS
    )
    source_hash_count = len(source_hash_keys)
    fingerprint_keys = (
        set(scoring_fingerprints) if isinstance(scoring_fingerprints, dict) else set()
    )
    missing_fingerprints = sorted(REQUIRED_SCORING_FINGERPRINTS - fingerprint_keys)
    subscore_keys = set(subscore_status) if isinstance(subscore_status, dict) else set()
    missing_subscores = sorted(REQUIRED_SUBSCORE_STATUS - subscore_keys)
    scoring_schema_present = any(key in provenance for key in SCORING_FINGERPRINT_PROVENANCE_FIELDS)
    scoring_input_schema_present = any(
        key in provenance for key in SCORING_INPUT_PROVENANCE_FIELDS
    )
    network_schema_present = any(key in provenance for key in NETWORK_PROVENANCE_FIELDS)
    legacy_missing_capabilities: list[str] = []
    if missing_fingerprints and not scoring_schema_present:
        legacy_missing_capabilities.append("full 18-file scoring fingerprint set")
    if not scoring_schema_present:
        legacy_missing_capabilities.append("record-level scoring fingerprint digests")
    if not scoring_input_schema_present:
        legacy_missing_capabilities.append("record-level scoring input provenance")
    if not network_schema_present:
        legacy_missing_capabilities.append("record-level network provenance")

    failed = (
        source_hash_count <= 0
        or bool(missing_expected_source_hashes)
        or bool(missing_subscores)
        or bool(blocking_provenance_signals)
        or (bool(missing_fingerprints) and scoring_schema_present)
    )
    if failed:
        state = "failed"
    elif legacy_missing_capabilities:
        state = "legacy"
    else:
        state = "passed"
    ok = state != "failed"
    warning = None
    if state == "legacy":
        warning = (
            "active bundle uses legacy provenance schema; missing capability: "
            + ", ".join(legacy_missing_capabilities)
            + "; score values may be used as a verified legacy artifact, but this "
            "bundle cannot provide full record-level provenance evidence"
        )
        if non_score_reference_source_hashes:
            warning += (
                "; non-score reference source hashes present: "
                + ", ".join(
                    source_hash_warning_label(key)
                    for key in non_score_reference_source_hashes
                )
            )
    elif not ok or warning_provenance_signals or non_score_reference_source_hashes:
        reasons: list[str] = []
        if source_hash_count <= 0:
            reasons.append("score source hashes")
        elif missing_expected_source_hashes:
            reasons.append(
                "score source hashes: " + ", ".join(missing_expected_source_hashes)
            )
        if missing_fingerprints:
            reasons.append(
                "scoring code/config fingerprints: " + ", ".join(missing_fingerprints)
            )
        if missing_subscores:
            reasons.append("locked-term status: " + ", ".join(missing_subscores))
        if blocking_provenance_signals:
            reasons.append(
                "blocking provenance signals: "
                + ", ".join(
                    BLOCKING_PROVENANCE_SIGNALS[key] for key in blocking_provenance_signals
                )
            )
        if warning_provenance_signals:
            reasons.append(
                "non-blocking provenance signals: "
                + ", ".join(
                    WARNING_PROVENANCE_SIGNALS[key] for key in warning_provenance_signals
                )
            )
        if non_score_reference_source_hashes:
            reasons.append(
                "non-score reference source hashes: "
                + ", ".join(
                    source_hash_warning_label(key)
                    for key in non_score_reference_source_hashes
                )
            )
        if not ok:
            warning = (
                "active bundle manifest lacks score source hashes, scoring code/config "
                "fingerprints, complete locked-term status, or fails provenance integrity "
                "signals: "
                + "; ".join(reasons)
                + "; regenerate/export the bundle with current code before using it as "
                "provenance evidence"
            )
        else:
            warning = (
                "active bundle manifest has non-blocking provenance signals: "
                + "; ".join(reasons)
                + "; verify digest maps before treating it as single-input evidence"
            )

    return {
        "ok": ok,
        "state": state,
        "manifest_path": str(manifest_path),
        "source_hash_count": source_hash_count,
        "source_hash_keys": source_hash_keys,
        "expected_score_source_hash_keys": expected_source_hash_keys,
        "missing_expected_score_source_hashes": missing_expected_source_hashes,
        "unexpected_source_hashes": unexpected_source_hashes,
        "non_score_reference_source_hashes": non_score_reference_source_hashes,
        "scoring_fingerprint_count": len(fingerprint_keys),
        "subscore_status_keys": sorted(subscore_keys),
        "missing_scoring_fingerprints": missing_fingerprints,
        "missing_subscore_status": missing_subscores,
        "legacy_missing_capabilities": legacy_missing_capabilities,
        "mixed_scoring_fingerprint_digests": mixed_fingerprints,
        "incomplete_scoring_fingerprint_provenance": incomplete_fingerprint_provenance,
        "scoring_fingerprint_changed_during_run": provenance_signals[
            "scoring_fingerprint_changed_during_run"
        ],
        "scoring_input_changed_during_run": provenance_signals[
            "scoring_input_changed_during_run"
        ],
        "network_changed_during_run": provenance_signals["network_changed_during_run"],
        "mixed_scoring_input_digests": provenance_signals["mixed_scoring_input_digests"],
        "mixed_network_digests": provenance_signals["mixed_network_digests"],
        "incomplete_scoring_input_provenance": provenance_signals[
            "incomplete_scoring_input_provenance"
        ],
        "incomplete_network_provenance": provenance_signals[
            "incomplete_network_provenance"
        ],
        "blocking_provenance_signals": blocking_provenance_signals,
        "warning_provenance_signals": warning_provenance_signals,
        "warning": warning,
    }


def latest_json_report(qa_dir: Path, pattern: str) -> Path | None:
    reports = [path for path in qa_dir.rglob(pattern) if path.is_file()]
    if not reports:
        return None
    return max(reports, key=lambda path: (path.stat().st_mtime, path.name))


def latest_json_reports(qa_dir: Path, pattern: str) -> list[Path]:
    return sorted(
        [path for path in qa_dir.rglob(pattern) if path.is_file()],
        key=lambda path: (path.stat().st_mtime, path.name),
        reverse=True,
    )


def is_blocking_onemap_report(report: dict[str, Any]) -> bool:
    sample_size = report.get("sample_size")
    sample_kind = report.get("sample_kind")
    return (
        isinstance(sample_size, int)
        and sample_size >= 2000
        and sample_kind in (None, "blocking_stratified")
    )


def onemap_subset_status(report: dict[str, Any]) -> dict[str, Any]:
    raw_subsets = report.get("subset_summary")
    if not isinstance(raw_subsets, dict):
        return {"subset_summary": {}, "failing_subset_order": []}

    subset_summary = {
        str(name): value for name, value in raw_subsets.items() if isinstance(value, dict)
    }
    failing_subsets: list[dict[str, Any]] = []
    for name, summary in subset_summary.items():
        if summary.get("thresholds_passed") is not False:
            continue
        failing_subsets.append(
            {
                "subset": name,
                "count": summary.get("count"),
                "median_abs_pct_delta": summary.get("median_abs_pct_delta"),
                "p95_abs_pct_delta": summary.get("p95_abs_pct_delta"),
                "median_abs_delta_m": summary.get("median_abs_delta_m"),
                "p95_abs_delta_m": summary.get("p95_abs_delta_m"),
            }
        )
    failing_subsets.sort(
        key=lambda item: (
            -(float(item["p95_abs_pct_delta"]) if item["p95_abs_pct_delta"] is not None else -1),
            str(item["subset"]),
        )
    )
    return {
        "subset_summary": subset_summary,
        "failing_subset_order": failing_subsets,
    }


def onemap_failure_summary(
    report: dict[str, Any],
    *,
    median: Any,
    p95: Any,
    median_max: Any,
    p95_max: Any,
    failing_subsets: list[dict[str, Any]],
) -> str:
    if report.get("gate_passed") is True:
        return ""

    failing_criteria: list[str] = []
    complete_cache_coverage = report.get("complete_cache_coverage")
    if not isinstance(complete_cache_coverage, bool):
        sample_size = report.get("sample_size")
        cached_results = report.get("cached_results")
        missing_results = report.get("missing_cache_results", 0)
        invalid_results = report.get("invalid_cache_results", 0)
        retryable_results = report.get("retryable_cache_results", 0)
        if isinstance(sample_size, int) and isinstance(cached_results, int):
            complete_cache_coverage = (
                cached_results == sample_size
                and missing_results == 0
                and invalid_results == 0
                and retryable_results == 0
            )
    if complete_cache_coverage is False:
        failing_criteria.append("complete cache coverage")
    if (
        isinstance(median, int | float)
        and isinstance(median_max, int | float)
        and float(median) > float(median_max)
    ):
        failing_criteria.append("median abs delta threshold")
    if (
        isinstance(p95, int | float)
        and isinstance(p95_max, int | float)
        and float(p95) > float(p95_max)
    ):
        failing_criteria.append("p95 abs delta threshold")
    if failing_subsets:
        failing_criteria.append("subset thresholds")

    if not failing_criteria:
        return ""

    details = f"; failing criteria: {', '.join(failing_criteria)}"
    if failing_subsets:
        subset_names = ", ".join(str(item["subset"]) for item in failing_subsets)
        details += f"; failing subsets: {subset_names}"
    return details


def onemap_validation_status(
    qa_dir: Path,
    *,
    active_bundle: str | None = None,
    bundle_dir: Path | None = None,
) -> dict[str, Any]:
    report_paths = latest_json_reports(qa_dir, "onemap_validation_cached_report*.json")
    report_path = None
    readable_reports: list[tuple[Path, dict[str, Any]]] = []
    for candidate_path in report_paths:
        try:
            candidate = read_json(candidate_path)
        except (OSError, TypeError, json.JSONDecodeError):
            continue
        if is_blocking_onemap_report(candidate):
            readable_reports.append((candidate_path, candidate))
    latest_any_path = readable_reports[0][0] if readable_reports else None
    if active_bundle:
        for candidate_path, candidate in readable_reports:
            if candidate.get("bundle") == active_bundle:
                report_path = candidate_path
                break
    report_path = report_path or latest_any_path
    if report_path is None:
        return {
            "state": "not_collected",
            "report_path": None,
            "gate_passed": False,
            "bundle_matches_active": None,
            "fresh_for_active_bundle": False,
            "summary": (
                "sample planner, guarded collector, and cache evaluator implemented; "
                "the 2,000-postal OneMap walk comparison has not been collected yet"
            ),
        }

    try:
        report = read_json(report_path)
    except (OSError, TypeError, json.JSONDecodeError) as exc:
        return {
            "state": "unreadable",
            "report_path": str(report_path),
            "summary": f"latest cached OneMap validation report is unreadable: {exc}",
        }

    gate_passed = bool(report.get("gate_passed"))
    report_bundle = report.get("bundle")
    bundle_matches_active: bool | None = None
    if active_bundle and isinstance(report_bundle, str):
        bundle_matches_active = report_bundle == active_bundle
    freshness = bundle_validation_floor(bundle_dir) if bundle_dir else {}
    report_generated_at = parse_iso_datetime(report.get("generated_at"))
    fresh_after = parse_iso_datetime(freshness.get("fresh_after"))
    fresh_for_active_bundle = (
        bool(bundle_matches_active)
        and report_generated_at is not None
        and (fresh_after is None or report_generated_at >= fresh_after)
    )

    thresholds = report.get("thresholds", {})
    subset_status = onemap_subset_status(report)
    sample_size = report.get("sample_size")
    sample_label = f"{sample_size:,}-row" if isinstance(sample_size, int) else "cached"
    median = report.get("median_abs_pct_delta")
    p95 = report.get("p95_abs_pct_delta")
    median_max = (
        thresholds.get("median_abs_pct_delta_max") if isinstance(thresholds, dict) else None
    )
    p95_max = thresholds.get("p95_abs_pct_delta_max") if isinstance(thresholds, dict) else None
    same_bundle_fresh_gate_passed = bool(gate_passed and fresh_for_active_bundle)
    result_state = "passed" if gate_passed else "failed"
    state = result_state
    if bundle_matches_active is False:
        state = f"{result_state}_stale_bundle"
    elif bundle_matches_active and not fresh_for_active_bundle:
        state = f"{result_state}_stale_report"

    if bundle_matches_active is False:
        summary = (
            f"latest cached {sample_label} OneMap walk validation is for bundle "
            f"{report_bundle}, not active bundle {active_bundle}; rerun validation before "
            f"using it as active-bundle launch evidence. That cached validation {result_state}: "
            f"median abs delta {median}%"
        )
    elif bundle_matches_active and not fresh_for_active_bundle:
        summary = (
            f"latest cached {sample_label} OneMap walk validation is for the active bundle "
            f"{active_bundle}, but it is stale for the current manifest; rerun validation before "
            f"using it as launch evidence. That cached validation {result_state}: "
            f"median abs delta {median}%"
        )
    else:
        summary = (
            f"latest cached {sample_label} OneMap walk validation {result_state}: "
            f"median abs delta {median}%"
        )
    if median_max is not None:
        summary += f" (max {median_max}%)"
    summary += f", p95 abs delta {p95}%"
    if p95_max is not None:
        summary += f" (max {p95_max}%)"
    summary += (
        f", missing cache results {report.get('missing_cache_results')}, "
        f"invalid cache results {report.get('invalid_cache_results')}"
    )
    summary += onemap_failure_summary(
        report,
        median=median,
        p95=p95,
        median_max=median_max,
        p95_max=p95_max,
        failing_subsets=subset_status["failing_subset_order"],
    )

    return {
        "state": state,
        "report_path": str(report_path),
        "summary": summary,
        "bundle": report_bundle,
        "active_bundle": active_bundle,
        "bundle_matches_active": bundle_matches_active,
        "fresh_for_active_bundle": fresh_for_active_bundle,
        "same_bundle_fresh_gate_passed": same_bundle_fresh_gate_passed,
        "gate_passed": gate_passed,
        "sample_size": report.get("sample_size"),
        "cached_results": report.get("cached_results"),
        "missing_cache_results": report.get("missing_cache_results"),
        "invalid_cache_results": report.get("invalid_cache_results"),
        "median_abs_pct_delta": median,
        "p95_abs_pct_delta": p95,
        "thresholds": thresholds,
        "subset_summary": subset_status["subset_summary"],
        "failing_subset_order": subset_status["failing_subset_order"],
        "generated_at": report.get("generated_at"),
        "freshness": freshness,
        "latest_any_report_path": str(latest_any_path) if latest_any_path else None,
    }


def readiness_features(
    qa_dir: Path = QA_DIR,
    *,
    active_bundle: str | None = None,
    bundle_dir: Path | None = None,
) -> dict[str, Any]:
    onemap_status = onemap_validation_status(
        qa_dir,
        active_bundle=active_bundle,
        bundle_dir=bundle_dir,
    )
    return {
        "incorporated": {
            "nparks_spatial_shade_proxy_heat_only": True,
            "broader_osm_covered_tags_from_hashed_pbf": True,
            "bus_as_transit_direct_fallback": True,
            "ura_no_dwelling_units_postal_source": True,
            "all_known_source_derived_postals_scored_or_explicit_state": True,
        },
        "not_incorporated": {
            "canonical_140k_postal_universe": (
                "not claimed; frozen v1 remains the 124443-record June 2020 OneMap-derived "
                "universe; the P19 v2 28 Aug 2026 public-source sample found 6 coordinate-backed HDB missing "
                "rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) sampled 2021-2026 "
                "public-source rows with postals, and its Overpass coverage cross-check found 25919 valid distinct OSM "
                "addr:postcode values, 25899 overlapping frozen postals, 20 valid OSM-only postcodes, and P64 found OneMap "
                "Search validates candidates but is not an enumerator"
            ),
            "postal_universe_v2_source_policy": (
                "candidate-source-first: use current free sources to propose v2 rows, then "
                "validate bounded candidates through OneMap Search under explicit token controls, "
                "72-hour token refresh, and current documented token-authenticated call-limit cap "
                "unless SLA approves a higher limit case-by-case; do not use OSM or OneMap Search "
                "as a complete postal registry"
            ),
            "ura_expanded_scores_live": (
                "postal prep produces 124443 candidate records and 123967 ready-to-score rows; "
                "not active production until full rescore/export/deploy"
            ),
            "overture_addresses_sg_candidate": (
                "optional archive/probe implemented as candidate-only postal-universe evidence; "
                "produced 125876-postal candidate universe with 1671 Overture-only postcodes; "
                "coordinate QA implemented with p95 23.5m and 41 postcodes over 1km; "
                "does not approve scoring or address-registry use until raw archive, attribution, "
                "dedupe, coordinate-outlier review, and owner approval"
            ),
            "nparks_lai_route_level_canopy": (
                "LAI is a species/generic reference table, not route geometry or a "
                "score provenance source"
            ),
            "building_shadow_time_of_day": "future heat model",
            "live_bus_or_mrt_arrivals": "requires runtime proxy or collected static aggregates",
            "onemap_walk_validation_gate": onemap_status["summary"],
            "bellingcat_openinframap_overpass_as_production_feeds": (
                "QA/discovery only unless raw bounded OSM query output is archived and hashed"
            ),
            "mayflower_560231_560234_shelter_false_negative": (
                "needs source-backed connector/correction review; no postal override"
            ),
        },
        "validation_gates": {
            "onemap_walk_validation": onemap_status,
        },
        "recent_public_source_gap_evidence_split": RECENT_PUBLIC_SOURCE_GAP_SAMPLE[
            "evidence_split"
        ],
        "source_policy": {
            "frozen_v1": FROZEN_V1_POLICY,
            "v2": POSTAL_UNIVERSE_V2_POLICY,
            "recent_public_source_gap_sample": RECENT_PUBLIC_SOURCE_GAP_SAMPLE,
            "osm_addr_postcode_registry": OSM_ADDR_POSTCODE_COVERAGE,
            "datamall_geospatial_discovery": DATAMALL_GEOSPATIAL_DISCOVERY_POLICY,
            "non_score_reference_sources": NON_SCORE_REFERENCE_SOURCE_POLICY,
            "night_lighting_layer": NIGHT_LIGHTING_LAYER_POLICY,
            "source_freshness": SOURCE_FRESHNESS_POLICY,
            "onemap_search_role": "candidate validation/geocoding, not national enumeration",
            "onemap_search_controls": ONEMAP_SEARCH_CONTROLS,
        },
    }


def build_readiness_report(
    *,
    project_root: Path = PROJECT_ROOT,
    web_dir: Path = WEB_DIR,
    bundle_dir: Path | None = None,
    mode: str = "candidate_full_registered",
    summary_path: Path | None = None,
    universe_path: Path | None = None,
    params_path: Path = PARAMS_PATH,
    qa_path: Path | None = None,
    debug_path: Path | None = None,
    network_path: Path = DEFAULT_NETWORK,
    postal_universe_path: Path = DEFAULT_UNIVERSE,
    waive_onemap_validation: bool = False,
    production_deploy_approved: bool = False,
    owner_approval_note: str = "",
    environment: Mapping[str, str] | None = None,
    progress: Callable[[str], None] | None = None,
) -> tuple[bool, dict[str, Any]]:
    def mark(message: str) -> None:
        if progress is not None:
            progress(message)

    mark("resolving active bundle and QA paths")
    bundle_dir = bundle_dir or active_bundle_dir()
    qa_path = qa_path or project_root / "qa" / "conflation_qa_island.json"
    debug_path = debug_path or project_root / "qa" / "island_debug.geojson"

    mark("validating static bundle artifacts")
    validation_ok, validation = validate_static_artifacts(
        input_dir=bundle_dir,
        progress=lambda message: mark(f"static artifacts: {message}"),
    )
    mark("auditing bundle state")
    bundle_state_full = build_report(
        bundle_dir=bundle_dir,
        replay_limit=0,
        network_path=network_path,
        postal_universe_path=postal_universe_path,
    )
    bundle_state = summarize_state_report(bundle_state_full)
    state_total = sum(int(value) for value in bundle_state["state_counts"].values())
    state_total_matches_manifest = state_total == int(bundle_state["manifest_record_count"])

    mark("validating island network QA")
    island_ok, island_qa = validate_network_qa(
        qa_path,
        debug_path,
        require_debug=False,
        require_production_sources=True,
    )
    mark("building dry-run batch plan")
    batch_ok, batch_plan = build_batch_plan(
        mode=mode,
        summary_path=summary_path,
        universe_path=universe_path,
        params_path=params_path,
        qa_path=qa_path,
        debug_path=debug_path,
    )
    mark("checking Vercel, environment, source freshness, and lamp overlay")
    vercel = vercel_readiness(project_root, web_dir)
    env_status = environment_readiness(environment)
    source_freshness = source_freshness_readiness(project_root)
    lamp_overlay = lamp_overlay_artifact_status(web_dir)
    mark("checking bundle freshness and score provenance")
    freshness = bundle_network_freshness(bundle_dir, network_path)
    score_provenance = bundle_score_provenance_status(bundle_dir)
    mark("checking OneMap validation status")
    onemap_status = onemap_validation_status(
        project_root / "qa",
        active_bundle=str(bundle_state.get("bundle") or ""),
        bundle_dir=bundle_dir,
    )

    errors: list[str] = []
    warnings: list[str] = []
    if not validation_ok:
        errors.append("static data validation failed")
    if not state_total_matches_manifest:
        errors.append("bundle state counts do not match manifest record_count")
    if not island_ok:
        errors.append("island network QA failed")
    if not batch_ok:
        errors.append("batch plan failed")
    if vercel.get("blocking"):
        errors.append("Vercel root directory is not web")
    if not vercel["linked"]:
        warnings.append("Vercel project is not linked in this local checkout")
    if not lamp_overlay["ok"]:
        errors.append("night lighting overlay artifact is not release-ready")
    warnings.extend(env_status["warnings"])
    if lamp_overlay["warning"]:
        warnings.append(str(lamp_overlay["warning"]))
    if source_freshness["warning"]:
        warnings.append(str(source_freshness["warning"]))
    if freshness["warning"]:
        warnings.append(str(freshness["warning"]))
    if score_provenance["warning"]:
        warnings.append(str(score_provenance["warning"]))
    onemap_gate_passed = bool(onemap_status.get("same_bundle_fresh_gate_passed"))
    onemap_gate_waived = bool(waive_onemap_validation and not onemap_gate_passed)
    if onemap_gate_waived:
        onemap_status = {
            **onemap_status,
            "waived": True,
            "waiver_reason": owner_approval_note
            or "owner approved release despite failed OneMap validation gate",
        }

    if not onemap_gate_passed:
        warnings.append(str(onemap_status.get("summary")))

    release_gate_checks = {
        "static_artifact_validation": bool(validation.get("ok")),
        "state_counts_match_manifest": state_total_matches_manifest,
        "scoring_fingerprints": bool(score_provenance.get("ok")),
        "lamp_overlay_artifact": bool(lamp_overlay.get("ok")),
        "onemap_validation_same_bundle_fresh": onemap_gate_passed,
        "onemap_validation_waived": onemap_gate_waived,
        "vercel_root_directory": bool(vercel.get("local_config_ok")),
        "infrastructure_readiness": not errors,
    }
    release_gate_blocking_checks = [
        key
        for key, value in release_gate_checks.items()
        if not value
        and (
            key != "onemap_validation_waived"
            or not release_gate_checks["onemap_validation_same_bundle_fresh"]
        )
    ]
    if onemap_gate_waived:
        release_gate_blocking_checks = [
            key
            for key in release_gate_blocking_checks
            if key != "onemap_validation_same_bundle_fresh"
            and key != "onemap_validation_waived"
        ]
    release_gate_warning_checks = [
        key
        for key, value in {
            "environment": bool(env_status["warnings"]),
            "lamp_overlay_artifact": bool(lamp_overlay["warning"]),
            "source_freshness": bool(source_freshness["warning"]),
            "bundle_network_freshness": bool(freshness["warning"]),
            "scoring_fingerprints": bool(score_provenance["warning"]),
            "onemap_validation": not onemap_gate_passed,
            "vercel_link": not vercel["linked"],
        }.items()
        if value
    ]
    owner_approvals = [] if production_deploy_approved else ["production_deploy"]
    blocking_checks = {
        key: value
        for key, value in release_gate_checks.items()
        if key
        not in {
            "onemap_validation_same_bundle_fresh",
            "onemap_validation_waived",
        }
    }
    preapproval_gate_passed = all(blocking_checks.values()) and (
        onemap_gate_passed or onemap_gate_waived
    )
    release_gate_passed = preapproval_gate_passed and not owner_approvals
    if not preapproval_gate_passed:
        release_gate_status = "blocked"
    elif owner_approvals:
        release_gate_status = "waiting_on_owner_approval"
    else:
        release_gate_status = "passed"

    report: dict[str, Any] = {
        "ok": not errors,
        "release_gate_passed": release_gate_passed,
        "release_gate_status": release_gate_status,
        "release_gate_summary": {
            "active_bundle": bundle_state.get("bundle"),
            "manifest_path": freshness.get("bundle_manifest_path"),
            "state_counts": bundle_state.get("state_counts"),
            "static_artifact_validation": {
                "ok": validation.get("ok"),
                "errors": validation.get("errors", []),
                "warnings": validation.get("warnings", []),
            },
            "scoring_fingerprint_status": score_provenance,
            "lamp_overlay_artifact": lamp_overlay,
            "source_freshness": source_freshness,
            "onemap_validation": onemap_status,
            "vercel_root_directory": vercel.get("root_directory"),
            "checks": release_gate_checks,
            "blocking_checks": release_gate_blocking_checks,
            "warning_checks": release_gate_warning_checks,
            "unresolved_warnings": warnings,
            "required_owner_approvals": owner_approvals,
            "owner_approvals": {
                "production_deploy": bool(production_deploy_approved),
                "note": owner_approval_note,
            },
        },
        "generated_at": datetime.now(UTC).isoformat(),
        "bundle": {
            **bundle_state,
            "path": str(bundle_dir),
            "state_total_matches_manifest": state_total_matches_manifest,
            "static_validation": {
                "ok": validation.get("ok"),
                "file_count": validation.get("file_count"),
                "indexed_postals": validation.get("indexed_postals"),
                "geometry_postals": validation.get("geometry_postals"),
                "geometry_postals_with_route_segments": validation.get(
                    "geometry_postals_with_route_segments"
                ),
                "transit_features": validation.get("transit_features"),
                "score_prefixes": validation.get("score_prefixes"),
                "errors": validation.get("errors", []),
                "warnings": validation.get("warnings", []),
            },
            "freshness": freshness,
            "score_provenance": score_provenance,
        },
        "network": {
            "ok": island_qa.get("ok"),
            "qa_path": island_qa.get("qa_path"),
            "debug_path": island_qa.get("debug_path"),
            "metrics": island_qa.get("metrics", {}),
            "errors": island_qa.get("errors", []),
            "warnings": island_qa.get("warnings", []),
        },
        "batch_plan": {
            "ok": batch_plan.get("ok"),
            "postal_universe": batch_plan.get("postal_universe", {}),
            "bounded_geocoding": batch_plan.get("bounded_geocoding", {}),
            "scoring_batch": batch_plan.get("scoring_batch", {}),
            "full_batch_release_scope": batch_plan.get("full_batch_release_scope", {}),
            "checkpoint_gates": batch_plan.get("checkpoint_gates", {}),
            "warnings": batch_plan.get("warnings", []),
            "errors": batch_plan.get("errors", []),
        },
        "vercel": vercel,
        "lamp_overlay": lamp_overlay,
        "source_freshness": source_freshness,
        "environment": env_status,
        "features": {},
        "errors": errors,
        "warnings": warnings,
    }
    mark("summarizing feature policy")
    report["features"] = readiness_features(
        project_root / "qa",
        active_bundle=str(bundle_state.get("bundle") or ""),
        bundle_dir=bundle_dir,
    )
    mark("readiness report complete")
    return not errors, report


def readiness_output_payload(
    report: dict[str, Any], *, gate_summary_only: bool = False
) -> dict[str, Any]:
    """Return the CLI output payload for the requested verbosity."""
    if not gate_summary_only:
        return report
    return {
        "ok": report.get("ok"),
        "release_gate_passed": report.get("release_gate_passed"),
        "release_gate_status": report.get("release_gate_status"),
        "generated_at": report.get("generated_at"),
        "release_gate_summary": report.get("release_gate_summary", {}),
        "warnings": report.get("warnings", []),
        "errors": report.get("errors", []),
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Fast production-readiness report without scoring or deploying."
    )
    parser.add_argument("--bundle-dir", type=Path, default=None)
    parser.add_argument("--mode", default="candidate_full_registered")
    parser.add_argument("--summary", type=Path, default=None)
    parser.add_argument("--universe", type=Path, default=None)
    parser.add_argument("--params", type=Path, default=PARAMS_PATH)
    parser.add_argument("--qa", type=Path, default=None)
    parser.add_argument("--debug", type=Path, default=None)
    parser.add_argument(
        "--waive-onemap-validation",
        action="store_true",
        help="Record an owner waiver for a failed fresh same-bundle OneMap gate.",
    )
    parser.add_argument(
        "--production-deploy-approved",
        action="store_true",
        help="Record explicit owner approval for production deployment.",
    )
    parser.add_argument(
        "--gate-summary",
        action="store_true",
        help="Print only the release gate verdict, checks, warnings, and errors.",
    )
    parser.add_argument("--owner-approval-note", default="")
    args = parser.parse_args()

    ok, report = build_readiness_report(
        bundle_dir=args.bundle_dir,
        mode=args.mode,
        summary_path=args.summary,
        universe_path=args.universe,
        params_path=args.params,
        qa_path=args.qa,
        debug_path=args.debug,
        waive_onemap_validation=args.waive_onemap_validation,
        production_deploy_approved=args.production_deploy_approved,
        owner_approval_note=args.owner_approval_note,
        progress=lambda message: print(
            f"[production-readiness] {message}", file=sys.stderr, flush=True
        ),
    )
    print(
        json.dumps(
            readiness_output_payload(report, gate_summary_only=args.gate_summary),
            indent=2,
            sort_keys=True,
        )
    )
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
