import gzip
import json
from pathlib import Path

import pytest
from shapely.geometry import LineString, MultiLineString

from pipeline.export import (
    CONFIRM_LIVE_SCORE_EXPORT_FLAG,
    build_transit_poi_collection,
    encode_polyline,
    export_static_artifacts,
    geom_record,
    json_size,
    load_score_batch_records,
    main as export_main,
    refresh_score_provenance_manifest,
    refresh_transit_manifest,
    route_edge_source_class,
    route_segment_geometries,
    slugify_area,
    station_code_rows_from_xls_bytes,
    validate_export_batch_args,
    validate_live_score_export_args,
    validate_static_artifacts,
    write_json,
)
from pipeline.score_batch import json_safe_score_record


def gzip_json_file(path: Path) -> None:
    payload = path.read_bytes()
    with gzip.open(path.with_name(f"{path.name}.gz"), "wb") as f:
        f.write(payload)
    path.unlink()


def test_route_edge_source_class_uses_osm_location_provenance():
    assert (
        route_edge_source_class({"is_covered": True, "location": "underground"})
        == "bridge_underpass"
    )
    assert route_edge_source_class({"is_covered": True, "location": "indoor"}) == "osm_covered"
    assert route_edge_source_class({"is_covered": True, "shelter": "yes"}) == "osm_covered"
    assert (
        route_edge_source_class({"is_covered": True, "weather_protection": "yes"}) == "osm_covered"
    )
    assert (
        route_edge_source_class({"is_covered": True, "source_layer": "osm_native_covered"})
        == "osm_covered"
    )
    assert route_edge_source_class({"is_covered": True, "building:part": "roof"}) == "osm_covered"
    assert route_edge_source_class({"is_covered": True, "man_made": "canopy"}) == "osm_covered"
    assert route_edge_source_class({"is_covered": True, "covered": "building_arcade"}) == (
        "osm_covered"
    )
    assert route_edge_source_class({"is_covered": True, "covered": "shelter"}) == "osm_covered"
    assert route_edge_source_class({"is_covered": True, "covered": "roof"}) == "osm_covered"
    assert (
        route_edge_source_class(
            {"is_covered": True, "public_transport": "platform", "shelter": "yes"}
        )
        == "osm_covered"
    )
    assert route_edge_source_class({"is_covered": True, "shelter_type": "roof"}) == "osm_covered"


def test_route_edge_source_class_labels_direct_bus_fallback():
    assert (
        route_edge_source_class(
            {
                "is_covered": False,
                "source_layer": "direct_bus_fallback",
                "synth_class": "unrouted_straight_line",
            }
        )
        == "direct_unrouted_bus"
    )


def sample_record(postal: str = "123456") -> dict:
    return {
        "postal": postal,
        "state": "SCORED",
        "total": 88.8,
        "subscores": {
            "access": 100.0,
            "bus": 90.0,
            "rain": 80.0,
            "heat": 80.0,
            "crossing": 100.0,
        },
        "best_node": {"type": "mrt_lrt_exit", "name": "TEST MRT Exit 1", "routed_m": 200.0},
        "paths": {"shortest_m": 200.0, "sheltered_m": 220.0, "detour_pct": 10.0},
        "exposure_gaps": [{"len_m": 50.0, "label": "open test gap"}],
        "data_as_of": "2026-07-27T00:00:00+00:00",
        "provenance": {
            "scoring_fingerprints": {
                "pipeline\\config\\params.yaml": "b" * 64,
                "pipeline\\config\\weights.yaml": "c" * 64,
                "pipeline\\routing.py": "d" * 64,
                "pipeline\\scoring.py": "e" * 64,
                "pipeline\\scoring_integration.py": "f" * 64,
            },
            "network": {
                "network_algorithm": "sha256-json-sort-keys-24hex",
                "networks": [
                    {
                        "path": "processed\\network_island.parquet",
                        "sha256": "n" * 64,
                        "row_count": 10,
                    }
                ],
                "total_rows": 10,
            },
            "source_hashes": {"osm_extract": "a" * 64},
            "subscore_status": {
                "access": "real_routed_shortest_distance",
                "bus": "real_static_datamall_connectivity",
                "rain": "real_routed_covered_length_ratio",
                "heat": "provisional_covered_plus_nparks_shade_proxy_heat_only",
                "crossing": "real_traffic_signals_with_grade_separated_exemption",
            },
        },
        "_area": "Test Area",
        "_origin": {"lat": 1.30001, "lon": 103.80001, "x": 28000.0, "y": 35000.0},
        "_geometry": {
            "shortest": LineString([(28000.0, 35000.0), (28100.0, 35100.0)]),
            "sheltered": LineString([(28000.0, 35000.0), (28120.0, 35100.0)]),
            "shortest_path_edges": [
                {
                    "length_m": 80.0,
                    "is_covered": False,
                    "geometry": LineString([(28000.0, 35000.0), (28040.0, 35040.0)]),
                },
                {
                    "length_m": 120.0,
                    "is_covered": True,
                    "geometry": LineString([(28040.0, 35040.0), (28100.0, 35100.0)]),
                },
            ],
            "sheltered_path_edges": [
                {
                    "length_m": 50.0,
                    "is_covered": False,
                    "geometry": LineString([(28000.0, 35000.0), (28050.0, 35050.0)]),
                },
                {
                    "length_m": 170.0,
                    "is_covered": True,
                    "geometry": LineString([(28050.0, 35050.0), (28120.0, 35100.0)]),
                },
            ],
            "exposure_gap_edges": [
                {
                    "length_m": 50.0,
                    "is_covered": False,
                    "geometry": LineString([(28000.0, 35000.0), (28050.0, 35050.0)]),
                }
            ],
        },
    }


def unscored_record(postal: str) -> dict:
    return {
        "postal": postal,
        "state": "NOT_YET_SCORED",
        "total": None,
        "subscores": None,
        "best_node": None,
        "paths": None,
        "exposure_gaps": None,
        "data_as_of": "2026-07-27T00:00:00+00:00",
        "provenance": {"reason": "test"},
        "_area": "Large Area",
    }


def no_transit_walk_evidence_record(postal: str = "560235") -> dict:
    record = sample_record(postal)
    record["state"] = "NO_TRANSIT_IN_RANGE"
    record["total"] = None
    record["subscores"] = None
    record["best_node"] = {
        "type": "mrt_lrt_exit",
        "name": "TEST MRT Exit 2",
        "routed_m": 1500.0,
        "station": "TEST MRT",
    }
    record["paths"] = {
        "shortest_m": 1300.0,
        "sheltered_m": 1500.0,
        "detour_pct": 15.4,
        "covered_m": 720.0,
        "covered_ratio": 0.48,
        "shade_m": 120.0,
        "shade_ratio": 0.08,
        "routing_type": "sheltered",
    }
    record["exposure_gaps"] = [{"len_m": 180.2, "label": "far connected gap"}]
    record["route_options"] = {
        "best_transit": {
            "state": "NO_TRANSIT_IN_RANGE",
            "total": None,
            "subscores": None,
            "best_node": record["best_node"],
            "paths": record["paths"],
            "exposure_gaps": record["exposure_gaps"],
        }
    }
    record["provenance"]["reason"] = "routed_candidates_beyond_access_range"
    record["provenance"]["routing_diagnostics"] = {"nearest_routed_m": 1500.0}
    return record


def test_slugify_area():
    assert slugify_area("Downtown Core") == "DOWNTOWN_CORE"
    assert slugify_area(None) == "UNKNOWN"
    assert slugify_area(float("nan")) == "UNKNOWN"


def test_encode_polyline_known_google_example():
    points = [
        (38.5, -120.2),
        (40.7, -120.95),
        (43.252, -126.453),
    ]

    assert encode_polyline(points) == "_p~iF~ps|U_ulLnnqC_mqNvxq`@"


def test_export_and_validate_static_artifacts(tmp_path: Path):
    records = [sample_record("123456"), sample_record("654321")]

    report = export_static_artifacts(records, output_dir=tmp_path)
    progress_events: list[str] = []
    ok, validation = validate_static_artifacts(tmp_path, progress=progress_events.append)

    assert report["record_count"] == 2
    assert report["score_area_count"] == 1
    assert report["geom_shard_count"] >= 1
    assert ok, validation
    assert progress_events[0] == "scanning JSON artifact files"
    assert any(event.startswith("scanned ") for event in progress_events)
    assert "validating score index and shards" in progress_events
    assert "validating 1 score shards" in progress_events
    assert "validated 1/1 score shards" in progress_events
    assert "validating geometry index and shards" in progress_events
    assert any(event.startswith("validating ") and " geometry shards" in event for event in progress_events)
    assert any(event.startswith("validated ") and " geometry shards" in event for event in progress_events)
    assert validation["indexed_postals"] == 2
    assert validation["score_prefixes"] == 2
    assert validation["geometry_postals"] == 2
    assert validation["geometry_postals_with_route_segments"] == 2
    manifest = json.loads((tmp_path / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["provenance"]["source_hashes"]["osm_extract"] == "a" * 64
    assert manifest["provenance"]["scoring_fingerprints"]["pipeline\\scoring.py"] == "e" * 64
    assert manifest["provenance"]["scoring_fingerprint_algorithm"] == (
        "sha256-json-sort-keys-24hex"
    )
    assert manifest["provenance"]["scoring_fingerprint_digest_counts"]
    assert manifest["provenance"]["mixed_scoring_fingerprint_digests"] is False
    assert manifest["provenance"]["network_digest_counts"]
    assert manifest["provenance"]["mixed_network_digests"] is False
    network_digest = next(iter(manifest["provenance"]["network_digest_counts"]))
    assert manifest["provenance"]["networks_by_digest"][network_digest]["networks"] == [
        {
            "path": "processed\\network_island.parquet",
            "sha256": "n" * 64,
            "row_count": 10,
        }
    ]
    assert (
        manifest["provenance"]["subscore_status"]["heat"]
        == "provisional_covered_plus_nparks_shade_proxy_heat_only"
    )
    exported_score = json.loads((tmp_path / "scores" / "TEST_AREA.json").read_text())[0]
    assert "scoring_fingerprint_digest" in exported_score["provenance"]
    assert "scoring_fingerprints" not in exported_score["provenance"]
    assert "network_digest" in exported_score["provenance"]
    assert "network" not in exported_score["provenance"]
    assert "git" not in exported_score["provenance"]
    prefix_index = json.loads((tmp_path / "scores" / "prefix-index.json").read_text())
    assert prefix_index["123"] == ["TEST_AREA"]
    assert prefix_index["654"] == ["TEST_AREA"]
    postal_index = json.loads((tmp_path / "geom" / "postal-index.json").read_text())
    for postal in ["123456", "654321"]:
        shard = postal_index[postal]
        shard_records = json.loads((tmp_path / "geom" / "h3" / f"{shard}.json").read_text())
        assert postal in {record["postal"] for record in shard_records}
        geom_record = next(record for record in shard_records if record["postal"] == postal)
        assert geom_record["route_segments"]["shortest"][0]["is_covered"] is False
        assert geom_record["route_segments"]["shortest"][1]["is_covered"] is True
        assert geom_record["route_segments"]["sheltered"][0]["len_m"] == 50.0


def test_validate_accepts_gzipped_json_artifacts(tmp_path: Path):
    records = [sample_record("123456"), sample_record("654321")]
    export_static_artifacts(records, output_dir=tmp_path)

    gzip_json_file(tmp_path / "scores" / "index.json")
    gzip_json_file(tmp_path / "geom" / "index.json")
    gzip_json_file(tmp_path / "transit" / "pois.json")
    for path in (tmp_path / "scores").glob("TEST_AREA*.json"):
        gzip_json_file(path)
    for path in (tmp_path / "geom" / "h3").glob("*.json"):
        gzip_json_file(path)

    ok, validation = validate_static_artifacts(tmp_path)

    assert ok, validation
    assert validation["indexed_postals"] == 2
    assert validation["geometry_postals"] == 2
    assert validation["geometry_postals_with_route_segments"] == 2


def test_validate_rejects_stale_score_prefix_index(tmp_path: Path):
    records = [sample_record("123456"), sample_record("654321")]
    export_static_artifacts(records, output_dir=tmp_path)
    prefix_index_path = tmp_path / "scores" / "prefix-index.json"
    prefix_index = json.loads(prefix_index_path.read_text(encoding="utf-8"))
    prefix_index["123"] = []
    prefix_index["999"] = ["TEST_AREA"]
    prefix_index_path.write_text(json.dumps(prefix_index), encoding="utf-8")

    ok, validation = validate_static_artifacts(tmp_path)

    assert not ok
    assert validation["errors"] == [
        "scores/prefix-index.json does not match scores/index.json prefixes"
    ]


def test_validate_rejects_stale_transit_manifest_counts(tmp_path: Path):
    export_static_artifacts([sample_record("123456")], output_dir=tmp_path)
    manifest_path = tmp_path / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["transit"]["feature_count"] = 999
    manifest["transit"]["counts"] = {"bus_stop": 999}
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")

    ok, validation = validate_static_artifacts(tmp_path)

    assert not ok
    assert validation["errors"] == [
        "manifest transit.feature_count does not match transit/pois.json",
        "manifest transit.counts does not match transit/pois.json",
    ]


def test_validate_rejects_malformed_transit_poi_features(tmp_path: Path):
    export_static_artifacts([sample_record("123456")], output_dir=tmp_path)
    transit_path = tmp_path / "transit" / "pois.json"
    transit = json.loads(transit_path.read_text(encoding="utf-8"))
    transit["features"][0]["geometry"]["coordinates"] = [0, 0]
    transit["features"][0]["properties"].pop("id")
    transit["features"][0]["properties"]["name"] = ""
    transit_path.write_text(json.dumps(transit), encoding="utf-8")

    ok, validation = validate_static_artifacts(tmp_path)

    assert not ok
    assert validation["errors"] == [
        "transit/pois.json:0: coordinates outside Singapore bounds",
        "transit/pois.json:0: missing id",
        "transit/pois.json:0: missing name",
    ]


def test_validate_rejects_duplicate_transit_poi_ids(tmp_path: Path):
    export_static_artifacts([sample_record("123456")], output_dir=tmp_path)
    transit_path = tmp_path / "transit" / "pois.json"
    transit = json.loads(transit_path.read_text(encoding="utf-8"))
    duplicate_id = transit["features"][0]["properties"]["id"]
    transit["features"][1]["properties"]["id"] = duplicate_id
    transit_path.write_text(json.dumps(transit), encoding="utf-8")

    ok, validation = validate_static_artifacts(tmp_path)

    assert not ok
    assert validation["errors"] == [
        f"transit/pois.json:1: duplicate id {duplicate_id!r} (first seen at 0)"
    ]


def test_validate_rejects_transit_poi_id_kind_mismatch(tmp_path: Path):
    export_static_artifacts([sample_record("123456")], output_dir=tmp_path)
    transit_path = tmp_path / "transit" / "pois.json"
    transit = json.loads(transit_path.read_text(encoding="utf-8"))
    kind = transit["features"][0]["properties"]["kind"]
    bad_id = {
        "bus_stop": "mrt:wrong",
        "mrt_exit": "bus:wrong",
        "mrt_station": "bus:wrong",
    }[kind]
    transit["features"][0]["properties"]["id"] = bad_id
    transit_path.write_text(json.dumps(transit), encoding="utf-8")

    ok, validation = validate_static_artifacts(tmp_path)

    assert not ok
    assert validation["errors"] == [
        f"transit/pois.json:0: id {bad_id!r} does not match kind {kind!r}"
    ]


def test_validate_rejects_transit_poi_kind_metadata_mismatch(tmp_path: Path):
    export_static_artifacts([sample_record("123456")], output_dir=tmp_path)
    transit_path = tmp_path / "transit" / "pois.json"
    transit = json.loads(transit_path.read_text(encoding="utf-8"))
    index_by_kind = {
        feature["properties"]["kind"]: index
        for index, feature in enumerate(transit["features"])
    }
    bus_index = index_by_kind["bus_stop"]
    mrt_exit_index = index_by_kind["mrt_exit"]
    station_index = index_by_kind["mrt_station"]
    transit["features"][bus_index]["properties"]["code"] = ""
    transit["features"][mrt_exit_index]["properties"]["station"] = ""
    transit["features"][mrt_exit_index]["properties"]["exit"] = ""
    transit["features"][station_index]["properties"]["exit_count"] = 0
    transit_path.write_text(json.dumps(transit), encoding="utf-8")

    ok, validation = validate_static_artifacts(tmp_path)

    assert not ok
    assert validation["errors"] == [
        f"transit/pois.json:{bus_index}: missing bus code",
        f"transit/pois.json:{mrt_exit_index}: missing MRT station",
        f"transit/pois.json:{mrt_exit_index}: missing MRT exit",
        f"transit/pois.json:{station_index}: missing exit_count",
    ]


def test_route_segments_split_disjoint_multiline_parts_without_fake_connector():
    segments = route_segment_geometries(
        [
            {
                "length_m": 10.0,
                "is_covered": True,
                "geometry": LineString([(0, 0), (10, 0)]),
            },
            {
                "length_m": 10.0,
                "is_covered": True,
                "geometry": LineString([(100, 0), (110, 0)]),
            },
        ]
    )

    assert len(segments) == 2
    assert all(segment["is_covered"] is True for segment in segments)
    assert all(segment["len_m"] == 10.0 for segment in segments)
    assert segments[0]["geom"] != segments[1]["geom"]


def test_geom_record_emits_multiline_route_parts_for_fallback_rendering():
    record = sample_record("560231")
    record["_geometry"]["shortest"] = MultiLineString(
        [
            LineString([(28000.0, 35000.0), (28010.0, 35000.0)]),
            LineString([(28100.0, 35000.0), (28110.0, 35000.0)]),
        ]
    )

    output = geom_record(record)

    assert output is not None
    assert len(output["shortest_parts"]) == 2


def sample_record_with_candidates(postal: str = "560234") -> dict:
    record = sample_record(postal)
    record["candidates"] = [
        {
            "node_id": "bus:66361",
            "node_name": "Aft Ang Mo Kio Int",
            "node_type": "bus_stop",
            "direct_distance_m": 129.4,
            "paths": {
                "shortest_m": 155.2,
                "sheltered_m": 189.7,
                "covered_ratio": 0.72,
                "detour_pct": 22.0,
                "shade_ratio": 0.15,
            },
            "geometry_ref": f"{postal}_bus:66361",
            "route_trust": "graph_routed_bus_stop",
            "routing_type": "sheltered",
            "state": "SCORED",
        },
        {
            "node_id": "mrt:21491",
            "node_name": "Yishun A",
            "node_type": "mrt_lrt_exit",
            "direct_distance_m": 245.0,
            "paths": {
                "shortest_m": 280.0,
                "sheltered_m": 310.0,
                "covered_ratio": 0.55,
                "detour_pct": 10.7,
                "shade_ratio": 0.2,
            },
            "geometry_ref": f"{postal}_mrt:21491",
            "route_trust": "graph_routed_mrt_lrt_exit",
            "routing_type": "sheltered",
            "state": "SCORED",
        },
    ]
    record["_candidate_geometries"] = {
        "bus:66361": {
            "shortest": LineString([(28000.0, 35000.0), (28150.0, 35060.0)]),
            "sheltered": LineString([(28000.0, 35000.0), (28160.0, 35090.0)]),
            "shortest_path_edges": [
                {
                    "length_m": 155.2,
                    "is_covered": False,
                    "geometry": LineString([(28000.0, 35000.0), (28150.0, 35060.0)]),
                }
            ],
            "sheltered_path_edges": [
                {
                    "length_m": 189.7,
                    "is_covered": True,
                    "geometry": LineString([(28000.0, 35000.0), (28160.0, 35090.0)]),
                }
            ],
            "exposure_gap_edges": [],
        },
        "mrt:21491": {
            "shortest": LineString([(28000.0, 35000.0), (28250.0, 35080.0)]),
            "sheltered": LineString([(28000.0, 35000.0), (28260.0, 35110.0)]),
            "shortest_path_edges": [
                {
                    "length_m": 280.0,
                    "is_covered": False,
                    "geometry": LineString([(28000.0, 35000.0), (28250.0, 35080.0)]),
                }
            ],
            "sheltered_path_edges": [
                {
                    "length_m": 310.0,
                    "is_covered": True,
                    "geometry": LineString([(28000.0, 35000.0), (28260.0, 35110.0)]),
                }
            ],
            "exposure_gap_edges": [],
        },
    }
    return record


def test_public_score_record_preserves_candidates_field_and_strips_private_geometry_maps():
    from pipeline.export import public_score_record

    record = sample_record_with_candidates("560234")

    public = public_score_record(record)

    assert public["candidates"] == record["candidates"]
    # Private geometry maps are stripped by the underscore-key rule.
    assert "_candidate_geometries" not in public
    assert "_geometry" not in public
    assert "_geometry_options" not in public


def test_geom_record_emits_candidate_geometry_map_keyed_by_node_id():
    record = sample_record_with_candidates("560234")

    output = geom_record(record)

    assert output is not None
    assert "candidates" in output
    assert set(output["candidates"]) == {"bus:66361", "mrt:21491"}
    for node_id in ("bus:66361", "mrt:21491"):
        candidate_geom = output["candidates"][node_id]
        assert candidate_geom["shortest"]
        assert candidate_geom["sheltered"]
        assert "postal" not in candidate_geom


def test_export_static_artifacts_writes_candidates_into_score_and_geom_shards(tmp_path: Path):
    export_static_artifacts([sample_record_with_candidates("560234")], output_dir=tmp_path)
    ok, validation = validate_static_artifacts(tmp_path)
    assert ok, validation

    scores = list((tmp_path / "scores").glob("TEST_AREA*.json"))
    assert len(scores) == 1
    payload = json.loads(scores[0].read_text(encoding="utf-8"))
    assert len(payload) == 1
    score = payload[0]
    assert score["postal"] == "560234"
    assert len(score["candidates"]) == 2
    assert score["candidates"][0]["node_id"] == "bus:66361"
    assert score["candidates"][0]["geometry_ref"] == "560234_bus:66361"
    # `_candidate_geometries` must never leak into the exported score shard.
    assert "_candidate_geometries" not in score

    postal_index = json.loads((tmp_path / "geom" / "postal-index.json").read_text())
    shard = postal_index["560234"]
    geom_payload = json.loads((tmp_path / "geom" / "h3" / f"{shard}.json").read_text())
    entry = next(record for record in geom_payload if record["postal"] == "560234")
    assert set(entry["candidates"]) == {"bus:66361", "mrt:21491"}
    assert entry["candidates"]["bus:66361"]["shortest"]
    assert "postal" not in entry["candidates"]["bus:66361"]


def test_validate_rejects_incomplete_candidate_geometry(tmp_path: Path):
    export_static_artifacts([sample_record_with_candidates("560241")], output_dir=tmp_path)
    postal_index = json.loads((tmp_path / "geom" / "postal-index.json").read_text())
    shard_path = tmp_path / "geom" / "h3" / f"{postal_index['560241']}.json"
    geom_payload = json.loads(shard_path.read_text(encoding="utf-8"))
    geom_payload[0]["candidates"]["bus:66361"].pop("shortest")
    geom_payload[0]["candidates"]["bus:66361"].pop("exposure_gaps")
    shard_path.write_text(json.dumps(geom_payload), encoding="utf-8")

    ok, validation = validate_static_artifacts(tmp_path)

    assert not ok
    assert validation["errors"] == [
        "geom/h3/886520d835fffff.json:560241:candidates.bus:66361: missing shortest",
        "geom/h3/886520d835fffff.json:560241:candidates.bus:66361: missing exposure_gaps",
    ]


def test_validate_rejects_malformed_score_candidates(tmp_path: Path):
    record = sample_record_with_candidates("560242")
    record["candidates"][0].pop("node_name")
    record["candidates"][0]["geometry_ref"] = "560242_bus:missing"
    record["candidates"][1]["state"] = "BROKEN"
    record["candidates"].append({**record["candidates"][1], "node_id": "bus:extra1"})
    record["candidates"].append({**record["candidates"][1], "node_id": "bus:extra2"})
    record["candidates"].append({**record["candidates"][1], "node_id": "bus:extra3"})
    record["candidates"].append({**record["candidates"][1], "node_id": "bus:extra4"})

    export_static_artifacts([record], output_dir=tmp_path)
    ok, validation = validate_static_artifacts(tmp_path)

    assert not ok
    assert validation["errors"] == [
        "scores/TEST_AREA.json:560242: candidates exceeds cap 5",
        "scores/TEST_AREA.json:560242:candidates[0]: missing node_name",
        "scores/TEST_AREA.json:560242:candidates[0]: geometry_ref must be '560242_bus:66361' or null",
        "scores/TEST_AREA.json:560242:candidates[1]: invalid state 'BROKEN'",
        "scores/TEST_AREA.json:560242:candidates[2]: invalid state 'BROKEN'",
        "scores/TEST_AREA.json:560242:candidates[2]: geometry_ref must be '560242_bus:extra1' or null",
        "scores/TEST_AREA.json:560242:candidates[3]: invalid state 'BROKEN'",
        "scores/TEST_AREA.json:560242:candidates[3]: geometry_ref must be '560242_bus:extra2' or null",
        "scores/TEST_AREA.json:560242:candidates[4]: invalid state 'BROKEN'",
        "scores/TEST_AREA.json:560242:candidates[4]: geometry_ref must be '560242_bus:extra3' or null",
        "scores/TEST_AREA.json:560242:candidates[5]: invalid state 'BROKEN'",
        "scores/TEST_AREA.json:560242:candidates[5]: geometry_ref must be '560242_bus:extra4' or null",
    ]


def test_validate_requires_geom_for_candidate_geometry_ref(tmp_path: Path):
    export_static_artifacts([sample_record_with_candidates("560243")], output_dir=tmp_path)
    postal_index = json.loads((tmp_path / "geom" / "postal-index.json").read_text())
    shard_path = tmp_path / "geom" / "h3" / f"{postal_index['560243']}.json"
    geom_payload = json.loads(shard_path.read_text(encoding="utf-8"))
    geom_payload[0]["candidates"].pop("bus:66361")
    shard_path.write_text(json.dumps(geom_payload), encoding="utf-8")

    ok, validation = validate_static_artifacts(tmp_path)

    assert not ok
    assert validation["errors"] == [
        "scores candidates:560243: bus:66361 has geometry_ref but missing geom candidate"
    ]


def test_export_static_artifacts_preserves_no_transit_walk_evidence(tmp_path: Path):
    export_static_artifacts([no_transit_walk_evidence_record("560235")], output_dir=tmp_path)
    ok, validation = validate_static_artifacts(tmp_path)
    assert ok, validation

    manifest = json.loads((tmp_path / "manifest.json").read_text(encoding="utf-8"))
    no_transit_semantics = manifest["scores"]["record_shape"]["state_semantics"][
        "NO_TRANSIT_IN_RANGE"
    ]
    assert manifest["scores"]["record_shape"]["candidates"] == {
        "cap": 5,
        "sort_key": "direct_distance_m_ascending",
        "geometry_ref_format": "<postal>_<node_id>",
        "required_fields": [
            "node_id",
            "node_name",
            "node_type",
            "direct_distance_m",
            "paths",
            "geometry_ref",
            "route_trust",
            "routing_type",
            "state",
        ],
        "geometry_requirement": (
            "non-null geometry_ref requires matching "
            "geom.<cell>.json[postal].candidates[<node_id>]"
        ),
        "node_id_prefixes": ["bus:", "mrt:"],
    }
    assert manifest["scores"]["record_shape"]["route_options"] == {
        "keys": ["best_transit", "mrt_lrt", "bus"],
        "required_fields": [
            "state",
            "total",
            "subscores",
            "best_node",
            "paths",
            "exposure_gaps",
        ],
        "best_transit_geometry": "uses the top-level geom shard record",
        "switchable_geometry_ref_format": "geom.<cell>.json[postal].route_options[<option_key>]",
        "switchable_geometry_requirement": (
            "non-best route_options with paths require matching geom shard route_options entries"
        ),
    }
    assert manifest["geom"]["record_shape"]["route_options_map"] == (
        "geom.<cell>.json[postal].route_options[<option_key>]"
    )
    assert manifest["geom"]["record_shape"]["candidates_map_required_fields"] == [
        "shortest",
        "sheltered",
        "exposure_gaps",
    ]
    assert manifest["geom"]["record_shape"]["route_options_map_required_fields"] == [
        "shortest",
        "sheltered",
        "exposure_gaps",
    ]
    assert no_transit_semantics == {
        "score_fields": "total and subscores are null",
        "walk_evidence": (
            "best_node, paths, exposure_gaps, and route_options may be present when a "
            "connected walk exists beyond the locked 1.2 km range"
        ),
        "geometry_requirement": (
            "records with paths require a matching geom shard even when total and subscores "
            "are null"
        ),
    }

    score_payload = json.loads(next((tmp_path / "scores").glob("TEST_AREA*.json")).read_text())
    score = score_payload[0]
    assert score["postal"] == "560235"
    assert score["state"] == "NO_TRANSIT_IN_RANGE"
    assert score["total"] is None
    assert score["subscores"] is None
    assert score["best_node"]["routed_m"] == 1500.0
    assert score["paths"]["covered_ratio"] == 0.48
    assert score["paths"]["sheltered_m"] == 1500.0
    assert score["exposure_gaps"] == [{"len_m": 180.2, "label": "far connected gap"}]
    assert score["route_options"]["best_transit"]["state"] == "NO_TRANSIT_IN_RANGE"
    assert score["route_options"]["best_transit"]["total"] is None
    assert score["provenance"]["reason"] == "routed_candidates_beyond_access_range"
    assert score["provenance"]["routing_diagnostics"] == {"nearest_routed_m": 1500.0}
    assert "_geometry" not in score

    postal_index = json.loads((tmp_path / "geom" / "postal-index.json").read_text())
    shard = postal_index["560235"]
    geom_payload = json.loads((tmp_path / "geom" / "h3" / f"{shard}.json").read_text())
    entry = next(record for record in geom_payload if record["postal"] == "560235")
    assert entry["route_segments"]["sheltered"][0]["len_m"] == 50.0
    assert entry["exposure_gaps"][0]["len_m"] == 180.2


def test_validate_requires_geometry_for_no_transit_walk_evidence(tmp_path: Path):
    record = no_transit_walk_evidence_record("560235")
    record.pop("_geometry")

    export_static_artifacts([record], output_dir=tmp_path)
    ok, validation = validate_static_artifacts(tmp_path)

    assert not ok
    assert validation["errors"] == ["1 records requiring geometry missing geometry shards"]


def test_validate_rejects_incomplete_no_transit_walk_evidence_records(tmp_path: Path):
    missing_best_node = no_transit_walk_evidence_record("560235")
    missing_best_node["best_node"] = None
    missing_exposure_gaps = no_transit_walk_evidence_record("560236")
    missing_exposure_gaps["exposure_gaps"] = None

    export_static_artifacts([missing_best_node, missing_exposure_gaps], output_dir=tmp_path)
    ok, validation = validate_static_artifacts(tmp_path)

    assert not ok
    assert validation["errors"] == [
        "scores/TEST_AREA.json:560235: best_node missing for path-bearing NO_TRANSIT_IN_RANGE",
        "scores/TEST_AREA.json:560236: exposure_gaps missing for path-bearing NO_TRANSIT_IN_RANGE",
    ]


def test_validate_requires_geometry_for_switchable_route_options(tmp_path: Path):
    record = sample_record("560237")
    record["route_options"] = {
        "best_transit": {
            "state": "SCORED",
            "total": record["total"],
            "subscores": record["subscores"],
            "best_node": record["best_node"],
            "paths": record["paths"],
            "exposure_gaps": record["exposure_gaps"],
        },
        "bus": {
            "state": "SCORED",
            "total": 62.0,
            "subscores": record["subscores"],
            "best_node": {"type": "bus_stop", "name": "Bus Option", "routed_m": 420.0},
            "paths": {
                "shortest_m": 420.0,
                "sheltered_m": 470.0,
                "covered_ratio": 0.51,
                "detour_pct": 11.9,
            },
            "exposure_gaps": [],
        },
    }

    export_static_artifacts([record], output_dir=tmp_path)
    ok, validation = validate_static_artifacts(tmp_path)

    assert not ok
    assert validation["errors"] == [
        "scores route_options:560237: bus has paths but missing geom route option"
    ]


def test_validate_rejects_incomplete_switchable_route_options(tmp_path: Path):
    record = sample_record("560238")
    record["route_options"] = {
        "best_transit": {
            "state": "SCORED",
            "total": record["total"],
            "subscores": record["subscores"],
            "best_node": record["best_node"],
            "paths": record["paths"],
            "exposure_gaps": record["exposure_gaps"],
        },
        "mrt_lrt": {
            "state": "SCORED",
            "total": 75.0,
            "subscores": record["subscores"],
            "best_node": {"type": "mrt_lrt_exit", "name": "MRT Option", "routed_m": 390.0},
            "paths": {
                "shortest_m": 390.0,
                "sheltered_m": 430.0,
                "covered_ratio": 0.55,
                "detour_pct": 10.3,
            },
            "exposure_gaps": None,
        },
        "bus": {
            "state": "SCORED",
            "total": 62.0,
            "subscores": record["subscores"],
            "best_node": None,
            "paths": {
                "shortest_m": 420.0,
                "sheltered_m": 470.0,
                "covered_ratio": 0.51,
                "detour_pct": 11.9,
            },
            "exposure_gaps": [],
        },
    }
    record["_geometry_options"] = {
        "mrt_lrt": record["_geometry"],
        "bus": record["_geometry"],
    }

    export_static_artifacts([record], output_dir=tmp_path)
    ok, validation = validate_static_artifacts(tmp_path)

    assert not ok
    assert validation["errors"] == [
        "scores/TEST_AREA.json:560238:route_options.bus: best_node missing for SCORED",
        "scores/TEST_AREA.json:560238:route_options.mrt_lrt: exposure_gaps missing for SCORED",
    ]


def test_validate_rejects_unknown_route_option_keys(tmp_path: Path):
    record = sample_record("560239")
    record["route_options"] = {
        "best_transit": {
            "state": "SCORED",
            "total": record["total"],
            "subscores": record["subscores"],
            "best_node": record["best_node"],
            "paths": record["paths"],
            "exposure_gaps": record["exposure_gaps"],
        },
        "taxi": {
            "state": "SCORED",
            "total": 68.0,
            "subscores": record["subscores"],
            "best_node": {"type": "taxi_stand", "name": "Taxi Option", "routed_m": 360.0},
            "paths": {
                "shortest_m": 360.0,
                "sheltered_m": 390.0,
                "covered_ratio": 0.57,
                "detour_pct": 8.3,
            },
            "exposure_gaps": [],
        },
    }
    record["_geometry_options"] = {"taxi": record["_geometry"]}

    export_static_artifacts([record], output_dir=tmp_path)
    ok, validation = validate_static_artifacts(tmp_path)

    assert not ok
    assert validation["errors"] == [
        "scores/TEST_AREA.json:560239:route_options.taxi: invalid route option key",
        "geom/h3/886520d835fffff.json:560239:route_options.taxi: invalid route option key",
    ]


def test_validate_rejects_incomplete_geom_route_options(tmp_path: Path):
    record = sample_record("560240")
    record["route_options"] = {
        "best_transit": {
            "state": "SCORED",
            "total": record["total"],
            "subscores": record["subscores"],
            "best_node": record["best_node"],
            "paths": record["paths"],
            "exposure_gaps": record["exposure_gaps"],
        },
        "bus": {
            "state": "SCORED",
            "total": 62.0,
            "subscores": record["subscores"],
            "best_node": {"type": "bus_stop", "name": "Bus Option", "routed_m": 420.0},
            "paths": {
                "shortest_m": 420.0,
                "sheltered_m": 470.0,
                "covered_ratio": 0.51,
                "detour_pct": 11.9,
            },
            "exposure_gaps": [],
        },
    }
    record["_geometry_options"] = {"bus": record["_geometry"]}

    export_static_artifacts([record], output_dir=tmp_path)
    postal_index = json.loads((tmp_path / "geom" / "postal-index.json").read_text())
    shard_path = tmp_path / "geom" / "h3" / f"{postal_index['560240']}.json"
    geom_payload = json.loads(shard_path.read_text(encoding="utf-8"))
    geom_payload[0]["route_options"]["bus"].pop("sheltered")
    geom_payload[0]["route_options"]["bus"].pop("exposure_gaps")
    shard_path.write_text(json.dumps(geom_payload), encoding="utf-8")

    ok, validation = validate_static_artifacts(tmp_path)

    assert not ok
    assert validation["errors"] == [
        "geom/h3/886520d835fffff.json:560240:route_options.bus: missing sheltered",
        "geom/h3/886520d835fffff.json:560240:route_options.bus: missing exposure_gaps",
    ]


def test_validate_rejects_stale_geom_postal_index(tmp_path: Path):
    export_static_artifacts([sample_record("560244")], output_dir=tmp_path)
    postal_index_path = tmp_path / "geom" / "postal-index.json"
    postal_index = json.loads(postal_index_path.read_text(encoding="utf-8"))
    expected_shard = postal_index["560244"]
    postal_index["560244"] = "886520d835ffff0"
    postal_index["999999"] = expected_shard
    postal_index_path.write_text(json.dumps(postal_index), encoding="utf-8")

    ok, validation = validate_static_artifacts(tmp_path)

    assert not ok
    assert validation["errors"] == [
        f"geom/postal-index.json:560244: expected shard {expected_shard}, got 886520d835ffff0",
        "geom/postal-index.json:999999: postal not present in geom shards",
    ]


def test_refresh_score_provenance_manifest_preserves_candidates_field(tmp_path: Path):
    export_static_artifacts([sample_record_with_candidates("560234")], output_dir=tmp_path)
    scores_dir = tmp_path / "scores"
    shard_path = next(scores_dir.glob("TEST_AREA*.json"))
    before = json.loads(shard_path.read_text(encoding="utf-8"))
    assert before[0]["candidates"]

    report = refresh_score_provenance_manifest(tmp_path)

    after = json.loads(shard_path.read_text(encoding="utf-8"))
    assert report["ok"] is True
    # Score records are untouched by refresh-provenance; candidates survive verbatim.
    assert after == before


def test_load_score_batch_records_roundtrips_records_without_candidates(tmp_path: Path):
    # Backward compat: a chunk emitted before the picker rescore has no
    # `candidates` field. Exporter must accept it and pass it through
    # unchanged.
    chunks_dir = tmp_path / "chunks"
    chunks_dir.mkdir()
    legacy_record = {
        "postal": "560234",
        "state": "SCORED",
        "total": 60.0,
        "subscores": {
            "access": 100.0,
            "bus": 90.0,
            "rain": 70.0,
            "heat": 70.0,
            "crossing": 100.0,
        },
        "best_node": {"type": "bus_stop", "name": "Legacy", "routed_m": 200.0},
        "paths": {"shortest_m": 200.0, "sheltered_m": 220.0, "detour_pct": 10.0},
        "exposure_gaps": [],
        "data_as_of": "2026-07-27T00:00:00+00:00",
        "provenance": {"reason": "legacy"},
    }
    (chunks_dir / "chunk_00001_560234_560234.json").write_text(
        json.dumps([legacy_record]), encoding="utf-8"
    )

    loaded = load_score_batch_records(tmp_path)

    assert loaded == [legacy_record]
    assert "candidates" not in loaded[0]


def test_load_score_batch_records_preserves_no_transit_walk_evidence(tmp_path: Path):
    chunks_dir = tmp_path / "chunks"
    record = json_safe_score_record(no_transit_walk_evidence_record("560235"))
    write_json(chunks_dir / "chunk_00001_560235_560235.json", [record])

    loaded = load_score_batch_records(tmp_path)

    assert loaded == [record]
    assert loaded[0]["state"] == "NO_TRANSIT_IN_RANGE"
    assert loaded[0]["total"] is None
    assert loaded[0]["subscores"] is None
    assert loaded[0]["best_node"]["routed_m"] == 1500.0
    assert loaded[0]["paths"]["covered_ratio"] == 0.48
    assert loaded[0]["route_options"]["best_transit"]["state"] == "NO_TRANSIT_IN_RANGE"
    assert loaded[0]["provenance"]["reason"] == "routed_candidates_beyond_access_range"


def test_station_code_rows_from_xls_bytes_parses_official_schema(monkeypatch):
    class FakeSheet:
        nrows = 3
        ncols = 5

        values = [
            [
                "stn_code",
                "mrt_station_english",
                "mrt_station_chinese",
                "mrt_line_english",
                "mrt_line_chinese",
            ],
            ["TE6", "Mayflower", "美华", "Thomson-East Coast Line", "汤申-东海岸线"],
            ["", "", "", "", ""],
        ]

        def cell_value(self, row: int, col: int) -> str:
            return str(self.values[row][col])

    class FakeBook:
        def sheets(self):
            return [FakeSheet()]

    def fake_open_workbook(*, file_contents: bytes):
        assert file_contents == b"xls"
        return FakeBook()

    monkeypatch.setattr("pipeline.export.xlrd.open_workbook", fake_open_workbook)

    assert station_code_rows_from_xls_bytes(b"xls") == [
        {
            "stn_code": "TE6",
            "mrt_station_english": "Mayflower",
            "mrt_station_chinese": "美华",
            "mrt_line_english": "Thomson-East Coast Line",
            "mrt_line_chinese": "汤申-东海岸线",
        }
    ]


def test_build_transit_poi_collection_exports_mrt_and_bus_points():
    mrt_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [103.83658, 1.36708]},
                "properties": {
                    "OBJECTID": 1,
                    "STATION_NA": "MAYFLOWER MRT STATION",
                    "EXIT_CODE": "Exit 5",
                },
            }
        ],
    }
    bus_payload = {
        "value": [
            {
                "BusStopCode": "55089",
                "Description": "Mayflower Stn Exit 5",
                "Latitude": 1.367,
                "Longitude": 103.837,
                "RoadName": "Ang Mo Kio Ave 4",
            }
        ]
    }
    bus_services_payload = {
        "value": [
            {
                "ServiceNo": "262",
                "Direction": 1,
                "Operator": "SBST",
                "Category": "TRUNK",
                "AM_Peak_Freq": "06-08",
                "PM_Peak_Freq": "07-09",
            }
        ]
    }
    bus_routes_payload = {
        "value": [
            {
                "ServiceNo": "262",
                "Direction": 1,
                "BusStopCode": "55089",
                "WD_FirstBus": "0530",
                "WD_LastBus": "0045",
                "SAT_FirstBus": "0535",
                "SAT_LastBus": "0040",
                "SUN_FirstBus": "0545",
                "SUN_LastBus": "0030",
            }
        ]
    }
    train_station_codes_payload = [
        {
            "stn_code": "TE6",
            "mrt_station_english": "Mayflower",
            "mrt_station_chinese": "美华",
            "mrt_line_english": "Thomson-East Coast Line",
            "mrt_line_chinese": "汤申-东海岸线",
        }
    ]

    collection = build_transit_poi_collection(
        mrt_geojson,
        bus_payload,
        {"source_hashes": {"mrt_lrt_exits": "a" * 64, "bus_stops": "b" * 64}},
        bus_services_payload,
        bus_routes_payload,
        train_station_codes_payload,
    )

    assert collection["type"] == "FeatureCollection"
    assert len(collection["features"]) == 3
    kinds = {feature["properties"]["kind"] for feature in collection["features"]}
    assert kinds == {"mrt_station", "mrt_exit", "bus_stop"}
    mrt = next(
        feature for feature in collection["features"] if feature["properties"]["kind"] == "mrt_exit"
    )
    station = next(
        feature
        for feature in collection["features"]
        if feature["properties"]["kind"] == "mrt_station"
    )
    bus = next(
        feature for feature in collection["features"] if feature["properties"]["kind"] == "bus_stop"
    )
    assert mrt["properties"]["name"] == "MAYFLOWER MRT STATION Exit 5"
    assert mrt["properties"]["system"] == "MRT"
    assert mrt["properties"]["station_codes"] == "TE6"
    assert mrt["properties"]["lines"] == "Thomson-East Coast Line"
    assert station["properties"]["label"] == "MAYFLOWER"
    assert station["properties"]["exit_count"] == 1
    assert station["properties"]["station_codes"] == "TE6"
    assert station["properties"]["lines"] == "Thomson-East Coast Line"
    assert bus["properties"]["code"] == "55089"
    assert bus["properties"]["services"] == "262"
    assert bus["properties"]["service_count"] == 1
    assert bus["properties"]["weekday_first_bus"] == "05:30"
    assert bus["properties"]["weekday_last_bus"] == "00:45"
    assert bus["properties"]["am_peak_best_min"] == 7
    assert bus["properties"]["pm_peak_best_min"] == 8


def test_refresh_transit_manifest_updates_only_transit_block(tmp_path: Path):
    write_json(
        tmp_path / "manifest.json",
        {
            "data_as_of": "2026-08-01T00:00:00+00:00",
            "transit": {"source_hashes": {"old": "hash"}},
        },
    )

    updated = refresh_transit_manifest(
        tmp_path,
        {
            "path": "transit/pois.json",
            "feature_count": 3,
            "counts": {"bus_stop": 1, "mrt_exit": 1, "mrt_station": 1},
            "source_hashes": {"train_station_codes": "a" * 64},
        },
    )

    manifest = json.loads((tmp_path / "manifest.json").read_text(encoding="utf-8"))
    assert updated is True
    assert manifest["data_as_of"] == "2026-08-01T00:00:00+00:00"
    assert manifest["transit"]["source_hashes"] == {"train_station_codes": "a" * 64}
    assert manifest["transit"]["refreshed_at"]


def test_refresh_score_provenance_manifest_updates_from_score_shards(tmp_path: Path):
    export_static_artifacts([sample_record("123456"), sample_record("654321")], output_dir=tmp_path)
    manifest_path = tmp_path / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["provenance"].pop("source_hashes", None)
    manifest["provenance"].pop("subscore_status", None)
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")

    report = refresh_score_provenance_manifest(tmp_path)

    refreshed = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert report["ok"] is True
    assert report["manifest_updated"] is True
    assert report["record_count"] == 2
    assert report["source_hash_count"] == 1
    assert report["scoring_fingerprint_count"] == 5
    assert refreshed["provenance"]["source_hashes"]["osm_extract"] == "a" * 64
    assert refreshed["provenance"]["scoring_fingerprints"]["pipeline\\scoring.py"] == "e" * 64
    assert refreshed["provenance"]["scoring_fingerprint_digest_counts"]
    assert refreshed["provenance"]["records_missing_scoring_fingerprint_digest"] == 0
    assert refreshed["provenance"]["network_digest_counts"]
    assert refreshed["provenance"]["records_missing_network_digest"] == 0
    assert report["network_digest_count"] == 1
    assert (
        refreshed["provenance"]["subscore_status"]["heat"]
        == "provisional_covered_plus_nparks_shade_proxy_heat_only"
    )
    assert refreshed["provenance"]["score_provenance_refreshed_at"]


def test_refresh_score_provenance_manifest_does_not_invent_scoring_fingerprints(
    tmp_path: Path,
):
    write_json(tmp_path / "manifest.json", {"provenance": {"record_count": 1}})
    write_json(tmp_path / "scores" / "index.json", {"TEST_AREA": ["123456"]})
    write_json(
        tmp_path / "scores" / "TEST_AREA.json",
        [
            {
                "postal": "123456",
                "state": "SCORED",
                "provenance": {
                    "source_hashes": {"osm_extract": "a" * 64},
                    "subscore_status": {
                        "access": "real_routed_shortest_distance",
                        "bus": "real_static_datamall_connectivity",
                        "rain": "real_routed_covered_length_ratio",
                        "heat": "provisional_covered_plus_nparks_shade_proxy_heat_only",
                        "crossing": "real_traffic_signals_with_grade_separated_exemption",
                    },
                },
            }
        ],
    )

    report = refresh_score_provenance_manifest(tmp_path)

    refreshed = json.loads((tmp_path / "manifest.json").read_text(encoding="utf-8"))
    assert report["scoring_fingerprint_count"] == 0
    assert refreshed["provenance"]["scoring_fingerprints"] == {}


def test_export_reports_mixed_scoring_fingerprint_digests(tmp_path: Path):
    records = [sample_record("123456"), sample_record("654321")]
    records_dir = tmp_path / "score_batch"
    write_json(
        records_dir / "batch_manifest.json",
        {
            "scoring_fingerprints_by_digest": {
                "a" * 24: {"pipeline\\bus.py": "a" * 64},
                "b" * 24: {"pipeline\\bus.py": "b" * 64},
            },
            "scoring_inputs_by_digest": {
                "i"
                * 24: {
                    "scoring_input_algorithm": "sha256-json-sort-keys-24hex",
                    "inputs": [
                        {
                            "path": "processed\\postal_universe_part01.parquet",
                            "sha256": "1" * 64,
                            "row_count": 1,
                        }
                    ],
                    "total_rows": 1,
                },
                "j"
                * 24: {
                    "scoring_input_algorithm": "sha256-json-sort-keys-24hex",
                    "inputs": [
                        {
                            "path": "processed\\postal_universe_part02.parquet",
                            "sha256": "2" * 64,
                            "row_count": 1,
                        }
                    ],
                    "total_rows": 1,
                },
            },
            "networks_by_digest": {
                "m"
                * 24: {
                    "network_algorithm": "sha256-json-sort-keys-24hex",
                    "networks": [
                        {
                            "path": "processed\\network_a.parquet",
                            "sha256": "3" * 64,
                            "row_count": 10,
                        }
                    ],
                    "total_rows": 10,
                },
                "n"
                * 24: {
                    "network_algorithm": "sha256-json-sort-keys-24hex",
                    "networks": [
                        {
                            "path": "processed\\network_b.parquet",
                            "sha256": "4" * 64,
                            "row_count": 10,
                        }
                    ],
                    "total_rows": 10,
                },
            },
        },
    )
    records[0]["provenance"] = {
        "scoring_fingerprint_digest": "a" * 24,
        "scoring_input_digest": "i" * 24,
        "network_digest": "m" * 24,
        "source_hashes": {"osm_extract": "a" * 64},
        "subscore_status": records[0]["provenance"]["subscore_status"],
    }
    records[1]["provenance"] = {
        "scoring_fingerprint_digest": "b" * 24,
        "scoring_input_digest": "j" * 24,
        "network_digest": "n" * 24,
        "source_hashes": {"osm_extract": "a" * 64},
        "subscore_status": records[1]["provenance"]["subscore_status"],
    }

    export_static_artifacts(records, output_dir=tmp_path, records_dir=records_dir)

    manifest = json.loads((tmp_path / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["provenance"]["scoring_fingerprint_digest_counts"] == {
        "a" * 24: 1,
        "b" * 24: 1,
    }
    assert manifest["provenance"]["scoring_fingerprints_by_digest"]["a" * 24] == {
        "pipeline\\bus.py": "a" * 64
    }
    assert manifest["provenance"]["scoring_fingerprint_digests_missing_maps"] == []
    assert manifest["provenance"]["scoring_fingerprint_provenance_complete"] is True
    assert manifest["provenance"]["mixed_scoring_fingerprint_digests"] is True
    assert manifest["provenance"]["scoring_input_digest_counts"] == {
        "i" * 24: 1,
        "j" * 24: 1,
    }
    assert manifest["provenance"]["scoring_inputs_by_digest"]["i" * 24]["inputs"] == [
        {
            "path": "processed\\postal_universe_part01.parquet",
            "sha256": "1" * 64,
            "row_count": 1,
        }
    ]
    assert manifest["provenance"]["scoring_input_digests_missing_maps"] == []
    assert manifest["provenance"]["scoring_input_provenance_complete"] is True
    assert manifest["provenance"]["mixed_scoring_input_digests"] is True
    assert manifest["provenance"]["network_digest_counts"] == {
        "m" * 24: 1,
        "n" * 24: 1,
    }
    assert manifest["provenance"]["networks_by_digest"]["m" * 24]["networks"] == [
        {
            "path": "processed\\network_a.parquet",
            "sha256": "3" * 64,
            "row_count": 10,
        }
    ]
    assert manifest["provenance"]["network_digests_missing_maps"] == []
    assert manifest["provenance"]["network_provenance_complete"] is True
    assert manifest["provenance"]["mixed_network_digests"] is True


def test_export_names_record_start_and_export_scoring_fingerprint_digests(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
):
    records = [sample_record("123456")]
    old_digest = "a" * 24
    new_digest = "b" * 24
    old_fingerprints = {"pipeline\\bus.py": "a" * 64}
    new_fingerprints = {"pipeline\\bus.py": "b" * 64}
    records[0]["provenance"] = {
        "scoring_fingerprint_digest": old_digest,
        "source_hashes": {"osm_extract": "a" * 64},
        "subscore_status": records[0]["provenance"]["subscore_status"],
    }
    records_dir = tmp_path / "score_batch"
    write_json(
        records_dir / "batch_manifest.json",
        {
            "scoring_provenance_at_start": {
                "scoring_fingerprint_digest": new_digest,
                "scoring_fingerprints": new_fingerprints,
            },
            "scoring_fingerprints_by_digest": {
                old_digest: old_fingerprints,
                new_digest: new_fingerprints,
            },
        },
    )
    monkeypatch.setattr(
        "pipeline.export.scoring_provenance_snapshot",
        lambda: {
            "scoring_fingerprint_digest": new_digest,
            "scoring_fingerprints": new_fingerprints,
            "git": {},
        },
    )

    export_static_artifacts(records, output_dir=tmp_path, records_dir=records_dir)

    provenance = json.loads((tmp_path / "manifest.json").read_text(encoding="utf-8"))[
        "provenance"
    ]
    assert provenance["record_scoring_fingerprint_digest"] == old_digest
    assert provenance["score_batch_start_scoring_fingerprint_digest"] == new_digest
    assert provenance["export_scoring_fingerprint_digest"] == new_digest
    assert provenance["scoring_fingerprint_digest"] == new_digest
    assert provenance["scoring_fingerprint_digest_counts"] == {old_digest: 1}
    assert provenance["scoring_fingerprint_changed_during_run"] is True
    assert provenance["mixed_scoring_fingerprint_digests"] is False


def test_export_fails_when_scoring_fingerprint_digest_is_unresolved(tmp_path: Path):
    records = [sample_record("123456")]
    records[0]["provenance"] = {
        "scoring_fingerprint_digest": "a" * 24,
        "source_hashes": {"osm_extract": "a" * 64},
        "subscore_status": records[0]["provenance"]["subscore_status"],
    }

    with pytest.raises(ValueError, match="unresolved scoring fingerprint digest maps"):
        export_static_artifacts(records, output_dir=tmp_path, records_dir=tmp_path / "score_batch")


def test_export_fails_when_scoring_input_digest_is_unresolved(tmp_path: Path):
    records = [sample_record("123456")]
    records[0]["provenance"]["scoring_input_digest"] = "i" * 24

    with pytest.raises(ValueError, match="unresolved scoring input digest maps"):
        export_static_artifacts(records, output_dir=tmp_path, records_dir=tmp_path / "score_batch")


def test_export_fails_when_network_digest_is_unresolved(tmp_path: Path):
    records = [sample_record("123456")]
    records[0]["provenance"].pop("network", None)
    records[0]["provenance"]["network_digest"] = "n" * 24

    with pytest.raises(ValueError, match="unresolved network digest maps"):
        export_static_artifacts(records, output_dir=tmp_path, records_dir=tmp_path / "score_batch")


def test_export_resolves_scoring_input_digest_from_explicit_provenance(tmp_path: Path):
    records = [sample_record("123456")]
    records[0]["provenance"]["scoring_input_digest"] = "i" * 24
    input_provenance = {
        "scoring_input_algorithm": "sha256-json-sort-keys-24hex",
        "scoring_input_digest": "i" * 24,
        "inputs": [
            {
                "path": "processed\\postal_universe.parquet",
                "sha256": "1" * 64,
                "row_count": 1,
            }
        ],
        "total_rows": 1,
    }

    export_static_artifacts(
        records,
        output_dir=tmp_path,
        scoring_input_provenance=input_provenance,
    )

    manifest = json.loads((tmp_path / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["provenance"]["scoring_inputs_by_digest"]["i" * 24]["inputs"] == [
        {
            "path": "processed\\postal_universe.parquet",
            "sha256": "1" * 64,
            "row_count": 1,
        }
    ]
    assert manifest["provenance"]["scoring_input_provenance_complete"] is True


def test_export_resolves_network_digest_from_explicit_provenance(tmp_path: Path):
    records = [sample_record("123456")]
    records[0]["provenance"].pop("network", None)
    records[0]["provenance"]["network_digest"] = "n" * 24
    network_provenance = {
        "network_algorithm": "sha256-json-sort-keys-24hex",
        "network_digest": "n" * 24,
        "networks": [
            {
                "path": "processed\\network_island.parquet",
                "sha256": "1" * 64,
                "row_count": 10,
            }
        ],
        "total_rows": 10,
    }

    export_static_artifacts(
        records,
        output_dir=tmp_path,
        network_provenance=network_provenance,
    )

    manifest = json.loads((tmp_path / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["provenance"]["networks_by_digest"]["n" * 24]["networks"] == [
        {
            "path": "processed\\network_island.parquet",
            "sha256": "1" * 64,
            "row_count": 10,
        }
    ]
    assert manifest["provenance"]["network_provenance_complete"] is True


def test_export_splits_large_score_files(tmp_path: Path):
    records = [unscored_record(f"1000{i:02d}") for i in range(40)]

    report = export_static_artifacts(records, output_dir=tmp_path, score_shard_max_bytes=1200)
    ok, validation = validate_static_artifacts(tmp_path)

    assert report["score_area_count"] == 1
    assert report["score_shard_count"] > 1
    assert ok, validation
    for path in (tmp_path / "scores").glob("LARGE_AREA_PART_*.json"):
        assert path.stat().st_size <= 1200


def test_export_merges_promoted_geom_shards_with_duplicate_child_id(tmp_path: Path, monkeypatch):
    # Under the drift-consistent grouping introduced with the picker-fix
    # release, records are first placed into a max-resolution cell and rolled
    # up via cell_to_parent, so two records with the same "shared-child"
    # deep cell always end up in the same res-8 parent — no cross-parent
    # merging is possible any more. This test now verifies the payoff: even
    # when the outer lat/lon grouping would have split records across res-8
    # parents (as the fake mock does at resolution 8), the records still land
    # in one shard lineage rooted at the max-resolution cell's true ancestor.
    parent_map = {
        "shared-child": "shared-parent",
        "shared-parent": "shared-parent",
    }

    def fake_latlng_to_cell(lat: float, _lon: float, resolution: int) -> str:
        if resolution == 8:
            return "parent-a" if lat < 1.31 else "parent-b"
        return "shared-child"

    def fake_cell_to_parent(cell: str, resolution: int) -> str:
        return parent_map.get(cell, cell)

    monkeypatch.setattr("pipeline.export.h3.latlng_to_cell", fake_latlng_to_cell)
    monkeypatch.setattr("pipeline.export.h3.cell_to_parent", fake_cell_to_parent)
    records = [
        sample_record("123456"),
        sample_record("123457"),
        sample_record("654321"),
        sample_record("654322"),
    ]
    records[0]["_origin"]["lat"] = 1.30
    records[1]["_origin"]["lat"] = 1.3001
    records[2]["_origin"]["lat"] = 1.32
    records[3]["_origin"]["lat"] = 1.3201
    threshold = json_size([geom_record(records[0])]) + 100

    report = export_static_artifacts(
        records,
        output_dir=tmp_path,
        geom_promotion_threshold_bytes=threshold,
    )
    ok, validation = validate_static_artifacts(tmp_path)

    assert ok, validation
    # All four records share the same max-resolution cell "shared-child" and
    # therefore climb to the same res-8 ancestor "shared-parent" under
    # cell_to_parent — regardless of what the outer res-8 lat/lon grouping
    # returned. At the max promotion resolution, sized_record_shards splits by
    # record count because the threshold only fits one record per shard.
    assert report["geom_shard_count"] == 4
    geom_records = []
    for path in sorted((tmp_path / "geom" / "h3").glob("shared-parent_PART_*.json")):
        geom_records.extend(json.loads(path.read_text()))
    assert sorted(record["postal"] for record in geom_records) == [
        "123456",
        "123457",
        "654321",
        "654322",
    ]


def test_export_recursively_promotes_large_geom_shards(tmp_path: Path, monkeypatch):
    ancestor_chain = ["deep-a", "still-too-large", "parent-cell"]
    ancestor_chain_b = ["deep-b", "still-too-large", "parent-cell"]

    def resolve_ancestor(cell: str, resolution: int) -> str:
        # chain positions: 0->res10, 1->res9, 2->res8
        target_pos = 10 - resolution
        if cell in ancestor_chain:
            return ancestor_chain[target_pos]
        if cell in ancestor_chain_b:
            return ancestor_chain_b[target_pos]
        return cell

    def fake_latlng_to_cell(lat: float, _lon: float, resolution: int) -> str:
        if resolution == 8:
            return "parent-cell"
        if resolution == 9:
            return "still-too-large"
        return "deep-a" if lat < 1.31 else "deep-b"

    monkeypatch.setattr("pipeline.export.h3.latlng_to_cell", fake_latlng_to_cell)
    monkeypatch.setattr("pipeline.export.h3.cell_to_parent", resolve_ancestor)
    records = [sample_record("123456"), sample_record("654321")]
    records[0]["_origin"]["lat"] = 1.30
    records[1]["_origin"]["lat"] = 1.32
    threshold = json_size([geom_record(records[0])]) + 100

    report = export_static_artifacts(
        records,
        output_dir=tmp_path,
        geom_promotion_threshold_bytes=threshold,
        geom_max_promotion_resolution=10,
    )
    ok, validation = validate_static_artifacts(tmp_path)

    assert ok, validation
    assert report["geom_shard_count"] == 2
    geom_index = json.loads((tmp_path / "geom" / "index.json").read_text())
    assert geom_index["parent-cell"] == ["deep-a", "deep-b"]


def test_load_score_batch_records_reads_chunks_in_order_and_rejects_duplicates(tmp_path: Path):
    records_dir = tmp_path / "batch"
    chunks_dir = records_dir / "chunks"
    write_json(
        chunks_dir / "chunk_00002_654321_654321.json",
        [json_safe_score_record(sample_record("654321"))],
    )
    write_json(
        chunks_dir / "chunk_00001_123456_123456.json",
        [json_safe_score_record(sample_record("123456"))],
    )

    records = load_score_batch_records(records_dir)

    assert [record["postal"] for record in records] == ["123456", "654321"]

    write_json(
        chunks_dir / "chunk_00003_123456_123456.json",
        [json_safe_score_record(sample_record("123456"))],
    )
    try:
        load_score_batch_records(records_dir)
    except ValueError as exc:
        assert str(exc) == "duplicate postal across score batch chunks: 123456"
    else:
        raise AssertionError("duplicate postal was accepted")


def test_load_score_batch_records_requires_chunks_directory(tmp_path: Path):
    try:
        load_score_batch_records(tmp_path / "missing")
    except FileNotFoundError as exc:
        assert "score batch chunks directory not found" in str(exc)
    else:
        raise AssertionError("missing chunks directory was accepted")


def test_validate_rejects_missing_required_artifacts(tmp_path: Path):
    ok, report = validate_static_artifacts(tmp_path)

    assert not ok
    assert "missing required file: manifest.json" in report["errors"]


def test_validate_export_batch_args_blocks_full_batch_without_checkpoint_confirmation():
    errors = validate_export_batch_args(
        full_batch=True,
        confirm_full_batch=False,
        postal_universe_path=Path("processed/postal_universe_official_current.parquet"),
    )

    assert errors == [
        "full export batch requires --confirm-full-batch after checkpoint approval",
    ]


def test_validate_export_batch_args_requires_postal_universe_for_full_batch():
    errors = validate_export_batch_args(
        full_batch=True,
        confirm_full_batch=True,
        postal_universe_path=None,
    )

    assert errors == ["--full-batch requires --postal-universe"]


def test_validate_export_batch_args_accepts_non_batch_default():
    errors = validate_export_batch_args(
        full_batch=False,
        confirm_full_batch=False,
        postal_universe_path=None,
    )

    assert errors == []


def test_validate_live_score_export_args_blocks_unconfirmed_live_export():
    errors = validate_live_score_export_args(
        records_dir=None,
        full_batch=False,
        confirm_live_score_export=False,
    )

    assert errors == [
        "live score export requires --confirm-live-score-export after owner approval; "
        "use --records-dir for pre-scored re-export"
    ]


def test_validate_live_score_export_args_allows_records_dir_without_live_confirmation():
    errors = validate_live_score_export_args(
        records_dir=Path("processed/score_batches/run/chunks"),
        full_batch=False,
        confirm_live_score_export=False,
    )

    assert errors == []


def test_export_cli_requires_explicit_output_before_loading_records(tmp_path: Path, capsys):
    missing_records_dir = tmp_path / "missing_records"

    assert export_main(["export", "--records-dir", str(missing_records_dir)]) == 1

    out = capsys.readouterr().out
    report = json.loads(out)
    assert report == {
        "errors": ["export requires explicit --output; choose a new bundle directory"],
        "ok": False,
    }


def test_export_cli_requires_live_score_confirmation_before_scoring(
    tmp_path: Path, monkeypatch, capsys
):
    def fail_score_postals(**_kwargs):
        raise AssertionError("live export must not score before confirmation")

    output_dir = tmp_path / "generated_20260822"
    monkeypatch.setattr("pipeline.export.score_postals", fail_score_postals)

    assert export_main(["export", "--output", str(output_dir)]) == 1

    out = capsys.readouterr().out
    report = json.loads(out)
    assert report == {
        "errors": [
            "live score export requires --confirm-live-score-export after owner approval; "
            "use --records-dir for pre-scored re-export"
        ],
        "ok": False,
    }
    assert not output_dir.exists()


def test_export_cli_confirmed_live_score_reaches_scoring(tmp_path: Path, monkeypatch, capsys):
    calls = []
    output_dir = tmp_path / "generated_20260822"

    def fake_score_postals(**kwargs):
        calls.append(kwargs)
        return [{"postal": "560234", "state": "SCORED", "total": 99.0}]

    def fake_export_static_artifacts(
        records,
        *,
        output_dir,
        records_dir,
        scoring_input_provenance,
        network_provenance,
    ):
        return {
            "ok": True,
            "records": len(records),
            "output_dir": str(output_dir),
            "records_dir": records_dir,
            "scoring_input_digest": scoring_input_provenance["scoring_input_digest"],
            "network_digest": network_provenance["network_digest"],
        }

    monkeypatch.setattr("pipeline.export.score_postals", fake_score_postals)
    monkeypatch.setattr(
        "pipeline.export.scoring_input_snapshot",
        lambda _path: {"scoring_input_digest": "input-digest"},
    )
    monkeypatch.setattr(
        "pipeline.export.network_snapshot",
        lambda _path: {"network_digest": "network-digest"},
    )
    monkeypatch.setattr("pipeline.export.export_static_artifacts", fake_export_static_artifacts)

    assert (
        export_main(
            [
                "export",
                "--output",
                str(output_dir),
                CONFIRM_LIVE_SCORE_EXPORT_FLAG,
                "--postal",
                "560234",
            ]
        )
        == 0
    )

    out = capsys.readouterr().out
    report = json.loads(out)
    assert report == {
        "network_digest": "network-digest",
        "ok": True,
        "output_dir": str(output_dir),
        "records": 1,
        "records_dir": None,
        "scoring_input_digest": "input-digest",
    }
    assert calls == [
        {
            "postal_codes": ["560234"],
            "limit": 5,
            "include_geometry": True,
            "network_path": Path("C:/sgSHIOK2026/processed/network_island.parquet"),
            "postal_universe_path": None,
        }
    ]


def test_export_cli_refuses_non_empty_output_before_loading_records(
    tmp_path: Path, capsys
):
    output_dir = tmp_path / "generated_20260822"
    output_dir.mkdir()
    (output_dir / "manifest.json").write_text("{}", encoding="utf-8")
    missing_records_dir = tmp_path / "missing_records"

    assert (
        export_main(
            [
                "export",
                "--output",
                str(output_dir),
                "--records-dir",
                str(missing_records_dir),
            ]
        )
        == 1
    )

    out = capsys.readouterr().out
    report = json.loads(out)
    assert report == {
        "errors": [
            f"export output directory is not empty; choose a new timestamped bundle directory: {output_dir}"
        ],
        "ok": False,
    }


def test_export_transit_cli_requires_explicit_output(capsys):
    assert export_main(["export-transit"]) == 1

    out = capsys.readouterr().out
    report = json.loads(out)
    assert report == {
        "errors": [
            "export-transit requires explicit --output; choose a new bundle directory"
        ],
        "ok": False,
    }


def test_refresh_provenance_cli_requires_explicit_output(capsys):
    assert export_main(["refresh-provenance"]) == 1

    out = capsys.readouterr().out
    report = json.loads(out)
    assert report == {
        "errors": [
            "refresh-provenance requires explicit --output; in-place manifest mutation must name its bundle directory"
        ],
        "ok": False,
    }
