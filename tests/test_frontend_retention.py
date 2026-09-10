"""Literal frontend archives only; no build, export, input repair or network."""

import hashlib
import json
from pathlib import Path

import pytest

from scripts import release_staging as staging
from tests.test_release_staging import (
    git, prepare, put, repository, snapshot, template_repository,
)


def archive(root, name="a", files=None, build_id=None):
    directory = root / "tmp" / "frontend-fixtures" / name
    files = files or {"_next/static/chunks/old-map.js": b"old map bytes",
                      "maplibre/6.1.0/worker.js": b"old worker bytes"}
    entries = []
    for path, content in files.items():
        put(directory, "assets/" + path, content)
        entries.append({"path": path, "bytes": len(content), "sha256": hashlib.sha256(content).hexdigest()})
    manifest = {"schemaVersion": 1, "buildId": build_id or "build-" + name, "files": entries}
    content = (json.dumps(manifest, sort_keys=True) + "\n").encode()
    put(directory, "frontend-assets.json", content)
    return directory, hashlib.sha256(content).hexdigest()


def selected_prepare(repository, selected):
    return prepare(staging, repository, previous_frontends=selected)


def test_retains_verified_archives_without_changing_source_or_data(repository):
    root, _, _ = repository
    selected = archive(root)
    before = snapshot(root / "web")
    result = selected_prepare(repository, [selected])
    stage = Path(result["stageRoot"])
    assert (stage / "web/public/_retained/_next/static/chunks/old-map.js").read_bytes() == b"old map bytes"
    assert (stage / "web/public/_retained/maplibre/6.1.0/worker.js").read_bytes() == b"old worker bytes"
    assert snapshot(root / "web") == before
    assert result["previousFrontends"][0]["manifestSha256"] == selected[1]
    assert result["previousFrontends"][0]["buildId"] == "build-a"
    policy = json.loads((stage / "web/frontend-retention.json").read_bytes())
    assert policy["buildIds"] == ["build-a"]
    assert policy["totalBytes"] == len(b"old map bytes") + len(b"old worker bytes")
    assert {entry["path"] for entry in policy["files"]} == {"_next/static/chunks/old-map.js", "maplibre/6.1.0/worker.js"}
    assert staging.verify_release_stage(root, stage, expected_manifest_sha256=result["releaseManifestSha256"])["status"] == "verified_not_deployed"


def test_deduplicates_identical_shared_urls_across_two_explicit_builds(repository):
    root, _, _ = repository
    first, second = archive(root, "a"), archive(root, "b")
    result = selected_prepare(repository, [first, second])
    policy = json.loads((Path(result["webRoot"]) / "frontend-retention.json").read_bytes())
    assert policy["buildIds"] == ["build-a", "build-b"]
    assert len(policy["files"]) == 2


def test_same_url_different_bytes_is_a_block_not_last_write_wins(repository):
    root, _, _ = repository
    a = archive(root, "a", {"_next/static/chunks/shared.js": b"a"})
    b = archive(root, "b", {"_next/static/chunks/shared.js": b"b"})
    with pytest.raises(staging.ReleaseStagingError, match="FRONTEND_ASSET_CONFLICT"):
        selected_prepare(repository, [a, b])
    assert not (root / "tmp/stage").exists()


@pytest.mark.parametrize("kind", ["hash", "payload", "unlisted", "missing", "duplicate-build", "case-collision", "too-many", "too-large"])
def test_invalid_retention_stops_before_stage_creation(repository, monkeypatch, kind):
    root, _, _ = repository
    path, pin = archive(root)
    selected = [(path, pin)]
    expected = {"hash": "FRONTEND_MANIFEST_HASH_MISMATCH", "payload": "INPUT_CHANGED",
                "unlisted": "FRONTEND_INVENTORY_MISMATCH", "missing": "FRONTEND_INVENTORY_MISMATCH",
                "duplicate-build": "FRONTEND_BUILD_DUPLICATE", "case-collision": "FRONTEND_ASSET_CONFLICT",
                "too-many": "FRONTEND_GENERATION_LIMIT", "too-large": "FRONTEND_TOTAL_SIZE_LIMIT"}[kind]
    if kind == "hash": selected = [(path, "0" * 64)]
    if kind == "payload": put(path, "assets/_next/static/chunks/old-map.js", b"changed")
    if kind == "unlisted": put(path, "assets/_next/static/chunks/extra.js", b"extra")
    if kind == "missing": (path / "assets/_next/static/chunks/old-map.js").unlink()
    if kind == "duplicate-build": selected.append(archive(root, "b", build_id="build-a"))
    if kind == "case-collision": selected.append(archive(root, "b", {"_next/static/chunks/OLD-MAP.js": b"old map bytes"}))
    if kind == "too-many": selected.extend([archive(root, "b"), archive(root, "c")])
    if kind == "too-large": monkeypatch.setattr(staging, "MAX_FRONTEND_BYTES", 1)
    with pytest.raises(staging.ReleaseStagingError, match=expected):
        selected_prepare(repository, selected)
    assert not (root / "tmp/stage").exists()


@pytest.mark.parametrize("path", ["../private.js", "_next/static/chunks/../private.js", "_next/static/private.html",
                                  "_next/static/private.js.map", "api/private.js", "data/private.js",
                                  "maplibre/latest/worker.js", "_next/static/chunks/a%2fb.js"])
def test_archive_metadata_cannot_escape_or_publish_unapproved_file_types(repository, path):
    root, _, _ = repository
    directory, _ = archive(root)
    content = json.dumps({"schemaVersion": 1, "buildId": "build-a", "files": [{"path": path, "bytes": 1, "sha256": "0" * 64}]}).encode()
    put(directory, "frontend-assets.json", content)
    with pytest.raises(staging.ReleaseStagingError, match="UNSAFE_PATH|UNSAFE_FRONTEND_ASSET"):
        selected_prepare(repository, [(directory, hashlib.sha256(content).hexdigest())])
    assert not (root / "tmp/stage").exists()


def test_changed_archive_after_prepare_is_caught_by_pinned_stage_verification(repository):
    root, _, _ = repository
    selected = archive(root)
    result = selected_prepare(repository, [selected])
    put(selected[0], "assets/_next/static/chunks/old-map.js", b"mutated")
    with pytest.raises(staging.ReleaseStagingError, match="INPUT_CHANGED"):
        staging.verify_release_stage(root, Path(result["stageRoot"]), expected_manifest_sha256=result["releaseManifestSha256"])


def test_same_version_current_public_worker_cannot_differ(repository):
    root, _, _ = repository
    put(root, "web/public/maplibre/6.1.0/worker.js", b"new conflicting bytes")
    git(root, "add", "web")
    git(root, "commit", "-qm", "test: conflicting worker")
    with pytest.raises(staging.ReleaseStagingError, match="FRONTEND_ASSET_CONFLICT"):
        selected_prepare(repository, [archive(root)])


def test_retention_namespace_cannot_be_populated_by_tracked_source(repository):
    root, _, _ = repository
    put(root, "web/public/_retained/private.js", b"not an archive")
    git(root, "add", "web")
    git(root, "commit", "-qm", "test: reserved namespace")
    with pytest.raises(staging.ReleaseStagingError, match="RESERVED_RETENTION_SOURCE"):
        selected_prepare(repository, [archive(root)])


def compiled_fixture(root):
    source = root / "tmp/compiled/web"
    put(source, ".next/BUILD_ID", b"reviewed-build-a\n")
    put(source, ".next/static/chunks/map.mjs", b"old map")
    put(source, ".next/static/chunks/map.js.map", b"private source map")
    put(source, "public/maplibre/6.1.0/maplibre-gl-shared.mjs", b"old library")
    put(source, "public/maplibre/6.1.0/maplibre-gl-worker.mjs", b"old worker")
    put(source, "public/maplibre/6.1.0/LICENSE.txt", b"license")
    put(source, "public/data/never-read/private.json", b"protected stand-in")
    put(source, ".next/server/private.js", b"server code not a browser runtime")
    return source


def test_capture_is_bounded_runtime_copy_not_data_or_server_export(repository):
    root, _, _ = repository
    source = compiled_fixture(root)
    before = snapshot(source)
    result = staging.capture_frontend_archive(root, source, root / "tmp/captured",
        expected_build_id="reviewed-build-a", maplibre_versions=["6.1.0"])
    assert result["files"] == 4 and result["bytes"] == 7 + 11 + 10 + 7
    assert result["omittedSourceMaps"] == ["_next/static/chunks/map.js.map"]
    assert result["deploymentIdentityVerified"] is False
    assert snapshot(source) == before
    selected_prepare(repository, [(Path(result["archiveRoot"]), result["manifestSha256"])])


def test_capture_wrong_build_stops_before_creating_archive(repository):
    root, _, _ = repository
    source = compiled_fixture(root)
    with pytest.raises(staging.ReleaseStagingError, match="FRONTEND_BUILD_ID_MISMATCH"):
        staging.capture_frontend_archive(root, source, root / "tmp/captured",
            expected_build_id="different", maplibre_versions=["6.1.0"])
    assert not (root / "tmp/captured").exists()


def test_capture_never_overwrites_existing_destination(repository):
    root, _, _ = repository
    source = compiled_fixture(root)
    output = root / "tmp/captured"
    put(output, "sentinel", b"keep")
    with pytest.raises(staging.ReleaseStagingError, match="DESTINATION_EXISTS"):
        staging.capture_frontend_archive(root, source, output,
            expected_build_id="reviewed-build-a", maplibre_versions=["6.1.0"])
    assert snapshot(output) == {"sentinel": hashlib.sha256(b"keep").hexdigest()}
