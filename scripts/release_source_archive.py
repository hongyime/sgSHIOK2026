"""Package two pinned existing stages as Vercel source-tgz parts, without deployment.

Only receipt-selected files are read. No Git, current source, original data,
pipeline, build, install or network access. Receipts are integrity evidence,
not release approval. Failed runs preserve scratch without a success receipt.
"""

from __future__ import annotations

import argparse
from contextlib import contextmanager
import gzip
import hashlib
import io
import json
import math
import os
from pathlib import Path
import re
import stat
import tarfile
import time
from typing import BinaryIO, Callable, Iterator
import zlib

from scripts import release_staging as staging


PART_BYTES = 100 * 1024 * 1024
CHUNK_BYTES = 64 * 1024
COMPRESSION_LEVEL = 1
RECEIPT_NAME = "source-archive.json"
CLI_REFERENCE = "6331571e2fe14de31a01d00deead9e7a349e53a6"
ArchiveError = staging.ReleaseStagingError
CONTROLS = {".vercelignore", "web/.vercelignore", "web/data-bundle.json",
            "web/frontend-retention.json", "web/next-env.d.ts", "web/vercel.json"}


class _Budget:
    def __init__(self, seconds: float):
        if not math.isfinite(seconds) or seconds <= 0:
            raise ArchiveError("INVALID_TIME_BUDGET", seconds)
        self.start, self.seconds = time.monotonic(), seconds

    def check(self) -> None:
        if time.monotonic() - self.start > self.seconds:
            raise ArchiveError("TIME_BUDGET_EXCEEDED", self.seconds)


def _positive(value: int, name: str) -> int:
    if type(value) is not int or value <= 0:
        raise ArchiveError("INVALID_BYTE_BUDGET", name)
    return value


def _digest(value: str, length: int = 64) -> str:
    if not isinstance(value, str) or not re.fullmatch(r"[a-f0-9]{%d}" % length, value):
        raise ArchiveError("INVALID_DIGEST", str(value))
    return value


def _directory(path: Path) -> Path:
    path = staging._absolute(path)
    if not stat.S_ISDIR(staging._plain(path).st_mode):
        raise ArchiveError("NOT_DIRECTORY", path)
    return path


@contextmanager
def _open_plain(path: Path, budget: _Budget) -> Iterator[BinaryIO]:
    budget.check()
    before = staging._plain(path)
    if not stat.S_ISREG(before.st_mode) or before.st_nlink != 1:
        raise ArchiveError("UNSAFE_INPUT_FILE", path)
    flags = os.O_RDONLY | getattr(os, "O_BINARY", 0) | getattr(os, "O_NOFOLLOW", 0)
    with os.fdopen(os.open(path, flags), "rb") as source:
        opened = os.fstat(source.fileno())
        if (opened.st_nlink != 1 or not stat.S_ISREG(opened.st_mode)
                or staging._stamp(before)[:4] != staging._stamp(opened)[:4]):
            raise ArchiveError("INPUT_CHANGED", path)
        yield source
        budget.check()
        if (staging._stamp(opened) != staging._stamp(os.fstat(source.fileno()))
                or staging._stamp(before) != staging._stamp(staging._plain(path))):
            raise ArchiveError("INPUT_CHANGED", path)


def _unique(pairs: list[tuple]) -> dict:
    result = {}
    for key, value in pairs:
        if key in result:
            raise ArchiveError("DUPLICATE_JSON_KEY", key)
        result[key] = value
    return result


def _json_bytes(value: dict) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True, allow_nan=False) + "\n").encode()


def _load_json(root: Path, path: Path, pin: str, budget: _Budget) -> dict:
    path = staging._absolute(path)
    staging._inside(path, root)
    if not any(path.is_relative_to(root / base) for base in ("tmp", "qa")):
        raise ArchiveError("UNSAFE_RECEIPT_PATH", path)
    _digest(pin)
    with _open_plain(path, budget) as source:
        if not 0 < os.fstat(source.fileno()).st_size <= staging.MAX_JSON_BYTES:
            raise ArchiveError("RECEIPT_SIZE_LIMIT", path)
        content = bytearray()
        while chunk := source.read(CHUNK_BYTES):
            budget.check()
            content.extend(chunk)
            if len(content) > staging.MAX_JSON_BYTES:
                raise ArchiveError("RECEIPT_SIZE_LIMIT", path)
    if hashlib.sha256(content).hexdigest() != pin:
        raise ArchiveError("RECEIPT_HASH_MISMATCH", path)
    try:
        value = json.loads(content, object_pairs_hook=_unique,
                           parse_constant=lambda value: (_ for _ in ()).throw(ValueError(value)))
    except (ValueError, RecursionError) as error:
        raise ArchiveError("INVALID_RECEIPT_JSON", path) from error
    if not isinstance(value, dict):
        raise ArchiveError("INVALID_RECEIPT_JSON", path)
    return value


def _member(entry: dict, source: str) -> dict:
    if (not isinstance(entry, dict) or type(entry.get("bytes")) is not int
            or entry["bytes"] < 0):
        raise ArchiveError("INVALID_MEMBER", str(entry))
    name = staging._relative(entry.get("path")).as_posix()
    parts = name.lower().split("/")
    if staging._private(name) or any(p.startswith(".env") or p in {
            ".git", ".hg", ".svn", ".next", "node_modules", "__pycache__", ".cache"} for p in parts):
        raise ArchiveError("EXCLUDED_MEMBER", name)
    if name != ".vercelignore" and not name.startswith("web/"):
        raise ArchiveError("UNSAFE_MEMBER_ROOT", name)
    # USTAR keeps verification bounded: no PAX/GNU extension payloads to parse.
    header = tarfile.TarInfo(name)
    header.size = entry["bytes"]
    try:
        header.tobuf(tarfile.USTAR_FORMAT, encoding="utf-8", errors="strict")
    except (ValueError, UnicodeError) as error:
        raise ArchiveError("UNSUPPORTED_TAR_PATH", name) from error
    return {"path": name, "bytes": entry["bytes"], "sha256": _digest(entry.get("sha256")),
            "root": source, "origin": entry.get("origin"), "mode": 0o644}


def _select(members: list[dict], pilot_bytes: int | None) -> list[dict]:
    if pilot_bytes is None:
        return members
    _positive(pilot_bytes, "pilot_bytes")
    selected, size = [], 0
    for member in members:
        if size + member["bytes"] > pilot_bytes:
            break
        selected.append(member)
        size += member["bytes"]
    if not selected or not any(m["root"] == "data" for m in selected):
        raise ArchiveError("PILOT_TOO_SMALL_FOR_DATA", pilot_bytes)
    return selected


def plan_source_archive(repo_root: Path, frontend_build: Path, frontend_sha256: str,
                        data_ledger: Path, data_sha256: str, *,
                        pilot_bytes: int | None = None, timeout_seconds: float = 60) -> dict:
    """Read pinned receipts only; never traverse or hash source/data payloads."""
    budget = _Budget(timeout_seconds)
    root = _directory(repo_root)
    front = _load_json(root, frontend_build, frontend_sha256, budget)
    data = _load_json(root, data_ledger, data_sha256, budget)
    compiler = front.get("compiler")
    if (front.get("scope") != "frontend-only-not-deployable" or not isinstance(compiler, dict)
            or any(front.get(k) is not True for k in ("passed", "beforeVerified", "afterVerified"))
            or compiler.get("ok") is not True
            or type(compiler.get("returncode")) is not int or compiler["returncode"] != 0
            or front.get("reporting") is not False or front.get("moderation") is not False):
        raise ArchiveError("FRONTEND_BUILD_NOT_VERIFIED", frontend_build)
    if (type(data.get("schemaVersion")) is not int or data["schemaVersion"] != 1
            or data.get("status") != "prepared_not_built"):
        raise ArchiveError("INVALID_STAGE_LEDGER", data_ledger)
    try:
        front_root, data_root = Path(front["stage"]), Path(data["stageRoot"])
        if (Path(front["root"]) != root or Path(data["repoRoot"]) != root
                or Path(front["webRoot"]) != front_root / "web"
                or Path(data["webRoot"]) != data_root / "web"
                or Path(front["dataStage"]) != data_root
                or Path(data_ledger) != data_root / "release-manifest.json"
                or front["dataStageManifestSha256"] != data_sha256):
            raise ArchiveError("INPUT_BINDING_MISMATCH", frontend_build)
        for source in (front_root, data_root):
            staging._inside(source, root / "tmp")
            _directory(source)
        if front_root.is_relative_to(data_root) or data_root.is_relative_to(front_root):
            raise ArchiveError("OVERLAPPING_INPUT_ROOTS", front_root)
        revision = _digest(front["sourceRevision"], 40)
        build_id = front["buildId"]
        if not isinstance(build_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,128}", build_id):
            raise ArchiveError("INVALID_BUILD_ID", frontend_build)
        build_output = front["buildOutput"]
        _digest(build_output["manifestSha256"])
        for key in ("files", "bytes"):
            _positive(build_output[key], key)
        artifacts = {}
        for artifact in data["artifacts"]:
            role, directory = artifact["role"], artifact["directory"]
            if role not in {"main", "overlay"} or role in artifacts:
                raise ArchiveError("INVALID_ARTIFACTS", data_ledger)
            if len(staging._relative(directory).parts) != 1:
                raise ArchiveError("INVALID_ARTIFACTS", directory)
            artifacts[role] = directory
        if (set(artifacts) != {"main", "overlay"}
                or len({v.lower() for v in artifacts.values()}) != 2):
            raise ArchiveError("INVALID_ARTIFACTS", data_ledger)
        members, names = [], set()
        for entries, source in ((front["files"], "frontend"), (data["files"], "data")):
            if not isinstance(entries, list) or not 0 < len(entries) <= staging.MAX_FILES:
                raise ArchiveError("INVENTORY_LIMIT", source)
            for entry in entries:
                if not isinstance(entry, dict):
                    raise ArchiveError("INVALID_MEMBER", source)
                origin = entry.get("origin")
                if source == "data" and origin not in {"main", "overlay", "git", "derived"}:
                    raise ArchiveError("UNSUPPORTED_STAGE_ORIGIN", str(origin))
                if source == "data" and origin not in {"main", "overlay"}:
                    continue
                member = _member(entry, source)
                name = member["path"]
                if source == "frontend":
                    if (name.lower() == "web/public/data" or name.lower().startswith("web/public/data/")
                            or origin not in {"git", "previous-verified-derived-control"}
                            or (origin != "git" and name not in CONTROLS)):
                        raise ArchiveError("INVALID_FRONTEND_MEMBER", name)
                elif not name.startswith(f"web/public/data/{artifacts[origin]}/"):
                    raise ArchiveError("INVALID_DATA_MEMBER", name)
                if name.lower() in names:
                    raise ArchiveError("DUPLICATE_MEMBER", name)
                names.add(name.lower())
                members.append(member)
        if (len(members) > staging.MAX_FILES
                or {m["origin"] for m in members if m["root"] == "data"} != {"main", "overlay"}
                or not any(m["root"] == "frontend" for m in members)):
            raise ArchiveError("INCOMPLETE_INVENTORY", frontend_build)
        for name in names:
            if any(parent.as_posix() in names for parent in Path(name).parents):
                raise ArchiveError("MEMBER_PATH_CONFLICT", name)
    except (KeyError, TypeError, AttributeError) as error:
        raise ArchiveError("INVALID_INPUT_RECEIPT", frontend_build) from error
    # Frontend first makes a bounded pilot exercise both roots, not just data.
    members.sort(key=lambda m: (m["root"] != "frontend", m["path"]))
    selected = _select(members, pilot_bytes)
    budget.check()
    return {"schemaVersion": 1, "kind": "sgshiok-source-archive", "repoRoot": str(root),
            "sourceRevision": revision, "buildId": build_id, "buildOutput": build_output,
            "roots": {"frontend": str(front_root), "data": str(data_root)}, "artifacts": artifacts,
            "inputs": {"frontendBuild": {"path": str(frontend_build), "sha256": frontend_sha256},
                       "dataLedger": {"path": str(data_ledger), "sha256": data_sha256}},
            "fullMemberCount": len(members), "fullInputBytes": sum(m["bytes"] for m in members),
            "pilotMaxBytes": pilot_bytes, "completeSourceInventory": pilot_bytes is None,
            "members": selected, "inputBytes": sum(m["bytes"] for m in selected)}


class _HashingReader:
    def __init__(self, source: BinaryIO, budget: _Budget):
        self.source, self.budget = source, budget
        self.digest, self.size = hashlib.sha256(), 0

    def read(self, size: int) -> bytes:
        self.budget.check()
        chunk = self.source.read(size)
        self.digest.update(chunk)
        self.size += len(chunk)
        return chunk


class _SplitWriter:
    def __init__(self, output: Path, maximum: int, budget: _Budget):
        self.output, self.maximum, self.budget = output, maximum, budget
        self.parts: list[dict] = []
        self.file = None
        self.total = self.size = 0

    def write(self, data: bytes) -> int:
        self.budget.check()
        if self.total + len(data) > self.maximum:
            raise ArchiveError("OUTPUT_BYTE_BUDGET_EXCEEDED", self.maximum)
        view = memoryview(data)
        while view:
            self.budget.check()
            if self.file is None:
                self.name = f".vercel/source.tgz.part{len(self.parts) + 1}"
                path = self.output / self.name
                if staging._plain(path, missing=True) is not None:
                    raise ArchiveError("DESTINATION_EXISTS", path)
                self.file = path.open("xb")
                self.sha1, self.sha256, self.size = hashlib.sha1(), hashlib.sha256(), 0
            chunk = view[:PART_BYTES - self.size]
            self.file.write(chunk)
            self.sha1.update(chunk)
            self.sha256.update(chunk)
            self.size += len(chunk)
            self.total += len(chunk)
            view = view[len(chunk):]
            if self.size == PART_BYTES:
                self.finish_part()
        return len(data)

    def finish_part(self) -> None:
        if self.file is not None:
            self.file.close()
            self.file = None
            self.parts.append({"file": self.name, "size": self.size, "sha": self.sha1.hexdigest(),
                               "sha256": self.sha256.hexdigest(), "mode": 0o666})


def _tar_bytes(members: list[dict]) -> int:
    content = sum(512 + ((m["bytes"] + 511) // 512) * 512 for m in members) + 1024
    return ((content + tarfile.RECORDSIZE - 1) // tarfile.RECORDSIZE) * tarfile.RECORDSIZE


def _part_chunks(output: Path, parts: list[dict], budget: _Budget) -> Iterator[bytes]:
    for part in parts:
        path = output / part["file"]
        with _open_plain(path, budget) as source:
            if os.fstat(source.fileno()).st_size != part["size"]:
                raise ArchiveError("PART_SIZE_MISMATCH", path)
            sha1, sha256, size = hashlib.sha1(), hashlib.sha256(), 0
            while chunk := source.read(min(CHUNK_BYTES, part["size"] - size + 1)):
                budget.check()
                size += len(chunk)
                if size > part["size"]:
                    raise ArchiveError("PART_SIZE_MISMATCH", path)
                sha1.update(chunk)
                sha256.update(chunk)
                yield chunk
            if size != part["size"] or sha1.hexdigest() != part["sha"] or sha256.hexdigest() != part["sha256"]:
                raise ArchiveError("PART_HASH_MISMATCH", path)


def _gunzip(chunks: Iterator[bytes], maximum: int, budget: _Budget) -> Iterator[bytes]:
    decoder, total = zlib.decompressobj(16 + zlib.MAX_WBITS), 0
    for chunk in chunks:
        pending = chunk
        while True:
            budget.check()
            try:
                decoded = decoder.decompress(pending, CHUNK_BYTES)
            except zlib.error as error:
                raise ArchiveError("INVALID_GZIP", "archive") from error
            total += len(decoded)
            if total > maximum:
                raise ArchiveError("TAR_SIZE_LIMIT", total)
            if decoded:
                yield decoded
            if decoder.eof:
                if decoder.unused_data or next(chunks, None) is not None:
                    raise ArchiveError("TRAILING_GZIP_DATA", "archive")
                return
            pending = decoder.unconsumed_tail
            if not pending and len(decoded) < CHUNK_BYTES:
                break
    raise ArchiveError("TRUNCATED_GZIP", "archive")


class _ChunkReader(io.RawIOBase):
    def __init__(self, chunks: Iterator[bytes]):
        self.chunks, self.pending = chunks, memoryview(b"")

    def readable(self) -> bool:
        return True

    def readinto(self, buffer: bytearray) -> int:
        if not self.pending:
            self.pending = memoryview(next(self.chunks, b""))
        size = min(len(buffer), len(self.pending))
        buffer[:size] = self.pending[:size]
        self.pending = self.pending[size:]
        return size

    def close(self) -> None:
        self.chunks.close()
        super().close()


def _verify_parts(output: Path, receipt: dict, budget: _Budget, maximum: int, *,
                  data_sink: Callable[[bytes], object] | None = None) -> dict:
    """Optionally copy data tar records; sink bytes are provisional until verification returns."""
    parts, members = receipt["parts"], receipt["members"]
    if (receipt.get("partBytes") != PART_BYTES or not isinstance(parts, list) or not parts
            or len(parts) > (maximum + PART_BYTES - 1) // PART_BYTES):
        raise ArchiveError("INVALID_PARTS", output)
    for index, part in enumerate(parts, 1):
        if (not isinstance(part, dict) or part.get("file") != f".vercel/source.tgz.part{index}"
                or type(part.get("size")) is not int or not 0 < part["size"] <= PART_BYTES
                or (index < len(parts) and part["size"] != PART_BYTES) or part.get("mode") != 0o666):
            raise ArchiveError("INVALID_PART_ORDER_OR_SIZE", index)
        _digest(part.get("sha"), 40)
        _digest(part.get("sha256"))
    compressed = sum(p["size"] for p in parts)
    if compressed > maximum or compressed != receipt["compressedBytes"]:
        raise ArchiveError("OUTPUT_BYTE_BUDGET_EXCEEDED", compressed)
    expected_names = sorted(Path(p["file"]).name for p in parts)
    if staging._files(output / ".vercel") != expected_names:
        raise ArchiveError("PART_INVENTORY_MISMATCH", output)
    tar_size, consumed = _tar_bytes(members), 0
    chunks = _part_chunks(output, parts, budget)
    try:
        with io.BufferedReader(_ChunkReader(_gunzip(chunks, tar_size, budget)), CHUNK_BYTES) as stream:
            for member in members:
                budget.check()
                header = stream.read(512)
                try:
                    info = tarfile.TarInfo.frombuf(header, "utf-8", "strict")
                except (tarfile.HeaderError, UnicodeError) as error:
                    raise ArchiveError("INVALID_TAR_HEADER", member["path"]) from error
                if (not info.isreg() or info.name != member["path"] or info.size != member["bytes"]
                        or info.mode != 0o644 or info.uid != 0 or info.gid != 0 or info.mtime != 0
                        or info.linkname or info.uname or info.gname):
                    raise ArchiveError("TAR_MEMBER_MISMATCH", member["path"])
                copy_data = data_sink is not None and member["root"] == "data"
                if copy_data:
                    data_sink(header)
                digest, remaining = hashlib.sha256(), info.size
                while remaining:
                    chunk = stream.read(min(CHUNK_BYTES, remaining))
                    if not chunk:
                        raise ArchiveError("TRUNCATED_TAR", info.name)
                    budget.check()
                    digest.update(chunk)
                    remaining -= len(chunk)
                    if copy_data:
                        data_sink(chunk)
                if digest.hexdigest() != member["sha256"]:
                    raise ArchiveError("TAR_MEMBER_HASH_MISMATCH", info.name)
                padding = (-info.size) % 512
                if stream.read(padding) != b"\0" * padding:
                    raise ArchiveError("INVALID_TAR_PADDING", info.name)
                if copy_data and padding:
                    data_sink(b"\0" * padding)
                consumed += 512 + info.size + padding
            remaining = tar_size - consumed
            while remaining:
                chunk = stream.read(min(CHUNK_BYTES, remaining))
                if not chunk or any(chunk):
                    raise ArchiveError("INVALID_TAR_END", output)
                budget.check()
                remaining -= len(chunk)
            if stream.read(1):
                raise ArchiveError("TRAILING_TAR_DATA", output)
    finally:
        chunks.close()
    return {"members": len(members), "inputBytes": sum(m["bytes"] for m in members),
            "tarBytes": tar_size, "compressedBytes": compressed}


def create_source_archive(repo_root: Path, frontend_build: Path, frontend_sha256: str,
                          data_ledger: Path, data_sha256: str, *, output_dir: Path,
                          max_input_bytes: int, max_output_bytes: int,
                          timeout_seconds: float, pilot_bytes: int | None = None) -> dict:
    """Create exclusively in new repo/tmp scratch, then verify before receipt publication."""
    budget = _Budget(timeout_seconds)
    _positive(max_input_bytes, "max_input_bytes")
    _positive(max_output_bytes, "max_output_bytes")
    plan = plan_source_archive(repo_root, frontend_build, frontend_sha256, data_ledger, data_sha256,
                               pilot_bytes=pilot_bytes, timeout_seconds=timeout_seconds)
    if plan["inputBytes"] > max_input_bytes:
        raise ArchiveError("INPUT_BYTE_BUDGET_EXCEEDED", plan["inputBytes"])
    root, output = Path(plan["repoRoot"]), staging._absolute(output_dir)
    staging._inside(output, root / "tmp")
    for path in [*map(Path, plan["roots"].values()), Path(frontend_build), Path(data_ledger)]:
        if output.is_relative_to(path) or path.is_relative_to(output):
            raise ArchiveError("OUTPUT_OVERLAPS_INPUT", output)
    if staging._plain(output, missing=True) is not None:
        raise ArchiveError("DESTINATION_EXISTS", output)
    budget.check()
    staging._mkdir(output.parent)
    output.mkdir()
    (output / ".vercel").mkdir()
    writer = _SplitWriter(output, max_output_bytes, budget)
    try:
        with gzip.GzipFile(filename="", mode="wb", fileobj=writer, mtime=0, compresslevel=COMPRESSION_LEVEL) as compressed:
            with tarfile.open(mode="w|", fileobj=compressed, format=tarfile.USTAR_FORMAT,
                              encoding="utf-8", errors="strict", copybufsize=CHUNK_BYTES) as archive:
                for member in plan["members"]:
                    path = Path(plan["roots"][member["root"]]) / member["path"]
                    with _open_plain(path, budget) as source:
                        if os.fstat(source.fileno()).st_size != member["bytes"]:
                            raise ArchiveError("MEMBER_SIZE_MISMATCH", member["path"])
                        reader = _HashingReader(source, budget)
                        info = tarfile.TarInfo(member["path"])
                        info.size, info.mode = member["bytes"], member["mode"]
                        archive.addfile(info, reader)
                        if (reader.size != member["bytes"] or source.read(1)
                                or reader.digest.hexdigest() != member["sha256"]):
                            raise ArchiveError("MEMBER_HASH_MISMATCH", member["path"])
    finally:
        writer.finish_part()
    budget.check()
    receipt = {**plan, "scope": "pilot-not-deployable" if pilot_bytes is not None else "source-archive",
               "status": "verified-not-deployed", "cliReference": CLI_REFERENCE,
               "partBytes": PART_BYTES, "compressionLevel": COMPRESSION_LEVEL,
               "compressedBytes": writer.total, "parts": writer.parts}
    pack_seconds = time.monotonic() - budget.start
    receipt["verification"] = _verify_parts(output, receipt, budget, max_output_bytes)
    # Pin checks again before publishing, without rereading either payload root.
    for item in plan["inputs"].values():
        _load_json(root, Path(item["path"]), item["sha256"], budget)
    receipt["elapsedSeconds"] = {"pack": pack_seconds, "total": time.monotonic() - budget.start}
    receipt["deploymentFiles"] = ([{k: p[k] for k in ("file", "sha", "size", "mode")}
                                  for p in writer.parts] if pilot_bytes is None else [])
    budget.check()
    identity = staging._write_new(output / RECEIPT_NAME, _json_bytes(receipt))
    return {"receipt": str(output / RECEIPT_NAME), "receiptSha256": identity["sha256"],
            "scope": receipt["scope"], "parts": len(writer.parts), "inputBytes": plan["inputBytes"],
            "compressedBytes": writer.total, "elapsedSeconds": receipt["elapsedSeconds"]}


def _archive_plan(root: Path, receipt_path: Path, receipt: dict, *,
                  max_input_bytes: int, timeout_seconds: float) -> dict:
    """Reconstruct archive metadata from its pinned build and data receipts, without payload reads."""
    try:
        front, data = receipt["inputs"]["frontendBuild"], receipt["inputs"]["dataLedger"]
        plan = plan_source_archive(root, Path(front["path"]), front["sha256"], Path(data["path"]), data["sha256"],
                                   pilot_bytes=receipt["pilotMaxBytes"], timeout_seconds=timeout_seconds)
        if any(receipt.get(k) != v for k, v in plan.items()):
            raise ArchiveError("RECEIPT_INVENTORY_MISMATCH", receipt_path)
        if plan["inputBytes"] > max_input_bytes:
            raise ArchiveError("INPUT_BYTE_BUDGET_EXCEEDED", plan["inputBytes"])
        expected_scope = "source-archive" if plan["completeSourceInventory"] else "pilot-not-deployable"
        if (receipt["scope"] != expected_scope or receipt["status"] != "verified-not-deployed"
                or receipt["cliReference"] != CLI_REFERENCE):
            raise ArchiveError("INVALID_ARCHIVE_RECEIPT", receipt_path)
    except (KeyError, TypeError, AttributeError) as error:
        raise ArchiveError("INVALID_ARCHIVE_RECEIPT", receipt_path) from error
    return plan


def repack_source_archive(repo_root: Path, receipt_path: Path, receipt_sha256: str,
                          frontend_build: Path, frontend_sha256: str,
                          data_ledger: Path, data_sha256: str, *, output_dir: Path,
                          max_input_bytes: int, max_output_bytes: int,
                          timeout_seconds: float) -> dict:
    """Replace frontend source in fresh scratch, streaming data from pinned parts only."""
    budget = _Budget(timeout_seconds)
    _positive(max_input_bytes, "max_input_bytes")
    _positive(max_output_bytes, "max_output_bytes")
    root = _directory(repo_root)
    receipt_path = staging._absolute(receipt_path)
    staging._inside(receipt_path, root / "tmp")
    old = _load_json(root, receipt_path, receipt_sha256, budget)
    old_plan = _archive_plan(root, receipt_path, old, max_input_bytes=max_input_bytes,
                             timeout_seconds=timeout_seconds)
    if not old_plan["completeSourceInventory"]:
        raise ArchiveError("FULL_SOURCE_ARCHIVE_REQUIRED", receipt_path)
    plan = plan_source_archive(root, frontend_build, frontend_sha256, data_ledger, data_sha256,
                               timeout_seconds=timeout_seconds)
    if plan["inputBytes"] > max_input_bytes:
        raise ArchiveError("INPUT_BYTE_BUDGET_EXCEEDED", plan["inputBytes"])
    if (plan["inputs"]["dataLedger"] != old_plan["inputs"]["dataLedger"]
            or plan["artifacts"] != old_plan["artifacts"]
            or [m for m in plan["members"] if m["root"] == "data"]
            != [m for m in old_plan["members"] if m["root"] == "data"]):
        raise ArchiveError("REPACK_DATA_MISMATCH", data_ledger)
    output = staging._absolute(output_dir)
    staging._inside(output, root / "tmp")
    inputs = [*old_plan["inputs"].values(), *plan["inputs"].values(),
              {"path": str(receipt_path), "sha256": receipt_sha256}]
    protected = [receipt_path.parent, *map(Path, old_plan["roots"].values()),
                 *map(Path, plan["roots"].values()), *(Path(item["path"]) for item in inputs)]
    for path in protected:
        if output.is_relative_to(path) or path.is_relative_to(output):
            raise ArchiveError("OUTPUT_OVERLAPS_INPUT", output)
    if staging._plain(output, missing=True) is not None:
        raise ArchiveError("DESTINATION_EXISTS", output)
    budget.check()
    staging._mkdir(output.parent)
    output.mkdir()
    (output / ".vercel").mkdir()
    writer = _SplitWriter(output, max_output_bytes, budget)
    try:
        with gzip.GzipFile(filename="", mode="wb", fileobj=writer, mtime=0, compresslevel=COMPRESSION_LEVEL) as compressed:
            # Write no frontend-only footer: the validated old data records follow directly.
            for member in plan["members"]:
                if member["root"] != "frontend":
                    continue
                path = Path(plan["roots"]["frontend"]) / member["path"]
                with _open_plain(path, budget) as source:
                    if os.fstat(source.fileno()).st_size != member["bytes"]:
                        raise ArchiveError("MEMBER_SIZE_MISMATCH", member["path"])
                    info = tarfile.TarInfo(member["path"])
                    info.size, info.mode = member["bytes"], member["mode"]
                    compressed.write(info.tobuf(tarfile.USTAR_FORMAT, encoding="utf-8", errors="strict"))
                    reader, remaining = _HashingReader(source, budget), member["bytes"]
                    while remaining:
                        chunk = reader.read(min(CHUNK_BYTES, remaining))
                        if not chunk:
                            raise ArchiveError("MEMBER_SIZE_MISMATCH", member["path"])
                        compressed.write(chunk)
                        remaining -= len(chunk)
                    if (reader.size != member["bytes"] or source.read(1)
                            or reader.digest.hexdigest() != member["sha256"]):
                        raise ArchiveError("MEMBER_HASH_MISMATCH", member["path"])
                    compressed.write(b"\0" * ((-member["bytes"]) % 512))
            checked = _verify_parts(receipt_path.parent, old, budget, max_output_bytes,
                                    data_sink=compressed.write)
            references = [{k: p[k] for k in ("file", "sha", "size", "mode")} for p in old["parts"]]
            if checked != old.get("verification") or references != old.get("deploymentFiles"):
                raise ArchiveError("INVALID_ARCHIVE_RECEIPT", receipt_path)
            content_bytes = sum(512 + ((m["bytes"] + 511) // 512) * 512 for m in plan["members"])
            compressed.write(b"\0" * (_tar_bytes(plan["members"]) - content_bytes))
    finally:
        writer.finish_part()
    budget.check()
    receipt = {**plan, "scope": "source-archive", "status": "verified-not-deployed",
               "cliReference": CLI_REFERENCE, "partBytes": PART_BYTES, "compressionLevel": COMPRESSION_LEVEL,
               "compressedBytes": writer.total, "parts": writer.parts,
               "repackedFrom": {"path": str(receipt_path), "sha256": receipt_sha256}}
    pack_seconds = time.monotonic() - budget.start
    receipt["verification"] = _verify_parts(output, receipt, budget, max_output_bytes)
    for item in inputs:
        _load_json(root, Path(item["path"]), item["sha256"], budget)
    receipt["elapsedSeconds"] = {"pack": pack_seconds, "total": time.monotonic() - budget.start}
    receipt["deploymentFiles"] = [{k: p[k] for k in ("file", "sha", "size", "mode")} for p in writer.parts]
    budget.check()
    identity = staging._write_new(output / RECEIPT_NAME, _json_bytes(receipt))
    return {"receipt": str(output / RECEIPT_NAME), "receiptSha256": identity["sha256"],
            "scope": receipt["scope"], "parts": len(writer.parts), "inputBytes": plan["inputBytes"],
            "compressedBytes": writer.total, "elapsedSeconds": receipt["elapsedSeconds"]}


def verify_source_archive(repo_root: Path, receipt_path: Path, receipt_sha256: str, *,
                          max_input_bytes: int, max_output_bytes: int,
                          timeout_seconds: float) -> dict:
    """Verify pinned parts and exact receipt-derived members; do not extract files."""
    budget = _Budget(timeout_seconds)
    _positive(max_input_bytes, "max_input_bytes")
    _positive(max_output_bytes, "max_output_bytes")
    root = _directory(repo_root)
    staging._inside(staging._absolute(receipt_path), root / "tmp")
    receipt = _load_json(root, receipt_path, receipt_sha256, budget)
    try:
        plan = _archive_plan(root, receipt_path, receipt, max_input_bytes=max_input_bytes,
                             timeout_seconds=timeout_seconds)
        expected_scope = "source-archive" if plan["completeSourceInventory"] else "pilot-not-deployable"
        result = _verify_parts(Path(receipt_path).parent, receipt, budget, max_output_bytes)
        references = ([{k: p[k] for k in ("file", "sha", "size", "mode")} for p in receipt["parts"]]
                      if plan["completeSourceInventory"] else [])
        if result != receipt["verification"] or references != receipt["deploymentFiles"]:
            raise ArchiveError("INVALID_ARCHIVE_RECEIPT", receipt_path)
    except (KeyError, TypeError, AttributeError) as error:
        raise ArchiveError("INVALID_ARCHIVE_RECEIPT", receipt_path) from error
    return {"verified": True, "scope": expected_scope, **result}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=Path(__file__).absolute().parents[1])
    commands = parser.add_subparsers(dest="command", required=True)
    for name in ("plan", "pack", "verify"):
        sub = commands.add_parser(name)
        sub.add_argument("--timeout-seconds", type=float, default=300)
        if name == "verify":
            sub.add_argument("--receipt", type=Path, required=True)
            sub.add_argument("--receipt-sha256", required=True)
        else:
            sub.add_argument("--frontend-build", type=Path, required=True)
            sub.add_argument("--frontend-sha256", required=True)
            sub.add_argument("--data-ledger", type=Path, required=True)
            sub.add_argument("--data-sha256", required=True)
            sub.add_argument("--pilot-bytes", type=int)
        if name != "plan":
            sub.add_argument("--max-input-bytes", type=int, required=True)
            sub.add_argument("--max-output-bytes", type=int, required=True)
        if name == "pack":
            sub.add_argument("--output", type=Path, required=True)
    args = vars(parser.parse_args(argv))
    command, root = args.pop("command"), args.pop("repo_root")
    try:
        if command == "plan":
            result = plan_source_archive(root, **args)
            result = {k: v for k, v in result.items() if k != "members"}
        elif command == "pack":
            args["output_dir"] = args.pop("output")
            result = create_source_archive(root, **args)
        else:
            args["receipt_path"] = args.pop("receipt")
            result = verify_source_archive(root, **args)
        print(json.dumps(result, sort_keys=True))
        return 0
    except (ArchiveError, OSError, tarfile.TarError) as error:
        print(json.dumps({"ok": False, "error": str(error)}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
