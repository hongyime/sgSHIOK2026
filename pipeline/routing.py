import ctypes
import math
import os
from multiprocessing import Pool, cpu_count
from pathlib import Path

import geopandas as gpd
import igraph as ig
import pandas as pd
import yaml
from shapely import wkt
from shapely.geometry import LineString, MultiLineString
from shapely.ops import linemerge

from pipeline.osm_tags import load_osm_tag_schema

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = PROJECT_ROOT / "pipeline" / "config" / "params.yaml"

_BASE_EDGE_METADATA_COLUMNS = [
    "source_layer",
    "synth_class",
    "confidence",
    "shade_ratio",
    "shade_source",
    "shade_confidence",
    "highway",
]
_OSM_EDGE_METADATA_COLUMNS = list(load_osm_tag_schema().network_extra_attributes)
EDGE_METADATA_COLUMNS = list(
    dict.fromkeys([*_BASE_EDGE_METADATA_COLUMNS, *_OSM_EDGE_METADATA_COLUMNS])
)


def load_params():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _available_memory_gib() -> float | None:
    if os.name == "nt":
        class MEMORYSTATUSEX(ctypes.Structure):
            _fields_ = [
                ("dwLength", ctypes.c_ulong),
                ("dwMemoryLoad", ctypes.c_ulong),
                ("ullTotalPhys", ctypes.c_ulonglong),
                ("ullAvailPhys", ctypes.c_ulonglong),
                ("ullTotalPageFile", ctypes.c_ulonglong),
                ("ullAvailPageFile", ctypes.c_ulonglong),
                ("ullTotalVirtual", ctypes.c_ulonglong),
                ("ullAvailVirtual", ctypes.c_ulonglong),
                ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
            ]

        status = MEMORYSTATUSEX()
        status.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
        if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
            return float(status.ullAvailPhys) / (1024**3)
        return None

    try:
        pages = os.sysconf("SC_AVPHYS_PAGES")
        page_size = os.sysconf("SC_PAGE_SIZE")
    except (AttributeError, OSError, ValueError):
        return None
    return float(pages * page_size) / (1024**3)


def choose_routing_worker_count(
    origin_count: int,
    routing_params: dict | None = None,
    *,
    cpu_count_value: int | None = None,
    available_memory_gib: float | None = None,
) -> tuple[int, str]:
    routing_params = routing_params or {}
    if origin_count <= 0:
        return 1, "origin_count=0"

    configured = routing_params.get("max_workers")
    cpu_limit = max(1, int(cpu_count_value or cpu_count() or 1))
    origin_limit = max(1, int(origin_count))
    default_cap = int(routing_params.get("default_cpu_cap", 8))
    requested_cap = int(configured) if configured is not None else default_cap

    worker_limit = max(1, min(cpu_limit, origin_limit, requested_cap))
    reasons = [
        f"origin_limit={origin_limit}",
        f"cpu_limit={cpu_limit}",
        f"configured_cap={requested_cap}",
    ]

    memory = available_memory_gib if available_memory_gib is not None else _available_memory_gib()
    rss_gib = float(routing_params.get("measured_worker_rss_gib", 2.9))
    reserve_gib = float(routing_params.get("memory_reserve_gib", 4.0))
    if memory is None or rss_gib <= 0:
        reasons.append("memory_limit=unknown")
    else:
        usable_gib = max(0.0, float(memory) - reserve_gib)
        memory_limit = max(1, int(usable_gib // rss_gib))
        worker_limit = min(worker_limit, memory_limit)
        reasons.append(
            f"memory_limit={memory_limit} available_gib={memory:.1f} reserve_gib={reserve_gib:.1f} worker_rss_gib={rss_gib:.1f}"
        )

    return max(1, worker_limit), "; ".join(reasons)


def prepare_edges_for_routing(edges_df):
    """Normalize edge geometry, endpoints, and metre lengths for routing."""
    edges_df = edges_df.copy()

    if "geometry" in edges_df.columns:
        edges_df["geometry"] = edges_df["geometry"].apply(
            lambda geom: wkt.loads(geom) if isinstance(geom, str) else geom
        )

        def get_coords(geom):
            if geom is not None and hasattr(geom, "is_empty") and not geom.is_empty:
                coords = geom.coords
                return (
                    (round(coords[0][0], 2), round(coords[0][1], 2)),
                    (round(coords[-1][0], 2), round(coords[-1][1], 2)),
                )
            return None, None

        coords = edges_df["geometry"].apply(get_coords)
        edges_df["u"] = [coord[0] for coord in coords]
        edges_df["v"] = [coord[1] for coord in coords]
        edges_df = edges_df.dropna(subset=["u", "v"])
    else:
        edges_df = edges_df[(edges_df["u"] != -1) & (edges_df["v"] != -1)]

    if "length_m" not in edges_df.columns:
        edges_df["length_m"] = pd.NA

    length_m = pd.to_numeric(edges_df["length_m"], errors="coerce")
    if "length" in edges_df.columns:
        length_m = length_m.fillna(pd.to_numeric(edges_df["length"], errors="coerce"))
    if "geometry" in edges_df.columns:
        geom_lengths = edges_df["geometry"].apply(
            lambda geom: (
                geom.length
                if geom is not None and hasattr(geom, "is_empty") and not geom.is_empty
                else pd.NA
            )
        )
        length_m = length_m.fillna(pd.to_numeric(geom_lengths, errors="coerce"))

    edges_df["length_m"] = length_m.fillna(1.0).clip(lower=0.0)
    edges_df["is_covered"] = edges_df["is_covered"].fillna(0).astype(int)
    return edges_df


def build_graph(edges_df):
    """Build igraph object from edge DataFrame."""
    unique_nodes = pd.concat([edges_df["u"], edges_df["v"]]).unique()
    node_mapping = {n: i for i, n in enumerate(unique_nodes)}
    reverse_mapping = {i: n for n, i in node_mapping.items()}

    edges_mapped = [
        (node_mapping[u], node_mapping[v]) for u, v in zip(edges_df["u"], edges_df["v"])
    ]

    g = ig.Graph(edges=edges_mapped, directed=False)
    g.es["length_m"] = edges_df["length_m"].values
    g.es["is_covered"] = edges_df["is_covered"].values
    if "geometry" in edges_df.columns:
        g.es["geometry"] = edges_df["geometry"].values
    for column in EDGE_METADATA_COLUMNS:
        if column in edges_df.columns:
            g.es[column] = edges_df[column].values

    return g, node_mapping, reverse_mapping


class RoutingGraph:
    """Reusable igraph routing context for repeated same-network route queries."""

    def __init__(self, edges_df):
        self.edges_df = prepare_edges_for_routing(edges_df)
        self.graph, self.node_map, self.reverse_map = build_graph(self.edges_df)
        self.component_membership = self.graph.connected_components(mode="weak").membership
        self.lengths = [float(value) for value in self.graph.es["length_m"]]
        self.covered = [bool(value) for value in self.graph.es["is_covered"]]
        self.shade_ratios = self._shade_ratio_values()
        self.geometries = (
            list(self.graph.es["geometry"]) if "geometry" in self.graph.edge_attributes() else None
        )
        self.edge_metadata = {
            column: list(self.graph.es[column])
            for column in EDGE_METADATA_COLUMNS
            if column in self.graph.edge_attributes()
        }
        self._sheltered_costs_by_lambda = {}

    @classmethod
    def from_edges_dict(cls, edges_dict):
        return cls(pd.DataFrame(edges_dict))

    @classmethod
    def from_prepared_edges(cls, edges_df):
        obj = cls.__new__(cls)
        obj.edges_df = edges_df
        obj.graph, obj.node_map, obj.reverse_map = build_graph(edges_df)
        obj.component_membership = obj.graph.connected_components(mode="weak").membership
        obj.lengths = [float(value) for value in obj.graph.es["length_m"]]
        obj.covered = [bool(value) for value in obj.graph.es["is_covered"]]
        obj.shade_ratios = obj._shade_ratio_values()
        obj.geometries = (
            list(obj.graph.es["geometry"]) if "geometry" in obj.graph.edge_attributes() else None
        )
        obj.edge_metadata = {
            column: list(obj.graph.es[column])
            for column in EDGE_METADATA_COLUMNS
            if column in obj.graph.edge_attributes()
        }
        obj._sheltered_costs_by_lambda = {}
        return obj

    def _shade_ratio_values(self):
        if "shade_ratio" not in self.graph.edge_attributes():
            return [0.0 for _ in self.lengths]
        ratios = []
        for value in self.graph.es["shade_ratio"]:
            numeric = pd.to_numeric(value, errors="coerce")
            ratios.append(0.0 if pd.isna(numeric) else max(0.0, min(1.0, float(numeric))))
        return ratios

    def sheltered_costs(self, shelter_lambda):
        lambda_key = float(shelter_lambda)
        if lambda_key not in self._sheltered_costs_by_lambda:
            self._sheltered_costs_by_lambda[lambda_key] = [
                length * (1.0 + lambda_key * (1.0 - float(covered)))
                for length, covered in zip(self.lengths, self.covered)
            ]
        return self._sheltered_costs_by_lambda[lambda_key]

    def _node_xy(self, vertex_idx):
        node = self.reverse_map.get(vertex_idx)
        if isinstance(node, (list, tuple)) and len(node) >= 2:
            return (float(node[0]), float(node[1]))
        return None

    @staticmethod
    def _distance_sq(a, b) -> float:
        return float((float(a[0]) - float(b[0])) ** 2 + (float(a[1]) - float(b[1])) ** 2)

    def oriented_geometry_for_edge(self, edge_id, from_vertex=None, to_vertex=None):
        if self.geometries is None:
            return None
        geometry = self.geometries[edge_id]
        if (
            geometry is None
            or from_vertex is None
            or to_vertex is None
            or getattr(geometry, "geom_type", None) != "LineString"
        ):
            return geometry
        from_xy = self._node_xy(from_vertex)
        to_xy = self._node_xy(to_vertex)
        if from_xy is None or to_xy is None:
            return geometry
        coords = list(geometry.coords)
        if len(coords) < 2:
            return geometry
        forward_score = self._distance_sq(coords[0], from_xy) + self._distance_sq(coords[-1], to_xy)
        reverse_score = self._distance_sq(coords[-1], from_xy) + self._distance_sq(coords[0], to_xy)
        if reverse_score < forward_score:
            return LineString(list(reversed(coords)))
        return geometry

    def oriented_lines_for_epath(self, epath, vpath=None):
        if self.geometries is None:
            return []
        if vpath and len(vpath) == len(epath) + 1:
            return [
                self.oriented_geometry_for_edge(edge_id, from_vertex, to_vertex)
                for edge_id, from_vertex, to_vertex in zip(epath, vpath, vpath[1:])
                if self.geometries[edge_id] is not None
            ]
        return [
            self.geometries[edge_id] for edge_id in epath if self.geometries[edge_id] is not None
        ]

    def vpath_for_epath(self, origin_idx, epath):
        current = origin_idx
        vpath = [current]
        for edge_id in epath:
            source, target = self.graph.es[edge_id].tuple
            if source == current:
                current = target
            elif target == current:
                current = source
            else:
                return []
            vpath.append(current)
        return vpath

    @staticmethod
    def _same_point(a, b, tolerance_m: float = 0.25) -> bool:
        return (float(a[0]) - float(b[0])) ** 2 + (float(a[1]) - float(b[1])) ** 2 <= (
            tolerance_m**2
        )

    def geometry_for_epath(self, epath, vpath=None):
        lines = self.oriented_lines_for_epath(epath, vpath)
        if not lines:
            return None
        if not vpath:
            return linemerge(MultiLineString(lines)) if len(lines) > 1 else lines[0]

        parts = []
        current_coords = []
        for line in lines:
            if getattr(line, "geom_type", None) != "LineString":
                if current_coords:
                    parts.append(LineString(current_coords))
                    current_coords = []
                parts.append(line)
                continue
            coords = list(line.coords)
            if len(coords) < 2:
                continue
            if not current_coords:
                current_coords = coords
            elif self._same_point(current_coords[-1], coords[0]):
                current_coords.extend(coords[1:])
            else:
                parts.append(LineString(current_coords))
                current_coords = coords
        if current_coords:
            parts.append(LineString(current_coords))
        if not parts:
            return None
        return parts[0] if len(parts) == 1 else MultiLineString(parts)

    def path_edges_for_epath(self, epath, vpath=None):
        if self.geometries is None:
            return []
        edges = []
        vertex_pairs = (
            list(zip(vpath, vpath[1:])) if vpath and len(vpath) == len(epath) + 1 else None
        )
        for index, edge_id in enumerate(epath):
            from_vertex, to_vertex = vertex_pairs[index] if vertex_pairs else (None, None)
            edge = {
                "length_m": float(self.lengths[edge_id]),
                "is_covered": bool(self.covered[edge_id]),
                "geometry": self.oriented_geometry_for_edge(edge_id, from_vertex, to_vertex),
            }
            for column, values in self.edge_metadata.items():
                value = values[edge_id]
                if pd.isna(value):
                    continue
                edge[column] = value
            edges.append(edge)
        return edges

    def route(self, od_pairs, shelter_lambda, detour_budget, include_geometry=True):
        sheltered_weights = (
            self.lengths if float(shelter_lambda) == 0.0 else self.sheltered_costs(shelter_lambda)
        )
        results = []

        for origin, destinations in od_pairs.items():
            if origin not in self.node_map:
                continue
            origin_idx = self.node_map[origin]
            origin_component = self.component_membership[origin_idx]

            valid_destinations = [
                destination
                for destination in destinations
                if destination in self.node_map
                and self.component_membership[self.node_map[destination]] == origin_component
            ]
            dest_indices = [self.node_map[destination] for destination in valid_destinations]

            if not dest_indices:
                continue

            paths_shortest = self.graph.get_shortest_paths(
                origin_idx, to=dest_indices, weights=self.lengths, output="epath"
            )
            paths_sheltered = self.graph.get_shortest_paths(
                origin_idx, to=dest_indices, weights=sheltered_weights, output="epath"
            )
            evidence_by_epath = {}
            materialized_by_epath = {}

            def evidence_for_epath(epath):
                key = tuple(epath)
                if key not in evidence_by_epath:
                    path_length = sum(self.lengths[edge_id] for edge_id in epath)
                    covered_m = sum(
                        self.lengths[edge_id] for edge_id in epath if self.covered[edge_id]
                    )
                    shade_m = sum(
                        self.lengths[edge_id] * self.shade_ratios[edge_id]
                        for edge_id in epath
                        if not self.covered[edge_id]
                    )
                    evidence_by_epath[key] = {
                        "length_m": path_length,
                        "covered_m": covered_m,
                        "shade_m": shade_m,
                    }
                return evidence_by_epath[key]

            def materialized_for_epath(epath):
                key = tuple(epath)
                if key not in materialized_by_epath:
                    vpath = self.vpath_for_epath(origin_idx, epath)
                    materialized_by_epath[key] = {
                        "geometry": self.geometry_for_epath(epath, vpath),
                        "path_edges": self.path_edges_for_epath(epath, vpath),
                    }
                return materialized_by_epath[key]

            for dest, epath_short, epath_shelt in zip(
                valid_destinations,
                paths_shortest,
                paths_sheltered,
            ):
                if not epath_short:
                    continue

                shortest_evidence = evidence_for_epath(epath_short)
                len_short = shortest_evidence["length_m"]

                if not epath_shelt:
                    final_epath = epath_short
                    routing_type = "shortest_fallback"
                else:
                    sheltered_evidence = evidence_for_epath(epath_shelt)
                    len_shelt = sheltered_evidence["length_m"]
                    if len_shelt <= float(detour_budget) * len_short:
                        final_epath = epath_shelt
                        routing_type = "sheltered"
                    else:
                        final_epath = epath_short
                        routing_type = "shortest_due_to_detour"

                final_evidence = evidence_for_epath(final_epath)
                final_length = final_evidence["length_m"]
                final_covered = final_evidence["covered_m"]
                final_shade = final_evidence["shade_m"]
                cov_short = shortest_evidence["covered_m"]
                shade_short = shortest_evidence["shade_m"]
                sheltered_length = (
                    evidence_for_epath(epath_shelt)["length_m"] if epath_shelt else None
                )

                result = {
                    "origin": origin,
                    "destination": dest,
                    "routing_type": routing_type,
                    "length_m": final_length,
                    "covered_m": final_covered,
                    "covered_ratio": final_covered / final_length if final_length > 0 else 0.0,
                    "shade_m": final_shade,
                    "shade_ratio": final_shade / final_length if final_length > 0 else 0.0,
                    "shortest_length_m": len_short,
                    "shortest_covered_ratio": cov_short / len_short if len_short > 0 else 0.0,
                    "shortest_shade_m": shade_short,
                    "shortest_shade_ratio": shade_short / len_short if len_short > 0 else 0.0,
                    "sheltered_length_m": sheltered_length,
                    "geometry": None,
                    "shortest_geometry": None,
                    "shortest_path_edges": [],
                    "sheltered_path_edges": [],
                    "path_edges": [],
                }
                if include_geometry:
                    final_materialized = materialized_for_epath(final_epath)
                    shortest_materialized = materialized_for_epath(epath_short)
                    result["geometry"] = final_materialized["geometry"]
                    result["shortest_geometry"] = shortest_materialized["geometry"]
                    result["shortest_path_edges"] = shortest_materialized["path_edges"]
                    result["sheltered_path_edges"] = final_materialized["path_edges"]
                    result["path_edges"] = final_materialized["path_edges"]
                results.append(result)

        return results


_WORKER_ROUTING_GRAPH = None


def route_worker(args):
    """Worker function for multiprocessing."""
    edges_dict, od_pairs, shelter_lambda, detour_budget = args
    return RoutingGraph.from_edges_dict(edges_dict).route(
        od_pairs,
        shelter_lambda,
        detour_budget,
        include_geometry=True,
    )


def init_route_worker(edges_dict):
    """Build the routing graph once per worker process."""
    global _WORKER_ROUTING_GRAPH
    _WORKER_ROUTING_GRAPH = RoutingGraph.from_edges_dict(edges_dict)


def route_worker_initialized(args):
    """Route one chunk using the worker-local graph built by the pool initializer."""
    if _WORKER_ROUTING_GRAPH is None:
        raise RuntimeError("route worker graph was not initialized")
    od_pairs, shelter_lambda, detour_budget = args
    return _WORKER_ROUTING_GRAPH.route(
        od_pairs,
        shelter_lambda,
        detour_budget,
        include_geometry=True,
    )


def run_routing_batch(network_path, od_pairs):
    params = load_params()
    shelter_lambda = params["shelter_lambda"]
    detour_budget = params["detour_budget"]
    routing_params = params.get("routing", {})

    print(f"Loading network from {network_path}...")
    edges_df = pd.read_parquet(network_path)
    edges_df = prepare_edges_for_routing(edges_df)

    cols = ["u", "v", "length_m", "is_covered"]
    if "geometry" in edges_df.columns:
        cols.append("geometry")
    cols.extend(column for column in EDGE_METADATA_COLUMNS if column in edges_df.columns)
    edges_dict = edges_df[cols].to_dict("list")

    origins = list(od_pairs.keys())
    num_workers, worker_reason = choose_routing_worker_count(len(origins), routing_params)
    target_tasks_per_worker = max(1, int(routing_params.get("target_tasks_per_worker", 4)))
    chunk_size = max(1, math.ceil(len(origins) / (num_workers * target_tasks_per_worker)))

    origin_chunks = [origins[i : i + chunk_size] for i in range(0, len(origins), chunk_size)]

    worker_args = []
    for chunk in origin_chunks:
        chunk_od_pairs = {o: od_pairs[o] for o in chunk}
        worker_args.append((chunk_od_pairs, shelter_lambda, detour_budget))

    print(
        "Starting routing on "
        f"{len(origins)} origins with {num_workers} workers, {len(worker_args)} chunks, "
        f"chunk_size={chunk_size}; worker_choice={worker_reason}"
    )

    results = []
    with Pool(num_workers, initializer=init_route_worker, initargs=(edges_dict,)) as pool:
        for res_chunk in pool.imap_unordered(route_worker_initialized, worker_args):
            results.extend(res_chunk)

    df = pd.DataFrame(results)

    # Ensure geometries are maintained
    if "geometry" in df.columns:
        gdf = gpd.GeoDataFrame(df, geometry="geometry", crs="EPSG:3414")
        return gdf
    return df


if __name__ == "__main__":
    pass
