from __future__ import annotations

import argparse
import json
from collections.abc import Callable
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import geopandas as gpd
import pandas as pd

from pipeline.network_qa import validate_network_qa
from pipeline.scoring import NOT_YET_SCORED
from pipeline.scoring_integration import (
    NETWORK_PATH,
    PROCESSED_DIR,
    PROJECT_ROOT,
    load_manifest,
    load_scoring_context,
    network_snapshot,
    score_postal_gdf,
    scoring_input_snapshot,
    scoring_provenance_snapshot,
)
from pipeline.scoring_integration import (
    json_safe_score_record as _shared_json_safe_score_record,
)

DEFAULT_OUTPUT_DIR = PROCESSED_DIR / "score_batches"
DEFAULT_ISLAND_NETWORK_PATH = PROCESSED_DIR / "network_island.parquet"
DEFAULT_ISLAND_QA_PATH = PROJECT_ROOT / "qa" / "conflation_qa_island.json"
DEFAULT_ISLAND_DEBUG_PATH = PROJECT_ROOT / "qa" / "island_debug.geojson"
ScoreChunker = Callable[[gpd.GeoDataFrame, Any, bool, int | None], list[dict[str, Any]]]


def chunk_slices(total: int, chunk_size: int) -> list[tuple[int, int]]:
    if chunk_size <= 0:
        raise ValueError(f"chunk_size must be positive, got {chunk_size}")
    return [(start, min(start + chunk_size, total)) for start in range(0, total, chunk_size)]


def chunk_path(output_dir: Path, chunk_index: int, postals: list[str]) -> Path:
    first = postals[0] if postals else "empty"
    last = postals[-1] if postals else "empty"
    return output_dir / "chunks" / f"chunk_{chunk_index:05d}_{first}_{last}.json"


def read_chunk_postals(path: Path) -> list[str] | None:
    try:
        with open(path, "r", encoding="utf-8") as f:
            payload: Any = json.load(f)
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(payload, list):
        return None
    postals = []
    for record in payload:
        if not isinstance(record, dict) or "postal" not in record:
            return None
        postals.append(str(record["postal"]))
    return postals


def write_json(path: Path, payload: Any) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    content = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True).encode("utf-8")
    path.write_bytes(content)
    return len(content)


def read_existing_scoring_fingerprint_maps(output_dir: Path) -> dict[str, dict[str, str]]:
    manifest_path = output_dir / "batch_manifest.json"
    if not manifest_path.is_file():
        return {}
    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest: Any = json.load(f)
    except (OSError, json.JSONDecodeError):
        return {}
    if not isinstance(manifest, dict):
        return {}
    maps: dict[str, dict[str, str]] = {}
    raw_maps = manifest.get("scoring_fingerprints_by_digest")
    if isinstance(raw_maps, dict):
        for digest, fingerprints in raw_maps.items():
            if not isinstance(digest, str) or not isinstance(fingerprints, dict):
                continue
            clean = {
                str(key): str(value)
                for key, value in fingerprints.items()
                if isinstance(key, str) and isinstance(value, str) and value
            }
            if clean:
                maps[digest] = dict(sorted(clean.items()))
    start = manifest.get("scoring_provenance_at_start")
    if isinstance(start, dict):
        digest = start.get("scoring_fingerprint_digest")
        fingerprints = start.get("scoring_fingerprints")
        if isinstance(digest, str) and isinstance(fingerprints, dict):
            maps[digest] = dict(
                sorted(
                    (str(key), str(value))
                    for key, value in fingerprints.items()
                    if isinstance(key, str) and isinstance(value, str) and value
                )
            )
    return dict(sorted(maps.items()))


def read_existing_scoring_input_maps(output_dir: Path) -> dict[str, dict[str, Any]]:
    manifest_path = output_dir / "batch_manifest.json"
    if not manifest_path.is_file():
        return {}
    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest: Any = json.load(f)
    except (OSError, json.JSONDecodeError):
        return {}
    if not isinstance(manifest, dict):
        return {}
    maps: dict[str, dict[str, Any]] = {}
    raw_maps = manifest.get("scoring_inputs_by_digest")
    if isinstance(raw_maps, dict):
        for digest, input_payload in raw_maps.items():
            if not isinstance(digest, str) or not isinstance(input_payload, dict):
                continue
            inputs = input_payload.get("inputs")
            if not isinstance(inputs, list):
                continue
            maps[digest] = dict(sorted(input_payload.items()))
    start = manifest.get("scoring_provenance_at_start")
    if isinstance(start, dict):
        digest = start.get("scoring_input_digest")
        inputs = start.get("inputs")
        if isinstance(digest, str) and isinstance(inputs, list):
            maps[digest] = {
                key: value
                for key, value in sorted(start.items())
                if key in {"inputs", "total_rows", "scoring_input_algorithm"}
            }
    return dict(sorted(maps.items()))


def read_existing_network_maps(output_dir: Path) -> dict[str, dict[str, Any]]:
    manifest_path = output_dir / "batch_manifest.json"
    if not manifest_path.is_file():
        return {}
    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest: Any = json.load(f)
    except (OSError, json.JSONDecodeError):
        return {}
    if not isinstance(manifest, dict):
        return {}
    maps: dict[str, dict[str, Any]] = {}
    raw_maps = manifest.get("networks_by_digest")
    if isinstance(raw_maps, dict):
        for digest, network_payload in raw_maps.items():
            if not isinstance(digest, str) or not isinstance(network_payload, dict):
                continue
            networks = network_payload.get("networks")
            if not isinstance(networks, list):
                continue
            maps[digest] = dict(sorted(network_payload.items()))
    start = manifest.get("scoring_provenance_at_start")
    if isinstance(start, dict):
        digest = start.get("network_digest")
        networks = start.get("networks")
        if isinstance(digest, str) and isinstance(networks, list):
            maps[digest] = {
                key: value
                for key, value in sorted(start.items())
                if key in {"networks", "total_rows", "network_algorithm"}
            }
    return dict(sorted(maps.items()))


def json_safe_geometry(value: Any) -> Any:
    if value is None:
        return None
    wkt = getattr(value, "wkt", None)
    return str(wkt) if isinstance(wkt, str) else value


def json_safe_score_record(record: dict[str, Any]) -> dict[str, Any]:
    """Serialize shapely geometry inside a score record.

    Delegates to the shared implementation in ``pipeline.scoring_integration``
    so ``_geometry``, ``_geometry_options`` and ``_candidate_geometries`` all
    stay in sync when the record schema evolves. Local reimplementation
    remains a thin wrapper so callers importing ``json_safe_score_record``
    from ``pipeline.score_batch`` (the deterministic batch chunk emitter) keep
    working.
    """
    return _shared_json_safe_score_record(record)


def source_list(value: Any) -> list[str]:
    if value is None:
        return []
    if hasattr(value, "tolist") and not isinstance(value, str):
        value = value.tolist()
    if isinstance(value, list | tuple | set):
        return [str(item) for item in value if str(item)]
    return [str(value)] if str(value) else []


def load_postal_universe_batch_rows(
    universe_path: Path,
    limit: int | None,
    include_unscored: bool,
) -> pd.DataFrame:
    if not universe_path.is_file():
        raise FileNotFoundError(f"postal universe not found: {universe_path}")
    rows = pd.read_parquet(universe_path)
    rows["postal_code"] = rows["postal_code"].astype(str).str.zfill(6)
    if not include_unscored:
        rows = rows[rows["status"] == "READY_TO_SCORE"].copy()
    rows = rows.sort_values("postal_code", kind="stable").reset_index(drop=True)
    if limit is not None:
        rows = rows.head(int(limit)).copy()
    return rows


def ready_rows_to_gdf(rows: pd.DataFrame) -> gpd.GeoDataFrame:
    ready = rows[
        (rows["status"] == "READY_TO_SCORE") & rows["x"].notna() & rows["y"].notna()
    ].copy()
    return gpd.GeoDataFrame(
        ready,
        geometry=gpd.points_from_xy(ready["x"], ready["y"]),
        crs="EPSG:3414",
    )


def display_path(path: Path) -> str:
    try:
        return str(path.relative_to(PROJECT_ROOT))
    except ValueError:
        return str(path)


def json_nullable(value: Any) -> Any:
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        return value
    return value


def not_yet_scored_record(
    row: pd.Series,
    postal_universe_path: Path,
    data_as_of: str | None,
    scoring_digest: str | None = None,
    scoring_input_digest_value: str | None = None,
    network_digest_value: str | None = None,
) -> dict[str, Any]:
    source_status = str(row.get("status") or NOT_YET_SCORED)
    provenance: dict[str, Any] = {
        "postal_universe": display_path(postal_universe_path),
        "source_status": source_status,
        "coordinate_source": json_nullable(row.get("coordinate_source")),
        "sources": source_list(row.get("sources")),
        "reason": (
            "missing_coordinates_after_bounded_geocode"
            if source_status == "NEEDS_GEOCODE"
            else f"unscorable_source_status:{source_status}"
        ),
    }
    if scoring_digest:
        provenance["scoring_fingerprint_digest"] = scoring_digest
    if scoring_input_digest_value:
        provenance["scoring_input_digest"] = scoring_input_digest_value
    if network_digest_value:
        provenance["network_digest"] = network_digest_value
    return {
        "postal": str(row["postal_code"]),
        "state": NOT_YET_SCORED,
        "total": None,
        "subscores": None,
        "best_node": None,
        "paths": None,
        "exposure_gaps": None,
        "data_as_of": data_as_of,
        "provenance": provenance,
    }


def validate_full_batch_gate(
    *,
    full_batch: bool,
    confirm_full_batch: bool,
    dry_run: bool,
    postal_universe_path: Path | None,
    network_path: Path,
    qa_path: Path = DEFAULT_ISLAND_QA_PATH,
    debug_path: Path = DEFAULT_ISLAND_DEBUG_PATH,
) -> tuple[bool, dict[str, Any], list[str]]:
    qa_ok, qa_summary = validate_network_qa(qa_path, debug_path)
    errors: list[str] = []
    if full_batch and not dry_run:
        if not confirm_full_batch:
            errors.append(
                "full score batch requires --confirm-full-batch after checkpoint approval"
            )
        if postal_universe_path is None:
            errors.append("--full-batch requires --postal-universe")
        if network_path.name == DEFAULT_ISLAND_NETWORK_PATH.name and not qa_ok:
            errors.append("full island score batch requires green island network QA")

    return not errors, {"ok": qa_ok, "summary": qa_summary}, errors


def build_score_batch(
    *,
    postal_universe_path: Path,
    output_dir: Path = DEFAULT_OUTPUT_DIR,
    network_path: Path = NETWORK_PATH,
    limit: int | None = 5,
    chunk_size: int = 500,
    include_geometry: bool = True,
    full_batch: bool = False,
    confirm_full_batch: bool = False,
    dry_run: bool = False,
    resume: bool = True,
    context_loader: Callable[[Path, Path | None], Any] = load_scoring_context,
    score_chunker: ScoreChunker = score_postal_gdf,
) -> tuple[bool, dict[str, Any]]:
    if limit is not None and limit < 0:
        return False, {"ok": False, "errors": ["limit must be >= 0"]}
    if chunk_size <= 0:
        return False, {"ok": False, "errors": ["chunk_size must be positive"]}

    gate_ok, qa_report, gate_errors = validate_full_batch_gate(
        full_batch=full_batch,
        confirm_full_batch=confirm_full_batch,
        dry_run=dry_run,
        postal_universe_path=postal_universe_path,
        network_path=network_path,
    )
    if not gate_ok:
        return False, {"ok": False, "errors": gate_errors, "island_network_qa": qa_report}

    requested_limit = None if full_batch else limit
    postal_rows = load_postal_universe_batch_rows(
        postal_universe_path,
        requested_limit,
        include_unscored=full_batch,
    )

    chunks = chunk_slices(len(postal_rows), chunk_size)
    report: dict[str, Any] = {
        "ok": True,
        "dry_run": dry_run,
        "full_batch": full_batch,
        "resume": resume,
        "postal_universe": str(postal_universe_path),
        "network": str(network_path),
        "output_dir": str(output_dir),
        "selected_postals": len(postal_rows),
        "ready_postals_selected": int((postal_rows["status"] == "READY_TO_SCORE").sum()),
        "unscored_postals_selected": int((postal_rows["status"] != "READY_TO_SCORE").sum()),
        "chunk_size": chunk_size,
        "chunk_count": len(chunks),
        "chunks_written": 0,
        "chunks_skipped_existing": 0,
        "records_written": 0,
        "not_yet_scored_records_written": 0,
        "generated_at": datetime.now(UTC).isoformat(),
        "island_network_qa": qa_report,
        "errors": [],
        "chunks": [],
    }
    if dry_run:
        return True, report

    context = context_loader(network_path, postal_universe_path)
    scoring_provenance_at_start = (
        context.scoring_provenance
        if isinstance(getattr(context, "scoring_provenance", None), dict)
        else scoring_provenance_snapshot()
    )
    input_provenance = scoring_input_snapshot(postal_universe_path)
    network_provenance = network_snapshot(network_path)
    scoring_provenance_at_start = {
        **scoring_provenance_at_start,
        "scoring_input_digest": input_provenance["scoring_input_digest"],
        "network_digest": network_provenance["network_digest"],
    }
    fingerprint_maps = read_existing_scoring_fingerprint_maps(output_dir)
    digest = scoring_provenance_at_start.get("scoring_fingerprint_digest")
    fingerprints = scoring_provenance_at_start.get("scoring_fingerprints")
    if isinstance(digest, str) and isinstance(fingerprints, dict):
        fingerprint_maps[digest] = dict(
            sorted(
                (str(key), str(value))
                for key, value in fingerprints.items()
                if isinstance(key, str) and isinstance(value, str) and value
            )
        )
    report["scoring_provenance_at_start"] = scoring_provenance_at_start
    report["scoring_fingerprints_by_digest"] = dict(sorted(fingerprint_maps.items()))
    input_maps = read_existing_scoring_input_maps(output_dir)
    input_digest = scoring_provenance_at_start.get("scoring_input_digest")
    if isinstance(input_digest, str) and input_digest:
        input_maps[input_digest] = {
            key: input_provenance[key]
            for key in ("scoring_input_algorithm", "inputs", "total_rows")
            if key in input_provenance
        }
    report["scoring_inputs_by_digest"] = dict(sorted(input_maps.items()))
    network_maps = read_existing_network_maps(output_dir)
    network_digest_value = scoring_provenance_at_start.get("network_digest")
    if isinstance(network_digest_value, str) and network_digest_value:
        network_maps[network_digest_value] = {
            key: network_provenance[key]
            for key in ("network_algorithm", "networks", "total_rows")
            if key in network_provenance
        }
    report["networks_by_digest"] = dict(sorted(network_maps.items()))
    data_as_of = load_manifest().get("generated_at")
    for chunk_index, (start, end) in enumerate(chunks, start=1):
        chunk = postal_rows.iloc[start:end].copy()
        postals = [str(item) for item in chunk["postal_code"].tolist()]
        path = chunk_path(output_dir, chunk_index, postals)
        expected_postals = postals
        if resume and path.is_file() and read_chunk_postals(path) == expected_postals:
            report["chunks_skipped_existing"] += 1
            report["records_written"] += len(expected_postals)
            report["chunks"].append(
                {
                    "index": chunk_index,
                    "path": str(path),
                    "records": len(expected_postals),
                    "status": "skipped_existing",
                }
            )
            continue

        ready_gdf = ready_rows_to_gdf(chunk)
        scored_records = [
            json_safe_score_record(record)
            for record in score_chunker(ready_gdf, context, include_geometry, None)
        ]
        scored_by_postal = {str(record["postal"]): record for record in scored_records}
        records = []
        for _, row in chunk.iterrows():
            postal = str(row["postal_code"])
            if postal in scored_by_postal:
                records.append(scored_by_postal[postal])
            else:
                records.append(
                    not_yet_scored_record(
                        row,
                        postal_universe_path,
                        data_as_of,
                        scoring_digest=(digest if isinstance(digest, str) and digest else None),
                        scoring_input_digest_value=(
                            input_digest if isinstance(input_digest, str) and input_digest else None
                        ),
                        network_digest_value=(
                            network_digest_value
                            if isinstance(network_digest_value, str) and network_digest_value
                            else None
                        ),
                    )
                )
        bytes_written = write_json(path, records)
        report["chunks_written"] += 1
        report["records_written"] += len(records)
        report["not_yet_scored_records_written"] += sum(
            1 for record in records if record.get("state") == NOT_YET_SCORED
        )
        report["chunks"].append(
            {
                "index": chunk_index,
                "path": str(path),
                "records": len(records),
                "bytes": bytes_written,
                "status": "written",
            }
        )

    manifest_path = output_dir / "batch_manifest.json"
    report["manifest_path"] = str(manifest_path)
    write_json(manifest_path, report)
    return True, report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run a resumable postal scoring batch.")
    parser.add_argument("--postal-universe", type=Path, required=True)
    parser.add_argument("--network", type=Path, default=NETWORK_PATH)
    parser.add_argument(
        "--output-dir",
        type=Path,
        help=(
            "Explicit output directory for non-dry runs; dry runs report the default "
            "processed/score_batches target without writing it."
        ),
    )
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument("--chunk-size", type=int, default=500)
    parser.add_argument("--no-geometry", action="store_true")
    parser.add_argument("--no-resume", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--full-batch",
        action="store_true",
        help="Score all eligible rows from --postal-universe; requires --confirm-full-batch.",
    )
    parser.add_argument(
        "--confirm-full-batch",
        action="store_true",
        help="Required with --full-batch after human checkpoint approval.",
    )
    args = parser.parse_args(argv)

    if args.output_dir is None and not args.dry_run:
        print(
            json.dumps(
                {
                    "ok": False,
                    "errors": [
                        "score-batch requires explicit --output-dir for non-dry runs"
                    ],
                },
                indent=2,
                sort_keys=True,
            )
        )
        return 1

    ok, report = build_score_batch(
        postal_universe_path=args.postal_universe,
        output_dir=args.output_dir or DEFAULT_OUTPUT_DIR,
        network_path=args.network,
        limit=None if args.full_batch else args.limit,
        chunk_size=args.chunk_size,
        include_geometry=not args.no_geometry,
        full_batch=bool(args.full_batch),
        confirm_full_batch=bool(args.confirm_full_batch),
        dry_run=bool(args.dry_run),
        resume=not args.no_resume,
    )
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
