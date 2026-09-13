"""Real local create-only journal, synthetic GitHub: no external writes or monitor runs."""

from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from dataclasses import replace
import json
from pathlib import Path
from threading import Event
from uuid import uuid4

import pytest

from scripts import source_metadata_comments as comments
from scripts.source_metadata_delivery import DeliveryError
from scripts.source_metadata_github import GitHubCommentClient
from scripts.source_metadata_state import transition


MONITOR = {"catalogSha256": "a" * 64, "stateSha256": "b" * 64, "reportSha256": "c" * 64}
DESTINATION = "owner/repository#7"
AUTHOR = 314


def notice():
    source = {"key": "covered_linkway", "name": "Synthetic source", "mode": "metadata",
              "staleAfterDays": 120, "baseline": {"publisherUpdatedAt": "2026-09-01T00:00:00Z", "sha256": "d" * 64}}
    return transition(source, None, {"outcome": "timeout", "attempted": True},
                      "2026-09-09T00:00:00Z")["pendingNotices"][0]


def plan(**changes):
    return comments.plan_comment(**{"destination": DESTINATION, "monitor": deepcopy(MONITOR),
                                    "notice": notice(), "author_id": AUTHOR, **changes})


@pytest.fixture
def journal():
    path = comments.ROOT / "tmp" / "source-notice-journals" / ("fixture-" + uuid4().hex)
    return comments.LocalCommentJournal.initialize(path)


def remote(value, identifier=81, **changes):
    return {"id": identifier, "authorId": value.author_id, "destination": value.destination,
            "body": value.body, **changes}


class FakeComments:
    def __init__(self):
        self.events = []
        self.values = []
        self.after_post = None
        self.before_post = None
        self.read_fault = None

    def create(self, value):
        self.events.append("POST")
        if self.before_post:
            raise self.before_post
        result = remote(value)
        self.values.append(result)
        if self.after_post:
            raise self.after_post
        return result

    def read(self, value, comment_id):
        self.events.append("GET")
        if self.read_fault:
            raise self.read_fault
        return next(item for item in self.values if item["id"] == comment_id)

    def find(self, value):
        self.events.append("LIST")
        return list(self.values)


def send(journal, transport, value=None):
    return comments.deliver_comment(value or plan(), journal=journal, transport=transport)


def test_comment_plan_is_deterministic_and_binds_only_allowlisted_notice_fields():
    value = plan()
    assert value == plan(destination="OWNER/REPOSITORY#7")
    assert value.notice_id in value.body
    assert value.attempt_key in value.body
    assert "not dataset validation" in value.body
    assert len(value.intent) < comments.MAX_FILE_BYTES


@pytest.mark.parametrize("author", [True, False, 0, -1, 2**53, "314", None])
def test_bad_author_never_plans(author):
    with pytest.raises(DeliveryError):
        plan(author_id=author)


@pytest.mark.parametrize("destination", ["https://example.test/", "owner/repo#0", "owner/../repo#7", "owner/repo#7\n", "", None])
def test_bad_destination_never_plans(destination):
    with pytest.raises(DeliveryError):
        plan(destination=destination)


def test_original_notice_not_mutated():
    value = notice()
    before = deepcopy(value)
    plan(notice=value)
    assert value == before


def test_journal_is_explicit_unique_pinned_and_reopenable(journal):
    opened = comments.LocalCommentJournal(journal.path, expected_identity_sha256=journal.identity_sha256)
    assert opened.identity == journal.identity
    assert comments._sha(journal.identity) == journal.identity_sha256
    with pytest.raises(FileExistsError):
        comments.LocalCommentJournal.initialize(journal.path)
    with pytest.raises(DeliveryError):
        comments.LocalCommentJournal(journal.path, expected_identity_sha256="0" * 64)


def test_absent_journal_does_not_bootstrap(journal):
    path = journal.path / "missing"
    with pytest.raises(DeliveryError):
        comments.LocalCommentJournal(path, expected_identity_sha256=journal.identity_sha256)
    assert not path.exists()


@pytest.mark.parametrize("suffix", ["raw", "processed", "qa/verification", "web/public/data", "tmp"])
def test_no_journal_can_target_protected_or_undesignated_paths(suffix, monkeypatch):
    monkeypatch.setattr(Path, "resolve", lambda *_: pytest.fail("Reject before filesystem resolution"))
    with pytest.raises(DeliveryError):
        comments.LocalCommentJournal.initialize(comments.ROOT / suffix)


def test_relative_and_parent_escape_rejected_before_io(monkeypatch):
    monkeypatch.setattr(Path, "resolve", lambda *_: pytest.fail("Reject before filesystem resolution"))
    for path in (Path("tmp/relative"), comments.ROOT / "tmp/source-notice-journals/../escape"):
        with pytest.raises(DeliveryError):
            comments.LocalCommentJournal.initialize(path)


def test_real_journal_claim_has_single_winner_and_exact_immutable_intent(journal):
    value = plan()
    assert journal.claim(value) is True
    assert journal.claim(value) is False
    assert (journal.path / f"{value.attempt_key}.intent.json").read_bytes() == value.intent
    with pytest.raises(DeliveryError):
        journal.claim(plan(author_id=AUTHOR + 1))


def test_changed_monitor_body_cannot_bypass_existing_claim(journal):
    value = plan()
    journal.claim(value)
    changed = plan(monitor={**MONITOR, "reportSha256": "f" * 64})
    assert value.attempt_key == changed.attempt_key
    transport = FakeComments()
    result = send(journal, transport, changed)
    assert result["reason"] == "journal_claim_failed"
    assert result["acknowledgedIds"] == []
    assert transport.events == []


def test_send_claim_exists_before_post_and_receipt_follows_readback(journal):
    transport = FakeComments()
    original = transport.create

    def create(value):
        assert (journal.path / f"{value.attempt_key}.intent.json").read_bytes() == value.intent
        assert journal.receipt(value) is None
        return original(value)

    transport.create = create
    value = plan()
    result = send(journal, transport, value)
    assert result["status"] == "verified"
    assert result["acknowledgedIds"] == [value.notice_id]
    assert transport.events == ["POST", "GET"]
    assert comments._sha(journal.receipt(value)) == result["receiptSha256"]


def test_restart_verifies_exact_saved_comment_without_second_post(journal):
    transport = FakeComments()
    first = send(journal, transport)
    reopened = comments.LocalCommentJournal(journal.path, expected_identity_sha256=journal.identity_sha256)
    assert send(reopened, transport) == first
    assert transport.events == ["POST", "GET", "GET"]


def test_lost_post_response_recovers_exact_comment_read_only(journal):
    transport = FakeComments()
    transport.after_post = TimeoutError("credential must never be returned")
    first = send(journal, transport)
    assert first["reason"] == "post_outcome_uncertain"
    assert first["acknowledgedIds"] == []
    assert journal.receipt(plan()) is None
    second = send(journal, transport)
    assert second["status"] == "verified"
    assert transport.events == ["POST", "LIST", "GET"]


@pytest.mark.parametrize("fault", [TimeoutError("secret"), PermissionError("secret"), RuntimeError("secret")])
def test_rejected_or_uncertain_post_never_retried_even_when_no_match(journal, fault):
    transport = FakeComments()
    transport.before_post = fault
    assert send(journal, transport)["reason"] == "post_outcome_uncertain"
    for _ in range(2):
        result = send(journal, transport)
        assert result["reason"] == "reconciliation_requires_operator"
        assert result["acknowledgedIds"] == []
        assert "secret" not in json.dumps(result)
    assert transport.events == ["POST", "LIST", "LIST"]


@pytest.mark.parametrize("fault", [KeyboardInterrupt(), SystemExit(2)])
def test_interrupt_propagates_but_claim_prevents_next_post(journal, fault):
    transport = FakeComments()
    transport.before_post = fault
    with pytest.raises(type(fault)):
        send(journal, transport)
    assert send(journal, transport)["reason"] == "reconciliation_requires_operator"
    assert transport.events == ["POST", "LIST"]


@pytest.mark.parametrize("changes", [{"authorId": AUTHOR + 1}, {"authorId": True},
                                    {"destination": "other/repo#7"}, {"body": "edited"},
                                    {"id": True}, {"id": 0}, {"id": 2**53}])
def test_forged_or_edited_marker_cannot_authorize_acknowledgement(journal, changes):
    value = plan()
    journal.claim(value)
    transport = FakeComments()
    transport.values = [remote(value, **changes)]
    result = send(journal, transport, value)
    assert result["status"] == "stopped"
    assert result["acknowledgedIds"] == []
    assert journal.receipt(value) is None
    assert transport.events == ["LIST"]


def test_duplicate_exact_comments_require_operator(journal):
    value = plan()
    journal.claim(value)
    transport = FakeComments()
    transport.values = [remote(value, 81), remote(value, 82)]
    result = send(journal, transport, value)
    assert result["reason"] == "reconciliation_requires_operator"
    assert result["acknowledgedIds"] == []


def test_readback_failure_keeps_notice_unacknowledged_then_reconciles(journal):
    transport = FakeComments()
    transport.read_fault = OSError("private endpoint details")
    assert send(journal, transport)["reason"] == "comment_readback_failed"
    assert journal.receipt(plan()) is None
    transport.read_fault = None
    assert send(journal, transport)["status"] == "verified"
    assert transport.events == ["POST", "GET", "GET"]


def test_deleted_or_edited_verified_comment_stops_without_replacement(journal):
    transport = FakeComments()
    assert send(journal, transport)["status"] == "verified"
    saved = journal.receipt(plan())
    transport.values[0]["body"] = "human edit"
    assert send(journal, transport)["reason"] == "comment_readback_failed"
    transport.values = []
    assert send(journal, transport)["reason"] == "comment_readback_failed"
    assert journal.receipt(plan()) == saved
    assert transport.events == ["POST", "GET", "GET", "GET"]


def test_torn_intent_is_retained_and_stops_before_network(journal):
    value = plan()
    path = journal.path / f"{value.attempt_key}.intent.json"
    with path.open("xb") as handle:
        handle.write(b'{"partial":')
    transport = FakeComments()
    assert send(journal, transport)["reason"] == "journal_claim_failed"
    assert path.read_bytes() == b'{"partial":'
    assert transport.events == []


def test_corrupt_receipt_is_not_overwritten_or_used(journal):
    value = plan()
    journal.claim(value)
    path = journal.path / f"{value.attempt_key}.receipt.json"
    with path.open("xb") as handle:
        handle.write(b'not a receipt')
    transport = FakeComments()
    assert send(journal, transport)["reason"] == "receipt_conflict"
    assert path.read_bytes() == b'not a receipt'
    assert transport.events == []


def test_orphan_receipt_stays_an_incident_on_every_attempt(journal):
    value = plan()
    content = comments._receipt(value, 81)
    path = journal.path / f"{value.attempt_key}.receipt.json"
    with path.open("xb") as handle:
        handle.write(content)
    transport = FakeComments()
    transport.values = [remote(value)]
    for _ in range(3):
        result = send(journal, transport, value)
        assert result["reason"] == "journal_claim_failed"
        assert result["acknowledgedIds"] == []
        assert not (journal.path / f"{value.attempt_key}.intent.json").exists()
        assert path.read_bytes() == content
    assert transport.events == []


def test_conflicting_receipt_publication_never_overwrites(journal):
    value = plan()
    journal.claim(value)
    original = journal.verify(value, comments._receipt(value, 81))
    with pytest.raises(DeliveryError):
        journal.verify(value, comments._receipt(value, 82))
    assert journal.receipt(value) == original


def test_existing_link_is_rejected_before_read_or_write(journal, monkeypatch):
    original = Path.is_symlink
    monkeypatch.setattr(Path, "is_symlink", lambda path: path == journal.path or original(path))
    transport = FakeComments()
    assert send(journal, transport)["reason"] == "journal_claim_failed"
    assert transport.events == []


def test_identity_corruption_is_retained_and_stops_before_network(journal):
    # Only this new test journal is writable; never alter project input/evidence.
    with (journal.path / "identity.json").open("wb") as handle:
        handle.write(b"corrupt fixture identity")
    transport = FakeComments()
    assert send(journal, transport)["reason"] == "journal_claim_failed"
    assert transport.events == []
    assert (journal.path / "identity.json").read_bytes() == b"corrupt fixture identity"


def test_fsync_failure_never_posts_and_partial_claim_blocks_retry(journal, monkeypatch):
    def broken(_):
        raise OSError("disk failure")

    monkeypatch.setattr(comments.os, "fsync", broken)
    transport = FakeComments()
    assert send(journal, transport)["reason"] == "journal_claim_failed"
    assert send(journal, transport)["reason"] == "reconciliation_requires_operator"
    assert transport.events == ["LIST"]


def test_receipt_failure_then_restart_reconciles_without_post(journal, monkeypatch):
    original = journal.verify
    monkeypatch.setattr(journal, "verify", lambda *_: (_ for _ in ()).throw(OSError("full disk")))
    transport = FakeComments()
    assert send(journal, transport)["reason"] == "receipt_publish_failed"
    assert journal.receipt(plan()) is None
    monkeypatch.setattr(journal, "verify", original)
    assert send(journal, transport)["status"] == "verified"
    assert transport.events == ["POST", "GET", "GET"]


def test_received_post_id_is_not_acknowledgement_but_avoids_pagination_on_restart(journal):
    transport = FakeComments()
    transport.read_fault = OSError("read timed out")
    first = send(journal, transport)
    assert first["acknowledgedIds"] == []
    assert journal.receipt(plan()) is None
    assert json.loads(journal.observation(plan()))["status"] == "unverified_post_response"
    transport.read_fault = None
    transport.find = lambda *_: pytest.fail("Known ID must use direct GET")
    assert send(journal, transport)["status"] == "verified"
    assert transport.events == ["POST", "GET", "GET"]


def test_orphan_post_observation_does_not_create_missing_intent(journal):
    value = plan()
    journal.observe(value, 81)
    transport = FakeComments()
    for _ in range(2):
        assert send(journal, transport)["reason"] == "journal_claim_failed"
        assert not (journal.path / f"{value.attempt_key}.intent.json").exists()
    assert transport.events == []


def test_conflicting_post_observation_and_receipt_stop_before_network(journal):
    value = plan()
    journal.claim(value)
    journal.observe(value, 81)
    journal.verify(value, comments._receipt(value, 82))
    transport = FakeComments()
    assert send(journal, transport)["reason"] == "receipt_conflict"
    assert transport.events == []


@pytest.mark.parametrize("content", [b"{}", b"not json", b"x" * 65537], ids=["empty", "invalid", "oversized"])
def test_corrupt_post_observation_stops_without_resend(journal, content):
    value = plan()
    journal.claim(value)
    with (journal.path / f"{value.attempt_key}.posted.json").open("xb") as handle:
        handle.write(content)
    transport = FakeComments()
    assert send(journal, transport)["status"] == "stopped"
    assert transport.events == []


def test_concurrent_invocations_only_one_posts(journal):
    entered, finish = Event(), Event()
    transport = FakeComments()
    original = transport.create

    def blocked(value):
        entered.set()
        assert finish.wait(5)
        return original(value)

    transport.create = blocked
    with ThreadPoolExecutor(max_workers=2) as pool:
        first = pool.submit(send, journal, transport)
        try:
            assert entered.wait(5)
            second = pool.submit(send, journal, transport).result(timeout=5)
            assert second["reason"] == "reconciliation_requires_operator"
        finally:
            finish.set()
        assert first.result(timeout=5)["status"] == "verified"
    assert transport.events.count("POST") == 1


@pytest.mark.parametrize("field,value", [("attempt_key", "f" * 64), ("body", "tamper"),
                                        ("intent", b"{}"), ("notice_id", "tamper"),
                                        ("author_id", AUTHOR + 1), ("intent", b"x" * 65537)],
                         ids=["key", "body", "intent-json", "notice", "author", "oversized-intent"])
def test_forged_plan_stops_before_journal_or_network(journal, field, value):
    transport = FakeComments()
    result = send(journal, transport, replace(plan(), **{field: value}))
    assert result["reason"] == "invalid_plan"
    assert transport.events == []
    assert len(list(journal.path.iterdir())) == 1


def test_adapter_and_real_local_journal_end_to_end_with_synthetic_http(journal):
    value = plan()
    calls, stored = [], []

    def request(operation):
        calls.append(operation["method"])
        if operation["method"] == "POST":
            stored.append({"id": 91, "user": {"id": AUTHOR}, "body": operation["payload"]["body"],
                           "issue_url": "https://api.github.com/repos/owner/repository/issues/7"})
        return {"data": stored[0], "nextPage": None}

    client = GitHubCommentClient(DESTINATION, author_id=AUTHOR, token="synthetic-not-a-token", request=request)
    assert send(journal, client, value)["status"] == "verified"
    assert send(journal, client, value)["status"] == "verified"
    assert calls == ["POST", "GET", "GET"]
    assert journal.receipt(value) is not None
