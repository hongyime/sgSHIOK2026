"""Immutable release preparation. Only Git reads and new staging-file writes.

No pipeline imports, builds, dependency installation, deployment or activation.
The receipt is a local integrity ledger, not a signature or release approval.
"""

from __future__ import annotations

import gzip
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import subprocess
import zlib
from typing import Any


CHUNK_BYTES = 1024 * 1024
MAX_JSON_BYTES = 64 * 1024 * 1024
MAX_SOURCE_BYTES = 32 * 1024 * 1024
MAX_TOTAL_SOURCE_BYTES = 64 * 1024 * 1024
MAX_FILES = 20000
BUILD_COMMAND = "node node_modules/next/dist/bin/next build"
INSTALL_COMMAND = "npm ci --ignore-scripts --no-audit --no-fund"
GENERATED_FILES = {"web/next-env.d.ts", "web/tsconfig.tsbuildinfo"}
GENERATED_TREES = {"web/.next", "web/node_modules"}


class ReleaseStagingError(ValueError):
    def __init__(self, code: str, path: Path | str, *, expected: Any = None, actual: Any = None):
        self.code, self.path, self.expected, self.actual = code, str(path), expected, actual
        detail = f" expected={expected} actual={actual}" if expected is not None or actual is not None else ""
        super().__init__(f"{code}: {path}{detail}")


def _relative(value: str) -> PurePosixPath:
    if not isinstance(value, str) or not value or "\\" in value:
        raise ReleaseStagingError("UNSAFE_PATH", str(value))
    parts = value.split("/")
    if any(not part or part in {".", ".."} or part[-1:] in {".", " "}
           or any(ord(c) < 32 or c in ':<>"|?*%#' for c in part)
           or re.fullmatch(r"(?i)(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?", part) for part in parts):
        raise ReleaseStagingError("UNSAFE_PATH", value)
    return PurePosixPath(value)


def _absolute(path: Path) -> Path:
    path = Path(path)
    if not path.is_absolute() or ".." in path.parts:
        raise ReleaseStagingError("UNSAFE_PATH", path)
    return path


def _plain(path: Path, *, missing: bool = False) -> os.stat_result | None:
    """Check named ancestors without resolving through symlinks/junctions first."""
    path = _absolute(path)
    result = None
    for item in [*reversed(path.parents), path]:
        try:
            result = item.lstat()
        except FileNotFoundError:
            if missing:
                return None
            raise ReleaseStagingError("MISSING_INPUT", item) from None
        except OSError as error:
            raise ReleaseStagingError("UNREADABLE_INPUT", item, actual=error.errno) from error
        if stat.S_ISLNK(result.st_mode) or getattr(result, "st_file_attributes", 0) & stat.FILE_ATTRIBUTE_REPARSE_POINT:
            raise ReleaseStagingError("LINKED_PATH", item)
        if item != path and not stat.S_ISDIR(result.st_mode):
            raise ReleaseStagingError("UNSAFE_PATH", item)
    return result


def _inside(path: Path, root: Path) -> None:
    if not path.is_relative_to(root) or path == root:
        raise ReleaseStagingError("OUTSIDE_ROOT", path)
    _relative(path.relative_to(root).as_posix())


def _stamp(info: os.stat_result) -> tuple[int, ...]:
    return info.st_dev, info.st_ino, info.st_size, info.st_mtime_ns, info.st_ctime_ns


def _hash_file(path: Path, destination: Path | None = None) -> dict[str, Any]:
    before = _plain(path)
    if not stat.S_ISREG(before.st_mode):
        raise ReleaseStagingError("UNSAFE_INPUT", path)
    digest, size = hashlib.sha256(), 0
    target = None
    try:
        if destination is not None:
            _mkdir(destination.parent)
            target = destination.open("xb")
        with path.open("rb") as source:
            opened = os.fstat(source.fileno())
            # Windows path-stat and descriptor-stat expose different ctime semantics.
            if _stamp(opened)[:4] != _stamp(before)[:4]:
                raise ReleaseStagingError("INPUT_CHANGED", path)
            while chunk := source.read(CHUNK_BYTES):
                size += len(chunk)
                if size > before.st_size:
                    raise ReleaseStagingError("INPUT_CHANGED", path)
                digest.update(chunk)
                if target is not None:
                    target.write(chunk)
            if _stamp(opened) != _stamp(os.fstat(source.fileno())):
                raise ReleaseStagingError("INPUT_CHANGED", path)
        after = _plain(path)
        if _stamp(before) != _stamp(after) or size != before.st_size:
            raise ReleaseStagingError("INPUT_CHANGED", path)
    except OSError as error:
        raise ReleaseStagingError("FILE_IO_FAILED", destination or path, actual=error.errno) from error
    finally:
        if target is not None:
            target.close()
    return {"bytes": size, "sha256": digest.hexdigest()}


def _mkdir(path: Path) -> None:
    if _plain(path, missing=True) is None:
        _mkdir(path.parent)
        path.mkdir()
    elif not path.is_dir():
        raise ReleaseStagingError("UNSAFE_PATH", path)


def _write_new(path: Path, content: bytes) -> dict[str, Any]:
    _mkdir(path.parent)
    try:
        with path.open("xb") as target:
            target.write(content)
    except OSError as error:
        raise ReleaseStagingError("STAGE_WRITE_FAILED", path, actual=error.errno) from error
    expected = {"bytes": len(content), "sha256": hashlib.sha256(content).hexdigest()}
    _same(path, expected, _hash_file(path))
    return expected


def _same(path: Path | str, expected: dict, actual: dict) -> None:
    if expected["bytes"] != actual["bytes"] or expected["sha256"] != actual["sha256"]:
        raise ReleaseStagingError("INPUT_CHANGED", path, expected=expected, actual=actual)


def _git(root: Path, *args: str, input: bytes | None = None) -> bytes:
    env = {key: os.environ[key] for key in ("PATH", "SYSTEMROOT", "WINDIR", "SYSTEMDRIVE") if key in os.environ}
    env.update(GIT_OPTIONAL_LOCKS="0", GIT_NO_LAZY_FETCH="1", GIT_TERMINAL_PROMPT="0",
               GIT_ALLOW_PROTOCOL="", GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL=os.devnull)
    try:
        result = subprocess.run(["git", "--no-optional-locks", "-C", str(root), *args], cwd=root,
                                env=env, input=input, capture_output=True, timeout=60,
                                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    except (OSError, subprocess.TimeoutExpired) as error:
        raise ReleaseStagingError("GIT_READ_FAILED", root) from error
    if result.returncode:
        raise ReleaseStagingError("GIT_READ_FAILED", root, actual=result.returncode)
    return result.stdout


def _revision(root: Path, revision: str) -> str:
    if not isinstance(revision, str) or not revision or revision.startswith("-") or any(ord(c) < 32 for c in revision):
        raise ReleaseStagingError("UNSAFE_REVISION", repr(revision))
    value = _git(root, "rev-parse", "--verify", "--end-of-options", revision + "^{commit}").decode().strip()
    if not re.fullmatch(r"[a-f0-9]{40}|[a-f0-9]{64}", value):
        raise ReleaseStagingError("INVALID_REVISION", revision)
    return value


def _private(path: str) -> bool:
    parts = PurePosixPath(path).parts
    return any(part.lower() == ".env" or part.lower().startswith(".env.")
               or part.lower() in {".vercel", ".npmrc", ".netrc", ".pypirc", "id_rsa", "id_ed25519"}
               or Path(part).suffix.lower() in {".pem", ".key", ".p12", ".pfx", ".kdbx"} for part in parts)


def _source_inventory(root: Path, revision: str) -> list[dict]:
    entries, names = [], set()
    for raw in _git(root, "ls-tree", "-rlz", revision, "--", "web/").split(b"\0"):
        if not raw:
            continue
        info, name = raw.split(b"\t", 1)
        mode, kind, oid, size = info.decode().split()
        path = _relative(name.decode("utf-8")).as_posix()
        if not path.startswith("web/") or mode not in {"100644", "100755"} or kind != "blob" or _private(path):
            raise ReleaseStagingError("UNSAFE_SOURCE", path)
        if path.lower() in names:
            raise ReleaseStagingError("SOURCE_CASE_COLLISION", path)
        names.add(path.lower())
        if path.startswith("web/public/data/") or any(part in {"node_modules", ".next"} for part in PurePosixPath(path).parts):
            continue
        entries.append({"path": path, "objectId": oid, "objectBytes": int(size)})
    if not entries or len(entries) > MAX_FILES:
        raise ReleaseStagingError("SOURCE_INVENTORY_LIMIT", root)
    return entries


def _blobs(root: Path, entries: list[dict]) -> dict[str, bytes]:
    total = 0
    for entry in entries:
        if not re.fullmatch(r"[a-f0-9]{40}|[a-f0-9]{64}", entry["objectId"]):
            raise ReleaseStagingError("INVALID_OBJECT", entry["path"])
        if type(entry["objectBytes"]) is not int or not 0 <= entry["objectBytes"] <= MAX_SOURCE_BYTES:
            raise ReleaseStagingError("SOURCE_SIZE_LIMIT", entry["path"], actual=entry["objectBytes"])
        total += entry["objectBytes"]
    if total > MAX_TOTAL_SOURCE_BYTES:
        raise ReleaseStagingError("SOURCE_TOTAL_SIZE_LIMIT", root, actual=total)
    output = _git(root, "cat-file", "--batch", input="".join(entry["objectId"] + "\n" for entry in entries).encode())
    if len(output) > total + 100 * len(entries):
        raise ReleaseStagingError("GIT_OUTPUT_SIZE_LIMIT", root)
    result, offset = {}, 0
    for entry in entries:
        oid, size = entry["objectId"], entry["objectBytes"]
        header = f"{oid} blob {size}\n".encode()
        if output[offset:offset + len(header)] != header:
            raise ReleaseStagingError("GIT_OBJECT_MISMATCH", entry["path"])
        offset += len(header)
        content = output[offset:offset + size]
        offset += size
        digest = hashlib.sha1 if len(oid) == 40 else hashlib.sha256
        actual = digest(f"blob {len(content)}\0".encode() + content).hexdigest()
        if len(content) != size or actual != oid or output[offset:offset + 1] != b"\n":
            raise ReleaseStagingError("GIT_OBJECT_MISMATCH", entry["path"], expected=oid, actual=actual)
        offset += 1
        result[entry["path"]] = content
    if offset != len(output):
        raise ReleaseStagingError("GIT_OUTPUT_SIZE_LIMIT", root)
    return result


def _files(root: Path) -> list[str]:
    _plain(root)
    result, names, pending = [], set(), [root]
    while pending:
        directory = pending.pop()
        try:
            children = list(directory.iterdir())
        except OSError as error:
            raise ReleaseStagingError("UNREADABLE_INPUT", directory, actual=error.errno) from error
        for path in children:
            relative = _relative(path.relative_to(root).as_posix()).as_posix()
            info = _plain(path)
            if _private(relative):
                raise ReleaseStagingError("UNSAFE_INPUT", path)
            if relative.lower() in names:
                raise ReleaseStagingError("INPUT_CASE_COLLISION", path)
            names.add(relative.lower())
            if len(names) > MAX_FILES:
                raise ReleaseStagingError("INPUT_INVENTORY_LIMIT", root)
            if stat.S_ISDIR(info.st_mode):
                pending.append(path)
            elif stat.S_ISREG(info.st_mode):
                result.append(relative)
            else:
                raise ReleaseStagingError("UNSAFE_INPUT", path)
    return sorted(result)


def _compressed_only(path: str) -> bool:
    # Kept fixture-checked against publish's policy without importing the exporter.
    parts = PurePosixPath(path).parts
    return len(parts) >= 2 and path.endswith(".json") and (
        parts[0] == "scores" or parts[:2] in {("geom", "h3"), ("geom", "postal-prefix"), ("transit", "h3")}
        or parts in {("geom", "index.json"), ("geom", "postal-index.json"), ("transit", "pois.json")})


def _decoded(root: Path, name: str, limit: int) -> tuple[str, int]:
    path = root / name
    _plain(path)
    digest, size = hashlib.sha256(), 0
    try:
        with gzip.open(path, "rb") as source:
            while chunk := source.read(min(CHUNK_BYTES, limit + 1 - size)):
                size += len(chunk)
                if size > limit:
                    raise ReleaseStagingError("GZIP_DECODE_LIMIT", path, actual=limit)
                digest.update(chunk)
    except (OSError, EOFError, zlib.error) as error:
        raise ReleaseStagingError("GZIP_INVALID", path) from error
    return digest.hexdigest(), size


def _json_bytes(content: bytes, path: Path | str) -> dict | list:
    try:
        value = json.loads(content.decode("utf-8"), parse_constant=lambda _: (_ for _ in ()).throw(ValueError()))
    except (ValueError, RecursionError) as error:
        raise ReleaseStagingError("INVALID_JSON", path) from error
    if not isinstance(value, (dict, list)):
        raise ReleaseStagingError("INVALID_JSON", path)
    return value


def _load_json(root: Path, logical: str, entries: dict[str, dict]) -> dict | list:
    _relative(logical)
    name = logical + ".gz" if logical + ".gz" in entries else logical
    if name not in entries:
        raise ReleaseStagingError("MISSING_REQUIRED_FILE", root / logical)
    path = root / name
    _plain(path)
    if name.endswith(".gz"):
        try:
            with gzip.open(path, "rb") as source:
                content = source.read(MAX_JSON_BYTES + 1)
        except (OSError, EOFError, zlib.error) as error:
            raise ReleaseStagingError("GZIP_INVALID", path) from error
    else:
        if entries[name]["bytes"] > MAX_JSON_BYTES:
            raise ReleaseStagingError("JSON_SIZE_LIMIT", path)
        content = path.read_bytes()
    if len(content) > MAX_JSON_BYTES:
        raise ReleaseStagingError("JSON_SIZE_LIMIT", path)
    return _json_bytes(content, path)


def _required_main(root: Path, entries: dict[str, dict], manifest: dict) -> None:
    def mapping(name: str) -> dict:
        value = _load_json(root, name, entries)
        if not isinstance(value, dict):
            raise ReleaseStagingError("INVALID_LOOKUP", root / name)
        return value

    def require(name: str) -> None:
        _relative(name)
        physical = name + ".gz" if _compressed_only(name) else name
        if physical not in entries:
            raise ReleaseStagingError("MISSING_REQUIRED_FILE", root / physical)

    areas = mapping("scores/index.json")
    prefixes = mapping("scores/prefix-index.json")
    geom = mapping("geom/index.json")
    postals = mapping("geom/postal-index.json")
    shards = (manifest.get("scores") or {}).get("shards")
    if not isinstance(shards, list) or any(not isinstance(name, str) for name in shards):
        raise ReleaseStagingError("INVALID_MANIFEST", root / "manifest.json")
    for name in {*areas, *shards}:
        require(f"scores/{name}.json")
    for prefix, names in prefixes.items():
        if not re.fullmatch(r"\d{3}", prefix) or not isinstance(names, list) or any(not isinstance(name, str) for name in names):
            raise ReleaseStagingError("INVALID_LOOKUP", root / "scores/prefix-index.json")
        for name in names:
            require(f"scores/{name}.json")
    for names in geom.values():
        if not isinstance(names, list) or any(not isinstance(name, str) for name in names):
            raise ReleaseStagingError("INVALID_LOOKUP", root / "geom/index.json")
        for name in names:
            require(f"geom/h3/{name}.json")
    expected_prefixes: dict[str, dict] = {}
    for postal, name in postals.items():
        if not re.fullmatch(r"\d{6}", postal) or not isinstance(name, str):
            raise ReleaseStagingError("INVALID_LOOKUP", root / "geom/postal-index.json")
        require(f"geom/h3/{name}.json")
        expected_prefixes.setdefault(postal[:3], {})[postal] = name
    for prefix, expected in expected_prefixes.items():
        name = f"geom/postal-prefix/{prefix}.json"
        require(name)
        if mapping(name) != expected:
            raise ReleaseStagingError("LOOKUP_MISMATCH", root / name)
    transit = mapping("transit/pois.json")
    if transit.get("type") != "FeatureCollection" or not isinstance(transit.get("features"), list):
        raise ReleaseStagingError("INVALID_LOOKUP", root / "transit/pois.json")
    if transit["features"] and not any(name.startswith("transit/h3/") and name.endswith(".json.gz") for name in entries):
        raise ReleaseStagingError("MISSING_REQUIRED_TRANSIT_H3", root)


def _artifact(root: Path, role: str) -> dict:
    entries = {name: {"path": name, **_hash_file(root / name)} for name in _files(root)}
    for name, entry in entries.items():
        if role == "main" and _compressed_only(name) and name + ".gz" not in entries:
            raise ReleaseStagingError("MISSING_GZIP_COMPANION", root / name)
        if name.endswith(".gz"):
            raw = entries.get(name[:-3])
            digest, size = _decoded(root, name, raw["bytes"] if raw else MAX_JSON_BYTES)
            if raw and (digest != raw["sha256"] or size != raw["bytes"]):
                raise ReleaseStagingError("GZIP_CONTENT_MISMATCH", root / name, expected=raw["sha256"], actual=digest)
    manifest = _load_json(root, "manifest.json", entries)
    if not isinstance(manifest, dict) or not isinstance(manifest.get("generated_at"), str):
        raise ReleaseStagingError("INVALID_MANIFEST", root / "manifest.json")
    if role == "main":
        _required_main(root, entries, manifest)
    else:
        if "manifest.json" not in entries or not isinstance(manifest.get("tiles"), list):
            raise ReleaseStagingError("INVALID_OVERLAY_MANIFEST", root)
        seen = set()
        for tile in manifest["tiles"]:
            if not isinstance(tile, dict) or not isinstance(tile.get("path"), str):
                raise ReleaseStagingError("INVALID_OVERLAY_MANIFEST", root)
            name = _relative(tile["path"]).as_posix()
            if not name.startswith("tiles/") or not name.endswith(".json") or name in seen:
                raise ReleaseStagingError("INVALID_OVERLAY_TILE_PATH", name)
            seen.add(name)
            if name not in entries:
                raise ReleaseStagingError("MISSING_OVERLAY_TILE", root / name)
            if tile.get("bytes") != entries[name]["bytes"]:
                raise ReleaseStagingError("OVERLAY_TILE_SIZE", root / name)
        if manifest.get("tile_count") != len(seen):
            raise ReleaseStagingError("INVALID_OVERLAY_MANIFEST", root)
    return {"role": role, "directory": root.name, "manifest": manifest, "inputs": list(entries.values())}


def _paths(repo_root: Path, stage_dir: Path, data_dir: Path | None = None, overlay_dir: Path | None = None) -> tuple[Path, Path]:
    root, stage = _absolute(repo_root), _absolute(stage_dir)
    if not stat.S_ISDIR(_plain(root).st_mode) or not stat.S_ISDIR(_plain(root / ".git").st_mode):
        raise ReleaseStagingError("UNSAFE_REPOSITORY", root)
    if Path(_git(root, "rev-parse", "--show-toplevel").decode().strip()) != root:
        raise ReleaseStagingError("REPOSITORY_ROOT_MISMATCH", root)
    _inside(stage, root / "tmp")
    _plain(stage.parent, missing=True)
    for artifact in (data_dir, overlay_dir):
        if artifact is not None:
            artifact = _absolute(artifact)
            if artifact.parent != root / "web/public/data" or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,127}", artifact.name):
                raise ReleaseStagingError("UNSAFE_ARTIFACT_PATH", artifact)
            if not stat.S_ISDIR(_plain(artifact).st_mode):
                raise ReleaseStagingError("UNSAFE_ARTIFACT_PATH", artifact)
    if data_dir is not None and data_dir == overlay_dir:
        raise ReleaseStagingError("DUPLICATE_ARTIFACT", data_dir)
    return root, stage


def _json_content(value: dict) -> bytes:
    return (json.dumps(value, sort_keys=True, indent=2, allow_nan=False) + "\n").encode()


def prepare_release_stage(repo_root: Path, data_dir: Path, *, stage_dir: Path, overlay_dir: Path,
                          revision: str = "HEAD") -> dict:
    root, stage = _paths(repo_root, stage_dir, data_dir, overlay_dir)
    if _plain(stage, missing=True) is not None:
        raise ReleaseStagingError("DESTINATION_EXISTS", stage)
    head = _revision(root, "HEAD")
    pinned = head if revision == "HEAD" else _revision(root, revision)
    sources = _source_inventory(root, pinned)
    source_names = {entry["path"] for entry in sources}
    for required in ("web/package.json", "web/package-lock.json", "web/next.config.js", "web/data-bundle.json"):
        if required not in source_names:
            raise ReleaseStagingError("MISSING_REQUIRED_SOURCE", required)
    _mkdir(stage.parent)
    stage.mkdir()
    artifacts = [_artifact(data_dir, "main"), _artifact(overlay_dir, "overlay")]
    files, controls = [], {}
    overrides = {"web/vercel.json", "web/data-bundle.json", "web/.vercelignore", "web/next-env.d.ts"}
    blobs = _blobs(root, sources)
    for entry in sources:
        content = blobs.pop(entry["path"])
        entry.update(bytes=len(content), sha256=hashlib.sha256(content).hexdigest())
        if entry["path"] in overrides:
            controls[entry["path"]] = content
        else:
            identity = _write_new(stage / entry["path"], content)
            files.append({"path": entry["path"], "origin": "git", **identity})
    for artifact in artifacts:
        origin = root / "web/public/data" / artifact["directory"]
        for entry in artifact["inputs"]:
            relative = entry["path"]
            omitted = artifact["role"] == "main" and _compressed_only(relative)
            entry["stagedPath"] = None if omitted else f"web/public/data/{origin.name}/{relative}"
            if not omitted:
                copied = _hash_file(origin / relative, stage / entry["stagedPath"])
                _same(origin / relative, entry, copied)
                _same(stage / entry["stagedPath"], entry, _hash_file(stage / entry["stagedPath"]))
                files.append({"path": entry["stagedPath"], "origin": artifact["role"], **copied})
    config = _json_bytes(controls.get("web/vercel.json", b"{}"), "web/vercel.json")
    if not isinstance(config, dict):
        raise ReleaseStagingError("INVALID_CONFIG", "web/vercel.json")
    config.pop("ignoreCommand", None)
    config.update(buildCommand=BUILD_COMMAND, installCommand=INSTALL_COMMAND,
                  framework="nextjs", outputDirectory=None)
    build = config.setdefault("build", {})
    if not isinstance(build, dict) or not isinstance(build.setdefault("env", {}), dict):
        raise ReleaseStagingError("INVALID_CONFIG", "web/vercel.json")
    build["env"].update(SHIOK_DATA_BUNDLE=data_dir.name,
                        NEXT_PUBLIC_DATA_BASE=f"/data/{data_dir.name}/",
                        NEXT_PUBLIC_LAMP_OVERLAY_BASE=f"/data/{overlay_dir.name}/")
    manifest = artifacts[0]["manifest"]
    provenance = manifest.get("provenance")
    if not isinstance(provenance, dict):
        raise ReleaseStagingError("INVALID_MANIFEST_PROVENANCE", data_dir)
    pointer = {"bundle": data_dir.name, "generated_at": manifest["generated_at"], "data_as_of": manifest.get("data_as_of"),
               "provenance": {key: provenance[key] for key in ("record_count", "state_counts") if key in provenance}}
    ignore = b".env*\n.vercel/\nnode_modules/\n.next/\nweb/.env*\nweb/.vercel/\nweb/node_modules/\nweb/.next/\n"
    derived = [("web/vercel.json", _json_content(config), "direct-next-and-ignore-install-hooks"),
               ("web/data-bundle.json", _json_content(pointer), "selected-manifest-pointer"),
               ("web/.vercelignore", ignore, "stage-only-allowlist"),
               (".vercelignore", ignore, "stage-only-allowlist")]
    if "web/next-env.d.ts" in controls:
        production_types = controls["web/next-env.d.ts"].replace(b'"./.next/dev/types/', b'"./.next/types/')
        derived.append(("web/next-env.d.ts", production_types, "production-next-type-imports"))
    for path, content, reason in derived:
        files.append({"path": path, "origin": "derived", "reason": reason,
                      "sourceSha256": hashlib.sha256(controls[path]).hexdigest() if path in controls else None,
                      **_write_new(stage / path, content)})
    report = {"schemaVersion": 1, "status": "prepared_not_built", "repoRoot": str(root), "stageRoot": str(stage),
              "webRoot": str(stage / "web"), "sourceRevision": pinned, "headAtStart": head,
              "sourceFiles": sources, "files": sorted(files, key=lambda entry: entry["path"]), "artifacts": artifacts,
              "buildPolicy": {"command": BUILD_COMMAND, "installCommand": INSTALL_COMMAND, "executed": False,
                              "localDependencies": str(root / "web/node_modules"),
                              "generatedFiles": sorted(GENERATED_FILES), "generatedFilesUntrackedOnly": True,
                              "generatedTrees": sorted(GENERATED_TREES)}}
    _verify_inputs(root, report)
    for entry in files:
        _same(stage / entry["path"], entry, _hash_file(stage / entry["path"]))
    receipt = stage / "release-manifest.json"
    identity = _write_new(receipt, _json_content(report))
    return {**report, "releaseManifestPath": str(receipt), "releaseManifestSha256": identity["sha256"]}


def _verify_inputs(root: Path, report: dict) -> None:
    current = _revision(root, "HEAD")
    if current != report["headAtStart"]:
        raise ReleaseStagingError("HEAD_CHANGED", root, expected=report["headAtStart"], actual=current)
    inventory = _source_inventory(root, report["sourceRevision"])
    expected = [{key: item[key] for key in ("path", "objectId", "objectBytes")} for item in report["sourceFiles"]]
    if inventory != expected:
        raise ReleaseStagingError("SOURCE_INVENTORY_CHANGED", root)
    blobs = _blobs(root, report["sourceFiles"])
    for entry in report["sourceFiles"]:
        content = blobs.pop(entry["path"])
        _same(entry["path"], entry, {"bytes": len(content), "sha256": hashlib.sha256(content).hexdigest()})
    for artifact in report["artifacts"]:
        origin = root / "web/public/data" / artifact["directory"]
        _paths(root, Path(report["stageRoot"]), origin)
        if _files(origin) != [entry["path"] for entry in artifact["inputs"]]:
            raise ReleaseStagingError("INPUT_INVENTORY_CHANGED", origin)
        for entry in artifact["inputs"]:
            _relative(entry["path"])
            _same(origin / entry["path"], entry, _hash_file(origin / entry["path"]))
    if _revision(root, "HEAD") != report["headAtStart"]:
        raise ReleaseStagingError("HEAD_CHANGED", root)


def verify_release_stage(repo_root: Path, stage_root: Path, *,
                         expected_manifest_sha256: str | None = None) -> dict:
    if expected_manifest_sha256 is not None:
        if not isinstance(expected_manifest_sha256, str) or not re.fullmatch(r"[a-fA-F0-9]{64}", expected_manifest_sha256):
            raise ReleaseStagingError("INVALID_MANIFEST_SHA256", stage_root)
        expected_manifest_sha256 = expected_manifest_sha256.lower()
    root, stage = _paths(repo_root, stage_root)
    receipt = stage / "release-manifest.json"
    info = _plain(receipt)
    if not stat.S_ISREG(info.st_mode):
        raise ReleaseStagingError("UNSAFE_INPUT", receipt)
    if info.st_size > MAX_JSON_BYTES:
        raise ReleaseStagingError("LEDGER_SIZE_LIMIT", receipt)
    try:
        with receipt.open("rb") as source:
            content = source.read(MAX_JSON_BYTES + 1)
    except OSError as error:
        raise ReleaseStagingError("FILE_IO_FAILED", receipt, actual=error.errno) from error
    if len(content) > MAX_JSON_BYTES:
        raise ReleaseStagingError("LEDGER_SIZE_LIMIT", receipt)
    if len(content) != info.st_size or _stamp(info) != _stamp(_plain(receipt)):
        raise ReleaseStagingError("INPUT_CHANGED", receipt)
    # Authenticate this exact snapshot before consulting any ledger-origin data.
    manifest_sha256 = hashlib.sha256(content).hexdigest()
    if expected_manifest_sha256 is not None and manifest_sha256 != expected_manifest_sha256:
        raise ReleaseStagingError("MANIFEST_HASH_MISMATCH", receipt,
                                  expected=expected_manifest_sha256, actual=manifest_sha256)
    report = _json_bytes(content, receipt)
    if (not isinstance(report, dict) or report.get("schemaVersion") != 1 or report.get("repoRoot") != str(root)
            or report.get("stageRoot") != str(stage) or report.get("webRoot") != str(stage / "web")):
        raise ReleaseStagingError("INVALID_STAGE_LEDGER", receipt)
    _verify_inputs(root, report)
    expected = {entry["path"]: entry for entry in report["files"]}
    pending, seen = [stage], set()
    while pending:
        for path in pending.pop().iterdir():
            name = _relative(path.relative_to(stage).as_posix()).as_posix()
            if name == "web/node_modules":
                _plain(root / "web/node_modules")
                if path.resolve() != (root / "web/node_modules").resolve() or not (root / "web/node_modules").is_dir():
                    raise ReleaseStagingError("UNAPPROVED_DEPENDENCIES", path)
                continue
            _plain(path)
            if name == "web/.next":
                if not path.is_dir():
                    raise ReleaseStagingError("INVALID_BUILD_OUTPUT", path)
                continue
            if path.is_dir():
                pending.append(path)
            elif name == "release-manifest.json":
                seen.add(name)
            elif name in expected:
                _same(path, expected[name], _hash_file(path))
                seen.add(name)
            elif name in GENERATED_FILES:
                seen.add(name)
            else:
                raise ReleaseStagingError("UNEXPECTED_STAGE_FILE", path)
    missing = set(expected) - seen
    if missing:
        raise ReleaseStagingError("MISSING_STAGE_FILE", sorted(missing)[0])
    return {"status": "verified_not_deployed", "stageRoot": str(stage), "sourceRevision": report["sourceRevision"],
            "filesVerified": len(expected), "releaseManifestSha256": manifest_sha256,
            "generatedFilePolicy": sorted(GENERATED_FILES), "generatedTreePolicy": sorted(GENERATED_TREES)}
