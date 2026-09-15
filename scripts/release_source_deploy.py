"""Submit existing source parts, never stage/build/repack or discover credentials.

prepare_source_deployment reads metadata only. submit_source_deployment performs
external writes and must only be called after exact release approval. Its token
is supplied explicitly by the caller, never loaded from files or environment.
No retries, redirects, alias operations or browser/cache manipulation. The caller
owns the outer process deadline and subsequent READY/production acceptance.
"""

from __future__ import annotations

from collections.abc import Callable, Iterable
import hashlib
import http.client
import json
from pathlib import Path
import re
import time
from urllib.parse import urlsplit

from scripts import release_source_archive as archive


PROJECT_ID = "prj_y6GIQUdEyXXmtg3UTWkcJECKHdEE"
TEAM_ID = "team_ARK7HKobyCMp0PCArQTLxbz6"
API_HOST = "api.vercel.com"
MAX_UPLOAD_BYTES = 500 * 1024 * 1024
MAX_RESPONSE_BYTES = 1024 * 1024
Transport = Callable[[str, dict[str, str], Iterable[bytes], archive._Budget], tuple[int, bytes]]


class SubmissionError(ValueError):
    def __init__(self, result: dict):
        self.result = result
        super().__init__(f"{result['state']}: {result['error']}")


def prepare_source_deployment(repo_root: Path, receipt_path: Path, receipt_sha256: str,
                              *, target: str, timeout_seconds: float = 30) -> dict:
    """Return the exact reviewable request without reading parts or using network."""
    root = archive._directory(repo_root)
    path = archive.staging._absolute(receipt_path)
    archive.staging._inside(path, root / "tmp")
    budget = archive._Budget(timeout_seconds)
    receipt = archive._load_json(root, path, receipt_sha256, budget)
    if target not in {"preview", "production"}:
        raise ValueError("Explicit preview or production target required")
    try:
        if (path.name != archive.RECEIPT_NAME or Path(receipt["repoRoot"]) != root
                or type(receipt["schemaVersion"]) is not int or receipt["schemaVersion"] != 1
                or receipt["kind"] != "sgshiok-source-archive"
                or receipt["scope"] != "source-archive"
                or receipt["status"] != "verified-not-deployed"
                or receipt["completeSourceInventory"] is not True
                or receipt["pilotMaxBytes"] is not None
                or receipt["cliReference"] != archive.CLI_REFERENCE
                or receipt["partBytes"] != archive.PART_BYTES):
            raise ValueError("Full verified source archive required")
        parts = receipt["parts"]
        if not isinstance(parts, list) or len(parts) != 5:
            raise ValueError("This consumer requires the reviewed five-part archive")
        for index, part in enumerate(parts, 1):
            if (part["file"] != f".vercel/source.tgz.part{index}"
                    or type(part["size"]) is not int or not 0 < part["size"] <= archive.PART_BYTES
                    or (index < 5 and part["size"] != archive.PART_BYTES)
                    or part["mode"] != 0o666):
                raise ValueError("Invalid part order, size or mode")
            archive._digest(part["sha"], 40)
            archive._digest(part["sha256"])
        files = [{k: p[k] for k in ("file", "sha", "size", "mode")} for p in parts]
        total = sum(p["size"] for p in parts)
        if (receipt["deploymentFiles"] != files or total > MAX_UPLOAD_BYTES
                or total != receipt["compressedBytes"]
                or receipt["verification"]["compressedBytes"] != total):
            raise ValueError("Part references or compressed-byte total mismatch")
        if receipt["artifacts"] != {
                "main": "generated_20260805_prefer_scored_routed", "overlay": "lamp_posts_v1"}:
            raise ValueError("Unexpected data artifacts")
        revision = archive._digest(receipt["sourceRevision"], 40)
    except (KeyError, TypeError, AttributeError) as error:
        raise ValueError("Invalid archive receipt") from error
    controls = {
        "SHIOK_DATA_BUNDLE": receipt["artifacts"]["main"],
        "NEXT_PUBLIC_DATA_BASE": f"/data/{receipt['artifacts']['main']}/",
        "NEXT_PUBLIC_LAMP_OVERLAY_BASE": "/data/lamp_posts_v1/",
        "SHIOK_REPORTS_ENABLED": "false", "SHIOK_MODERATION_ENABLED": "false", "NODE_OPTIONS": "",
    }
    request = {
        "name": "sgshiok", "project": PROJECT_ID, "files": files,
        "projectSettings": {
            "rootDirectory": "web", "framework": "nextjs", "nodeVersion": "24.x",
            "buildCommand": "node scripts/build-next-release.mjs build",
            "installCommand": "npm ci --ignore-scripts --no-audit --no-fund",
            "outputDirectory": None,
        },
        "env": dict(controls), "build": {"env": dict(controls)},
        "meta": {"sourceArchiveSha256": receipt_sha256, "sourceRevision": revision},
    }
    if target == "production":
        request["target"] = "production"
    budget.check()
    return {"receipt": str(path), "receiptSha256": receipt_sha256,
            "artifactDirectory": str(path.parent), "parts": parts, "compressedBytes": total,
            "target": target, "teamId": TEAM_ID, "request": request,
            "requestSha256": hashlib.sha256(archive._json_bytes(request)).hexdigest()}


def _remaining(budget: archive._Budget) -> float:
    budget.check()
    return max(0.001, budget.seconds - (time.monotonic() - budget.start))


def _post(path: str, headers: dict[str, str], body: Iterable[bytes],
          budget: archive._Budget) -> tuple[int, bytes]:
    """Binary HTTPS with fixed destination, bounded IO and no implicit retry."""
    connection = http.client.HTTPSConnection(API_HOST, timeout=_remaining(budget))
    try:
        connection.connect()
        connection.sock.settimeout(_remaining(budget))
        connection.putrequest("POST", path)
        for key, value in headers.items():
            connection.putheader(key, value)
        connection.endheaders()
        sent = 0
        expected = int(headers["Content-Length"])
        for chunk in body:
            if not isinstance(chunk, bytes) or sent + len(chunk) > expected:
                raise ValueError("Invalid upload body")
            connection.sock.settimeout(_remaining(budget))
            connection.send(chunk)
            sent += len(chunk)
        if sent != expected:
            raise ValueError("Truncated upload body")
        connection.sock.settimeout(_remaining(budget))
        response = connection.getresponse()
        result = bytearray()
        while True:
            if connection.sock is not None:
                connection.sock.settimeout(_remaining(budget))
            chunk = response.read1(min(65536, MAX_RESPONSE_BYTES + 1 - len(result)))
            budget.check()
            if not chunk:
                break
            result.extend(chunk)
            if len(result) > MAX_RESPONSE_BYTES:
                raise ValueError("Response size limit")
        return response.status, bytes(result)
    finally:
        connection.close()


def _created(body: bytes, target: str) -> dict:
    value = json.loads(body, object_pairs_hook=archive._unique)
    if not isinstance(value, dict):
        raise ValueError("Invalid create response")
    if value.get("error"):
        raise ValueError("Create response reports an error")
    deployment_id, url = value.get("id"), value.get("url")
    if not isinstance(deployment_id, str) or not re.fullmatch(r"dpl_[A-Za-z0-9]+", deployment_id):
        raise ValueError("Missing deployment identity")
    if not isinstance(url, str) or not re.fullmatch(r"[A-Za-z0-9-]+\.vercel\.app", url):
        raise ValueError("Invalid deployment URL")
    if urlsplit("https://" + url).hostname != url:
        raise ValueError("Invalid deployment hostname")
    if value.get("target") != ("production" if target == "production" else None):
        raise ValueError("Deployment target mismatch")
    if value.get("readyState") not in {
            "INITIALIZING", "ANALYZING", "BUILDING", "DEPLOYING", "READY", "QUEUED", "CANCELED", "ERROR"}:
        raise ValueError("Invalid deployment state")
    return {"id": deployment_id, "url": url, "readyState": value["readyState"], "target": value.get("target")}


def submit_source_deployment(repo_root: Path, receipt_path: Path, receipt_sha256: str, *,
                             target: str, request_sha256: str, token: str, output_dir: Path,
                             timeout_seconds: float, transport: Transport | None = None) -> dict:
    """EXTERNAL WRITES: five uploads and one create, only after caller approval.

Fresh local scratch records intent, each completed upload, create-attempt and
the result. A failed/uncertain attempt is never resumed or retried automatically.
"""
    budget = archive._Budget(timeout_seconds)
    if not isinstance(token, str) or not re.fullmatch(r"[!-~]{1,8192}", token):
        raise ValueError("Explicit valid runtime token required")
    plan = prepare_source_deployment(repo_root, receipt_path, receipt_sha256,
                                     target=target, timeout_seconds=timeout_seconds)
    if archive._digest(request_sha256) != plan["requestSha256"]:
        raise ValueError("Reviewed request hash mismatch")
    root, output, source = archive._directory(repo_root), archive.staging._absolute(output_dir), Path(plan["artifactDirectory"])
    archive.staging._inside(output, root / "tmp")
    if output.parent != root / "tmp":
        raise ValueError("Output must be a new direct child of repository tmp")
    if output.is_relative_to(source) or source.is_relative_to(output):
        raise ValueError("Output overlaps archive")
    if archive.staging._plain(output, missing=True) is not None:
        raise ValueError("Output must be new scratch")
    # Validate all compressed objects before the first external write, no inflation.
    for _ in archive._part_chunks(source, plan["parts"], budget):
        pass
    archive._load_json(root, Path(plan["receipt"]), receipt_sha256, budget)
    archive.staging._mkdir(output.parent)
    output.mkdir()
    archive.staging._write_new(output / "intent.json", archive._json_bytes(plan))
    post = _post if transport is None else transport
    result = {"ok": False, "state": "uploading", "uploaded": [], "requestSha256": request_sha256,
              "receiptSha256": receipt_sha256, "teamId": TEAM_ID, "projectId": PROJECT_ID,
              "productionSmokeVerified": False}
    try:
        for part in plan["parts"]:
            result["part"] = part["file"]
            body = archive._part_chunks(source, [part], budget)
            try:
                status, _ = post(f"/v2/files?teamId={TEAM_ID}", {
                    "Authorization": "Bearer " + token, "Content-Type": "application/octet-stream",
                    "Content-Length": str(part["size"]), "x-vercel-digest": part["sha"],
                }, body, budget)
                if next(body, None) is not None:
                    raise ValueError("Transport did not consume upload")
            finally:
                body.close()
            budget.check()
            if status != 200:
                result.update(httpStatus=status)
                raise ValueError("Upload not accepted")
            result["uploaded"].append(part["sha"])
            archive.staging._write_new(output / f"upload-{len(result['uploaded'])}.json",
                                      archive._json_bytes({"sha": part["sha"], "httpStatus": status}))
        result.pop("part")
        result["state"] = "creating"
        body = archive._json_bytes(plan["request"])
        budget.check()
        archive.staging._write_new(output / "create-attempt.json", archive._json_bytes({
            "requestSha256": request_sha256, "teamId": TEAM_ID, "projectId": PROJECT_ID}))
        status, response = post(f"/v13/deployments?teamId={TEAM_ID}", {
            "Authorization": "Bearer " + token, "Content-Type": "application/json",
            "Content-Length": str(len(body)),
        }, [body], budget)
        result["httpStatus"] = status
        budget.check()
        if status != 200 or len(response) > MAX_RESPONSE_BYTES:
            raise ValueError("Create response not accepted")
        deployment = _created(response, target)
        result.update(ok=True, state="created", deployment=deployment)
    except Exception:
        result.update(state="create_outcome_unknown" if result["state"] == "creating" else "upload_stopped",
                      error="SUBMISSION_STOPPED_INSPECT_RECEIPTS_NO_AUTOMATIC_RETRY")
        archive.staging._write_new(output / "result.json", archive._json_bytes(result))
        raise SubmissionError(result) from None
    archive.staging._write_new(output / "result.json", archive._json_bytes(result))
    return result
