"""Explicit fixture maintenance only; read existing payloads, never download/build them."""
from __future__ import annotations

import gzip
import hashlib
import json
import subprocess
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
BUNDLE_POINTER = ROOT / "web/data-bundle.json"
BUNDLE = json.loads(BUNDLE_POINTER.read_text(encoding="utf-8"))["bundle"]
SOURCE = ROOT / "web/public/data" / BUNDLE
DESTINATION = ROOT / "web/lib/__tests__/fixtures"
sources: dict[str, dict[str, Any]] = {}


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_source(relative: str) -> Any:
    path = SOURCE / relative
    if not path.exists():
        path = Path(str(path) + ".gz")
    raw = path.read_bytes()
    decoded = gzip.decompress(raw) if path.suffix == ".gz" else raw
    sources[relative] = {
        "path": path.relative_to(ROOT).as_posix(),
        "bytes": len(raw),
        "sha256": digest(raw),
        "decodedSha256": digest(decoded),
    }
    return json.loads(decoded)


def pick(value: dict[str, Any], keys: list[str]) -> dict[str, Any]:
    return {key: value[key] for key in keys if key in value}


def reduced_score(record: dict[str, Any]) -> dict[str, Any]:
    result = pick(record, ["postal", "state", "total", "subscores", "best_node", "paths", "exposure_gaps", "data_as_of"])
    result["provenance"] = pick(record["provenance"], ["reason"])
    if record["postal"] == "018956":
        result["candidates"] = [candidate for candidate in record["candidates"] if candidate["node_id"] == "mrt:21678"]
        assert len(result["candidates"]) == 1
    return result


def reduced_geom(record: dict[str, Any]) -> dict[str, Any]:
    keys = ["shortest", "sheltered", "shortest_parts", "sheltered_parts", "exposure_gaps"]
    result = pick(record, ["postal", *keys])
    if record["postal"] == "018956":
        result["candidates"] = {"mrt:21678": pick(record["candidates"]["mrt:21678"], keys)}
    return result


def main() -> None:
    postals = {"018956", "018990", "079908", "560234"}
    fixture: dict[str, Any] = {}
    manifest = read_source("manifest.json")
    fixture["manifest.json"] = pick(manifest, ["generated_at", "data_as_of"])
    fixture["manifest.json"]["provenance"] = pick(manifest["provenance"], ["record_count", "state_counts"])
    index = read_source("scores/index.json")
    score_index = {shard: [postal for postal in rows if postal in postals] for shard, rows in index.items() if postals.intersection(rows)}
    fixture["scores/index.json"] = score_index
    assert {postal for rows in score_index.values() for postal in rows} == postals
    for shard, selected in score_index.items():
        fixture[f"scores/{shard}.json"] = [reduced_score(row) for row in read_source(f"scores/{shard}.json") if row["postal"] in selected]
    score_prefix = read_source("scores/prefix-index.json")
    fixture["scores/prefix-index.json"] = {
        prefix: [shard for shard in score_prefix[prefix] if any(postal.startswith(prefix) for postal in score_index.get(shard, []))]
        for prefix in sorted({postal[:3] for postal in postals})
    }
    geom_index = read_source("geom/postal-index.json")
    geom_postals = {"018956", "079908", "560234"}
    fixture["geom/postal-index.json"] = {postal: geom_index[postal] for postal in sorted(geom_postals) if postal in geom_index}
    assert "079908" not in geom_index
    for prefix in sorted({postal[:3] for postal in geom_postals}):
        path = f"geom/postal-prefix/{prefix}.json"
        fixture[path] = {postal: shard for postal, shard in read_source(path).items() if postal in geom_postals}
    for shard in sorted(set(fixture["geom/postal-index.json"].values())):
        path = f"geom/h3/{shard}.json"
        fixture[path] = [reduced_geom(row) for row in read_source(path) if row["postal"] in geom_postals]
    serialized = (json.dumps(fixture, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    provenance = {
        "bundle": BUNDLE,
        "sourceCheckoutCommit": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
        "bundlePointerSha256": digest(BUNDLE_POINTER.read_bytes()),
        "fixtureSha256": digest(serialized),
        "sources": sources,
        "reduction": [
            "Four actual score rows: 018956 live, 018990 partial, 079908 missing route, 560234 existing schema test.",
            "Score postal/state/total/subscores/best_node/paths/exposure_gaps/data_as_of retained verbatim; provenance retains only reason when present, otherwise an empty projected object.",
            "Only the 018956 mrt:21678 candidate is retained, with all of that candidate's original fields. Score route_options and all other candidates are omitted.",
            "Only 018956 and 560234 geometries retained. Keep encoded shortest/sheltered, multipart arrays and exposure gaps verbatim; omit route_segments and route_options. Keep the same fields for the sole mrt:21678 candidate.",
            "079908 has no geometry-index entry; its reduced 079 prefix is empty. No synthetic empty route is introduced.",
            "Score and geometry indexes are filtered to retained rows, including prefix membership. These samples do not validate the complete production index.",
            "Manifest retains generated_at/data_as_of and global record_count/state_counts. Global metadata counts are not sample cardinalities.",
            "The existing test deliberately clones a candidate and sets coverage=null; that one mutation is synthetic and does not alter the real fixture.",
        ],
    }
    # Detect any source identity change during extraction; source files are never opened for writes.
    for source in sources.values():
        assert digest((ROOT / source["path"]).read_bytes()) == source["sha256"]
    DESTINATION.mkdir(parents=True, exist_ok=True)
    (DESTINATION / "published-walks.json").write_bytes(serialized)
    (DESTINATION / "published-walks.provenance.json").write_bytes((json.dumps(provenance, indent=2) + "\n").encode("utf-8"))
    print(f"fixture_bytes={len(serialized)} sources={len(sources)} source_identity_unchanged=true")


if __name__ == "__main__":
    main()
