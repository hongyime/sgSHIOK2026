from __future__ import annotations

import json
from pathlib import Path

import yaml

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SOURCES_CONFIG = PROJECT_ROOT / "pipeline" / "config" / "sources.yaml"
RAW_MANIFEST = PROJECT_ROOT / "raw" / "manifest.json"


def source_names_from_raw_manifest(path: Path) -> list[str]:
    if not path.exists():
        return []
    manifest = json.loads(path.read_text(encoding="utf-8"))
    sources = manifest.get("sources", {})
    return sorted(sources)


def main() -> None:
    sources = yaml.safe_load(SOURCES_CONFIG.read_text(encoding="utf-8"))
    raw_sources = source_names_from_raw_manifest(RAW_MANIFEST)
    rows = [
        (
            "postal coordinate universe",
            "processed/score_batches/full_rescore_20260804_205430/partitions/*.parquet",
            "path only in legacy published bundle; sha256,row_count,digest in P9+ manifests",
        ),
        (
            "routing network graph",
            "processed/network_island.parquet",
            "path only in legacy published bundle; sha256,row_count,digest in P10+ manifests",
        ),
        (
            "bus stops/services/routes",
            "sources.yaml datamall_bus_stops, datamall_bus_services, datamall_bus_routes",
            "identified through raw/manifest.json source hashes when present",
        ),
        (
            "covered linkways / shelter evidence",
            "sources.yaml lta_covered_linkway",
            "identified through raw/manifest.json source hashes when present",
        ),
        (
            "shade and greenery proxy layers",
            "sources.yaml nparks and greenery/shade sources",
            "scored shade/greenery inputs are identified through raw/manifest.json source hashes when present; leaf_area_index is a freshness-only non-score reference",
        ),
        (
            "crossing data",
            "traffic signal / overhead bridge / underpass sources and derived network attributes",
            "identified through raw/manifest.json source hashes when source is present; derived network now separately fingerprinted",
        ),
        (
            "scoring code and tunable config",
            "SCORING_FINGERPRINT_FILES",
            "sha256 map and digest in manifest; compact digest per record",
        ),
    ]

    print("sources_yaml_top_level_keys=" + json.dumps(sorted(sources), sort_keys=True))
    print("raw_manifest_source_count=" + str(len(raw_sources)))
    print("raw_manifest_sources=" + json.dumps(raw_sources, sort_keys=True))
    print("coverage_table=artifact | source | current_identification")
    for artifact, source, status in rows:
        print(f"{artifact} | {source} | {status}")


if __name__ == "__main__":
    main()
