from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import geopandas as gpd
import pandas as pd
import yaml

NPARKS_SHADE_SOURCE_KEYS = {
    "nparks_nature_ways",
    "nparks_park_connector_loop",
    "nparks_tracks",
    "nparks_heritage_trees",
    "nparks_heritage_road_green_buffers",
}

SHADE_ONLY_NOTE = "tree_and_greenery_proxy_heat_only_not_rain_shelter"
PROJECT_ROOT = Path(__file__).resolve().parents[1]
PARAMS_PATH = PROJECT_ROOT / "pipeline" / "config" / "params.yaml"
DEFAULT_SHADE_PROXY_LINE_BUFFER_M = 8.0
DEFAULT_SHADE_PROXY_POINT_BUFFER_M = 6.0
DEFAULT_SHADE_PROXY_WEIGHT = 0.5


def positive_float(value: Any, default: float) -> float:
    if isinstance(value, (int, float)) and not isinstance(value, bool) and value > 0:
        return float(value)
    return default


@lru_cache(maxsize=1)
def load_shade_proxy_config(params_path: Path = PARAMS_PATH) -> dict[str, float]:
    if not params_path.is_file():
        return {
            "line_buffer_m": DEFAULT_SHADE_PROXY_LINE_BUFFER_M,
            "point_buffer_m": DEFAULT_SHADE_PROXY_POINT_BUFFER_M,
            "shade_weight": DEFAULT_SHADE_PROXY_WEIGHT,
        }
    with params_path.open("r", encoding="utf-8") as f:
        payload: Any = yaml.safe_load(f) or {}
    heat_comfort = payload.get("heat_comfort", {}) if isinstance(payload, dict) else {}
    return {
        "line_buffer_m": positive_float(
            heat_comfort.get("shade_proxy_line_buffer_m"),
            DEFAULT_SHADE_PROXY_LINE_BUFFER_M,
        ),
        "point_buffer_m": positive_float(
            heat_comfort.get("shade_proxy_point_buffer_m"),
            DEFAULT_SHADE_PROXY_POINT_BUFFER_M,
        ),
        "shade_weight": positive_float(
            heat_comfort.get("shade_proxy_weight"),
            DEFAULT_SHADE_PROXY_WEIGHT,
        ),
    }


def prepare_shade_proxy_geometries(
    features: gpd.GeoDataFrame,
    *,
    source_key: str,
    line_buffer_m: float | None = None,
    point_buffer_m: float | None = None,
    shade_weight: float | None = None,
) -> gpd.GeoDataFrame:
    """Convert NParks greenery features into conservative shade proxy polygons.

    These polygons are heat-comfort evidence only. They must not be merged into
    rain-shelter coverage.
    """
    if features.empty:
        return gpd.GeoDataFrame(geometry=[], crs="EPSG:3414")

    config = load_shade_proxy_config()
    line_buffer = float(line_buffer_m if line_buffer_m is not None else config["line_buffer_m"])
    point_buffer = float(point_buffer_m if point_buffer_m is not None else config["point_buffer_m"])
    proxy_weight = float(shade_weight if shade_weight is not None else config["shade_weight"])

    frame = features.copy()
    if frame.crs is None:
        frame = frame.set_crs("EPSG:4326")
    frame = frame.to_crs("EPSG:3414")

    rows: list[dict[str, Any]] = []
    for _, row in frame.iterrows():
        geom = row.geometry
        if geom is None or geom.is_empty:
            continue
        geom_type = geom.geom_type
        if geom_type in {"LineString", "MultiLineString"}:
            shade_geom = geom.buffer(line_buffer)
        elif geom_type in {"Point", "MultiPoint"}:
            shade_geom = geom.buffer(point_buffer)
        elif geom_type in {"Polygon", "MultiPolygon"}:
            shade_geom = geom
        else:
            continue
        rows.append(
            {
                "source_key": source_key,
                "source_layer": source_key,
                "shade_proxy": 1,
                "shade_weight": proxy_weight,
                "score_use": SHADE_ONLY_NOTE,
                "confidence": "proxy",
                "geometry": shade_geom,
            }
        )

    return gpd.GeoDataFrame(rows, geometry="geometry", crs="EPSG:3414")


def compute_edge_shade_ratio(
    edges: gpd.GeoDataFrame,
    shade_polygons: gpd.GeoDataFrame,
) -> pd.Series:
    """Return the fraction of each edge length covered by shade proxy polygons."""
    if edges.empty:
        return pd.Series(dtype=float)
    if shade_polygons.empty:
        return pd.Series(0.0, index=edges.index)

    edge_frame = edges.copy()
    if edge_frame.crs is None:
        edge_frame = edge_frame.set_crs("EPSG:3414")
    edge_frame = edge_frame.to_crs("EPSG:3414")

    shade_frame = shade_polygons.copy()
    if shade_frame.crs is None:
        shade_frame = shade_frame.set_crs("EPSG:3414")
    shade_frame = shade_frame.to_crs("EPSG:3414")
    shade_sindex = shade_frame.sindex
    ratios: list[float] = []
    for geom in edge_frame.geometry:
        length = float(geom.length) if geom is not None else 0.0
        if length <= 0:
            ratios.append(0.0)
            continue
        possible = shade_sindex.query(geom, predicate="intersects")
        if len(possible) == 0:
            ratios.append(0.0)
            continue
        shade_union = shade_frame.iloc[possible].geometry.union_all()
        shaded_length = float(geom.intersection(shade_union).length)
        ratios.append(max(0.0, min(1.0, shaded_length / length)))
    return pd.Series(ratios, index=edges.index)
