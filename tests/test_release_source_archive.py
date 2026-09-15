"""Bounded synthetic stages only; never package real application/data payloads."""

import gzip
import hashlib
import io
import json
import os
from contextlib import contextmanager
from pathlib import Path
import shutil
import stat
import subprocess
import sys
import tarfile

import pytest

from scripts import release_source_archive as archive


def put(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)
    return path


def save(path, value):
    put(path, (json.dumps(value, sort_keys=True) + "\n").encode())
    return hashlib.sha256(path.read_bytes()).hexdigest()


def entry(root, name, content, origin):
    put(root / name, content)
    return {"path": name, "bytes": len(content), "sha256": hashlib.sha256(content).hexdigest(),
            "origin": origin}


@pytest.fixture
def stages(tmp_path):
    root = tmp_path / "repo"
    front, data = root / "tmp/frontend", root / "tmp/data"
    members = [entry(front, "web/package.json", b'{"name":"fixture"}', "git"),
               entry(front, "web/app/page.tsx", b"fixture page", "git"),
               entry(front, ".vercelignore", b".next\nnode_modules\n", "previous-verified-derived-control")]
    data_files = [entry(data, "web/old.ts", b"never included", "git"),
                  entry(data, "web/public/data/main/empty.json", b"", "main"),
                  entry(data, "web/public/data/main/payload.bin", os.urandom(24000), "main"),
                  entry(data, "web/public/data/overlay/payload.json.gz", gzip.compress(b'[{"id":1}]'), "overlay")]
    ledger = data / "release-manifest.json"
    data_pin = save(ledger, {"schemaVersion": 1, "status": "prepared_not_built", "repoRoot": str(root),
                           "stageRoot": str(data), "webRoot": str(data / "web"), "files": data_files,
                           "sourceRevision": "b" * 40,
                           "artifacts": [{"role": "main", "directory": "main"},
                                         {"role": "overlay", "directory": "overlay"}]})
    build = root / "qa/build.json"
    front_pin = save(build, {"scope": "frontend-only-not-deployable", "passed": True,
                            "beforeVerified": True, "afterVerified": True,
                            "compiler": {"ok": True, "returncode": 0}, "reporting": False, "moderation": False,
                            "root": str(root), "stage": str(front), "webRoot": str(front / "web"),
                            "dataStage": str(data), "dataStageManifestSha256": data_pin,
                            "sourceRevision": "a" * 40, "buildId": "fixture-build",
                            "buildOutput": {"manifestSha256": "c" * 64, "files": 1, "bytes": 12}, "files": members})
    # These exist but must never be discovered/read by the packager.
    for directory in (front, data):
        put(directory / "web/.env", b"secret")
        put(directory / "web/.next/cache/private", b"generated")
    put(root / "web/public/data/protected", b"original protected payload")
    return {"repo_root": root, "frontend_build": build, "frontend_sha256": front_pin,
            "data_ledger": ledger, "data_sha256": data_pin}


def update(stages, which, change):
    key, pin = ("frontend_build", "frontend_sha256") if which == "front" else ("data_ledger", "data_sha256")
    value = json.loads(stages[key].read_bytes())
    change(value)
    stages[pin] = save(stages[key], value)
    if which == "data":
        update(stages, "front", lambda f: f.update(dataStageManifestSha256=stages[pin]))


def pack(stages, **kwargs):
    options = {"output_dir": stages["repo_root"] / "tmp/archive", "max_input_bytes": 100000,
               "max_output_bytes": 200000, "timeout_seconds": 30}
    options.update(kwargs)
    return archive.create_source_archive(**stages, **options)


def verify(stages, result, **kwargs):
    options = {"repo_root": stages["repo_root"], "receipt_path": Path(result["receipt"]),
               "receipt_sha256": result["receiptSha256"], "max_input_bytes": 100000,
               "max_output_bytes": 200000, "timeout_seconds": 30}
    options.update(kwargs)
    return archive.verify_source_archive(**options)


def snapshot(root):
    return {p.relative_to(root).as_posix(): p.read_bytes() for p in root.rglob("*") if p.is_file()}


def test_real_default_part_size():
    assert archive.PART_BYTES == 104857600
    assert archive.COMPRESSION_LEVEL == 1


def test_two_roots_multipart_roundtrip_and_no_source_reads_outside_selection(stages, monkeypatch):
    monkeypatch.setattr(archive, "PART_BYTES", 4096)
    before = snapshot(stages["repo_root"])
    allowed = {stages["frontend_build"], stages["data_ledger"]}
    plan = archive.plan_source_archive(**stages)
    allowed.update(Path(plan["roots"][m["root"]]) / m["path"] for m in plan["members"])
    original = archive._open_plain

    def guarded(path, budget):
        assert path in allowed or path.is_relative_to(stages["repo_root"] / "tmp/archive")
        return original(path, budget)

    monkeypatch.setattr(archive, "_open_plain", guarded)
    result = pack(stages)
    receipt = json.loads(Path(result["receipt"]).read_bytes())
    assert receipt["compressionLevel"] == 1
    assert len(receipt["parts"]) > 2
    assert all(p["size"] == 4096 for p in receipt["parts"][:-1])
    assert receipt["completeSourceInventory"] is True
    assert receipt["sourceRevision"] == "a" * 40
    assert verify(stages, result)["verified"] is True
    compressed = b"".join((Path(result["receipt"]).parent / p["file"]).read_bytes() for p in receipt["parts"])
    with tarfile.open(fileobj=io.BytesIO(compressed), mode="r:gz") as reader:
        extracted = {m.name: reader.extractfile(m).read() for m in reader.getmembers()}
    assert set(extracted) == {m["path"] for m in plan["members"]}
    for m in plan["members"]:
        assert hashlib.sha256(extracted[m["path"]]).hexdigest() == m["sha256"]
    assert all((stages["repo_root"] / name).read_bytes() == value for name, value in before.items())


def test_plan_does_not_read_payload(stages, monkeypatch):
    original = archive._open_plain
    def guarded(path, budget):
        assert path in (stages["frontend_build"], stages["data_ledger"])
        return original(path, budget)
    monkeypatch.setattr(archive, "_open_plain", guarded)
    assert archive.plan_source_archive(**stages)["fullMemberCount"] == 6


@pytest.mark.parametrize("name", ["../escape", "/absolute", "web/../escape", "web\\file", "web/.env",
                                 "web/.env.production", "web/.envrc", "web/.vercel/project.json", "web/private.pem",
                                 "web/node_modules/file", "web/.next/BUILD_ID", "web/.git/config"])
def test_reject_unsafe_or_excluded_inventory(stages, name):
    update(stages, "front", lambda f: f["files"][0].update(path=name))
    with pytest.raises(archive.ArchiveError):
        pack(stages)
    assert not (stages["repo_root"] / "tmp/archive").exists()


def test_duplicate_casefold_member(stages):
    update(stages, "front", lambda f: f["files"].append(dict(f["files"][0], path="web/PACKAGE.json")))
    with pytest.raises(archive.ArchiveError, match="DUPLICATE_MEMBER"):
        pack(stages)


def test_file_directory_member_conflict(stages):
    update(stages, "front", lambda f: f["files"].append(dict(f["files"][0], path="web/app")))
    with pytest.raises(archive.ArchiveError, match="MEMBER_PATH_CONFLICT"):
        pack(stages)


@pytest.mark.parametrize("which", ["frontend_sha256", "data_sha256"])
def test_receipt_pin_mismatch(stages, which):
    stages[which] = "0" * 64
    with pytest.raises(archive.ArchiveError, match="RECEIPT_HASH_MISMATCH"):
        pack(stages)


def test_duplicate_json_keys(stages):
    path = stages["frontend_build"]
    put(path, b'{"scope":1,"scope":2}')
    stages["frontend_sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
    with pytest.raises(archive.ArchiveError, match="INVALID_RECEIPT_JSON"):
        pack(stages)


@pytest.mark.parametrize("change", [lambda f: f.update(passed=False), lambda f: f.update(reporting=True),
                                   lambda f: f.update(compiler=[]), lambda f: f["compiler"].update(returncode=False),
                                   lambda f: f.update(dataStageManifestSha256="d" * 64),
                                   lambda f: f.update(stage=f["root"] + "/web")])
def test_failed_build_reporting_or_root_binding(stages, change):
    update(stages, "front", change)
    with pytest.raises(archive.ArchiveError):
        pack(stages)


def test_data_namespace_mismatch(stages):
    update(stages, "data", lambda d: d["files"][1].update(path="web/public/data/other/empty.json"))
    with pytest.raises(archive.ArchiveError, match="INVALID_DATA_MEMBER"):
        pack(stages)


@pytest.mark.parametrize("origin", ["previous-frontend", "unknown"])
def test_unhandled_stage_origin_is_rejected_instead_of_silently_dropped(stages, origin):
    update(stages, "data", lambda d: d["files"].append({
        "path": "web/public/_next/static/old.js", "origin": origin,
        "bytes": 4, "sha256": "a" * 64,
    }))
    with pytest.raises(archive.ArchiveError, match="UNSUPPORTED_STAGE_ORIGIN"):
        archive.plan_source_archive(**stages)


def test_input_hash_mismatch_has_no_success_receipt(stages):
    source = stages["repo_root"] / "tmp/frontend/web/app/page.tsx"
    source.write_bytes(b"wrong___page")
    with pytest.raises(archive.ArchiveError, match="MEMBER_HASH_MISMATCH"):
        pack(stages)
    output = stages["repo_root"] / "tmp/archive"
    assert output.exists() and not (output / archive.RECEIPT_NAME).exists()


def test_input_changes_during_stream_fail_closed(stages, monkeypatch):
    original = archive._HashingReader.read
    changed = False
    def mutate(reader, size):
        nonlocal changed
        content = original(reader, size)
        if not changed:
            changed = True
            target = stages["repo_root"] / "tmp/frontend/.vercelignore"
            with target.open("ab") as handle:
                handle.write(b"changed")
        return content
    monkeypatch.setattr(archive._HashingReader, "read", mutate)
    with pytest.raises(archive.ArchiveError, match="MEMBER_HASH_MISMATCH|INPUT_CHANGED"):
        pack(stages)
    assert not (stages["repo_root"] / "tmp/archive" / archive.RECEIPT_NAME).exists()


def test_hardlinked_source_rejected(stages):
    source = stages["repo_root"] / "tmp/frontend/web/app/page.tsx"
    os.link(source, source.parent / "linked.tsx")
    with pytest.raises(archive.ArchiveError, match="UNSAFE_INPUT_FILE"):
        pack(stages)


def test_symlink_ancestor_rejected(stages):
    root = stages["repo_root"].resolve(strict=True)
    repo_tmp = Path(__file__).absolute().parents[1] / "tmp"
    assert root.is_relative_to(repo_tmp.resolve(strict=True))
    source = root / "tmp/frontend/web/app"
    moved = source.with_name("real-app")
    assert source.resolve(strict=True).is_relative_to(root)
    assert moved.resolve().is_relative_to(root) and not moved.exists()
    expected = (source / "page.tsx").read_bytes()
    source.rename(moved)
    junction = False
    try:
        source.symlink_to(moved, target_is_directory=True)
    except OSError as error:
        if os.name != "nt" or getattr(error, "winerror", None) != 1314:
            raise
        import _winapi

        _winapi.CreateJunction(str(moved), str(source))
        junction = True
    try:
        info = source.lstat()
        if junction:
            assert info.st_file_attributes & stat.FILE_ATTRIBUTE_REPARSE_POINT
            assert info.st_reparse_tag == stat.IO_REPARSE_TAG_MOUNT_POINT
            assert not stat.S_ISLNK(info.st_mode)
        else:
            assert stat.S_ISLNK(info.st_mode)
        assert source.resolve(strict=True) == moved
        assert (source / "page.tsx").samefile(moved / "page.tsx")
        with pytest.raises(archive.ArchiveError, match="LINKED_PATH") as plain_error:
            archive.staging._plain(source / "page.tsx")
        assert plain_error.value.path == str(source)
        with pytest.raises(archive.ArchiveError, match="LINKED_PATH") as pack_error:
            pack(stages)
        assert pack_error.value.path == str(source)
        assert not (root / "tmp/archive" / archive.RECEIPT_NAME).exists()
    finally:
        # Remove only the link, never recursively traverse its fixture target.
        if junction:
            os.rmdir(source)
        else:
            source.unlink()
    assert (moved / "page.tsx").read_bytes() == expected


@pytest.mark.parametrize("location", ["web/archive", "tmp/frontend/new", "tmp/data/new", "tmp"])
def test_output_cannot_overlap_or_write_protected_paths(stages, location):
    with pytest.raises(archive.ArchiveError):
        pack(stages, output_dir=stages["repo_root"] / location)


def test_existing_output_is_never_replaced(stages):
    output = stages["repo_root"] / "tmp/archive"
    put(output / "keep", b"untouched")
    with pytest.raises(archive.ArchiveError, match="DESTINATION_EXISTS"):
        pack(stages)
    assert (output / "keep").read_bytes() == b"untouched"


@pytest.mark.parametrize("limits,code", [({"max_input_bytes": 10}, "INPUT_BYTE_BUDGET"),
                                        ({"max_output_bytes": 10}, "OUTPUT_BYTE_BUDGET"),
                                        ({"max_input_bytes": True}, "INVALID_BYTE_BUDGET")])
def test_byte_budgets(stages, limits, code):
    with pytest.raises(archive.ArchiveError, match=code):
        pack(stages, **limits)
    assert not (stages["repo_root"] / "tmp/archive" / archive.RECEIPT_NAME).exists()


def test_deadline(stages, monkeypatch):
    tick = iter(range(10000))
    monkeypatch.setattr(archive.time, "monotonic", lambda: next(tick))
    with pytest.raises(archive.ArchiveError, match="TIME_BUDGET_EXCEEDED"):
        pack(stages, timeout_seconds=0.1)


def test_pilot_is_incomplete_and_has_no_deployment_references(stages):
    plan = archive.plan_source_archive(**stages)
    limit = sum(m["bytes"] for m in plan["members"][:-1])
    result = pack(stages, pilot_bytes=limit)
    receipt = json.loads(Path(result["receipt"]).read_bytes())
    assert receipt["scope"] == "pilot-not-deployable"
    assert receipt["completeSourceInventory"] is False
    assert receipt["deploymentFiles"] == []
    assert len(receipt["members"]) < receipt["fullMemberCount"]
    assert verify(stages, result)["scope"] == "pilot-not-deployable"


@pytest.mark.parametrize("corruption", ["missing", "bytes", "order", "size", "extra", "receipt-member"])
def test_verifier_rejects_corruption(stages, monkeypatch, corruption):
    monkeypatch.setattr(archive, "PART_BYTES", 4096)
    result = pack(stages)
    path = Path(result["receipt"])
    receipt = json.loads(path.read_bytes())
    part = path.parent / receipt["parts"][0]["file"]
    if corruption == "missing":
        part.unlink()
    elif corruption == "bytes":
        data = bytearray(part.read_bytes())
        data[100] ^= 1
        part.write_bytes(data)
    elif corruption == "order":
        receipt["parts"].reverse()
    elif corruption == "size":
        receipt["parts"][0]["size"] -= 1
    elif corruption == "extra":
        put(path.parent / ".vercel/unlisted", b"extra")
    else:
        receipt["members"][0]["sha256"] = "f" * 64
    result["receiptSha256"] = save(path, receipt)
    with pytest.raises(archive.ArchiveError):
        verify(stages, result)


def test_single_gzip_stream_not_concatenated_archives(stages):
    result = pack(stages)
    path = Path(result["receipt"])
    receipt = json.loads(path.read_bytes())
    part = receipt["parts"][0]
    data = (path.parent / part["file"]).read_bytes() + gzip.compress(b"")
    put(path.parent / part["file"], data)
    part.update(size=len(data), sha=hashlib.sha1(data).hexdigest(), sha256=hashlib.sha256(data).hexdigest())
    receipt["compressedBytes"] = len(data)
    result["receiptSha256"] = save(path, receipt)
    with pytest.raises(archive.ArchiveError, match="TRAILING_GZIP_DATA"):
        verify(stages, result)


@pytest.mark.parametrize("change", ["name", "link", "content", "truncated"])
def test_verifier_checks_tar_not_only_part_digests(stages, change):
    result = pack(stages)
    path = Path(result["receipt"])
    receipt = json.loads(path.read_bytes())
    part = receipt["parts"][0]
    tar = bytearray(gzip.decompress((path.parent / part["file"]).read_bytes()))
    if change in {"name", "link"}:
        info = tarfile.TarInfo.frombuf(tar[:512], "utf-8", "strict")
        if change == "name":
            info.name = "../escape"
        else:
            info.type, info.linkname = tarfile.SYMTYPE, "../../outside"
        tar[:512] = info.tobuf(tarfile.USTAR_FORMAT)
    elif change == "content":
        tar[512] ^= 1
    data = gzip.compress(tar, mtime=0)
    if change == "truncated":
        data = data[:-4]
    put(path.parent / part["file"], data)
    part.update(size=len(data), sha=hashlib.sha1(data).hexdigest(), sha256=hashlib.sha256(data).hexdigest())
    receipt["compressedBytes"] = len(data)
    result["receiptSha256"] = save(path, receipt)
    with pytest.raises(archive.ArchiveError):
        verify(stages, result)


def test_exact_split_boundary_has_no_empty_part(tmp_path):
    writer = archive._SplitWriter(tmp_path, archive.PART_BYTES, archive._Budget(10))
    (tmp_path / ".vercel").mkdir()
    # Keep the fixture small while exercising the actual splitting implementation.
    from unittest.mock import patch
    with patch.object(archive, "PART_BYTES", 32):
        writer.write(b"x" * 64)
        writer.finish_part()
    assert [p["size"] for p in writer.parts] == [32, 32]


def test_node_bundled_tar_cross_reader(stages, monkeypatch):
    node = shutil.which("node")
    parser = Path(__file__).absolute().parents[1] / "web/node_modules/next/dist/compiled/tar/index.min.js"
    if not node or not parser.is_file():
        pytest.skip("existing Node/bundled tar is unavailable; no installation")
    monkeypatch.setattr(archive, "PART_BYTES", 4096)
    result = pack(stages)
    receipt_path = Path(result["receipt"])
    receipt = json.loads(receipt_path.read_bytes())
    payload = b"".join((receipt_path.parent / p["file"]).read_bytes() for p in receipt["parts"])
    script = r"""
const tar = require(process.argv[1]);
const {createGunzip} = require('node:zlib');
const {createHash} = require('node:crypto');
const rows = [];
const reader = tar.t({onentry(entry) {
  const hash = createHash('sha256'); let bytes = 0;
  entry.on('data', chunk => { hash.update(chunk); bytes += chunk.length; });
  entry.on('end', () => rows.push({path:entry.path, bytes, sha256:hash.digest('hex')}));
}});
const fail = error => { process.stderr.write(String(error)); process.exitCode = 1; };
const gzip = createGunzip(); gzip.on('error', fail); reader.on('error', fail);
reader.on('end', () => process.stdout.write(JSON.stringify(rows)));
process.stdin.pipe(gzip).pipe(reader);
"""
    run = subprocess.run([node, "--max-old-space-size=128", "-e", script, str(parser)], input=payload,
                         capture_output=True, timeout=20, cwd=stages["repo_root"],
                         env=dict(os.environ, NODE_OPTIONS="", NODE_PATH=""),
                         creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    assert run.returncode == 0, run.stderr.decode(errors="replace")
    actual = sorted(json.loads(run.stdout), key=lambda m: m["path"])
    expected = sorted([{k: m[k] for k in ("path", "bytes", "sha256")} for m in receipt["members"]],
                      key=lambda m: m["path"])
    assert actual == expected


def test_cli_plan_is_offline_and_writes_nothing(stages):
    root = Path(__file__).absolute().parents[1]
    before = snapshot(stages["repo_root"])
    command = [sys.executable, "-B", "-m", "scripts.release_source_archive", "--repo-root", str(stages["repo_root"]),
               "plan", "--frontend-build", str(stages["frontend_build"]),
               "--frontend-sha256", stages["frontend_sha256"], "--data-ledger", str(stages["data_ledger"]),
               "--data-sha256", stages["data_sha256"]]
    run = subprocess.run(command, cwd=root, capture_output=True, text=True, timeout=15,
                         env=dict(os.environ, PYTHONDONTWRITEBYTECODE="1"),
                         creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    assert run.returncode == 0, run.stdout + run.stderr
    assert json.loads(run.stdout)["fullMemberCount"] == 6
    assert snapshot(stages["repo_root"]) == before


def test_cli_pack_and_verify(stages):
    root = Path(__file__).absolute().parents[1]
    base = [sys.executable, "-B", "-m", "scripts.release_source_archive", "--repo-root", str(stages["repo_root"])]
    limits = ["--max-input-bytes", "100000", "--max-output-bytes", "200000", "--timeout-seconds", "30"]
    command = base + ["pack", "--frontend-build", str(stages["frontend_build"]),
                      "--frontend-sha256", stages["frontend_sha256"], "--data-ledger", str(stages["data_ledger"]),
                      "--data-sha256", stages["data_sha256"], "--output", str(stages["repo_root"] / "tmp/cli-archive")] + limits
    def run(args):
        result = subprocess.run(args, cwd=root, capture_output=True, text=True, timeout=15,
                                env=dict(os.environ, PYTHONDONTWRITEBYTECODE="1"),
                                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        assert result.returncode == 0, result.stdout + result.stderr
        return json.loads(result.stdout)
    result = run(command)
    verified = run(base + ["verify", "--receipt", result["receipt"],
                           "--receipt-sha256", result["receiptSha256"]] + limits)
    assert verified["verified"] is True


@pytest.fixture
def replacement(stages, monkeypatch):
    monkeypatch.setattr(archive, "PART_BYTES", 4096)
    old = pack(stages)
    front = json.loads(stages["frontend_build"].read_bytes())
    root = stages["repo_root"] / "tmp/new-frontend"
    front.update(stage=str(root), webRoot=str(root / "web"), sourceRevision="d" * 40,
                 buildId="replacement-build",
                 buildOutput={"manifestSha256": "e" * 64, "files": 2, "bytes": 24},
                 files=[entry(root, "web/package.json", b'{"name":"fixture"}', "git"),
                        entry(root, "web/app/page.tsx", b"changed frontend page", "git"),
                        entry(root, "web/public/added.txt", b"new frontend asset", "git")])
    new = dict(stages, frontend_build=stages["repo_root"] / "qa/new-build.json")
    new["frontend_sha256"] = save(new["frontend_build"], front)
    return new, old


def repack(replacement, **kwargs):
    stages, old = replacement
    options = {"receipt_path": Path(old["receipt"]), "receipt_sha256": old["receiptSha256"],
               "output_dir": stages["repo_root"] / "tmp/repacked", "max_input_bytes": 500000,
               "max_output_bytes": 500000, "timeout_seconds": 30}
    options.update(kwargs)
    return archive.repack_source_archive(**stages, **options)


def no_repack_receipt(replacement):
    assert not (replacement[0]["repo_root"] / "tmp/repacked" / archive.RECEIPT_NAME).exists()


def source_tar(result):
    path = Path(result["receipt"])
    receipt = json.loads(path.read_bytes())
    return gzip.decompress(b"".join((path.parent / p["file"]).read_bytes() for p in receipt["parts"]))


def replace_old_stream(replacement, payload):
    stages, old = replacement
    receipt = json.loads(Path(old["receipt"]).read_bytes())
    output = stages["repo_root"] / "tmp/corrupt-source"
    (output / ".vercel").mkdir(parents=True)
    writer = archive._SplitWriter(output, 500000, archive._Budget(30))
    writer.write(payload)
    writer.finish_part()
    receipt.update(parts=writer.parts, compressedBytes=writer.total,
                   deploymentFiles=[{k: p[k] for k in ("file", "sha", "size", "mode")} for p in writer.parts])
    receipt["verification"]["compressedBytes"] = writer.total
    old.update(receipt=str(output / archive.RECEIPT_NAME),
               receiptSha256=save(output / archive.RECEIPT_NAME, receipt))


def test_repack_changed_added_removed_frontend_multipart_roundtrip(replacement):
    stages, old = replacement
    before = snapshot(stages["repo_root"])
    result = repack(replacement)
    receipt = json.loads(Path(result["receipt"]).read_bytes())
    assert len(receipt["parts"]) > 2
    assert receipt["sourceRevision"] == "d" * 40
    assert receipt["buildId"] == "replacement-build"
    assert receipt["buildOutput"] == json.loads(stages["frontend_build"].read_bytes())["buildOutput"]
    assert receipt["inputs"]["frontendBuild"] == {
        "path": str(stages["frontend_build"]), "sha256": stages["frontend_sha256"]}
    assert receipt["repackedFrom"] == {"path": old["receipt"], "sha256": old["receiptSha256"]}
    assert receipt["completeSourceInventory"] is True
    assert verify(stages, result)["verified"] is True
    with tarfile.open(fileobj=io.BytesIO(source_tar(result)), mode="r:") as reader:
        files = {m.name: reader.extractfile(m).read() for m in reader.getmembers()}
    assert files["web/app/page.tsx"] == b"changed frontend page"
    assert files["web/public/added.txt"] == b"new frontend asset"
    assert ".vercelignore" not in files
    assert set(files) == {m["path"] for m in receipt["members"]}
    for member in receipt["members"]:
        assert hashlib.sha256(files[member["path"]]).hexdigest() == member["sha256"]
    assert all((stages["repo_root"] / name).read_bytes() == content for name, content in before.items())
    regular = pack(stages, output_dir=stages["repo_root"] / "tmp/regular-new")
    assert source_tar(result) == source_tar(regular)


def test_repack_only_opens_receipts_new_frontend_and_parts_with_bounded_reads(replacement, monkeypatch):
    stages, old = replacement
    plan = archive.plan_source_archive(**stages)
    receipt = json.loads(Path(old["receipt"]).read_bytes())
    output_receipt = stages["repo_root"] / "tmp/repacked" / archive.RECEIPT_NAME
    allowed = {Path(old["receipt"]), *(Path(p["path"]) for p in receipt["inputs"].values()),
               stages["frontend_build"], stages["data_ledger"], output_receipt}
    allowed.update(Path(old["receipt"]).parent / p["file"] for p in receipt["parts"])
    allowed.update(Path(plan["roots"]["frontend"]) / m["path"] for m in plan["members"] if m["root"] == "frontend")
    original, opened = archive._open_plain, []

    class Bounded:
        def __init__(self, source):
            self.source = source

        def fileno(self):
            return self.source.fileno()

        def read(self, size):
            assert 0 <= size <= archive.CHUNK_BYTES
            return self.source.read(size)

    @contextmanager
    def guarded(path, budget):
        assert path in allowed or path.is_relative_to(stages["repo_root"] / "tmp/repacked/.vercel")
        opened.append(path)
        with original(path, budget) as source:
            yield Bounded(source)

    def forbidden(*args, **kwargs):
        raise AssertionError("No extraction, traversal of loose data or restaging")

    original_hash = archive.staging._hash_file

    def receipt_hash(path, destination=None):
        assert path == output_receipt and destination is None
        return original_hash(path)

    monkeypatch.setattr(archive, "_open_plain", guarded)
    monkeypatch.setattr(archive.tarfile, "open", forbidden)
    monkeypatch.setattr(archive.staging, "_hash_file", receipt_hash)
    result = repack(replacement)
    assert verify(stages, result)["verified"] is True
    for part in receipt["parts"]:
        assert opened.count(Path(old["receipt"]).parent / part["file"]) == 1


@pytest.mark.parametrize("which", ["archive", "old-build", "new-build", "data"])
def test_repack_receipt_pins_fail_closed(replacement, which):
    stages, old = replacement
    if which == "archive":
        old["receiptSha256"] = "0" * 64
    else:
        receipt = json.loads(Path(old["receipt"]).read_bytes())
        path = {"old-build": Path(receipt["inputs"]["frontendBuild"]["path"]),
                "new-build": stages["frontend_build"], "data": stages["data_ledger"]}[which]
        put(path, path.read_bytes() + b" ")
    with pytest.raises(archive.ArchiveError, match="RECEIPT_HASH_MISMATCH"):
        repack(replacement)
    no_repack_receipt(replacement)


@pytest.mark.parametrize("field", ["passed", "beforeVerified", "afterVerified"])
def test_repack_requires_real_verified_build_flags(replacement, field):
    update(replacement[0], "front", lambda f: f.update({field: False}))
    with pytest.raises(archive.ArchiveError, match="FRONTEND_BUILD_NOT_VERIFIED"):
        repack(replacement)
    no_repack_receipt(replacement)


@pytest.mark.parametrize("change", ["binding", "pin", "inventory"])
def test_repack_rejects_new_data_binding_or_inventory(replacement, change):
    stages, _ = replacement
    if change == "binding":
        update(stages, "front", lambda f: f.update(dataStageManifestSha256="0" * 64))
    else:
        data = json.loads(stages["data_ledger"].read_bytes())
        root = stages["repo_root"] / "tmp/other-data"
        root.mkdir()
        data.update(stageRoot=str(root), webRoot=str(root / "web"))
        if change == "inventory":
            data["files"][1]["sha256"] = "f" * 64
        stages["data_ledger"] = root / "release-manifest.json"
        stages["data_sha256"] = save(stages["data_ledger"], data)
        update(stages, "front", lambda f: f.update(dataStage=str(root), dataStageManifestSha256=stages["data_sha256"]))
    with pytest.raises(archive.ArchiveError, match="INPUT_BINDING_MISMATCH|REPACK_DATA_MISMATCH"):
        repack(replacement)
    no_repack_receipt(replacement)


@pytest.mark.parametrize("change", ["inventory", "last-part-hash", "part-order", "part-size", "verification", "references"])
def test_repack_rejects_old_receipt_corruption_even_with_updated_pin(replacement, change):
    _, old = replacement
    path = Path(old["receipt"])
    receipt = json.loads(path.read_bytes())
    if change == "inventory":
        receipt["members"][-1]["sha256"] = "f" * 64
    elif change == "last-part-hash":
        receipt["parts"][-1]["sha256"] = "f" * 64
    elif change == "part-order":
        receipt["parts"].reverse()
    elif change == "part-size":
        receipt["parts"][0]["size"] -= 1
    elif change == "verification":
        receipt["verification"]["members"] -= 1
    else:
        receipt["deploymentFiles"] = []
    old["receiptSha256"] = save(path, receipt)
    with pytest.raises(archive.ArchiveError):
        repack(replacement)
    no_repack_receipt(replacement)


@pytest.mark.parametrize("change", ["part-bytes", "missing", "extra"])
def test_repack_rejects_old_part_corruption(replacement, change):
    _, old = replacement
    path = Path(old["receipt"])
    receipt = json.loads(path.read_bytes())
    part = path.parent / receipt["parts"][-1]["file"]
    if change == "part-bytes":
        content = bytearray(part.read_bytes())
        content[-1] ^= 1
        put(part, content)
    elif change == "missing":
        part.unlink()
    else:
        put(path.parent / ".vercel/unlisted", b"extra")
    with pytest.raises((archive.ArchiveError, OSError)):
        repack(replacement)
    no_repack_receipt(replacement)


@pytest.mark.parametrize("change", ["old-frontend", "data", "name", "link", "pax", "duplicate", "padding",
                                   "unexpected", "missing-member", "truncated-tar", "truncated-gzip", "extra-gzip"])
def test_repack_validates_all_old_tar_bytes_despite_new_part_pins(replacement, change):
    _, old = replacement
    receipt = json.loads(Path(old["receipt"]).read_bytes())
    tar = bytearray(source_tar(old))
    offsets, consumed = [], 0
    for member in receipt["members"]:
        offsets.append(consumed)
        consumed += 512 + ((member["bytes"] + 511) // 512) * 512
    data_index = next(i for i, m in enumerate(receipt["members"]) if m["root"] == "data" and m["bytes"])
    offset = offsets[data_index]
    if change == "old-frontend":
        tar[512] ^= 1
    elif change == "data":
        tar[offset + 512] ^= 1
    elif change in {"name", "link", "pax", "duplicate"}:
        info = tarfile.TarInfo.frombuf(tar[offset:offset + 512], "utf-8", "strict")
        if change == "name":
            info.name = "../escape"
        elif change == "link":
            info.type, info.linkname = tarfile.SYMTYPE, "../../outside"
        elif change == "pax":
            info.type = tarfile.XHDTYPE
        else:
            info.name = receipt["members"][data_index - 1]["path"]
        tar[offset:offset + 512] = info.tobuf(tarfile.USTAR_FORMAT)
    elif change == "padding":
        tar[512 + receipt["members"][0]["bytes"]] = 1
    elif change == "unexpected":
        tar[consumed:consumed + 512] = tarfile.TarInfo("web/unexpected").tobuf(tarfile.USTAR_FORMAT)
    elif change == "missing-member":
        tar[offset:offset + 512] = b"\0" * 512
    elif change == "truncated-tar":
        tar = tar[:offset + 513]
    payload = gzip.compress(tar, compresslevel=archive.COMPRESSION_LEVEL, mtime=0)
    if change == "truncated-gzip":
        payload = payload[:-4]
    elif change == "extra-gzip":
        payload += gzip.compress(b"")
    replace_old_stream(replacement, payload)
    with pytest.raises(archive.ArchiveError):
        repack(replacement)
    no_repack_receipt(replacement)


def test_repack_refuses_pilot_source(stages):
    plan = archive.plan_source_archive(**stages)
    old = pack(stages, pilot_bytes=sum(m["bytes"] for m in plan["members"][:-1]))
    with pytest.raises(archive.ArchiveError, match="FULL_SOURCE_ARCHIVE_REQUIRED"):
        repack((stages, old))
    no_repack_receipt((stages, old))


@pytest.mark.parametrize("location", ["web/repacked", "tmp/archive/new", "tmp/frontend/new",
                                     "tmp/data/new", "tmp/new-frontend/new", "tmp"])
def test_repack_output_cannot_overlap_inputs_or_protected_paths(replacement, location):
    with pytest.raises(archive.ArchiveError):
        repack(replacement, output_dir=replacement[0]["repo_root"] / location)
    no_repack_receipt(replacement)


def test_repack_never_replaces_existing_output(replacement):
    path = replacement[0]["repo_root"] / "tmp/repacked/keep"
    put(path, b"untouched")
    with pytest.raises(archive.ArchiveError, match="DESTINATION_EXISTS"):
        repack(replacement)
    assert path.read_bytes() == b"untouched"
    no_repack_receipt(replacement)


@pytest.mark.parametrize("limits", [{"max_input_bytes": 10}, {"max_input_bytes": True},
                                   {"max_output_bytes": 10}, {"max_output_bytes": False},
                                   {"timeout_seconds": 0}])
def test_repack_budget_guards(replacement, limits):
    with pytest.raises(archive.ArchiveError):
        repack(replacement, **limits)
    no_repack_receipt(replacement)


@pytest.mark.parametrize("limit", ["input", "output"])
def test_repack_bounds_new_bytes_separately_from_old_archive(replacement, limit):
    stages, old = replacement
    front = json.loads(stages["frontend_build"].read_bytes())
    front["files"].append(entry(Path(front["stage"]), "web/large.bin", os.urandom(70000), "git"))
    stages["frontend_sha256"] = save(stages["frontend_build"], front)
    receipt = json.loads(Path(old["receipt"]).read_bytes())
    limits = {"max_input_bytes": receipt["inputBytes"]} if limit == "input" else {
        "max_output_bytes": receipt["compressedBytes"]}
    with pytest.raises(archive.ArchiveError, match="BYTE_BUDGET_EXCEEDED"):
        repack(replacement, **limits)
    no_repack_receipt(replacement)


def test_repack_deadline_during_old_stream_leaves_no_receipt(replacement, monkeypatch):
    original = archive._part_chunks

    def timed_out(*args):
        for chunk in original(*args):
            yield chunk
            raise archive.ArchiveError("TIME_BUDGET_EXCEEDED", 30)

    monkeypatch.setattr(archive, "_part_chunks", timed_out)
    with pytest.raises(archive.ArchiveError, match="TIME_BUDGET_EXCEEDED"):
        repack(replacement)
    no_repack_receipt(replacement)


def test_repack_independently_verifies_new_parts_before_receipt(replacement, monkeypatch):
    original = archive._verify_parts
    calls = []

    def corrupt(output, receipt, budget, maximum, **kwargs):
        calls.append(output)
        if not kwargs.get("data_sink"):
            path = output / receipt["parts"][-1]["file"]
            payload = bytearray(path.read_bytes())
            payload[-1] ^= 1
            put(path, payload)
        return original(output, receipt, budget, maximum, **kwargs)

    monkeypatch.setattr(archive, "_verify_parts", corrupt)
    with pytest.raises(archive.ArchiveError):
        repack(replacement)
    assert len(calls) == 2
    no_repack_receipt(replacement)


@pytest.mark.parametrize("which", ["archive", "old-build", "new-build", "data"])
def test_repack_rechecks_receipt_pins_before_publication(replacement, monkeypatch, which):
    stages, old = replacement
    receipt = json.loads(Path(old["receipt"]).read_bytes())
    path = {"archive": Path(old["receipt"]), "old-build": Path(receipt["inputs"]["frontendBuild"]["path"]),
            "new-build": stages["frontend_build"], "data": stages["data_ledger"]}[which]
    original = archive._verify_parts

    def mutate(output, receipt, budget, maximum, **kwargs):
        result = original(output, receipt, budget, maximum, **kwargs)
        if not kwargs.get("data_sink"):
            put(path, path.read_bytes() + b" ")
        return result

    monkeypatch.setattr(archive, "_verify_parts", mutate)
    with pytest.raises(archive.ArchiveError, match="RECEIPT_HASH_MISMATCH"):
        repack(replacement)
    no_repack_receipt(replacement)
