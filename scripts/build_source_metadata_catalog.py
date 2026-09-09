"""Create a reviewable metadata-monitor catalog, never a pipeline input."""

from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
import hashlib
import json
from pathlib import Path
import re
import subprocess
from typing import Any

from scripts.source_metadata_http import publisher_instant


TEXTUAL_METADATA = {"pipeline/config/sources.yaml", "raw/manifest.json"}


def metadata_identity(path: str, committed: bytes, local: bytes) -> dict[str, Any]:
    """Compare these metadata representations only; never normalize a file or payload hash."""
    if path not in TEXTUAL_METADATA:
        raise ValueError("Path is not an allowlisted textual metadata anchor")
    try:
        committed.decode("utf8")
    except UnicodeError as error:
        raise ValueError("Invalid committed metadata encoding") from error
    if b"\r" in committed or b"\x00" in committed or committed.startswith(b"\xef\xbb\xbf"):
        raise ValueError("Invalid committed metadata: require UTF-8 LF text without BOM or NUL")
    expected, actual = hashlib.sha256(committed).hexdigest(), hashlib.sha256(local).hexdigest()
    if local.replace(b"\r\n", b"\n") != committed:
        raise RuntimeError("STOP_INPUT_MISMATCH tracked metadata: " + path + " expected=" + expected + " actual=" + actual)
    return {"committedSha256": expected, "localSha256": actual,
            "comparison": "identical" if committed == local else "lf_crlf_only",
            "committedBytes": len(committed), "localBytes": len(local)}


def make_catalog(config: dict[str, Any], manifest: dict[str, Any], anchors: dict[str, str],
                 now: str, *, git_anchors: dict[str, str] | None = None) -> dict[str, Any]:
    sources, defaults = config.get("sources"), config.get("freshness_defaults", {})
    recorded = manifest.get("sources")
    if not isinstance(sources, dict) or not isinstance(defaults, dict) or not isinstance(recorded, dict) or len(sources) > 64:
        raise ValueError("Invalid source configuration")
    catalog = []
    for key, source in sources.items():
        if not re.fullmatch(r"[a-z0-9_]+", key) or not isinstance(source, dict):
            raise ValueError("Invalid source declaration")
        policy = {**defaults.get(source.get("kind"), {}), **source.get("freshness", {})}
        manual = policy.get("mode") == "manual" or policy.get("expected_cadence") == "manual" or source.get("refresh") == "manual"
        adapter = "manual" if manual else {"datagov_polldownload": "datagov_metadata", "datamall_geospatial_listing": "datamall_listing"}.get(source.get("kind"), "unsupported")
        entry = recorded.get(key, {})
        if not isinstance(entry, dict):
            raise ValueError("Invalid recorded input metadata")
        raw_updated = entry.get("last_modified")
        updated = publisher_instant(raw_updated)
        if updated is None and isinstance(raw_updated, str):
            try:
                stamp = parsedate_to_datetime(raw_updated)
                updated = stamp.astimezone(UTC).isoformat() if stamp.tzinfo else None
            except (ValueError, TypeError, OverflowError):
                pass
        threshold = policy.get("stale_after_days")
        threshold = threshold if type(threshold) is int and threshold > 0 else None
        item = {"key": key, "name": str(source.get("name") or key), "mode": "manual" if manual else "automatic",
                "adapter": adapter, "staleAfterDays": threshold, "expectedCadence": policy.get("expected_cadence"),
                "baseline": {"publisherUpdatedAt": updated, "sha256": entry.get("sha256"), "present": key in recorded}}
        if adapter == "datagov_metadata":
            if not re.fullmatch(r"d_[a-z0-9]{1,128}", source.get("dataset_id", "")):
                raise ValueError("Invalid dataset ID")
            item["datasetId"] = source["dataset_id"]
        if adapter == "datamall_listing":
            if not re.fullmatch(r"[A-Za-z_]{1,100}", source.get("search_keyword", "")):
                raise ValueError("Invalid listing keyword")
            item["keyword"] = source["search_keyword"]
        catalog.append(item)
    return {"schemaVersion": 1, "generatedAt": now, "anchors": anchors,
            "gitAnchors": dict(anchors if git_anchors is None else git_anchors),
            "baselineMeaning": "Tracked raw input metadata, not proof of the deployed bundle or current physical conditions. fetched_at is never a publisher update date.",
            "sources": catalog}


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    if Path.cwd() != root or str(root) != r"C:\sgSHIOK2026":
        raise RuntimeError("Wrong working root")
    # Existing local dependency only; the monitor runtime itself needs stdlib only.
    import yaml
    from scripts.check_source_metadata import validate_catalog

    paths = ["pipeline/config/sources.yaml", "raw/manifest.json"]
    data, anchors, git_anchors, representations = {}, {}, {}, {}
    revision = subprocess.run(["git", "rev-parse", "HEAD"], cwd=root, check=True, capture_output=True).stdout.strip().decode("ascii")
    for path in paths:
        content = (root / path).read_bytes()
        committed = subprocess.run(["git", "show", revision + ":" + path], cwd=root, check=True, capture_output=True).stdout
        representations[path] = metadata_identity(path, committed, content)
        anchors[path] = representations[path]["localSha256"]
        git_anchors[path] = representations[path]["committedSha256"]
        data[path] = yaml.safe_load(content) if path.endswith(".yaml") else json.loads(content)
    output = root / "source-metadata-catalog.json"
    result = make_catalog(data[paths[0]], data[paths[1]], anchors, datetime.now(UTC).isoformat(), git_anchors=git_anchors)
    validate_catalog(result)
    for path, expected in anchors.items():
        actual = hashlib.sha256((root / path).read_bytes()).hexdigest()
        if actual != expected:
            raise RuntimeError("STOP_INPUT_MISMATCH tracked metadata: " + path + " expected=" + expected + " actual=" + actual)
    if subprocess.run(["git", "rev-parse", "HEAD"], cwd=root, check=True, capture_output=True).stdout.strip().decode("ascii") != revision:
        raise RuntimeError("STOP_GIT_REVISION_CHANGED during catalog creation")
    with output.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(result, stream, indent=2, ensure_ascii=True)
        stream.write("\n")
    print(json.dumps({"output": str(output), "sources": len(result["sources"]), "anchors": anchors,
                      "gitAnchors": git_anchors, "gitRevision": revision, "representations": representations,
                      "adapters": {name: sum(s["adapter"] == name for s in result["sources"]) for name in ["datagov_metadata", "datamall_listing", "manual", "unsupported"]}}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
