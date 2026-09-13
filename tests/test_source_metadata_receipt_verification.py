"""Pinned receipt verification with real local journals and synthetic GETs only."""

import builtins
from copy import deepcopy
from dataclasses import dataclass, replace
import hashlib
import io
import json
import os
from pathlib import Path
import socket
import subprocess
from uuid import uuid4

import pytest

from scripts import source_metadata_comments as comments
from scripts.source_metadata_delivery import DeliveryError
from scripts.source_metadata_github import GitHubCommentClient
from tests.test_source_metadata_comments import plan as make_plan, remote


ROOT = Path(r"C:\sgSHIOK2026")
DEFAULT = object()
RAW_OPEN = io.open
SECRET = "synthetic-sensitive-diagnostic"


def snapshot(root: Path) -> dict:
    return {
        path.relative_to(root).as_posix(): (
            None if path.is_dir() else path.read_bytes(), path.stat().st_mtime_ns
        )
        for path in root.rglob("*")
    }


@dataclass
class Recorded:
    journal: comments.LocalCommentJournal
    plan: comments.CommentPlan
    receipt: bytes
    pin: str
    comment_id: int

    def path(self, suffix: str) -> Path:
        name = "identity.json" if suffix == "identity" else f"{self.plan.attempt_key}.{suffix}.json"
        return self.journal.path / name

    def corrupt(self, suffix: str, content: bytes) -> None:
        # Deliberate fixture mutation bypasses the verifier's write guards, never its reads.
        path = self.path(suffix)
        assert path.is_absolute() and path.parent == self.journal.path
        with RAW_OPEN(path, "wb") as handle:
            handle.write(content)


class FakeGet:
    def __init__(self, recorded: Recorded, *, response=DEFAULT, fault=None, during_get=None):
        self.recorded = recorded
        self.response = response
        self.fault = fault
        self.during_get = during_get
        self.calls = []
        self.expected_files = None

    def read(self, plan, comment_id):
        self.calls.append(("GET", plan, comment_id))
        assert plan == self.recorded.plan and comment_id == self.recorded.comment_id
        if self.during_get is not None:
            self.during_get()
            self.expected_files = snapshot(self.recorded.journal.path)
        if self.fault is not None:
            raise self.fault
        if self.response is DEFAULT:
            return remote(self.recorded.plan, self.recorded.comment_id)
        return deepcopy(self.response)

    def create(self, *args, **kwargs):
        pytest.fail("Unexpected POST")

    def find(self, *args, **kwargs):
        pytest.fail("Unexpected LIST")


@pytest.fixture(autouse=True)
def deny_network_and_processes(monkeypatch):
    def forbidden(*args, **kwargs):
        pytest.fail("Real network or subprocess access is forbidden")

    for target, names in (
        (socket, ("create_connection", "getaddrinfo")),
        (socket.socket, ("connect", "connect_ex", "sendto")),
        (subprocess, ("run", "Popen")),
    ):
        for name in names:
            monkeypatch.setattr(target, name, forbidden)


@pytest.fixture
def record():
    assert Path.cwd() == ROOT and comments.ROOT == ROOT

    def create(*, claim=True, receipt=True, observation=False, comment_id=81):
        path = ROOT / "tmp" / "source-notice-journals" / uuid4().hex
        journal = comments.LocalCommentJournal.initialize(path)
        plan = make_plan()
        saved = comments._receipt(plan, comment_id)
        if claim:
            journal.claim(plan)
        if observation:
            journal.observe(plan, comment_id)
        if receipt:
            journal.verify(plan, saved)
        return Recorded(journal, plan, saved, hashlib.sha256(saved).hexdigest(), comment_id)

    return create


@pytest.fixture
def verify(monkeypatch):
    def invoke(recorded, transport=None, *, pin=DEFAULT, plan=None):
        transport = transport if transport is not None else FakeGet(recorded)
        before = snapshot(recorded.journal.path)
        unsafe = []

        def forbidden(*args, **kwargs):
            unsafe.append("unsafe call")
            pytest.fail("Verification attempted a write, claim, delivery, POST or LIST")

        def guard_open(original):
            def checked(file, mode="r", *args, **kwargs):
                if any(flag in mode for flag in "wax+"):
                    forbidden()
                return original(file, mode, *args, **kwargs)
            return checked

        with monkeypatch.context() as guard:
            for target, names in (
                (comments.LocalCommentJournal, ("initialize", "claim", "observe", "verify")),
                (comments, ("_publish", "deliver_comment")),
                (transport, ("create", "find")),
                (os, ("mkdir", "link", "rename", "replace", "remove", "unlink", "rmdir")),
            ):
                for name in names:
                    guard.setattr(target, name, forbidden)
            guard.setattr(builtins, "open", guard_open(builtins.open))
            guard.setattr(io, "open", guard_open(io.open))
            try:
                result = comments.verify_recorded_comment(
                    recorded.plan if plan is None else plan,
                    journal=recorded.journal,
                    transport=transport,
                    expected_receipt_sha256=recorded.pin if pin is DEFAULT else pin,
                )
            finally:
                assert unsafe == []
                expected = getattr(transport, "expected_files", None)
                assert snapshot(recorded.journal.path) == (before if expected is None else expected)
        return result, transport

    return invoke


def stopped(result: dict, reason: str) -> None:
    assert result == {
        "status": "stopped", "reason": reason, "commentId": None,
        "acknowledgedIds": [], "receiptSha256": None,
    }
    assert SECRET not in json.dumps(result)


@pytest.mark.parametrize("observation", [False, True])
@pytest.mark.parametrize("reopen", [False, True])
def test_existing_receipt_verifies_once_without_any_journal_write(record, verify, observation, reopen):
    saved = record(observation=observation)
    if reopen:
        saved.journal = comments.LocalCommentJournal(
            saved.journal.path, expected_identity_sha256=saved.journal.identity_sha256
        )
    result, transport = verify(saved)
    assert result == {
        "status": "verified", "reason": "recorded_comment_read_back",
        "commentId": saved.comment_id, "acknowledgedIds": [saved.plan.notice_id],
        "receiptSha256": saved.pin,
    }
    assert transport.calls == [("GET", saved.plan, saved.comment_id)]


@pytest.mark.parametrize("pin", [
    None, True, 0, b"a" * 64, "", "a" * 63, "a" * 65, "A" * 64,
    "g" * 64, " " + "a" * 64, "a" * 64 + "\n", [], {},
])
def test_malformed_independent_pin_stops_before_get(record, verify, pin):
    result, transport = verify(record(), pin=pin)
    stopped(result, "invalid_receipt_pin")
    assert transport.calls == []


def test_well_formed_but_wrong_pin_stops_before_get(record, verify):
    result, transport = verify(record(), pin="f" * 64)
    stopped(result, "recorded_receipt_invalid")
    assert transport.calls == []


@pytest.mark.parametrize("claim,receipt,observation", [
    (False, False, False), (False, True, False), (False, False, True),
    (False, True, True), (True, False, False), (True, False, True),
])
def test_missing_claim_or_receipt_never_repairs_or_reconciles(
    record, verify, claim, receipt, observation
):
    result, transport = verify(record(claim=claim, receipt=receipt, observation=observation))
    stopped(result, "recorded_receipt_invalid")
    assert transport.calls == []


@pytest.mark.parametrize("content", [b"", b'{"partial":', b"\xff", b"{}"])
@pytest.mark.parametrize("suffix", ["identity", "intent"])
def test_corrupt_identity_or_claim_is_not_rewritten(record, verify, content, suffix):
    saved = record()
    saved.corrupt(suffix, content)
    result, transport = verify(saved)
    stopped(result, "recorded_receipt_invalid")
    assert transport.calls == []


def test_equivalent_but_nonidentical_claim_bytes_are_rejected(record, verify):
    saved = record()
    saved.corrupt("intent", saved.plan.intent + b"\n")
    result, transport = verify(saved)
    stopped(result, "recorded_receipt_invalid")
    assert transport.calls == []


@pytest.mark.parametrize("field,value", [
    ("destination", "other/repository#7"), ("author_id", 999),
    ("notice_id", "invented"), ("attempt_key", "e" * 64),
    ("body", "edited"), ("intent", b"{}"),
])
def test_forged_plan_stops_without_get(record, verify, field, value):
    saved = record()
    result, transport = verify(saved, plan=replace(saved.plan, **{field: value}))
    assert result["status"] == "stopped" and result["acknowledgedIds"] == []
    assert result["receiptSha256"] is None and transport.calls == []


@pytest.mark.parametrize("field", ["catalogSha256", "stateSha256", "reportSha256"])
def test_different_valid_monitor_plan_cannot_use_original_claim(record, verify, field):
    saved = record()
    payload = json.loads(saved.plan.body.split("```json\n", 1)[1].removesuffix("```\n"))
    other = make_plan(monitor={**payload["monitor"], field: "e" * 64})
    result, transport = verify(saved, plan=other)
    stopped(result, "recorded_receipt_invalid")
    assert transport.calls == []


@pytest.mark.parametrize("repin", [False, True])
@pytest.mark.parametrize("formatting", ["whitespace", "pretty", "duplicate"])
def test_receipt_pin_binds_raw_canonical_bytes(record, verify, repin, formatting):
    saved = record()
    content = saved.receipt + b"\n"
    if formatting == "pretty":
        content = json.dumps(json.loads(saved.receipt), indent=2).encode()
    elif formatting == "duplicate":
        content = b'{"commentId":81,' + saved.receipt[1:]
    saved.corrupt("receipt", content)
    pin = hashlib.sha256(content).hexdigest() if repin else saved.pin
    result, transport = verify(saved, pin=pin)
    stopped(result, "recorded_receipt_invalid")
    assert transport.calls == []


@pytest.mark.parametrize("content", [
    b"", b'{"partial":', b"\xff", b"null", b"[]", b"{}", b"NaN",
    b'{"commentId":81,"extra":NaN}', b"[" * 1500,
    b"x" * (comments.MAX_FILE_BYTES + 1),
], ids=["empty", "partial", "non-utf8", "null", "array", "missing-id", "nan",
        "nested-nan", "deep-json", "oversized"])
def test_malformed_receipt_even_with_matching_raw_pin_stops(record, verify, content):
    saved = record()
    saved.corrupt("receipt", content)
    result, transport = verify(saved, pin=hashlib.sha256(content).hexdigest())
    stopped(result, "recorded_receipt_invalid")
    assert transport.calls == []


@pytest.mark.parametrize("field,value", [
    ("schemaVersion", True), ("schemaVersion", 2), ("status", "unverified"),
    ("destination", "other/repository#7"), ("destination", "owner/repository#8"),
    ("authorId", 999), ("authorId", True), ("authorId", "314"),
    ("intentSha256", "e" * 64), ("bodySha256", "e" * 64), ("extra", "field"),
    ("commentId", True), ("commentId", False), ("commentId", 0), ("commentId", -1),
    ("commentId", 2**53), ("commentId", 81.0), ("commentId", "81"),
    ("commentId", None), ("commentId", []),
])
def test_changed_receipt_fields_cannot_be_authorized_by_repinning(record, verify, field, value):
    saved = record()
    content = comments._encode({**json.loads(saved.receipt), field: value})
    saved.corrupt("receipt", content)
    result, transport = verify(saved, pin=hashlib.sha256(content).hexdigest())
    stopped(result, "recorded_receipt_invalid")
    assert transport.calls == []


@pytest.mark.parametrize("content", [
    b"", b'{"partial":', b"\xff", b"null", b"{}", b"[]",
    b"x" * (comments.MAX_FILE_BYTES + 1),
], ids=["empty", "partial", "non-utf8", "null", "empty-object", "array", "oversized"])
def test_malformed_optional_observation_stops_without_get(record, verify, content):
    saved = record(observation=True)
    saved.corrupt("posted", content)
    result, transport = verify(saved)
    stopped(result, "recorded_receipt_invalid")
    assert transport.calls == []


@pytest.mark.parametrize("field,value", [
    ("commentId", 82), ("commentId", True), ("commentId", "81"),
    ("intentSha256", "e" * 64), ("status", "verified"),
    ("schemaVersion", True), ("extra", "field"),
])
def test_conflicting_post_observation_stops_without_get(record, verify, field, value):
    saved = record(observation=True)
    observation = json.loads(saved.path("posted").read_bytes())
    saved.corrupt("posted", comments._encode({**observation, field: value}))
    result, transport = verify(saved)
    stopped(result, "recorded_receipt_invalid")
    assert transport.calls == []


@pytest.mark.parametrize("field,value", [
    ("id", 82), ("id", True), ("id", 0), ("id", -1), ("id", 2**53),
    ("id", "81"), ("id", 81.0), ("authorId", 999), ("authorId", True),
    ("authorId", "314"), ("destination", "other/repository#7"),
    ("destination", "owner/repository#8"), ("destination", "OWNER/REPOSITORY#7"),
    ("body", "forged"), ("body", None), ("body", b"body"), ("extra", "field"),
])
def test_forged_get_fields_never_acknowledge(record, verify, field, value):
    saved = record()
    response = {**remote(saved.plan, saved.comment_id), field: value}
    transport = FakeGet(saved, response=response)
    result, _ = verify(saved, transport)
    stopped(result, "comment_readback_failed")
    assert transport.calls == [("GET", saved.plan, saved.comment_id)]


@pytest.mark.parametrize("response", [None, [], {}, "not a comment"])
def test_malformed_get_envelope_stops(record, verify, response):
    saved = record()
    result, transport = verify(saved, FakeGet(saved, response=response))
    stopped(result, "comment_readback_failed")
    assert len(transport.calls) == 1


@pytest.mark.parametrize("field", ["id", "authorId", "destination", "body"])
def test_get_missing_required_field_stops(record, verify, field):
    saved = record()
    response = remote(saved.plan, saved.comment_id)
    response.pop(field)
    result, transport = verify(saved, FakeGet(saved, response=response))
    stopped(result, "comment_readback_failed")
    assert len(transport.calls) == 1


def test_correct_marker_with_edited_body_is_not_delivery_proof(record, verify):
    saved = record()
    response = remote(saved.plan, saved.comment_id, body=saved.plan.body + "edited\n")
    result, transport = verify(saved, FakeGet(saved, response=response))
    stopped(result, "comment_readback_failed")
    assert len(transport.calls) == 1


@pytest.mark.parametrize("fault", [
    PermissionError("401 " + SECRET), PermissionError("403 " + SECRET),
    FileNotFoundError("404 " + SECRET), TimeoutError(SECRET),
    ConnectionError(SECRET), DeliveryError(SECRET),
])
def test_auth_deleted_comment_and_transport_failures_never_retry(record, verify, fault):
    saved = record()
    result, transport = verify(saved, FakeGet(saved, fault=fault))
    stopped(result, "comment_readback_failed")
    assert len(transport.calls) == 1


@pytest.mark.parametrize("suffix", ["identity", "intent", "receipt", "posted"])
def test_journal_change_during_get_stops_without_repair(record, verify, suffix):
    saved = record(observation=True)
    transport = FakeGet(saved, during_get=lambda: saved.corrupt(suffix, b"changed-during-get"))
    result, _ = verify(saved, transport)
    stopped(result, "recorded_receipt_changed")
    assert len(transport.calls) == 1
    assert saved.path(suffix).read_bytes() == b"changed-during-get"


def test_adding_even_valid_optional_observation_during_get_is_a_change(record, verify):
    saved = record(observation=False)
    transport = FakeGet(saved, during_get=lambda: saved.corrupt(
        "posted", comments._observation(saved.plan, saved.comment_id)
    ))
    result, _ = verify(saved, transport)
    stopped(result, "recorded_receipt_changed")
    assert len(transport.calls) == 1


@pytest.mark.parametrize("method", ["require_claim", "receipt", "observation"])
@pytest.mark.parametrize("fail_at", [1, 2])
def test_local_read_failures_stop_at_each_side_of_get(record, verify, monkeypatch, method, fail_at):
    saved = record(observation=True)
    original = getattr(saved.journal, method)
    reads = []

    def read(*args):
        reads.append(method)
        if len(reads) == fail_at:
            raise OSError(SECRET)
        return original(*args)

    monkeypatch.setattr(saved.journal, method, read)
    result, transport = verify(saved)
    stopped(result, "recorded_receipt_invalid" if fail_at == 1 else "recorded_receipt_changed")
    assert len(transport.calls) == fail_at - 1
    assert len(reads) == fail_at


@pytest.mark.parametrize("fault_type", [KeyboardInterrupt, SystemExit, GeneratorExit])
@pytest.mark.parametrize("stage", ["before_get", "get", "after_get"])
def test_interrupts_propagate_without_any_write(record, verify, monkeypatch, fault_type, stage):
    saved = record(observation=True)
    fault = fault_type("synthetic interrupt")
    transport = FakeGet(saved, fault=fault if stage == "get" else None)
    original = saved.journal.require_claim
    reads = []

    def read(*args):
        reads.append("claim")
        if (stage == "before_get" and len(reads) == 1
                or stage == "after_get" and len(reads) == 2):
            raise fault
        return original(*args)

    monkeypatch.setattr(saved.journal, "require_claim", read)
    with pytest.raises(fault_type) as caught:
        verify(saved, transport)
    assert caught.value is fault
    assert len(transport.calls) == (0 if stage == "before_get" else 1)


@pytest.mark.parametrize("comment_id", [1, 2**53 - 1])
def test_valid_comment_id_boundaries(record, verify, comment_id):
    result, transport = verify(record(comment_id=comment_id))
    assert result["status"] == "verified" and result["commentId"] == comment_id
    assert transport.calls[0][2] == comment_id


def test_real_adapter_uses_only_authenticated_exact_id_get_with_fake_request(record, verify):
    saved = record()
    calls = []
    token = "synthetic-test-token-DO-NOT-USE"
    repository, issue = saved.plan.destination.split("#")

    def request(value):
        calls.append(deepcopy(value))
        return {"nextPage": None, "data": {
            "id": saved.comment_id,
            "issue_url": f"https://api.github.com/repos/{repository}/issues/{issue}",
            "user": {"id": saved.plan.author_id}, "body": saved.plan.body,
        }}

    transport = GitHubCommentClient(
        saved.plan.destination, author_id=saved.plan.author_id, token=token, request=request
    )
    result, _ = verify(saved, transport)
    assert result["status"] == "verified"
    assert calls == [{
        "method": "GET", "target": f"/repos/{repository}/issues/comments/{saved.comment_id}",
        "payload": {}, "token": token,
    }]
    assert token not in json.dumps(result)
