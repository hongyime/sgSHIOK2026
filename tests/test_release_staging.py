"""Synthetic Git/artifact fixtures only; no pipeline/export/build imports or calls."""

import gzip
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys


if __name__ == "__main__":
    import re
    import time

    root = Path("C:/sgSHIOK2026")
    if (Path.cwd() != root or len(sys.argv) not in (2, 3) or not re.fullmatch(r"a-[a-z0-9-]+", sys.argv[1])
            or (len(sys.argv) == 3 and not re.fullmatch(r"[a-zA-Z0-9_ ()]+", sys.argv[2]))):
        raise SystemExit("C root and a fresh a-* label required")
    output = root / "qa/revamp-r1/release-staging-20260910" / sys.argv[1]
    output.mkdir(parents=True, exist_ok=False)

    def identities():
        return {name: hashlib.sha256((root / name).read_bytes()).hexdigest() if (root / name).exists() else None
                for name in ("scripts/release_staging.py", "tests/test_release_staging.py")}

    before = identities()
    command = [str(root / ".venv/Scripts/python.exe"), "-B", "-m", "pytest", "-q",
               str(root / "tests/test_release_staging.py"), "--noconftest", "-p", "no:cacheprovider",
               "-o", "addopts=", "--basetemp", str(root / "tmp" / ("release-staging-" + sys.argv[1]))]
    if len(sys.argv) == 3:
        command.extend(["-k", sys.argv[2]])
    start = time.monotonic()
    timed_out = False
    try:
        run = subprocess.run(command, cwd=root, capture_output=True, text=True, timeout=240,
                             env=dict(os.environ, PYTEST_DISABLE_PLUGIN_AUTOLOAD="1", PYTHONDONTWRITEBYTECODE="1", PYTEST_ADDOPTS=""))
    except subprocess.TimeoutExpired as error:
        timed_out = True
        def decoded(value):
            return value.decode("utf-8", errors="replace") if isinstance(value, bytes) else value or ""
        run = subprocess.CompletedProcess(command, 124, decoded(error.stdout), decoded(error.stderr))
    after = identities()
    receipt = {"command": command, "before": before, "after": after, "stable": before == after,
               "exitCode": run.returncode, "timedOut": timed_out, "stdout": run.stdout, "stderr": run.stderr,
               "elapsedMs": (time.monotonic() - start) * 1000}
    (output / "checks.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(receipt))
    raise SystemExit(run.returncode if before == after else 1)


import pytest


@pytest.fixture
def staging():
    from scripts import release_staging
    return release_staging


def git(root, *args, input=None):
    return subprocess.run(["git", "-C", str(root), *args], input=input, capture_output=True, check=True,
                          env=dict(os.environ, GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL=os.devnull,
                                   GIT_AUTHOR_NAME="Fixture", GIT_AUTHOR_EMAIL="fixture@example.invalid",
                                   GIT_COMMITTER_NAME="Fixture", GIT_COMMITTER_EMAIL="fixture@example.invalid"),
                          timeout=30).stdout


def put(root, name, data):
    path = root / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return path


def put_json(root, name, value, compressed=True, plain=True):
    data = json.dumps(value, sort_keys=True).encode()
    if plain:
        put(root, name, data)
    if compressed:
        put(root, name + ".gz", gzip.compress(data, mtime=123456789))


@pytest.fixture(scope="module")
def template_repository(tmp_path_factory):
    root = tmp_path_factory.mktemp("template") / "repo"
    root.mkdir()
    git(root, "init", "-q")
    put(root, "web/app/page.tsx", b"export default function Page() { return null; }\n")
    put(root, "web/next.config.js", b"module.exports = {};\n")
    put(root, "web/next-env.d.ts", b'/// <reference types="next" />\nimport "./.next/dev/types/routes.d.ts";\nimport "./.next/dev/types/root-params.d.ts";\n')
    put_json(root, "web/tsconfig.json", {"compilerOptions": {"strict": True}}, compressed=False)
    put_json(root, "web/package.json", {"scripts": {"build": "node scripts/ensure-data-bundle.mjs && next build",
             "preinstall": "echo DO_NOT_RUN"}}, compressed=False)
    put_json(root, "web/package-lock.json", {"lockfileVersion": 3}, compressed=False)
    put_json(root, "web/vercel.json", {"git": {"deploymentEnabled": False}, "ignoreCommand": "DO_NOT_RUN",
             "buildCommand": "npm run build", "installCommand": "npm ci"}, compressed=False)
    put_json(root, "web/data-bundle.json", {"bundle": "generated_fixture", "generated_at": "2026-09-10T00:00:00Z",
             "data_as_of": None, "provenance": {"record_count": 1}}, compressed=False)
    put(root, "web/public/icon.svg", b"<svg/>\n")
    git(root, "add", "web")
    git(root, "commit", "-qm", "test: fixture source")
    data = root / "web/public/data/generated_fixture"
    overlay = root / "web/public/data/lamp_posts_v1"
    put_json(data, "manifest.json", {"generated_at": "2026-09-10T00:00:00Z", "data_as_of": None,
             "provenance": {"record_count": 1}, "scores": {"shards": ["AREA"]}})
    put_json(data, "scores/index.json", {"AREA": ["018956"]})
    put_json(data, "scores/prefix-index.json", {"018": ["AREA"]})
    put_json(data, "scores/AREA.json", [{"postal": "018956"}])
    put_json(data, "geom/index.json", {"cell-a": ["cell-a"]})
    put_json(data, "geom/postal-index.json", {"018956": "cell-a"})
    put_json(data, "geom/postal-prefix/018.json", {"018956": "cell-a"}, plain=False)
    put_json(data, "geom/h3/cell-a.json", [{"postal": "018956"}])
    put_json(data, "transit/pois.json", {"type": "FeatureCollection", "features": [{"type": "Feature"}]})
    put_json(data, "transit/h3/cell-a.json", {"type": "FeatureCollection", "features": []}, plain=False)
    put_json(overlay, "tiles/cell-a.json", {"cell": "cell-a", "points": [[103.8, 1.3]]}, compressed=False)
    tile_bytes = (overlay / "tiles/cell-a.json").stat().st_size
    put_json(overlay, "manifest.json", {"schema_version": 1, "generated_at": "2026-09-10T00:00:00Z",
             "tile_count": 1, "tiles": [{"cell": "cell-a", "path": "tiles/cell-a.json", "bytes": tile_bytes}]}, compressed=False)
    (root / "tmp").mkdir()
    return root


@pytest.fixture
def repository(tmp_path, template_repository):
    root = tmp_path / "repo"
    shutil.copytree(template_repository, root)
    return root, root / "web/public/data/generated_fixture", root / "web/public/data/lamp_posts_v1"


def prepare(staging, repository, **changes):
    root, data, overlay = repository
    return staging.prepare_release_stage(root, changes.pop("data_dir", data),
        stage_dir=changes.pop("stage_dir", root / "tmp/stage"),
        overlay_dir=changes.pop("overlay_dir", overlay), **changes)


def snapshot(root):
    return {str(path.relative_to(root)): hashlib.sha256(path.read_bytes()).hexdigest()
            for path in root.rglob("*") if path.is_file()}


def test_committed_source_only_both_artifacts_gzip_bytes_and_no_input_changes(staging, repository):
    root, data, overlay = repository
    source = git(root, "show", "HEAD:web/app/page.tsx")
    put(root, "web/app/page.tsx", b"dirty, never staged")
    for name in ["web/.env", "web/.env.production", "web/.vercel/project.json", "web/node_modules/private",
                 "web/.next/private", "web/untracked.ts", "web/public/data/unselected/manifest.json"]:
        put(root, name, b"PRIVATE")
    before = snapshot(root / "web")
    result = prepare(staging, repository)
    staged = Path(result["stageRoot"])
    assert (staged / "web/app/page.tsx").read_bytes() == source
    assert (staged / "web/public/data/generated_fixture/scores/AREA.json.gz").read_bytes() == (data / "scores/AREA.json.gz").read_bytes()
    assert not (staged / "web/public/data/generated_fixture/scores/AREA.json").exists()
    assert (staged / "web/public/data/lamp_posts_v1/tiles/cell-a.json").read_bytes() == (overlay / "tiles/cell-a.json").read_bytes()
    assert all(b"PRIVATE" not in path.read_bytes() for path in staged.rglob("*") if path.is_file())
    assert snapshot(root / "web") == before
    assert result["sourceRevision"] == git(root, "rev-parse", "HEAD").decode().strip()
    assert {artifact["role"] for artifact in result["artifacts"]} == {"main", "overlay"}
    ledger = {entry["path"]: entry for entry in result["files"]}
    assert set(ledger) | {"release-manifest.json"} == {
        path.relative_to(staged).as_posix() for path in staged.rglob("*") if path.is_file()}
    for relative, entry in ledger.items():
        assert entry["sha256"] == hashlib.sha256((staged / relative).read_bytes()).hexdigest()
    json.dumps(result)


def test_derived_remote_config_does_not_execute_package_hooks(staging, repository):
    root, _, _ = repository
    original = json.loads((root / "web/vercel.json").read_bytes())
    original.update(framework="vite", outputDirectory="dist",
                    build={"env": {"SHIOK_DATA_BUNDLE": "wrong", "NEXT_PUBLIC_DATA_BASE": "/data/wrong/",
                                   "NEXT_PUBLIC_LAMP_OVERLAY_BASE": "/data/wrong-lamp/"}})
    put_json(root, "web/vercel.json", original, compressed=False)
    git(root, "add", "web/vercel.json")
    git(root, "commit", "-qm", "test: conflicting config")
    before = (root / "web/vercel.json").read_bytes()
    result = prepare(staging, repository)
    config = json.loads((Path(result["webRoot"]) / "vercel.json").read_bytes())
    assert config["buildCommand"] == "node node_modules/next/dist/bin/next build"
    assert config["installCommand"] == "npm ci --ignore-scripts --no-audit --no-fund"
    assert config["framework"] == "nextjs"
    assert config["outputDirectory"] is None
    assert "ignoreCommand" not in config
    assert config["git"]["deploymentEnabled"] is False
    assert config["build"]["env"]["SHIOK_DATA_BUNDLE"] == "generated_fixture"
    assert config["build"]["env"]["NEXT_PUBLIC_DATA_BASE"] == "/data/generated_fixture/"
    assert config["build"]["env"]["NEXT_PUBLIC_LAMP_OVERLAY_BASE"] == "/data/lamp_posts_v1/"
    assert next(entry for entry in result["files"] if entry["path"] == "web/vercel.json")["origin"] == "derived"
    assert (root / "web/vercel.json").read_bytes() == before


@pytest.mark.parametrize("name", [".env", ".env.production", ".npmrc", "private.key", ".vercel/project.json"])
def test_tracked_suspicious_files_are_rejected(staging, repository, name):
    root, _, _ = repository
    put(root, "web/" + name, b"secret")
    git(root, "add", "-f", "web/" + name)
    git(root, "commit", "-qm", "test: forbidden source")
    with pytest.raises(staging.ReleaseStagingError, match="UNSAFE_SOURCE"):
        prepare(staging, repository)


@pytest.mark.parametrize("name", ["scores/index.json.gz", "scores/prefix-index.json.gz", "geom/postal-index.json.gz",
                                 "geom/postal-prefix/018.json.gz", "transit/h3/cell-a.json.gz"])
def test_missing_existing_gzip_or_derived_lookup_fails_without_regeneration(staging, repository, name):
    _, data, _ = repository
    (data / name).unlink()
    before = snapshot(data)
    with pytest.raises(staging.ReleaseStagingError, match="MISSING"):
        prepare(staging, repository)
    assert snapshot(data) == before


@pytest.mark.parametrize("replacement", [gzip.compress(b"different"), b"not gzip", gzip.compress(b"x" * 200000),
                                        b"\x1f\x8b\x08\x00" + b"\x00" * 6 + b"\xff" * 8],
                         ids=["different", "invalid-header", "oversized-decode", "invalid-deflate"])
def test_raw_gzip_mismatch_or_corruption_fails_before_success(staging, repository, replacement):
    _, data, _ = repository
    (data / "scores/AREA.json.gz").write_bytes(replacement)
    with pytest.raises(staging.ReleaseStagingError, match="GZIP"):
        prepare(staging, repository)


def test_missing_overlay_tile_is_not_silently_omitted(staging, repository):
    _, _, overlay = repository
    (overlay / "tiles/cell-a.json").unlink()
    with pytest.raises(staging.ReleaseStagingError, match="MISSING"):
        prepare(staging, repository)


def test_existing_stage_is_never_overwritten(staging, repository):
    root, _, _ = repository
    sentinel = put(root, "tmp/stage/keep", b"unchanged")
    with pytest.raises(staging.ReleaseStagingError, match="DESTINATION_EXISTS"):
        prepare(staging, repository)
    assert sentinel.read_bytes() == b"unchanged"


@pytest.mark.parametrize("kind", ["relative", "outside_tmp", "traversal", "nested_bundle", "same_overlay"])
def test_invalid_path_contract_fails(staging, repository, kind):
    root, data, _ = repository
    changes = {"relative": {"stage_dir": Path("relative")}, "outside_tmp": {"stage_dir": root / "other"},
               "traversal": {"stage_dir": root / "tmp/../other"},
               "nested_bundle": {"data_dir": data / "nested"}, "same_overlay": {"overlay_dir": data}}[kind]
    with pytest.raises(staging.ReleaseStagingError):
        prepare(staging, repository, **changes)


def test_tracked_symlink_is_rejected_without_following_it(staging, repository):
    root, _, _ = repository
    blob = git(root, "hash-object", "-w", "--stdin", input=b"../../outside").decode().strip()
    git(root, "update-index", "--add", "--cacheinfo", f"120000,{blob},web/linked")
    git(root, "commit", "-qm", "test: symlink")
    with pytest.raises(staging.ReleaseStagingError, match="UNSAFE_SOURCE"):
        prepare(staging, repository)


def test_tracked_submodule_is_rejected(staging, repository):
    root, _, _ = repository
    revision = git(root, "rev-parse", "HEAD").decode().strip()
    git(root, "update-index", "--add", "--cacheinfo", f"160000,{revision},web/submodule")
    git(root, "commit", "-qm", "test: submodule")
    with pytest.raises(staging.ReleaseStagingError, match="UNSAFE_SOURCE"):
        prepare(staging, repository)


def test_staged_pointer_is_explicitly_derived_without_mutating_committed_or_local_pointer(staging, repository):
    root, _, _ = repository
    put_json(root, "web/data-bundle.json", {"bundle": "other"}, compressed=False)
    git(root, "add", "web/data-bundle.json")
    git(root, "commit", "-qm", "test: different pointer")
    before = (root / "web/data-bundle.json").read_bytes()
    result = prepare(staging, repository)
    pointer = json.loads((Path(result["webRoot"]) / "data-bundle.json").read_bytes())
    assert pointer == {"bundle": "generated_fixture", "generated_at": "2026-09-10T00:00:00Z",
                       "data_as_of": None, "provenance": {"record_count": 1}}
    assert (root / "web/data-bundle.json").read_bytes() == before
    assert next(entry for entry in result["files"] if entry["path"] == "web/data-bundle.json")["origin"] == "derived"


def test_verify_rechecks_all_inputs_and_staged_bytes_without_mutation(staging, repository):
    root, _, _ = repository
    result = prepare(staging, repository)
    stage = Path(result["stageRoot"])
    before = snapshot(stage)
    verified = staging.verify_release_stage(root, stage)
    assert verified["status"] == "verified_not_deployed"
    assert verified["sourceRevision"] == result["sourceRevision"]
    assert verified["releaseManifestSha256"] == result["releaseManifestSha256"]
    assert snapshot(stage) == before


@pytest.mark.parametrize("uppercase", [False, True])
def test_manifest_pin_verifies_single_read_and_parses_the_hashed_bytes(staging, repository, monkeypatch, uppercase):
    root, _, _ = repository
    result = prepare(staging, repository)
    stage = Path(result["stageRoot"])
    receipt = Path(result["releaseManifestPath"])
    content = receipt.read_bytes()
    expected = result["releaseManifestSha256"]
    original_open, original_parse = Path.open, staging._json_bytes
    reads, parsed = [], []

    def counted_open(path, *args, **kwargs):
        if path == receipt:
            reads.append(path)
            assert len(reads) == 1, "ledger must not be reopened after hashing"
        return original_open(path, *args, **kwargs)

    def checked_parse(value, path):
        if path == receipt:
            assert value == content
            assert hashlib.sha256(value).hexdigest() == expected
            parsed.append(path)
        return original_parse(value, path)

    monkeypatch.setattr(Path, "open", counted_open)
    monkeypatch.setattr(staging, "_json_bytes", checked_parse)
    verified = staging.verify_release_stage(root, stage,
        expected_manifest_sha256=expected.upper() if uppercase else expected)
    assert verified["status"] == "verified_not_deployed"
    assert verified["releaseManifestSha256"] == expected
    assert reads == parsed == [receipt]


@pytest.mark.parametrize("pin", ["", "a" * 63, "a" * 65, "g" * 64, 7, True])
def test_manifest_pin_invalid_format_rejected_before_filesystem(staging, monkeypatch, pin):
    def forbidden(*args, **kwargs):
        pytest.fail("invalid external pin must fail before filesystem or Git access")

    monkeypatch.setattr(staging, "_paths", forbidden)
    with pytest.raises(staging.ReleaseStagingError, match="INVALID_MANIFEST_SHA256"):
        staging.verify_release_stage(Path("C:/sgSHIOK2026"), Path("C:/sgSHIOK2026/tmp/not-consulted"),
                                     expected_manifest_sha256=pin)


@pytest.mark.parametrize("malformed", [False, True])
def test_manifest_pin_tampered_before_first_verify_never_consults_ledger_data(staging, repository, monkeypatch, malformed):
    root, _, _ = repository
    result = prepare(staging, repository)
    receipt = Path(result["releaseManifestPath"])
    changed = json.loads(receipt.read_bytes())
    changed["artifacts"][0]["directory"] = "../../tmp/never-consulted"
    changed["sourceRevision"] = "never-consulted"
    replacement = b"not even JSON" if malformed else json.dumps(changed).encode()
    receipt.write_bytes(replacement)

    def forbidden(*args, **kwargs):
        pytest.fail("mismatched ledger must not be parsed or supply input paths/revisions")

    monkeypatch.setattr(staging, "_json_bytes", forbidden)
    monkeypatch.setattr(staging, "_verify_inputs", forbidden)
    with pytest.raises(staging.ReleaseStagingError, match="MANIFEST_HASH_MISMATCH") as error:
        staging.verify_release_stage(root, Path(result["stageRoot"]),
                                     expected_manifest_sha256=result["releaseManifestSha256"])
    assert error.value.expected == result["releaseManifestSha256"]
    assert error.value.actual == hashlib.sha256(replacement).hexdigest()


@pytest.mark.parametrize("change", ["artifact", "omitted_plain", "copy", "extra", "head"])
def test_verify_detects_changes_before_external_actions(staging, repository, change):
    root, data, _ = repository
    result = prepare(staging, repository)
    stage = Path(result["stageRoot"])
    if change == "artifact":
        (data / "scores/AREA.json.gz").write_bytes(b"changed")
    elif change == "omitted_plain":
        (data / "scores/AREA.json").write_bytes(b"changed")
    elif change == "copy":
        (stage / "web/app/page.tsx").write_bytes(b"changed")
    elif change == "extra":
        put(stage, "web/untracked-private.js", b"unexpected")
    else:
        git(root, "commit", "--allow-empty", "-qm", "test: changed head")
    with pytest.raises(staging.ReleaseStagingError, match="CHANGED|UNEXPECTED"):
        staging.verify_release_stage(root, stage)


def test_changed_input_during_copy_preserves_partial_stage_without_success_ledger(staging, repository, monkeypatch):
    root, data, _ = repository
    original = staging._hash_file
    changed = False

    def mutate(path, destination=None):
        nonlocal changed
        result = original(path, destination)
        if destination is not None and not changed:
            changed = True
            (data / "scores/AREA.json").write_bytes(b"changed during staging")
        return result

    monkeypatch.setattr(staging, "_hash_file", mutate)
    with pytest.raises(staging.ReleaseStagingError, match="INPUT_CHANGED"):
        prepare(staging, repository)
    assert (root / "tmp/stage/web/app/page.tsx").exists()
    assert not (root / "tmp/stage/release-manifest.json").exists()


def test_unreadable_input_failure_has_named_path_and_no_success_ledger(staging, repository, monkeypatch):
    root, data, _ = repository
    original = Path.open

    def denied(path, *args, **kwargs):
        if path == data / "scores/AREA.json":
            raise PermissionError("fixture input unreadable")
        return original(path, *args, **kwargs)

    monkeypatch.setattr(Path, "open", denied)
    with pytest.raises(staging.ReleaseStagingError, match="scores.*AREA.json"):
        prepare(staging, repository)
    assert not (root / "tmp/stage/release-manifest.json").exists()


@pytest.mark.parametrize("name", ["../outside.json", "/absolute.json", "tiles\\escape.json", "tiles/../../escape.json",
                                "tiles/%2e%2e/escape.json", "tiles/cell-a.json#fragment"])
def test_overlay_manifest_paths_fail_before_tile_access(staging, repository, name):
    _, _, overlay = repository
    put_json(overlay, "manifest.json", {"generated_at": "2026-09-10T00:00:00Z", "tile_count": 1,
             "tiles": [{"path": name, "bytes": 1}]}, compressed=False)
    with pytest.raises(staging.ReleaseStagingError, match="PATH"):
        prepare(staging, repository)


def junction(link, target):
    if os.name == "nt":
        subprocess.run(["cmd", "/d", "/c", "mklink", "/J", str(link), str(target)],
                       capture_output=True, check=True, timeout=10)
    else:
        link.symlink_to(target, target_is_directory=True)


@pytest.mark.parametrize("place", ["data", "stage_parent"])
def test_junction_or_symlink_parents_are_rejected(staging, repository, place):
    root, data, _ = repository
    target = root / "tmp/link-target"
    target.mkdir()
    if place == "data":
        junction(data / "escape", target)
        changes = {}
    else:
        junction(root / "tmp/linked-parent", target)
        changes = {"stage_dir": root / "tmp/linked-parent/stage"}
    with pytest.raises(staging.ReleaseStagingError, match="LINKED_PATH"):
        prepare(staging, repository, **changes)
    assert list(target.iterdir()) == []


def test_verify_allows_only_named_next_outputs_and_exact_existing_dependency_link(staging, repository):
    root, _, _ = repository
    result = prepare(staging, repository)
    stage = Path(result["stageRoot"])
    put(stage, "web/.next/BUILD_ID", b"synthetic, no build executed")
    put(stage, "web/tsconfig.tsbuildinfo", b"synthetic")
    (root / "web/node_modules").mkdir()
    junction(stage / "web/node_modules", root / "web/node_modules")
    assert staging.verify_release_stage(root, stage)["status"] == "verified_not_deployed"


def test_production_type_imports_have_explicit_original_and_derived_hashes(staging, repository):
    root, _, _ = repository
    before = (root / "web/next-env.d.ts").read_bytes()
    result = prepare(staging, repository)
    entry = next(item for item in result["files"] if item["path"] == "web/next-env.d.ts")
    derived = (Path(result["webRoot"]) / "next-env.d.ts").read_bytes()
    assert derived == before.replace(b'"./.next/dev/types/', b'"./.next/types/')
    assert entry["origin"] == "derived" and entry["reason"] == "production-next-type-imports"
    assert entry["sourceSha256"] == hashlib.sha256(before).hexdigest()
    assert entry["sha256"] == hashlib.sha256(derived).hexdigest()
    assert (root / "web/next-env.d.ts").read_bytes() == before


@pytest.mark.parametrize("name", ["next-env.d.ts", "tsconfig.json"])
def test_verify_rejects_modified_committed_or_derived_configuration(staging, repository, name):
    root, _, _ = repository
    result = prepare(staging, repository)
    (Path(result["webRoot"]) / name).write_bytes(b"unexpected build modification")
    with pytest.raises(staging.ReleaseStagingError, match="INPUT_CHANGED"):
        staging.verify_release_stage(root, Path(result["stageRoot"]))


def test_verify_rejects_dependency_link_to_any_other_directory(staging, repository):
    root, _, _ = repository
    result = prepare(staging, repository)
    (root / "web/node_modules").mkdir()
    wrong = root / "tmp/unapproved-dependencies"
    wrong.mkdir()
    junction(Path(result["webRoot"]) / "node_modules", wrong)
    with pytest.raises(staging.ReleaseStagingError, match="UNAPPROVED_DEPENDENCIES"):
        staging.verify_release_stage(root, Path(result["stageRoot"]))


def test_head_change_during_preparation_keeps_partial_stage_without_success_receipt(staging, repository, monkeypatch):
    root, _, _ = repository
    original = staging._blobs
    changed = False

    def change_head(repo, entries):
        nonlocal changed
        content = original(repo, entries)
        if not changed:
            changed = True
            git(root, "commit", "--allow-empty", "-qm", "test: concurrent head change")
        return content

    monkeypatch.setattr(staging, "_blobs", change_head)
    with pytest.raises(staging.ReleaseStagingError, match="HEAD_CHANGED"):
        prepare(staging, repository)
    assert (root / "tmp/stage/web/app/page.tsx").exists()
    assert not (root / "tmp/stage/release-manifest.json").exists()
