"""Inspect one pinned local notice journal, without network, repair or activation.

Run with Python -B to prevent import bytecode writes. This command never reads
credentials, comment bodies into output, or arbitrary monitor/data directories.
Local receipt consistency is not current remote delivery proof. Trusted stable
ancestors and the independently retained identity pin are still required.
"""

import argparse
import json
import math
import os
from pathlib import Path
import re
import stat
import time

from scripts import source_metadata_comments as comments
from scripts.source_metadata_delivery import DeliveryError, _encode, _sha
from scripts.source_metadata_request_budget import GitHubRequestBudget, MAX_HISTORY, _number, validate_request_history

MAX_SNAPSHOT_BYTES = 16 * 1024 * 1024
ATTEMPT_FILE = re.compile(r"([a-f0-9]{64})\.(intent|posted|receipt)\.json")
REQUEST_FILE = re.compile(r"([0-9]{6})\.(request|result)\.json")


def _names(path: Path, *, request_ledger: bool = False) -> list[str]:
    comments._safe_root(path)
    limit = 2 * MAX_HISTORY + 1 if request_ledger else 3 * MAX_HISTORY + 2
    names = []
    with os.scandir(path) as entries:
        for entry in entries:
            if len(names) == limit:
                raise DeliveryError("STOP_INSPECTION_ENTRY_BOUND")
            candidate = path / entry.name
            if candidate.is_symlink() or candidate.is_junction():
                raise DeliveryError("STOP_JOURNAL_LINK")
            metadata = candidate.lstat()
            mode = metadata.st_mode
            if not request_ledger and entry.name == "github-requests":
                if not stat.S_ISDIR(mode):
                    raise DeliveryError("STOP_INSPECTION_FILE_TYPE")
            elif not stat.S_ISREG(mode):
                raise DeliveryError("STOP_INSPECTION_FILE_TYPE")
            elif metadata.st_nlink != 1:
                raise DeliveryError("STOP_INSPECTION_HARDLINK")
            elif entry.name != "identity.json" and not (
                    REQUEST_FILE if request_ledger else ATTEMPT_FILE).fullmatch(entry.name):
                raise DeliveryError("STOP_INSPECTION_UNEXPECTED_FILE")
            names.append(entry.name)
    return sorted(names)


def _snapshot(journal: comments.LocalCommentJournal) -> tuple[dict[str, bytes], list[str], list[str]]:
    top = _names(journal.path)
    ledger = _names(journal.path / "github-requests", request_ledger=True) if "github-requests" in top else []
    names = [name for name in top if name != "github-requests"]
    names.extend("github-requests/" + name for name in ledger)
    saved = {}
    total = 0
    for name in names:
        raw = comments._read(journal.path / name)
        if raw is None:
            raise DeliveryError("STOP_INSPECTION_CHANGED")
        total += len(raw)
        if total > MAX_SNAPSHOT_BYTES:
            raise DeliveryError("STOP_INSPECTION_BYTE_BOUND")
        saved[name] = raw
    if saved.get("identity.json") != journal.identity:
        raise DeliveryError("STOP_JOURNAL_IDENTITY")
    return saved, top, ledger


def _reason(error: Exception) -> str:
    value = str(error)
    return value if isinstance(error, DeliveryError) and re.fullmatch(r"STOP_[A-Z0-9_]{1,80}", value) else "STOP_INSPECTION_INVALID_LOCAL_HISTORY"


def _attempt(key: str, saved: dict[str, bytes]) -> dict:
    files = {kind: saved[f"{key}.{kind}.json"] for kind in ("intent", "posted", "receipt")
             if f"{key}.{kind}.json" in saved}
    result = {"attemptKey": key, "fileSha256": {kind: _sha(raw) for kind, raw in files.items()},
              "remoteChecked": False, "automaticResendAllowed": False}
    try:
        if "intent" not in files:
            raise DeliveryError("STOP_ORPHAN_JOURNAL_ENTRY")
        data = json.loads(files["intent"])
        plan = comments.CommentPlan(data["destination"], data["authorId"], data["noticeId"],
                                    data["attemptKey"], data["body"], files["intent"])
        comments._validate_plan(plan)
        if plan.attempt_key != key:
            raise DeliveryError("STOP_INSPECTION_ATTEMPT_KEY")
        observed_id = receipt_id = None
        for kind in ("posted", "receipt"):
            if kind not in files:
                continue
            identifier = json.loads(files[kind])["commentId"]
            if type(identifier) is not int or not 1 <= identifier < 2**53:
                raise DeliveryError("STOP_INSPECTION_COMMENT_ID")
            expected = comments._observation(plan, identifier) if kind == "posted" else comments._receipt(plan, identifier)
            if expected != files[kind]:
                raise DeliveryError("STOP_INSPECTION_COMMENT_CONTENT")
            if kind == "posted":
                observed_id = identifier
            else:
                receipt_id = identifier
        if observed_id is not None and receipt_id is not None and observed_id != receipt_id:
            raise DeliveryError("STOP_INSPECTION_COMMENT_CONFLICT")
        result.update(destination=plan.destination, authorId=plan.author_id, noticeId=plan.notice_id,
                      commentId=receipt_id if receipt_id is not None else observed_id)
        if receipt_id is not None:
            result.update(status="receipt_recorded_locally", action="verify_pinned_receipt_by_authenticated_get_before_acknowledgement")
        elif observed_id is not None:
            result.update(status="post_id_recorded_unverified", action="preserve_history_then_review_exact_comment_id_without_resending")
        else:
            result.update(status="post_outcome_unknown", action="preserve_history_and_investigate_no_automatic_resend")
    except Exception as error:
        result.update(status="invalid_local_history", reason=_reason(error), action="stop_preserve_all_files_no_repair")
    return result


def inspect_journal(path: Path, identity_sha256: str, *, now: float | None = None) -> dict:
    """No writes or transport imports. Exit0=locally consistent,1=attention,2=invalid.

    Never provides an independent receipt pin, proves monitor ancestry, chooses
    authoritative storage, or permits bypassing an unresolved request reservation.
    Concurrent changes stop inspection; this is not a filesystem snapshot/lock.
    """
    result = {"operation": "inspect_source_notice_journal", "networkRequests": 0,
              "journalWrites": 0, "remoteChecked": False, "activationAuthorized": False,
              "automaticResendAllowed": False}
    try:
        now = time.time() if now is None else now
        if not _number(now):
            raise DeliveryError("STOP_INSPECTION_CLOCK")
        # Establish object types before the constructor opens even the identity.
        _names(comments._safe_root(path))
        journal = comments.LocalCommentJournal(path, expected_identity_sha256=identity_sha256)
        saved, top, ledger = _snapshot(journal)
        keys = sorted({match[1] for name in top if (match := ATTEMPT_FILE.fullmatch(name))})
        if len(keys) > MAX_HISTORY:
            raise DeliveryError("STOP_INSPECTION_ATTEMPT_BOUND")
        attempts = [_attempt(key, saved) for key in keys]
        budget = {"remoteChecked": False, "historyCanAuthorizeIO": False}
        if "github-requests" not in top:
            budget.update(status="not_initialized", action="choose_authoritative_storage_and_approved_setup_no_implicit_bootstrap")
        else:
            reservations = {name[:6] for name in ledger if name.endswith(".request.json")}
            results = {name[:6] for name in ledger if name.endswith(".result.json")}
            budget.update(reservationWithoutResult=sorted(reservations - results), resultWithoutReservation=sorted(results - reservations))
            try:
                index, last_hash, finished, until = validate_request_history(
                    GitHubRequestBudget._identity(journal), set(ledger),
                    lambda name: saved.get("github-requests/" + name))
                if now < finished:
                    raise DeliveryError("STOP_INSPECTION_CLOCK")
                wait = max(0, math.ceil(until - now))
                budget.update(status="history_full" if index > MAX_HISTORY else "cooldown" if wait else "locally_consistent",
                              completedRequests=index - 1, lastResultOrIdentitySha256=last_hash,
                              notBefore=until, remainingWaitSeconds=wait,
                              action="operator_planning_required" if index > MAX_HISTORY else
                              "preserve_cooldown_no_dispatch" if wait else "local_history_only_not_authorization_to_send")
            except Exception as error:
                budget.update(status="blocked", reason=_reason(error), action="stop_preserve_all_files_no_repair_or_resend")
        # Re-read all inspected bytes and membership. No silent successful snapshot
        # after a participating writer changed history during validation.
        if _names(journal.path) != top or ("github-requests" in top and
                _names(journal.path / "github-requests", request_ledger=True) != ledger):
            raise DeliveryError("STOP_INSPECTION_CHANGED")
        for name, raw in saved.items():
            comments._safe_root(journal.path / name)
            if comments._read(journal.path / name) != raw:
                raise DeliveryError("STOP_INSPECTION_CHANGED")
        invalid = any(item["status"] == "invalid_local_history" for item in attempts) or budget["status"] == "blocked"
        attention = any(item["status"] != "receipt_recorded_locally" for item in attempts) or budget["status"] != "locally_consistent"
        exit_code = 2 if invalid else 1 if attention else 0
        result.update(exitCode=exit_code, status="invalid_local_history" if invalid else "attention" if attention else "locally_consistent",
                      journalIdentitySha256=journal.identity_sha256, inspectedAtEpoch=now,
                      fileCount=len(saved), totalBytes=sum(map(len, saved.values())),
                      snapshotSha256=_sha(_encode({name: _sha(raw) for name, raw in saved.items()})),
                      attempts=attempts, requestBudget=budget)
    except Exception as error:
        result.update(exitCode=2, status="stopped", reason=_reason(error), action="preserve_all_files_no_repair_or_resend")
        if isinstance(error, OSError):
            result.update(osError=error.errno, winError=getattr(error, "winerror", None))
    return result


def main() -> int:
    if Path.cwd() != comments.ROOT or str(comments.ROOT) != r"C:\sgSHIOK2026":
        raise SystemExit("Wrong working root: inspect requires C:\\sgSHIOK2026")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--journal", type=Path, required=True)
    parser.add_argument("--journal-sha256", required=True)
    args = parser.parse_args()
    result = inspect_journal(args.journal, args.journal_sha256)
    print(json.dumps(result, sort_keys=True, ensure_ascii=True, allow_nan=False))
    return result["exitCode"]


if __name__ == "__main__":
    raise SystemExit(main())
