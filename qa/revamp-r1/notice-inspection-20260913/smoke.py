"""Actual CLI output over synthetic local history, with write/network audit denial."""
import contextlib
import io
import json
import os
from pathlib import Path
import sys
from uuid import uuid4

ROOT = Path(r"C:\sgSHIOK2026")
assert Path.cwd() == ROOT
assert sys.dont_write_bytecode
sys.path.insert(0, str(ROOT))

from scripts import inspect_source_notice_journal as inspector
from scripts import source_metadata_comments as comments
from scripts.source_metadata_request_budget import GitHubRequestBudget
from scripts.source_metadata_state import transition

journal = comments.LocalCommentJournal.initialize(
    ROOT / "tmp/source-notice-journals" / ("inspection-smoke-" + uuid4().hex))
GitHubRequestBudget.initialize(journal)
for index, status in enumerate(("intent", "posted", "receipt"), 1):
    source = {"key": f"synthetic_{status}", "name": "Synthetic source", "mode": "metadata",
              "staleAfterDays": 120, "baseline": {"publisherUpdatedAt": "2026-09-01T00:00:00Z", "sha256": "d" * 64}}
    notice = transition(source, None, {"outcome": "timeout", "attempted": True},
                        "2026-09-09T00:00:00Z")["pendingNotices"][0]
    plan = comments.plan_comment("synthetic-owner/synthetic-repo#7",
                                {"catalogSha256": "a" * 64, "stateSha256": "b" * 64, "reportSha256": "c" * 64},
                                notice, author_id=314)
    journal.claim(plan)
    if status == "posted":
        journal.observe(plan, index)
    elif status == "receipt":
        journal.verify(plan, comments._receipt(plan, index))

def snapshot():
    return {path.relative_to(journal.path).as_posix(): (path.read_bytes(), path.stat().st_mtime_ns)
            for path in journal.path.rglob("*") if path.is_file()}

before = snapshot()
blocked_events = []
def audit(event, args):
    writes = {"os.mkdir", "os.remove", "os.rename", "os.rmdir", "os.link", "os.symlink",
              "os.truncate", "os.chmod", "os.utime", "os.system", "subprocess.Popen"}
    if (event in writes or event.startswith("socket.") or
            (event == "open" and ((isinstance(args[1], str) and any(flag in args[1] for flag in "wax+"))
             or (isinstance(args[2], int) and args[2] & (os.O_WRONLY | os.O_RDWR | os.O_CREAT | os.O_TRUNC | os.O_APPEND))))):
        blocked_events.append(event)
        raise AssertionError("Inspection attempted a forbidden side effect")

sys.addaudithook(audit)
sys.argv = ["inspect_source_notice_journal", "--journal", str(journal.path),
            "--journal-sha256", journal.identity_sha256]
capture = io.StringIO()
with contextlib.redirect_stdout(capture):
    code = inspector.main()
output = capture.getvalue()
result = json.loads(output)
assert code == 1 and result["exitCode"] == 1
assert {item["status"] for item in result["attempts"]} == {
    "post_outcome_unknown", "post_id_recorded_unverified", "receipt_recorded_locally"}
assert not blocked_events and snapshot() == before
assert all(item["remoteChecked"] is False and item["automaticResendAllowed"] is False for item in result["attempts"])
print(output, end="")
print(json.dumps({"syntheticFixture": True, "journal": str(journal.path), "cliExit": code,
                  "fileCount": len(before), "bytesAndMtimesUnchanged": True,
                  "writeAndNetworkAuditDenialEnabled": True, "forbiddenEvents": blocked_events,
                  "remoteReceiptOrNoticeCreated": False}))
