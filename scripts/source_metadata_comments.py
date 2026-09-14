"""Append-only notices with a local, create-only send journal.

No scheduler or CLI activates this path. A caller must first validate the monitor
state/report and pin the destination and expected GitHub author ID. No monitor
state is rewritten here. An existing intent NEVER authorizes another POST, even
if no comment is visible: a timed-out request could still finish remotely.

The journal is single-host storage, not a distributed lock, authenticated backup,
rollback defense or power-loss guarantee. Retain it and its initialization pin;
lost history is an operator incident, not permission to bootstrap again.
The local directory and its ancestors must be trusted and stable. Link checks
reject existing substitutions; they are not a handle-based sandbox against a
concurrent directory-to-junction attack by another local writer.
"""

from dataclasses import dataclass
import json
import os
from pathlib import Path
import re
from typing import Protocol
from uuid import uuid4

from scripts.source_metadata_delivery import DeliveryError, _encode, _hash, _monitor, _notices, _sha

ROOT = Path(__file__).resolve().parents[1]
MAX_FILE_BYTES = 64 * 1024
DESTINATION = re.compile(r"[A-Za-z0-9][A-Za-z0-9_-]{0,99}/[A-Za-z0-9][A-Za-z0-9_.-]{0,99}#[1-9][0-9]{0,14}")


@dataclass(frozen=True)
class CommentPlan:
    destination: str
    author_id: int
    notice_id: str
    attempt_key: str
    body: str
    intent: bytes


def plan_comment(destination: str, monitor: dict, notice: dict, *, author_id: int) -> CommentPlan:
    """One notice per comment; retries must retain the original pinned plan."""
    if (not isinstance(destination, str) or not DESTINATION.fullmatch(destination)
            or type(author_id) is not int or not 1 <= author_id < 2**53):
        raise DeliveryError("STOP_COMMENT_DESTINATION")
    identity = _monitor(monitor)
    clean = _notices([notice])[0]
    # Author/content changes must conflict with the same claim, not permit a resend.
    key = _sha(_encode([destination.lower(), identity["catalogSha256"], clean["id"]]))
    payload = {"schemaVersion": 2, "monitor": identity, "notice": clean}
    body = (f"<!-- sgshiok-source-notice:{key} -->\n"
            "Source metadata notice; not dataset validation.\n\n```json\n"
            + _encode(payload).decode("ascii") + "```\n")
    intent = _encode({"schemaVersion": 1, "destination": destination.lower(),
                      "authorId": author_id, "noticeId": clean["id"],
                      "attemptKey": key, "body": body})
    if len(intent) > MAX_FILE_BYTES:
        raise DeliveryError("STOP_COMMENT_BOUND")
    return CommentPlan(destination.lower(), author_id, clean["id"], key, body, intent)


def _validate_plan(plan: CommentPlan) -> None:
    if (not isinstance(plan, CommentPlan) or not isinstance(plan.intent, bytes)
            or not isinstance(plan.body, str) or len(plan.intent) > MAX_FILE_BYTES
            or len(plan.body) > MAX_FILE_BYTES):
        raise DeliveryError("STOP_COMMENT_PLAN")
    try:
        data = json.loads(plan.intent)
        payload = json.loads(plan.body.split("```json\n", 1)[1].removesuffix("```\n"))
        expected = plan_comment(data["destination"], payload["monitor"], payload["notice"],
                                author_id=data["authorId"])
        if plan != expected:
            raise ValueError
    except (KeyError, ValueError, TypeError, IndexError, RecursionError):
        raise DeliveryError("STOP_COMMENT_PLAN") from None


def _safe_root(path: Path) -> Path:
    if not isinstance(path, Path) or not path.is_absolute():
        raise DeliveryError("STOP_JOURNAL_PATH")
    # Only designated scratch state, never raw, exported data or historical evidence.
    allowed = ROOT / "tmp" / "source-notice-journals"
    if not path.is_relative_to(allowed) or path == allowed or ".." in path.parts:
        raise DeliveryError("STOP_JOURNAL_PATH")
    current = ROOT
    for part in path.relative_to(ROOT).parts:
        current = current / part
        if current.is_symlink() or (hasattr(current, "is_junction") and current.is_junction()):
            raise DeliveryError("STOP_JOURNAL_LINK")
    resolved = path.resolve()
    if not resolved.is_relative_to(allowed):
        raise DeliveryError("STOP_JOURNAL_PATH")
    return resolved


def _read(path: Path) -> bytes | None:
    if path.is_symlink() or (hasattr(path, "is_junction") and path.is_junction()):
        raise DeliveryError("STOP_JOURNAL_LINK")
    try:
        with path.open("rb") as handle:
            value = handle.read(MAX_FILE_BYTES + 1)
    except FileNotFoundError:
        return None
    if len(value) > MAX_FILE_BYTES:
        raise DeliveryError("STOP_JOURNAL_BOUND")
    return value


def _publish(path: Path, value: bytes) -> bool:
    """Exclusive creation is the send claim. Partial files are retained and stop recovery."""
    if len(value) > MAX_FILE_BYTES:
        raise DeliveryError("STOP_JOURNAL_BOUND")
    try:
        with path.open("xb") as handle:
            handle.write(value)
            handle.flush()
            os.fsync(handle.fileno())
    except FileExistsError:
        if _read(path) != value:
            raise DeliveryError("STOP_JOURNAL_CONFLICT") from None
        return False
    if _read(path) != value:
        raise DeliveryError("STOP_JOURNAL_READBACK")
    return True


class LocalCommentJournal:
    """Explicit initialization; no implicit directory/history repair or overwrite."""

    @classmethod
    def initialize(cls, path: Path) -> "LocalCommentJournal":
        path = _safe_root(path)
        path.mkdir(parents=True, exist_ok=False)
        identity = _encode({"schemaVersion": 1, "purpose": "source-metadata-append-only-comments",
                            "journalId": str(uuid4())})
        _publish(path / "identity.json", identity)
        return cls(path, expected_identity_sha256=_sha(identity))

    def __init__(self, path: Path, *, expected_identity_sha256: str):
        self.path = _safe_root(path)
        identity = _read(self.path / "identity.json")
        if (not _hash(expected_identity_sha256) or identity is None
                or _sha(identity) != expected_identity_sha256):
            raise DeliveryError("STOP_JOURNAL_IDENTITY")
        data = json.loads(identity)
        if (not isinstance(data, dict) or set(data) != {"schemaVersion", "purpose", "journalId"}
                or type(data["schemaVersion"]) is not int or data["schemaVersion"] != 1
                or data["purpose"] != "source-metadata-append-only-comments"
                or not isinstance(data["journalId"], str)
                or not re.fullmatch(r"[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}", data["journalId"])
                or _encode(data) != identity):
            raise DeliveryError("STOP_JOURNAL_IDENTITY")
        self.identity = identity
        self.identity_sha256 = expected_identity_sha256

    def _path(self, plan: CommentPlan, suffix: str) -> Path:
        _validate_plan(plan)
        # Recheck the root each time; no cached permission to follow a substituted link.
        if _safe_root(self.path) != self.path or _read(self.path / "identity.json") != self.identity:
            raise DeliveryError("STOP_JOURNAL_IDENTITY")
        return self.path / f"{plan.attempt_key}.{suffix}.json"

    def claim(self, plan: CommentPlan) -> bool:
        intent_path = self._path(plan, "intent")
        if _read(intent_path) is None and (self.receipt(plan) is not None or self.observation(plan) is not None):
            raise DeliveryError("STOP_ORPHAN_JOURNAL_ENTRY")
        return _publish(intent_path, plan.intent)

    def has_claim(self, plan: CommentPlan) -> bool:
        """Inspect before admission; never reserve a notice merely to check limits."""
        saved = _read(self._path(plan, "intent"))
        if saved is None:
            if self.receipt(plan) is not None or self.observation(plan) is not None:
                raise DeliveryError("STOP_ORPHAN_JOURNAL_ENTRY")
            return False
        if saved != plan.intent:
            raise DeliveryError("STOP_JOURNAL_CONFLICT")
        return True

    def require_claim(self, plan: CommentPlan) -> None:
        """Read-only validation: acknowledgement must never create a missing intent."""
        if _read(self._path(plan, "intent")) != plan.intent:
            raise DeliveryError("STOP_JOURNAL_CLAIM")

    def receipt(self, plan: CommentPlan) -> bytes | None:
        return _read(self._path(plan, "receipt"))

    def observation(self, plan: CommentPlan) -> bytes | None:
        return _read(self._path(plan, "posted"))

    def observe(self, plan: CommentPlan, comment_id: int) -> None:
        _publish(self._path(plan, "posted"), _observation(plan, comment_id))

    def verify(self, plan: CommentPlan, receipt: bytes) -> bytes:
        _publish(self._path(plan, "receipt"), receipt)
        saved = self.receipt(plan)
        if saved != receipt:
            raise DeliveryError("STOP_JOURNAL_READBACK")
        return saved


class CommentTransport(Protocol):
    def create(self, plan: CommentPlan) -> dict:
        """Exactly one POST, no retries. Return normalized ID/destination/author/body."""
        ...

    def read(self, plan: CommentPlan, comment_id: int) -> dict:
        """Authenticated GET of the exact comment; validate its issue URL too."""
        ...

    def find(self, plan: CommentPlan) -> list[dict]:
        """One complete authenticated page only. Return marker matches; never negative proof."""
        ...


def _comment(value: dict, plan: CommentPlan, expected_id: int | None = None) -> int:
    if (not isinstance(value, dict) or set(value) != {"id", "destination", "authorId", "body"}
            or type(value["id"]) is not int or not 1 <= value["id"] < 2**53
            or (expected_id is not None and value["id"] != expected_id)
            or value["destination"] != plan.destination
            or type(value["authorId"]) is not int or value["authorId"] != plan.author_id
            or value["body"] != plan.body):
        raise DeliveryError("STOP_COMMENT_READBACK")
    return value["id"]


def _receipt(plan: CommentPlan, comment_id: int) -> bytes:
    return _encode({"schemaVersion": 1, "status": "verified", "destination": plan.destination,
                    "authorId": plan.author_id, "commentId": comment_id,
                    "intentSha256": _sha(plan.intent), "bodySha256": _sha(plan.body.encode())})


def _observation(plan: CommentPlan, comment_id: int) -> bytes:
    return _encode({"schemaVersion": 1, "status": "unverified_post_response",
                    "intentSha256": _sha(plan.intent), "commentId": comment_id})


def verify_recorded_comment(plan: CommentPlan, *, journal: LocalCommentJournal,
                            transport: CommentTransport, expected_receipt_sha256: str) -> dict:
    """Read only: a pinned existing receipt and exact authenticated GET, never POST.

    This is the acknowledgement/checkpoint path. It does not claim, reconcile an
    unknown outcome or change notice evidence. A production transport separately
    persists request-budget records; GET-only does not mean filesystem-read-only.
    """
    stage = "invalid_receipt_pin"
    try:
        _validate_plan(plan)
        if not _hash(expected_receipt_sha256):
            raise DeliveryError("STOP_RECEIPT_PIN")
        stage = "recorded_receipt_invalid"
        journal.require_claim(plan)
        saved = journal.receipt(plan)
        observed = journal.observation(plan)
        if saved is None or _sha(saved) != expected_receipt_sha256:
            raise DeliveryError("STOP_RECEIPT_PIN")
        comment_id = json.loads(saved)["commentId"]
        if (type(comment_id) is not int or not 1 <= comment_id < 2**53
                or saved != _receipt(plan, comment_id)
                or (observed is not None and observed != _observation(plan, comment_id))):
            raise DeliveryError("STOP_RECEIPT_CONTENT")
        stage = "comment_readback_failed"
        _comment(transport.read(plan, comment_id), plan, comment_id)
        stage = "recorded_receipt_changed"
        journal.require_claim(plan)
        if journal.receipt(plan) != saved or journal.observation(plan) != observed:
            raise DeliveryError("STOP_JOURNAL_CHANGED")
        return {"status": "verified", "reason": "recorded_comment_read_back",
                "commentId": comment_id, "acknowledgedIds": [plan.notice_id],
                "receiptSha256": expected_receipt_sha256}
    except Exception:
        return {"status": "stopped", "reason": stage, "commentId": None,
                "acknowledgedIds": [], "receiptSha256": None}


def deliver_comment(plan: CommentPlan, *, journal: LocalCommentJournal,
                    transport: CommentTransport) -> dict:
    """Claim before POST, exact authenticated readback before a create-only receipt.

    Existing intent + missing receipt means reconciliation only, even after an
    explicit rejection. Zero/multiple/forged matches return no acknowledgement.
    A later run must reopen this same journal. No monitor acknowledge() is called.
    """
    stage = "invalid_plan"
    try:
        _validate_plan(plan)
        stage = "journal_claim_failed"
        admitted_create = getattr(transport, "create_once", None)
        deferred_claim = callable(admitted_create) and not journal.has_claim(plan)
        fresh = True if deferred_claim else journal.claim(plan)
        stage = "journal_receipt_failed"
        saved = journal.receipt(plan)
        observed = journal.observation(plan)
        if fresh and saved is not None:
            raise DeliveryError("STOP_RECEIPT_WITHOUT_INTENT")
        observed_id = None
        if observed is not None:
            stage = "observation_conflict"
            data = json.loads(observed)
            observed_id = data["commentId"]
            if (type(observed_id) is not int or not 1 <= observed_id < 2**53
                    or observed != _observation(plan, observed_id)):
                raise DeliveryError("STOP_POST_OBSERVATION")
        if saved is not None:
            stage = "receipt_conflict"
            data = json.loads(saved)
            comment_id = data["commentId"]
            if (type(comment_id) is not int or not 1 <= comment_id < 2**53
                    or saved != _receipt(plan, comment_id)
                    or (observed_id is not None and observed_id != comment_id)):
                raise DeliveryError("STOP_RECEIPT_CONTENT")
        elif observed_id is not None:
            comment_id = observed_id
        elif fresh:
            stage = "post_outcome_uncertain"
            comment_id = _comment(admitted_create(plan, journal) if deferred_claim else transport.create(plan), plan)
            stage = "post_observation_failed"
            journal.observe(plan, comment_id)
        else:
            stage = "reconciliation_failed"
            matches = transport.find(plan)
            if not isinstance(matches, list) or len(matches) != 1:
                stage = "reconciliation_requires_operator"
                raise DeliveryError("STOP_COMMENT_MATCH_COUNT")
            comment_id = _comment(matches[0], plan)
        stage = "comment_readback_failed"
        _comment(transport.read(plan, comment_id), plan, comment_id)
        stage = "receipt_publish_failed"
        receipt = journal.verify(plan, _receipt(plan, comment_id))
        return {"status": "verified", "reason": "comment_and_journal_read_back",
                "commentId": comment_id, "acknowledgedIds": [plan.notice_id],
                "receiptSha256": _sha(receipt)}
    except Exception:  # Adapter/storage content may contain secrets. Interrupts still propagate.
        return {"status": "stopped", "reason": stage, "commentId": None,
                "acknowledgedIds": [], "receiptSha256": None}
