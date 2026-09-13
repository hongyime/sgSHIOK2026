"""Publish a fresh notice-acknowledgement checkpoint; never check or rebuild inputs.

Proofs bind each receipt to its original monitor pair and to the exact notice still
pending in the selected current state. Existing journal entries are GET-verified,
not sent or repaired. A successful checkpoint is NOT a successful metadata check.
The configured journal, receipt pins and ancestry remain trusted local state.
"""

import argparse
from copy import deepcopy
from datetime import UTC, datetime
import json
import os
from pathlib import Path
import re
from typing import Callable

from scripts import check_source_metadata as monitor
from scripts.source_metadata_comments import LocalCommentJournal, CommentTransport, plan_comment, verify_recorded_comment
from scripts.source_metadata_github import GitHubCommentClient
from scripts.source_metadata_state import acknowledge, trusted_previous

MAX_ACKNOWLEDGEMENTS = 8


def _instant(value: datetime) -> datetime:
    if not isinstance(value, datetime) or value.utcoffset() is None:
        raise monitor.MonitorError("STOP_ACK_CLOCK: timezone-aware clock required")
    return value.astimezone(UTC)


def _pending(states: dict) -> dict:
    return {notice["id"]: notice for state in states.values() for notice in state["pendingNotices"]}


def publish_checkpoint(root: Path, output: Path, *, previous: Path, proofs: list[dict],
                       destination: str, author_id: int, journal: LocalCommentJournal,
                       transport: CommentTransport,
                       clock: Callable[[], datetime] = lambda: datetime.now(UTC)) -> dict:
    """Bounded (1..8) receipt GETs followed by a new state/report pair, no other network.

    A later checker must explicitly choose this checkpoint with --previous. No
    pointer, old state/report or comment is modified. All proof failures occur
    before output creation; partial local publications remain non-restorable.
    """
    if (not isinstance(proofs, list) or not 1 <= len(proofs) <= MAX_ACKNOWLEDGEMENTS
            or any(not isinstance(proof, dict) or set(proof) != {"originState", "noticeId", "receiptSha256"}
                   or not isinstance(proof["originState"], str) or not isinstance(proof["noticeId"], str)
                   or not 1 <= len(proof["noticeId"]) <= 200 or not monitor._hash(proof["receiptSha256"])
                   for proof in proofs)
            or len({proof["noticeId"] for proof in proofs}) != len(proofs)):
        raise monitor.MonitorError("STOP_ACK_PROOFS: choose 1..8 unique pinned receipt references")
    started = _instant(clock())
    monitor._safe_path(root, output)
    if (output.parent != root / "qa/source-monitor"
            or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,79}", output.name) or output.exists()):
        raise monitor.MonitorError("STOP_ACK_OUTPUT: fresh direct qa/source-monitor child required")
    watched = {}

    def read(path: Path) -> bytes:
        value = monitor._read(monitor._safe_path(root, path))
        if path in watched and watched[path] != value:
            raise monitor.MonitorError("STOP_ACK_INPUT_CHANGED: preserve the original monitor pair")
        watched[path] = value
        return value

    catalog_path = root / "source-metadata-catalog.json"
    catalog_bytes = read(catalog_path)
    catalog_sha = monitor._sha(catalog_bytes)
    catalog = monitor.validate_catalog(monitor._json(catalog_bytes))
    cache = {}

    def load(path: Path) -> tuple[dict, dict, dict]:
        monitor._safe_path(root, path)
        if path.name != "state.json" or path.parent.parent != root / "qa/source-monitor":
            raise monitor.MonitorError("STOP_ACK_ORIGIN: named source-monitor state pair required")
        if path not in cache:
            state_bytes = read(path)
            report_bytes = read(path.with_name("report.json"))
            states, state_sha = monitor._restore(root, path, catalog, catalog_sha, started)
            if state_sha != monitor._sha(state_bytes):
                raise monitor.MonitorError("STOP_ACK_INPUT_CHANGED: state changed during restoration")
            envelope = monitor._json(state_bytes)
            monitor.validate_pair_content(envelope, monitor._json(report_bytes))
            cache[path] = (states, envelope,
                           {"catalogSha256": catalog_sha, "stateSha256": state_sha,
                            "reportSha256": monitor._sha(report_bytes)})
        return cache[path]

    states, current, current_identity = load(previous)
    pending = _pending(states)
    prepared = []
    for proof in proofs:
        origin_path = Path(proof["originState"])
        origins, origin, identity = load(origin_path)
        identifier = proof["noticeId"]
        original_notice = _pending(origins).get(identifier)
        current_notice = pending.get(identifier)
        if (original_notice is None or current_notice is None
                or original_notice != current_notice
                or datetime.fromisoformat(origin["finishedAt"]) > datetime.fromisoformat(current["finishedAt"])):
            raise monitor.MonitorError("STOP_ACK_NOTICE: receipt origin must match a still-pending current notice")
        plan = plan_comment(destination, identity, original_notice, author_id=author_id)
        prepared.append((proof, origin_path, plan))

    verified = []
    for proof, origin_path, plan in prepared:
        result = verify_recorded_comment(plan, journal=journal, transport=transport,
                                          expected_receipt_sha256=proof["receiptSha256"])
        if result["status"] != "verified":
            raise monitor.MonitorError("STOP_ACK_RECEIPT: " + result["reason"] + "; no checkpoint created")
        verified.append({"noticeId": plan.notice_id, "commentId": result["commentId"],
                         "receiptSha256": result["receiptSha256"],
                         "originState": origin_path.relative_to(root).as_posix(),
                         "originStateSha256": monitor._sha(watched[origin_path]),
                         "originReportSha256": monitor._sha(watched[origin_path.with_name("report.json")])})
    finished = _instant(clock())
    if finished < started:
        raise monitor.MonitorError("STOP_ACK_CLOCK: clock moved backwards")
    identifiers = [entry["noticeId"] for entry in verified]
    updated = deepcopy(states)
    for source in catalog["sources"]:
        key = source["key"]
        updated[key] = acknowledge(states[key], identifiers, finished)
        if trusted_previous(source, updated[key], finished) is None:
            raise monitor.MonitorError("STOP_ACK_STATE: invalid acknowledgement transition")
    if set(_pending(updated)) != set(pending) - set(identifiers):
        raise monitor.MonitorError("STOP_ACK_STATE: requested notice removal did not occur")
    # Recheck all pinned local inputs after remote reads and before any publication.
    for path, expected in watched.items():
        if monitor._read(monitor._safe_path(root, path)) != expected:
            raise monitor.MonitorError("STOP_ACK_INPUT_CHANGED: monitor input changed; no checkpoint created")
    envelope = {"schemaVersion": 1, "catalogSha256": catalog_sha,
                "finishedAt": finished.isoformat(), "sources": updated}
    report = {"schemaVersion": 1, "operation": "notice_acknowledgement",
              "startedAt": started.isoformat(), "finishedAt": finished.isoformat(),
              "catalogSha256": catalog_sha, "previousStateSha256": current_identity["stateSha256"],
              "previousState": previous.relative_to(root).as_posix(),
              "previousReportSha256": current_identity["reportSha256"],
              "sourceHealth": "not_rechecked", "checkCompleted": False,
              "metadataRequests": 0, "commentReads": len(verified),
              "destination": destination.lower(), "authorId": author_id,
              "journalIdentitySha256": journal.identity_sha256,
              "acknowledgements": verified, "pendingNotices": list(_pending(updated).values()),
              "exitCode": 0, "runStatus": "ok", "noticeDelivery": "verified_existing_receipts"}
    output.mkdir(parents=True, exist_ok=False)
    monitor._write(output / "state.json", envelope)
    saved = monitor._read(output / "state.json")
    expected = (json.dumps(envelope, indent=2, ensure_ascii=True, allow_nan=False) + "\n").encode("utf8")
    if saved != expected:
        raise monitor.MonitorError("STOP_ACK_STATE_READBACK: no completion published")
    report["persistence"] = {"status": "verified", "stateSha256": monitor._sha(saved)}
    monitor._validate_ack_completion(root, output / "state.json", envelope, report, catalog, finished)
    monitor._publish_report(output, report)
    return report


def main() -> int:
    if Path.cwd() != monitor.ROOT or str(monitor.ROOT) != r"C:\sgSHIOK2026":
        raise SystemExit("Wrong working root: acknowledgement requires C:\\sgSHIOK2026")
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("output", "previous", "proofs", "journal"):
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--journal-sha256", required=True)
    parser.add_argument("--destination", required=True)
    parser.add_argument("--author-id", type=int, required=True)
    args = parser.parse_args()
    try:
        proofs = monitor._json(monitor._read(monitor._safe_path(monitor.ROOT, args.proofs)))
        journal = LocalCommentJournal(args.journal, expected_identity_sha256=args.journal_sha256)
        client = GitHubCommentClient(args.destination, author_id=args.author_id,
                                     token=os.environ.get("SHIOK_NOTICE_TOKEN", ""))
        report = publish_checkpoint(monitor.ROOT, args.output, previous=args.previous, proofs=proofs,
                                     destination=args.destination, author_id=args.author_id,
                                     journal=journal, transport=client)
        print(json.dumps({"output": str(args.output), "operation": report["operation"], "exitCode": 0,
                          "metadataRequests": 0, "acknowledged": len(report["acknowledgements"]),
                          "remainingPending": len(report["pendingNotices"]), "sourceHealth": "not_rechecked"}))
        return 0
    except Exception as error:
        print(json.dumps({"operation": "notice_acknowledgement", "exitCode": 2,
                          "error": str(error) if isinstance(error, monitor.MonitorError) else
                          "STOP_ACK: no successful checkpoint; preserve partial output and inspect locally"}))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
