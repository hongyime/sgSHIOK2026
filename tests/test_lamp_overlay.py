import json
from pathlib import Path

import pytest

from pipeline.lamp_overlay import build_lamp_overlay_artifact, load_lamp_points


def _write_lamp_geojson(path: Path) -> None:
    payload = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [103.8, 1.3]},
                "properties": {"LAMPPOST_NUM": "A1"},
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [103.8001, 1.3001]},
                "properties": {"LAMPPOST_NUM": "A2"},
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [103.9, 1.4]},
                "properties": {"LAMPPOST_NUM": "B1"},
            },
            {
                "type": "Feature",
                "geometry": {"type": "LineString", "coordinates": [[103.8, 1.3], [103.9, 1.4]]},
                "properties": {"LAMPPOST_NUM": "not-a-point"},
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": ["bad", 1.3]},
                "properties": {"LAMPPOST_NUM": "bad-coordinate"},
            },
        ],
    }
    path.write_text(json.dumps(payload), encoding="utf-8")


def test_load_lamp_points_keeps_only_valid_points(tmp_path: Path) -> None:
    source = tmp_path / "lamp_posts.geojson"
    _write_lamp_geojson(source)

    points, skipped = load_lamp_points(source)

    assert points == [(103.8, 1.3), (103.8001, 1.3001), (103.9, 1.4)]
    assert skipped == 2


def test_build_lamp_overlay_artifact_writes_compact_h3_tiles(tmp_path: Path) -> None:
    source = tmp_path / "lamp_posts.geojson"
    output = tmp_path / "lamp_overlay_v1"
    _write_lamp_geojson(source)

    report = build_lamp_overlay_artifact(
        input_path=source,
        output_dir=output,
        h3_resolution=8,
        generated_at="2026-08-16T00:00:00+00:00",
    )

    manifest = json.loads((output / "manifest.json").read_text(encoding="utf-8"))
    tile_paths = sorted((output / "tiles").glob("*.json"))
    tile_points = [
        point
        for tile_path in tile_paths
        for point in json.loads(tile_path.read_text(encoding="utf-8"))["points"]
    ]

    assert report["point_count"] == 3
    assert report["skipped_feature_count"] == 2
    assert report["tile_count"] == len(tile_paths)
    assert report["total_bytes"] == report["manifest_bytes"] + report["tile_bytes"]
    assert manifest["schema_version"] == 1
    assert manifest["generated_at"] == "2026-08-16T00:00:00+00:00"
    assert manifest["source"]["sha256"] == (
        "f1fa0b370ff962eea956e59ed84cbac43f22c3afac877b76601f8cbd0adf1ddb"
    )
    assert manifest["source"]["bytes"] == source.stat().st_size
    assert manifest["point_count"] == 3
    assert manifest["skipped_feature_count"] == 2
    assert manifest["bbox"] == [103.8, 1.3, 103.9, 1.4]
    assert tile_points == [[103.8, 1.3], [103.8001, 1.3001], [103.9, 1.4]]
    assert all(set(tile) == {"bbox", "bytes", "cell", "count", "path"} for tile in manifest["tiles"])


def test_build_lamp_overlay_artifact_refuses_nonempty_output_dir(tmp_path: Path) -> None:
    source = tmp_path / "lamp_posts.geojson"
    output = tmp_path / "lamp_overlay_v1"
    output.mkdir()
    (output / "manifest.json").write_text("{}", encoding="utf-8")
    _write_lamp_geojson(source)

    with pytest.raises(FileExistsError, match="choose a new versioned path"):
        build_lamp_overlay_artifact(input_path=source, output_dir=output)
