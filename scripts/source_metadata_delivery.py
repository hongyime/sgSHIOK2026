"""Historical abstract issue-replacement contract; not a GitHub activation path.

source_metadata_comments and source_metadata_github implement the replacement
append-only path. Keep these validation helpers and historical contract tests;
do not wire IssueTransport.update to GitHub PATCH.

Callers must first validate the monitor's immutable state/report pair. Only their
hashes and allowlisted notice fields enter this module, never report bodies or
credentials. Plans are intents, not delivery proof. A separate hash-pinned receipt
tracks delivery without calling acknowledge() or rewriting any monitor state.

Adapters must enforce the supplied byte/deadline limits, atomic compare-and-swap
and durable receipt publication. None is implemented or activated here. Callers
must retain a trusted receipt hash; a self-consistent receipt is not authenticated
storage or rollback protection. Ledger exhaustion stops, never silently prunes.

GitHub Issues PATCH support for this atomic-update contract is unverified and is
an activation gap. Read-then-PATCH must not be presented as atomic CAS. A provider
adapter needs primary-documentation verification or a separately reviewed recovery
model, not a silently weakened contract. Timeout arguments are adapter requirements:
synchronous Python calls are not preempted here. Enforced bounds cover planned
payload sizes and operation counts, not elapsed time or an adapter's internal retries.
"""

import hashlib
import json
import re
from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any, Protocol

from scripts.source_metadata_state import INSTANT, REASONS

MAX_NOTICES = 128
MAX_ISSUE_BYTES = 48 * 1024
MAX_RECEIPT_BYTES = 128 * 1024
OPERATION_SECONDS = 10
MONITOR_KEYS = {"catalogSha256", "stateSha256", "reportSha256"}
RECEIPT_KEYS = {"schemaVersion", "status", "destination", "monitor", "generation",
                "previousReceiptSha256", "notices", "issueBodySha256"}


class DeliveryError(ValueError):
    """Fixed local validation codes; never include caller or transport content."""


class IssueTransport(Protocol):
    def read(self, destination: str, *, max_bytes: int, timeout_seconds: int) -> dict:
        """Return exactly destination/body, from the named existing issue."""
        ...

    def update(self, destination: str, body: str, *, expected_body_sha256: str,
               timeout_seconds: int) -> bool:
        """Require atomic expected-body match; not a claim of GitHub PATCH support."""
        ...


class ReceiptStore(Protocol):
    def read(self, *, max_bytes: int, timeout_seconds: int) -> bytes | None:
        """Return exact committed receipt bytes, or None if never initialized."""
        ...

    def commit(self, receipt: bytes, *, expected_sha256: str | None,
               timeout_seconds: int) -> bool:
        """Durably publish with CAS; None expects an absent initial receipt."""
        ...


def _sha(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _hash(value: Any) -> bool:
    return (isinstance(value, str) and len(value) == 64
            and re.fullmatch(r"[a-f0-9]{64}", value) is not None)


def _encode(value: Any) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":"),
                       ensure_ascii=True, allow_nan=False) + "\n").encode("ascii")


def _monitor(value: Any) -> dict:
    if (not isinstance(value, dict) or set(value) != MONITOR_KEYS
            or not all(_hash(item) for item in value.values())):
        raise DeliveryError("STOP_MONITOR_IDENTITY")
    return dict(value)


def _notices(values: Any) -> list[dict]:
    if not isinstance(values, list) or len(values) > MAX_NOTICES:
        raise DeliveryError("STOP_NOTICE_BOUND")
    unique = {}
    for value in values:
        if not isinstance(value, dict) or set(value) != {
                "id", "sourceKey", "episode", "kind", "reasons", "createdAt"}:
            raise DeliveryError("STOP_NOTICE_SCHEMA")
        key, episode, identifier = value["sourceKey"], value["episode"], value["id"]
        if (not isinstance(key, str) or not re.fullmatch(r"[a-z][a-z0-9_]{0,99}", key)
                or type(episode) is not int or not 1 <= episode < 2**53
                or not isinstance(identifier, str)
                or len(identifier) != len(f"{key}:{episode}:") + 64
                or not identifier.startswith(f"{key}:{episode}:")
                or not _hash(identifier[len(f"{key}:{episode}:"):])):
            raise DeliveryError("STOP_NOTICE_IDENTITY")
        reasons, created = value["reasons"], value["createdAt"]
        if (value["kind"] not in {"action", "recovery"}
                or not isinstance(reasons, list) or not 1 <= len(reasons) <= len(REASONS)
                or any(not isinstance(reason, str) or len(reason) > 64 or reason not in REASONS
                       for reason in reasons)
                or len(set(reasons)) != len(reasons)
                or not isinstance(created, str) or len(created) > 40
                or not INSTANT.fullmatch(created)):
            raise DeliveryError("STOP_NOTICE_FIELDS")
        instant = datetime.fromisoformat(created)
        if abs(instant.utcoffset().total_seconds()) > 14 * 3600:
            raise DeliveryError("STOP_NOTICE_TIME")
        clean = {"id": identifier, "sourceKey": key, "episode": episode,
                 "kind": value["kind"], "reasons": sorted(reasons),
                 "createdAt": instant.astimezone(UTC).isoformat().replace("+00:00", "Z")}
        if identifier in unique and unique[identifier] != clean:
            raise DeliveryError("STOP_NOTICE_CONFLICT")
        unique[identifier] = clean
    return [unique[key] for key in sorted(unique)]


def _body(catalog_sha256: str, notices: list[dict]) -> str:
    content = _encode({"schemaVersion": 1, "catalogSha256": catalog_sha256,
                       "notices": notices}).decode("ascii")
    body = "Source metadata notice history; not dataset validation.\n\n```json\n" + content + "```\n"
    if len(body) > MAX_ISSUE_BYTES:
        raise DeliveryError("STOP_ISSUE_BOUND")
    return body


def _restore(previous: bytes | None, expected: str | None, destination: str,
             monitor: dict, bootstrap: bool) -> dict | None:
    if type(bootstrap) is not bool:
        raise DeliveryError("STOP_BOOTSTRAP")
    if previous is None:
        if not bootstrap or expected is not None:
            raise DeliveryError("STOP_PRIOR_RECEIPT_MISSING")
        return None
    if (bootstrap or not isinstance(previous, bytes) or len(previous) > MAX_RECEIPT_BYTES
            or not _hash(expected) or _sha(previous) != expected):
        raise DeliveryError("STOP_PRIOR_RECEIPT_IDENTITY")
    value = json.loads(previous.decode("utf8"))
    if (not isinstance(value, dict) or set(value) != RECEIPT_KEYS
            or type(value["schemaVersion"]) is not int or value["schemaVersion"] != 1
            or value["status"] != "verified" or value["destination"] != destination
            or type(value["generation"]) is not int or not 1 <= value["generation"] < 2**53
            or _monitor(value["monitor"])["catalogSha256"] != monitor["catalogSha256"]):
        raise DeliveryError("STOP_PRIOR_RECEIPT_SCHEMA")
    if ((value["generation"] == 1 and value["previousReceiptSha256"] is not None)
            or (value["generation"] > 1 and not _hash(value["previousReceiptSha256"]))):
        raise DeliveryError("STOP_PRIOR_RECEIPT_CHAIN")
    notices = _notices(value["notices"])
    if (notices != value["notices"] or not notices or _encode(value) != previous
            or value["issueBodySha256"] != _sha(_body(monitor["catalogSha256"], notices).encode())):
        raise DeliveryError("STOP_PRIOR_RECEIPT_CONTENT")
    return value


def plan_delivery(destination: str, monitor: dict, notices: list[dict], *,
                  previous_receipt: bytes | None = None,
                  expected_receipt_sha256: str | None = None, bootstrap: bool = False) -> dict:
    """Plan one bounded issue replacement. No IO and no acknowledgement authority.

    Bootstrap must explicitly designate a dedicated empty issue. Later calls must
    supply the pinned previous receipt; missing/corrupt state never becomes bootstrap.
    The full bounded history retains exact IDs, including distinct recovery episodes.
    """
    try:
        if (not isinstance(destination, str) or not re.fullmatch(
                r"[A-Za-z0-9][A-Za-z0-9_-]{0,99}/[A-Za-z0-9][A-Za-z0-9_.-]{0,99}#[1-9][0-9]{0,14}",
                destination)):
            raise DeliveryError("STOP_DESTINATION")
        identity = _monitor(monitor)
        incoming = _notices(notices)
        prior = _restore(previous_receipt, expected_receipt_sha256, destination, identity, bootstrap)
        known = {notice["id"]: notice for notice in prior["notices"]} if prior else {}
        new_ids = []
        for notice in incoming:
            if notice["id"] in known and known[notice["id"]] != notice:
                raise DeliveryError("STOP_NOTICE_CONFLICT")
            if notice["id"] not in known:
                new_ids.append(notice["id"])
            known[notice["id"]] = notice
        if len(known) > MAX_NOTICES:
            raise DeliveryError("STOP_LEDGER_FULL")
        ledger = [known[key] for key in sorted(known)]
        body = _body(identity["catalogSha256"], ledger)
        candidate = {"schemaVersion": 1, "status": "pending", "destination": destination,
                     "monitor": identity, "generation": prior["generation"] + 1 if prior else 1,
                     "previousReceiptSha256": expected_receipt_sha256,
                     "notices": ledger, "issueBodySha256": _sha(body.encode())}
        if prior and not new_ids and prior["monitor"] == identity:
            candidate = {**prior, "status": "pending"}
        if (candidate["generation"] >= 2**53
                or len(_encode({**candidate, "status": "verified"})) > MAX_RECEIPT_BYTES):
            raise DeliveryError("STOP_RECEIPT_BOUND")
        return {"destination": destination, "body": body,
                "previousBody": _body(identity["catalogSha256"], prior["notices"]) if prior else "",
                "previousReceiptSha256": expected_receipt_sha256,
                "noticeIds": [notice["id"] for notice in incoming], "newNoticeIds": new_ids,
                "receiptCandidate": candidate, "emptyBootstrap": not prior and not ledger}
    except DeliveryError:
        raise
    except (ValueError, TypeError, KeyError, OverflowError, RecursionError):
        raise DeliveryError("STOP_INVALID_DELIVERY_INPUT") from None


def _issue_body(value: Any, destination: str) -> str:
    if (not isinstance(value, dict) or set(value) != {"destination", "body"}
            or value["destination"] != destination or not isinstance(value["body"], str)
            or len(value["body"]) > MAX_ISSUE_BYTES
            or len(value["body"].encode("utf8")) > MAX_ISSUE_BYTES):
        raise DeliveryError("STOP_ISSUE_READBACK")
    return value["body"]


def _stopped(reason: str) -> dict:
    return {"status": "stopped", "reason": reason,
            "acknowledgedIds": [], "receiptSha256": None}


def _attempt(operation: Callable[[], Any]) -> tuple[bool, Any]:
    try:
        return True, operation()
    except Exception:  # noqa: BLE001 - Adapter exceptions can contain secrets; interrupts propagate.
        return False, None


def deliver_notices(destination: str, monitor: dict, notices: list[dict], *,
                    transport: IssueTransport, receipts: ReceiptStore,
                    previous_receipt: bytes | None = None,
                    expected_receipt_sha256: str | None = None, bootstrap: bool = False) -> dict:
    """At most 2 issue reads, 1 conditional update, 2 receipt reads and 1 CAS commit.

    No retries. Any failed send/readback/persistence returns zero acknowledgement
    IDs, including when the remote write may have succeeded. A restart can reconcile
    the exact planned body/complete receipt without resending. Returned IDs are only
    delivery acknowledgements; never splice them into a hash-bound monitor state file.
    """
    try:
        plan = plan_delivery(destination, monitor, notices, previous_receipt=previous_receipt,
                             expected_receipt_sha256=expected_receipt_sha256, bootstrap=bootstrap)
    except DeliveryError:
        return _stopped("invalid_plan")
    if plan["emptyBootstrap"]:
        return {"status": "noop", "reason": "no_notices",
                "acknowledgedIds": [], "receiptSha256": None}
    completed = _encode({**plan["receiptCandidate"], "status": "verified"})
    loaded, current = _attempt(lambda: receipts.read(
        max_bytes=MAX_RECEIPT_BYTES, timeout_seconds=OPERATION_SECONDS))
    if not loaded:
        return _stopped("receipt_load_failed")
    # Accept only the pinned predecessor or this exact completed attempt after a crash.
    if current is not None and (not isinstance(current, bytes) or len(current) > MAX_RECEIPT_BYTES):
        return _stopped("receipt_conflict")
    if current != previous_receipt and current != completed:
        return _stopped("receipt_conflict")
    read, body = _attempt(lambda: _issue_body(transport.read(
        destination, max_bytes=MAX_ISSUE_BYTES, timeout_seconds=OPERATION_SECONDS), destination))
    if not read:
        return _stopped("issue_read_failed")
    if body != plan["body"]:
        if body != plan["previousBody"] or current == completed:
            return _stopped("issue_conflict")
        accepted, sent = _attempt(lambda: transport.update(
            destination, plan["body"], expected_body_sha256=_sha(body.encode()),
            timeout_seconds=OPERATION_SECONDS))
        if not accepted or sent is not True:
            return _stopped("issue_update_failed")
        read, body = _attempt(lambda: _issue_body(transport.read(
            destination, max_bytes=MAX_ISSUE_BYTES, timeout_seconds=OPERATION_SECONDS), destination))
        if not read:
            return _stopped("issue_readback_failed")
        if body != plan["body"]:
            return _stopped("issue_readback_mismatch")
    if current != completed:
        accepted, saved = _attempt(lambda: receipts.commit(
            completed, expected_sha256=plan["previousReceiptSha256"],
            timeout_seconds=OPERATION_SECONDS))
        if not accepted or saved is not True:
            return _stopped("receipt_commit_failed")
    read, persisted = _attempt(lambda: receipts.read(
        max_bytes=MAX_RECEIPT_BYTES, timeout_seconds=OPERATION_SECONDS))
    if not read:
        return _stopped("receipt_readback_failed")
    if not isinstance(persisted, bytes) or persisted != completed:
        return _stopped("receipt_readback_mismatch")
    return {"status": "verified", "reason": "issue_and_receipt_read_back",
            "acknowledgedIds": plan["noticeIds"], "receiptSha256": _sha(completed)}
