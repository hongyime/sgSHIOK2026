"""Approved GitHub-only scheduler adapter; metadata and notices, never data jobs.

One serialized workflow owns the journal. Every attempt retains a bounded,
create-only checkpoint, including failures. Missing history is not bootstrap.
"""

import argparse
from datetime import UTC, datetime
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import time
import zipfile

from scripts import check_source_metadata as monitor
from scripts import run_source_maintenance as runner
from scripts.source_metadata_comments import LocalCommentJournal, MAX_FILE_BYTES as JOURNAL_BYTES
from scripts.source_metadata_github import GitHubCommentClient
from scripts.source_metadata_http import MetadataClient
from scripts.source_metadata_request_budget import GitHubRequestBudget

ROOT = Path(__file__).resolve().parents[1]
REPOSITORY = "hongyime/sgSHIOK2026"
WORKFLOW = "source-metadata-weekly.yml"
DESTINATION = REPOSITORY + "#34"
AUTHOR_ID = 41898282  # github-actions[bot], independently read from GitHub's API.
JOURNAL = "tmp/source-notice-journals/github-weekly"
MAX_ZIP = 64 * 1024 * 1024
MAX_TOTAL = 64 * 1024 * 1024
MAX_FILES = 12000
MAX_BATCHES = 3
MONITOR_DIR = re.compile(r"ci-[1-9][0-9]*-[1-9][0-9]*-(?:check|ack-[0-2])")
# Five check files, three files per acknowledgement, and at most 24 notices
# (three journal files each) plus 72 request/result pairs and two identities.
RESERVE_MONITOR_FILES = 5 + MAX_BATCHES * 3
RESERVE_JOURNAL_FILES = MAX_BATCHES * (8 * 3 + 24 * 2) + 2
RESERVE_FILES = RESERVE_MONITOR_FILES + RESERVE_JOURNAL_FILES
RESERVE_BYTES = RESERVE_MONITOR_FILES * monitor.MAX_FILE_BYTES + RESERVE_JOURNAL_FILES * JOURNAL_BYTES
MONITOR_FILE = re.compile(r"qa/source-monitor/ci-[1-9][0-9]*-[1-9][0-9]*-(?:check|ack-[0-2])/(?:state\.json|report\.json|report\.pending\.json|started\.json|observations\.jsonl)")
JOURNAL_FILE = re.compile(re.escape(JOURNAL) + r"/(?:identity\.json|[a-f0-9]{64}\.(?:intent|posted|receipt)\.json|github-requests/(?:identity\.json|[0-9]{6}\.(?:request|result)\.json))")


class ScheduleError(ValueError):
    """Safe error codes only; never remote bodies, headers or credentials."""


def encode(value: object) -> bytes:
    return (json.dumps(value, ensure_ascii=True, allow_nan=False, indent=2) + "\n").encode("utf8")


def sha(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def safe_file(root: Path, name: str) -> Path:
    if not isinstance(name, str) or not (MONITOR_FILE.fullmatch(name) or JOURNAL_FILE.fullmatch(name)):
        raise ScheduleError("STOP_CHECKPOINT_PATH")
    return monitor._safe_path(root, root / name)


def archive_name(run_id: int, attempt: int) -> str:
    if any(type(v) is not int or v < 1 for v in (run_id, attempt)):
        raise ScheduleError("STOP_RUN_IDENTITY")
    return f"source-metadata-state-{run_id}-{attempt}"


def checkpoint_files(root: Path) -> dict[str, bytes]:
    """Only scheduler-owned history; never traverse unrelated tracked evidence."""
    files = {}
    total = 0
    base = monitor._safe_path(root, root / "qa/source-monitor")
    stack = [root / JOURNAL]
    if base.exists():
        for index, directory in enumerate(base.iterdir()):
            if index >= MAX_FILES:
                raise ScheduleError("STOP_CHECKPOINT_FILE_BOUND")
            if MONITOR_DIR.fullmatch(directory.name):
                monitor._safe_path(root, directory)
                if not directory.is_dir():
                    raise ScheduleError("STOP_CHECKPOINT_PATH")
                stack.append(directory)
    visited = 0
    while stack:
        directory = stack.pop()
        monitor._safe_path(root, directory)
        if not directory.exists():
            continue
        for path in directory.iterdir():
            visited += 1
            if visited > MAX_FILES * 2:
                raise ScheduleError("STOP_CHECKPOINT_FILE_BOUND")
            monitor._safe_path(root, path)
            if path.is_dir():
                stack.append(path)
                continue
            name = path.relative_to(root).as_posix()
            safe_file(root, name)
            raw = monitor._read(path)
            total += len(raw)
            if total > MAX_TOTAL or len(files) >= MAX_FILES:
                raise ScheduleError("STOP_CHECKPOINT_SIZE_BOUND")
            files[name] = raw
    return files


def reserve_checkpoint_capacity(root: Path) -> None:
    """Worst-case uncompressed growth, checked before any external operation."""
    files = checkpoint_files(root)
    count = len(files) + RESERVE_FILES
    total = sum(map(len, files.values())) + RESERVE_BYTES
    # Allow one KiB per ZIP entry and one MiB for the manifest. Stored ZIPs
    # cannot expand beyond this allowance; no compression-ratio assumption.
    archive_bound = total + count * 1024 + monitor.MAX_FILE_BYTES
    manifest_entries = [{"path": name, "bytes": len(raw), "sha256": sha(raw)}
                        for name, raw in sorted(files.items())]
    if (count > MAX_FILES or total > MAX_TOTAL or archive_bound > MAX_ZIP
            or len(encode(manifest_entries)) + RESERVE_FILES * 512 + 65536 > monitor.MAX_FILE_BYTES
            or shutil.disk_usage(root).free < RESERVE_BYTES + archive_bound):
        raise ScheduleError("STOP_CHECKPOINT_CAPACITY_BEFORE_IO")


def pack_checkpoint(root: Path, output: Path, identity: dict) -> dict:
    """Validate a bounded archive before publishing its upload-visible filename."""
    files = checkpoint_files(root)
    total = sum(map(len, files.values()))
    manifest = {**identity, "files": [{"path": name, "bytes": len(raw), "sha256": sha(raw)}
                                    for name, raw in sorted(files.items())]}
    manifest_raw = encode(manifest)
    if len(manifest_raw) > monitor.MAX_FILE_BYTES:
        raise ScheduleError("STOP_CHECKPOINT_MANIFEST_BOUND")
    if total + len(files) * 1024 + len(manifest_raw) + 1024 > MAX_ZIP:
        raise ScheduleError("STOP_CHECKPOINT_ARCHIVE_BOUND")
    staged = io.BytesIO()
    with zipfile.ZipFile(staged, "w", compression=zipfile.ZIP_STORED) as archive:
        archive.writestr("manifest.json", manifest_raw)
        for name, raw in sorted(files.items()):
            archive.writestr(name, raw)
    payload = staged.getvalue()
    if len(payload) > MAX_ZIP:
        raise ScheduleError("STOP_CHECKPOINT_ARCHIVE_BOUND")
    with zipfile.ZipFile(io.BytesIO(payload)) as check:
        if check.testzip() is not None:
            raise ScheduleError("STOP_CHECKPOINT_ARCHIVE_READBACK")
    pending = output.with_suffix(".pending.zip")
    with pending.open("xb") as stream:
        stream.write(payload)
        stream.flush()
        os.fsync(stream.fileno())
    if sha(pending.read_bytes()) != sha(payload):
        raise ScheduleError("STOP_CHECKPOINT_ARCHIVE_READBACK")
    os.link(pending, output)
    return {"files": len(files), "bytes": total, "archiveBytes": output.stat().st_size,
            "archiveSha256": sha(output.read_bytes()), "manifestSha256": sha(manifest_raw)}


def restore_checkpoint(root: Path, archive_path: Path, *, run_id: int, attempt: int) -> dict:
    if archive_path.stat().st_size > MAX_ZIP:
        raise ScheduleError("STOP_CHECKPOINT_ARCHIVE_BOUND")
    with zipfile.ZipFile(archive_path) as archive:
        infos = archive.infolist()
        names = [item.filename for item in infos]
        if (len(infos) > MAX_FILES + 1 or len(set(names)) != len(names)
                or "manifest.json" not in names or sum(i.file_size for i in infos) > MAX_TOTAL + monitor.MAX_FILE_BYTES
                or any(i.flag_bits & 1 or i.is_dir() or stat.S_ISLNK(i.external_attr >> 16)
                       or i.compress_type not in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED)
                       or i.file_size > monitor.MAX_FILE_BYTES for i in infos)):
            raise ScheduleError("STOP_CHECKPOINT_ARCHIVE_FORMAT")
        manifest = monitor._json(archive.read("manifest.json"))
        if (not isinstance(manifest, dict) or manifest.get("schemaVersion") != 1
                or manifest.get("repository") != REPOSITORY or manifest.get("workflow") != WORKFLOW
                or manifest.get("runId") != run_id or manifest.get("attempt") != attempt
                or manifest.get("anchorProfile") != "git" or manifest.get("status") != "ready"
                or manifest.get("catalogSha256") != sha(monitor._read(root / "source-metadata-catalog.json"))
                or not isinstance(manifest.get("files"), list)):
            raise ScheduleError("STOP_CHECKPOINT_IDENTITY_OR_STOPPED")
        files = {}
        for item in manifest["files"]:
            if not isinstance(item, dict) or set(item) != {"path", "bytes", "sha256"}:
                raise ScheduleError("STOP_CHECKPOINT_MANIFEST")
            name = item["path"]
            path = safe_file(root, name)
            if name in files or path.exists() or name not in names:
                raise ScheduleError("STOP_CHECKPOINT_COLLISION")
            raw = archive.read(name)
            if len(raw) != item["bytes"] or sha(raw) != item["sha256"]:
                raise ScheduleError("STOP_CHECKPOINT_HASH")
            files[name] = raw
        if set(files) != set(names) - {"manifest.json"}:
            raise ScheduleError("STOP_CHECKPOINT_UNLISTED_FILE")
        # Validate every byte/path before creating any destination file.
        for name, raw in files.items():
            path = safe_file(root, name)
            path.parent.mkdir(parents=True, exist_ok=True)
            with path.open("xb") as stream:
                stream.write(raw)
            if path.read_bytes() != raw:
                raise ScheduleError("STOP_CHECKPOINT_RESTORE_READBACK")
    return manifest


def previous_run(runs: dict, *, run_id: int, run_number: int, attempt: int, bootstrap: bool) -> tuple[int, int] | None:
    # A deleted newer run is invisible in the listing. Reruns can therefore
    # never prove they own the latest send history; require a new dispatch.
    if attempt > 1:
        raise ScheduleError("STOP_RERUN_UNSAFE_HISTORY")
    values = runs.get("workflow_runs")
    if not isinstance(values, list) or len(values) > 10:
        raise ScheduleError("STOP_RUN_DISCOVERY")
    if any(r["run_number"] > run_number for r in values):
        raise ScheduleError("STOP_STALE_RUN")
    previous = [r for r in values if r["run_number"] < run_number]
    if not previous:
        if not bootstrap or run_number != 1:
            raise ScheduleError("STOP_NO_PREDECESSOR")
        return None
    if bootstrap:
        raise ScheduleError("STOP_REBOOTSTRAP")
    latest = max(previous, key=lambda r: r["run_number"])
    if latest["run_number"] != run_number - 1:
        raise ScheduleError("STOP_RUN_HISTORY_GAP")
    if (latest["status"] != "completed" or latest["head_branch"] != "main"
            or latest["event"] not in ("schedule", "workflow_dispatch")):
        raise ScheduleError("STOP_PREDECESSOR_NOT_TERMINAL_MAIN")
    return latest["id"], latest["run_attempt"]


def gh(args: list[str], *, json_result: bool = True) -> dict | None:
    result = subprocess.run(["gh", *args], cwd=ROOT, capture_output=True, timeout=30,
                            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    if result.returncode or len(result.stdout) > 4 * 1024 * 1024:
        raise ScheduleError("STOP_GITHUB_CONTROL_REQUEST")
    return monitor._json(result.stdout) if json_result else None


def relative_ref(root: Path, ref: dict | None) -> dict | None:
    if ref is None:
        return None
    path = Path(ref["path"])
    monitor._safe_path(root, path)
    return {**ref, "path": path.relative_to(root).as_posix()}


def restore_ref(root: Path, ref: dict) -> runner.StateRef:
    if not isinstance(ref, dict) or set(ref) != {"path", "stateSha256", "reportSha256"}:
        raise ScheduleError("STOP_STATE_REFERENCE")
    path = safe_file(root, ref["path"])
    if path.name != "state.json":
        raise ScheduleError("STOP_STATE_REFERENCE")
    return runner.StateRef(path, ref["stateSha256"], ref["reportSha256"])


def identity_from_env(env: dict) -> dict:
    if (env.get("GITHUB_ACTIONS") != "true" or env.get("GITHUB_REPOSITORY") != REPOSITORY
            or env.get("GITHUB_REF") != "refs/heads/main"
            or env.get("GITHUB_EVENT_NAME") not in ("schedule", "workflow_dispatch")
            or Path(env.get("GITHUB_WORKSPACE", "")).resolve() != ROOT or Path.cwd() != ROOT):
        raise ScheduleError("STOP_NOT_APPROVED_MAIN_WORKFLOW")
    values = [env.get(key, "") for key in ("GITHUB_RUN_ID", "GITHUB_RUN_NUMBER", "GITHUB_RUN_ATTEMPT")]
    if any(not re.fullmatch(r"[1-9][0-9]{0,19}", value) for value in values):
        raise ScheduleError("STOP_RUN_IDENTITY")
    return dict(zip(("runId", "runNumber", "attempt"), map(int, values)))


def execute(root: Path, output: Path, *, identity: dict, previous: dict | None, token: str,
            credentials: dict, metadata_factory=MetadataClient, transport_factory=None) -> dict:
    reserve_checkpoint_capacity(root)
    journal_path = root / JOURNAL
    if previous is None:
        journal = LocalCommentJournal.initialize(journal_path)
        GitHubRequestBudget.initialize(journal)
    else:
        journal = LocalCommentJournal(journal_path, expected_identity_sha256=previous["journalIdentitySha256"])
    make_transport = ((lambda: transport_factory(journal)) if transport_factory else
        lambda: GitHubCommentClient(DESTINATION, author_id=AUTHOR_ID,
                                   token=token, budget=GitHubRequestBudget(journal)))
    label = f"ci-{identity['runId']}-{identity['attempt']}"
    result = None
    results = []
    started = time.monotonic()
    snapshot = {**identity, "schemaVersion": 1, "repository": REPOSITORY, "workflow": WORKFLOW,
                "anchorProfile": "git", "catalogSha256": sha(monitor._read(root / "source-metadata-catalog.json")),
                "journalIdentitySha256": journal.identity_sha256, "status": "stopped",
                "originState": previous.get("originState") if previous else None,
                "currentState": previous.get("currentState") if previous else None}
    try:
        pending = False
        current = restore_ref(root, previous["currentState"]) if previous else None
        if current:
            states, _, _ = runner._load(root, current, datetime.now(UTC), anchor_profile="git")
            pending = any(s["pendingNotices"] for s in states.values())
        for batch in range(MAX_BATCHES):
            if time.monotonic() - started > 900:
                raise ScheduleError("STOP_WORKFLOW_BUDGET")
            ack = root / f"qa/source-monitor/{label}-ack-{batch}"
            if batch == 0 and not pending:
                result = runner.run_cycle(root, root / f"qa/source-monitor/{label}-check", ack,
                    bootstrap=previous is None, previous=current, metadata_client=metadata_factory(),
                    journal=journal, transport_factory=make_transport, credentials=credentials, anchor_profile="git")
            else:
                origin = restore_ref(root, snapshot["originState"])
                current = restore_ref(root, snapshot["currentState"])
                result = runner.resume_pending(root, ack, origin=origin, current=current,
                    journal=journal, transport=make_transport(), anchor_profile="git")
            results.append(result)
            for field in ("originState", "currentState"):
                if field in result:
                    snapshot[field] = relative_ref(root, result[field])
            if result["status"] == "stopped":
                break
            snapshot["status"] = "ready"
            if result.get("pendingCount", 0) == 0:
                break
        if result and result["status"] == "stopped":
            snapshot["status"] = "stopped"
    except Exception as error:
        snapshot["status"] = "stopped"
        snapshot["error"] = str(error) if isinstance(error, (ScheduleError, monitor.MonitorError)) else "STOP_SCHEDULER_OPERATION"
    snapshot["results"] = results
    snapshot["finishedAt"] = datetime.now(UTC).isoformat()
    archive = pack_checkpoint(root, output / "checkpoint.zip", snapshot)
    code = 2 if snapshot["status"] != "ready" else int(any(r.get("checkExitCode", 0) for r in results)
                or not results or results[-1].get("pendingCount", 0) > 0)
    summary = {"runId": identity["runId"], "attempt": identity["attempt"], "status": snapshot["status"],
               "issue": "https://github.com/" + REPOSITORY + "/issues/34", "exitCode": code,
               "metadataRequests": sum(r.get("metadataRequests", 0) for r in results),
               "githubNoticeRequests": sum(r.get("githubRequests", 0) for r in results),
               "batches": len(results), "pendingCount": result.get("pendingCount") if result else None,
               "metadataCheckPerformed": any(r.get("operation") == "maintenance_cycle" for r in results),
               "elapsedSeconds": time.monotonic() - started, "checkpoint": archive,
               "sourceHealth": next((r.get("sourceHealth") for r in results if r.get("checkExitCode") is not None), "not_rechecked"),
               "error": snapshot.get("error"), "pipelineRuns": 0}
    with (output / "summary.json").open("xb") as stream:
        stream.write(encode(summary))
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bootstrap", action="store_true")
    args = parser.parse_args()
    identity = identity_from_env(os.environ)
    if args.bootstrap and os.environ["GITHUB_EVENT_NAME"] != "workflow_dispatch":
        raise ScheduleError("STOP_SCHEDULE_BOOTSTRAP")
    token = os.environ.get("GH_TOKEN", "")
    if not token:
        raise ScheduleError("STOP_GITHUB_TOKEN_MISSING")
    output = ROOT / f"qa/source-monitor-runs/{identity['runId']}-{identity['attempt']}"
    output.mkdir(parents=True, exist_ok=False)
    previous = None
    runs = gh(["api", f"repos/{REPOSITORY}/actions/workflows/{WORKFLOW}/runs?per_page=10"])
    prior = previous_run(runs, run_id=identity["runId"], run_number=identity["runNumber"],
                         attempt=identity["attempt"], bootstrap=args.bootstrap)
    if prior:
        run_id, attempt = prior
        listing = gh(["api", f"repos/{REPOSITORY}/actions/runs/{run_id}/artifacts?per_page=100"])
        artifacts = [a for a in listing["artifacts"] if a["name"] == archive_name(run_id, attempt)]
        if listing["total_count"] > 100 or len(artifacts) != 1 or artifacts[0]["expired"] or artifacts[0]["size_in_bytes"] > MAX_ZIP:
            raise ScheduleError("STOP_PREDECESSOR_ARTIFACT_MISSING_OR_OVERSIZE")
        download = ROOT / f"tmp/source-monitor-download/{identity['runId']}-{identity['attempt']}"
        download.mkdir(parents=True, exist_ok=False)
        gh(["run", "download", str(run_id), "--repo", REPOSITORY, "--name", archive_name(run_id, attempt), "--dir", str(download)], json_result=False)
        previous = restore_checkpoint(ROOT, download / "checkpoint.zip", run_id=run_id, attempt=attempt)
    result = execute(ROOT, output, identity=identity, previous=previous, token=token,
                     credentials={"LTA_DATAMALL_ACCOUNT_KEY": os.environ.get("LTA_DATAMALL_ACCOUNT_KEY", "")})
    print(json.dumps(result, ensure_ascii=True))
    return result["exitCode"]


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ScheduleError, monitor.MonitorError, OSError, ValueError, KeyError, subprocess.SubprocessError) as error:
        print(json.dumps({"status": "stopped", "error": str(error) if isinstance(error, (ScheduleError, monitor.MonitorError)) else "STOP_SCHEDULER_SETUP", "pipelineRuns": 0}))
        raise SystemExit(2) from None
