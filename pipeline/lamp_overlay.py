from __future__ import annotations

import argparse
import hashlib
import json
import math
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import h3


PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = PROJECT_ROOT / "raw"
DEFAULT_LAMP_SOURCE_SHA256 = (
    "2b552c1429aaf93c544209df3da68838d708a78ec5ae86dcd2852c10b0589f29"
)
DEFAULT_LAMP_SOURCE = RAW_DIR / DEFAULT_LAMP_SOURCE_SHA256 / "lamp_posts.geojson"
DEFAULT_H3_RESOLUTION = 8


def is_versioned_output_dir(path: Path) -> bool:
    name = path.name
    if "_v" not in name:
        return False
    version = name.rsplit("_v", 1)[1]
    return version.isdigit() and int(version) > 0


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def display_path(path: Path) -> str:
    resolved = path.resolve()
    try:
        return resolved.relative_to(PROJECT_ROOT).as_posix()
    except ValueError:
        return str(resolved)


def _valid_lng_lat(coordinates: Any) -> tuple[float, float] | None:
    if not isinstance(coordinates, list | tuple) or len(coordinates) < 2:
        return None
    try:
        lng = float(coordinates[0])
        lat = float(coordinates[1])
    except (TypeError, ValueError):
        return None
    if not (math.isfinite(lng) and math.isfinite(lat)):
        return None
    if not (-180 <= lng <= 180 and -90 <= lat <= 90):
        return None
    return lng, lat


def _bbox(points: list[tuple[float, float]]) -> list[float] | None:
    if not points:
        return None
    lngs = [point[0] for point in points]
    lats = [point[1] for point in points]
    return [min(lngs), min(lats), max(lngs), max(lats)]


def load_lamp_points(path: Path) -> tuple[list[tuple[float, float]], int]:
    with open(path, "r", encoding="utf-8") as f:
        payload: Any = json.load(f)
    features = payload.get("features") if isinstance(payload, dict) else None
    if not isinstance(features, list):
        raise ValueError(f"lamp GeoJSON must contain a features list: {path}")

    points: list[tuple[float, float]] = []
    skipped = 0
    for feature in features:
        if not isinstance(feature, dict):
            skipped += 1
            continue
        geometry = feature.get("geometry")
        if not isinstance(geometry, dict) or geometry.get("type") != "Point":
            skipped += 1
            continue
        point = _valid_lng_lat(geometry.get("coordinates"))
        if point is None:
            skipped += 1
            continue
        points.append(point)
    return points, skipped


def _write_json(path: Path, payload: Any) -> int:
    text = json.dumps(payload, sort_keys=True, separators=(",", ":")) + "\n"
    path.write_text(text, encoding="utf-8", newline="\n")
    return len(text.encode("utf-8"))


def _prepare_output_dir(output_dir: Path) -> None:
    if not is_versioned_output_dir(output_dir):
        raise ValueError(
            "lamp overlay output directory must end with a numeric version tag such as _v2; "
            f"got: {output_dir}"
        )
    output_dir.mkdir(parents=True, exist_ok=True)
    existing = [child for child in output_dir.iterdir()]
    if existing:
        raise FileExistsError(
            f"lamp overlay output directory is not empty; choose a new versioned path: {output_dir}"
        )
    (output_dir / "tiles").mkdir()


def build_lamp_overlay_artifact(
    *,
    input_path: Path = DEFAULT_LAMP_SOURCE,
    output_dir: Path,
    h3_resolution: int = DEFAULT_H3_RESOLUTION,
    generated_at: str | None = None,
) -> dict[str, Any]:
    if h3_resolution < 0 or h3_resolution > 15:
        raise ValueError("h3_resolution must be between 0 and 15")
    if not input_path.is_file():
        raise FileNotFoundError(input_path)

    _prepare_output_dir(output_dir)
    points, skipped = load_lamp_points(input_path)
    buckets: dict[str, list[tuple[float, float]]] = defaultdict(list)
    for lng, lat in points:
        buckets[h3.latlng_to_cell(lat, lng, h3_resolution)].append((lng, lat))

    tile_index: list[dict[str, Any]] = []
    tile_bytes_total = 0
    for cell in sorted(buckets):
        tile_points = sorted(buckets[cell])
        tile_payload = {
            "cell": cell,
            "points": [[round(lng, 7), round(lat, 7)] for lng, lat in tile_points],
        }
        rel_path = f"tiles/{cell}.json"
        tile_bytes = _write_json(output_dir / rel_path, tile_payload)
        tile_bytes_total += tile_bytes
        tile_index.append(
            {
                "cell": cell,
                "path": rel_path,
                "count": len(tile_points),
                "bytes": tile_bytes,
                "bbox": _bbox(tile_points),
            }
        )

    generated = generated_at or datetime.now(UTC).isoformat()
    manifest = {
        "schema_version": 1,
        "generated_at": generated,
        "source": {
            "path": display_path(input_path),
            "sha256": sha256_file(input_path),
            "bytes": input_path.stat().st_size,
        },
        "h3_resolution": h3_resolution,
        "point_count": len(points),
        "skipped_feature_count": skipped,
        "tile_count": len(tile_index),
        "tile_bytes": tile_bytes_total,
        "bbox": _bbox(points),
        "tiles": tile_index,
    }
    manifest_bytes = _write_json(output_dir / "manifest.json", manifest)
    report = {
        "ok": True,
        "output_dir": str(output_dir),
        "manifest_path": str(output_dir / "manifest.json"),
        "manifest_bytes": manifest_bytes,
        "tile_bytes": tile_bytes_total,
        "total_bytes": manifest_bytes + tile_bytes_total,
        "point_count": len(points),
        "skipped_feature_count": skipped,
        "tile_count": len(tile_index),
        "h3_resolution": h3_resolution,
    }
    print(json.dumps(report, sort_keys=True))
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Build a compact, versioned lamp-post overlay artifact."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_LAMP_SOURCE)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--h3-resolution", type=int, default=DEFAULT_H3_RESOLUTION)
    args = parser.parse_args(argv)

    build_lamp_overlay_artifact(
        input_path=args.input,
        output_dir=args.output,
        h3_resolution=args.h3_resolution,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
