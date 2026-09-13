"""Read-only validation of an existing monitor receipt, not a source check."""

from datetime import UTC, datetime
import hashlib
import json
from pathlib import Path
import socket
import sys

ROOT = Path(r"C:\sgSHIOK2026")
assert Path.cwd() == ROOT
sys.path.insert(0, str(ROOT))
from scripts import check_source_metadata as monitor


def forbidden(*args, **kwargs):
    raise AssertionError("This inspection must not access a network")


socket.create_connection = socket.getaddrinfo = forbidden
socket.socket.connect = socket.socket.connect_ex = forbidden
previous = ROOT / "qa/source-monitor/live-review-1/state.json"
paths = [ROOT / "source-metadata-catalog.json", previous, previous.with_name("report.json")]
before = {path: path.read_bytes() for path in paths}
catalog_bytes = before[paths[0]]
catalog = monitor.validate_catalog(monitor._json(catalog_bytes))
catalog_sha = hashlib.sha256(catalog_bytes).hexdigest()
states, state_sha = monitor._restore(ROOT, previous, catalog, catalog_sha, datetime.now(UTC))
assert all(path.read_bytes() == content for path, content in before.items())
report = monitor._json(before[previous.with_name("report.json")])
print(json.dumps({"kind": "existing_receipt_compatibility_only", "accepted": True,
    "originalFinishedAt": report["finishedAt"], "sourcesRestored": len(states),
    "historicalPendingNotices": sum(len(state["pendingNotices"]) for state in states.values()),
    "stateSha256": state_sha, "originalExitCode": report["exitCode"],
    "files": [{"path": path.relative_to(ROOT).as_posix(), "bytes": len(content),
               "sha256": hashlib.sha256(content).hexdigest()} for path, content in before.items()],
    "bytesUnchanged": True, "sourceRequests": 0, "commentRequests": 0, "pipelineRuns": 0}, indent=2))
