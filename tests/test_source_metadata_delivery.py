"""Synthetic, in-memory delivery fixtures only; no real stores, network or files.

The doubles assert adapter arguments and simulate conditional updates. These tests
do not verify provider CAS support, physical durability or enforced wall deadlines.
"""

import hashlib
import json
from copy import deepcopy

import pytest

from scripts import source_metadata_delivery as delivery
from scripts.source_metadata_state import acknowledge, transition

DESTINATION = "owner/repository#7"
MONITOR = {"catalogSha256": "a" * 64, "stateSha256": "b" * 64, "reportSha256": "c" * 64}
NOW = "2026-09-09T00:00:00Z"
LATER = "2026-09-10T00:00:00Z"
AFTER = "2026-09-11T00:00:00Z"


def digest(content):
    return hashlib.sha256(content).hexdigest()


def encoded(value):
    return (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()


def source(key="covered_linkway"):
    return {"key": key, "name": "Synthetic source", "mode": "metadata", "staleAfterDays": 120,
            "baseline": {"publisherUpdatedAt": "2026-09-01T00:00:00Z", "sha256": "d" * 64}}


def failed(key="covered_linkway"):
    return transition(source(key), None, {"outcome": "timeout", "attempted": True}, NOW)


def intents():
    return failed()["pendingNotices"]


def spec(notices=None, **changes):
    return {"destination": DESTINATION, "monitor": dict(MONITOR),
            "notices": intents() if notices is None else notices, "bootstrap": True, **changes}


class MemoryIssue:
    def __init__(self, body=""):
        self.body = body
        self.events = []
        self.read_faults = {}
        self.send_fault = None
        self.reads = 0
        self.updates = 0

    def read(self, destination, *, max_bytes, timeout_seconds):
        self.reads += 1
        self.events.append("issue_read")
        assert destination == DESTINATION
        assert max_bytes == delivery.MAX_ISSUE_BYTES
        assert timeout_seconds == delivery.OPERATION_SECONDS
        fault = self.read_faults.get(self.reads)
        if isinstance(fault, BaseException):
            raise fault
        return fault if fault is not None else {"destination": destination, "body": self.body}

    def update(self, destination, body, *, expected_body_sha256, timeout_seconds):
        self.updates += 1
        self.events.append("issue_update")
        assert destination == DESTINATION
        assert expected_body_sha256 == digest(self.body.encode())
        assert timeout_seconds == delivery.OPERATION_SECONDS
        assert len(body.encode()) <= delivery.MAX_ISSUE_BYTES
        if self.send_fault == "reject":
            return False
        if self.send_fault == "raise":
            raise OSError("private transport token must not escape")
        self.body = body
        if self.send_fault == "after_write":
            raise OSError("private transport token must not escape")
        if self.send_fault == "interrupt":
            raise KeyboardInterrupt
        return True


class MemoryReceipts:
    def __init__(self, content=None):
        self.content = content
        self.events = []
        self.read_faults = {}
        self.commit_fault = None
        self.reads = 0
        self.commits = 0

    def read(self, *, max_bytes, timeout_seconds):
        self.reads += 1
        self.events.append("receipt_read")
        assert max_bytes == delivery.MAX_RECEIPT_BYTES
        assert timeout_seconds == delivery.OPERATION_SECONDS
        fault = self.read_faults.get(self.reads)
        if isinstance(fault, BaseException):
            raise fault
        return fault if fault is not None else self.content

    def commit(self, receipt, *, expected_sha256, timeout_seconds):
        self.commits += 1
        self.events.append("receipt_commit")
        assert expected_sha256 == (digest(self.content) if self.content is not None else None)
        assert timeout_seconds == delivery.OPERATION_SECONDS
        assert len(receipt) <= delivery.MAX_RECEIPT_BYTES
        if self.commit_fault == "reject":
            return False
        if self.commit_fault == "raise":
            raise OSError("private storage token must not escape")
        self.content = receipt
        if self.commit_fault == "after_write":
            raise OSError("private storage token must not escape")
        if self.commit_fault == "interrupt":
            raise KeyboardInterrupt
        return True


def deliver(arguments=None, issue=None, receipts=None):
    issue = issue if issue is not None else MemoryIssue()
    receipts = receipts if receipts is not None else MemoryReceipts()
    result = delivery.deliver_notices(**(spec() if arguments is None else arguments),
                                       transport=issue, receipts=receipts)
    return result, issue, receipts


def restart(receipts, notices=None, **changes):
    return spec(notices, bootstrap=False, previous_receipt=receipts.content,
                expected_receipt_sha256=digest(receipts.content), **changes)


def assert_stopped(result):
    assert result["status"] == "stopped"
    assert result["acknowledgedIds"] == []
    assert result["receiptSha256"] is None
    assert "private" not in str(result)


def test_planning_is_deterministic_bounded_and_not_an_acknowledgement():
    notices = intents() + failed("traffic_signals")["pendingNotices"]
    original = deepcopy(notices)
    first = delivery.plan_delivery(**spec(notices))
    second = delivery.plan_delivery(**spec(list(reversed(notices)) + notices))
    assert first == second
    assert first["receiptCandidate"]["status"] == "pending"
    assert first["noticeIds"] == sorted({notice["id"] for notice in notices})
    assert "acknowledgedIds" not in first
    assert len(first["body"].encode()) <= delivery.MAX_ISSUE_BYTES
    assert notices == original


def test_delivery_requires_ordered_issue_and_receipt_readback():
    issue, receipts, events = MemoryIssue(), MemoryReceipts(), []
    issue.events = receipts.events = events
    result, _, _ = deliver(spec(intents() * 3), issue, receipts)
    assert result["status"] == "verified"
    assert result["acknowledgedIds"] == [intents()[0]["id"]]
    assert result["receiptSha256"] == digest(receipts.content)
    assert events == ["receipt_read", "issue_read", "issue_update", "issue_read",
                      "receipt_commit", "receipt_read"]
    receipt = json.loads(receipts.content)
    assert receipt["status"] == "verified"
    assert receipt["generation"] == 1 and receipt["previousReceiptSha256"] is None
    assert receipt["issueBodySha256"] == digest(issue.body.encode())


def test_repeats_and_restart_deduplicate_exact_ids_without_rewriting_receipt():
    _, issue, receipts = deliver()
    previous = receipts.content
    result, issue, receipts = deliver(restart(receipts, intents() * 4),
                                       MemoryIssue(issue.body), MemoryReceipts(previous))
    assert result["status"] == "verified"
    assert len(result["acknowledgedIds"]) == 1
    assert issue.updates == 0 and receipts.commits == 0
    assert receipts.content == previous


def test_new_monitor_identity_updates_receipt_not_issue_for_same_notice():
    _, issue, receipts = deliver()
    old = receipts.content
    changed = {**MONITOR, "stateSha256": "e" * 64, "reportSha256": "f" * 64}
    result, _, _ = deliver(restart(receipts, monitor=changed), issue, receipts)
    receipt = json.loads(receipts.content)
    assert result["status"] == "verified" and issue.updates == 1
    assert receipt["generation"] == 2 and receipt["previousReceiptSha256"] == digest(old)
    assert receipt["monitor"] == changed


def test_failure_recovery_and_recurrence_are_distinct_deliveries():
    bad = failed()
    good = transition(source(), bad, {"outcome": "observed", "attempted": True, "metadata": {
        "kind": "catalogue_revision", "identity": "revision", "publisherUpdatedAt": NOW}}, LATER)
    again = transition(source(), good, {"outcome": "timeout", "attempted": True}, AFTER)
    assert good["pendingNotices"][0]["kind"] == "recovery"
    result, issue, receipts = deliver(spec(bad["pendingNotices"]))
    for state in [good, again]:
        result, _, _ = deliver(restart(receipts, state["pendingNotices"]), issue, receipts)
        assert result["acknowledgedIds"] == [state["pendingNotices"][0]["id"]]
    assert issue.updates == 3
    assert len(json.loads(receipts.content)["notices"]) == 3


@pytest.mark.parametrize("fault", ["raise", "reject", "after_write"])
def test_failed_send_never_acknowledges_even_when_remote_write_happened(fault):
    issue = MemoryIssue()
    issue.send_fault = fault
    result, _, receipts = deliver(issue=issue)
    assert_stopped(result)
    assert result["reason"] == "issue_update_failed"
    assert issue.reads == 1 and issue.updates == 1 and receipts.commits == 0


@pytest.mark.parametrize("read_number", [1, 2])
@pytest.mark.parametrize("fault", [OSError("private read token"), {},
    {"destination": "owner/repository#8", "body": ""},
    {"destination": DESTINATION, "body": "x" * (delivery.MAX_ISSUE_BYTES + 1)},
    {"destination": DESTINATION, "body": "\u00e9" * delivery.MAX_ISSUE_BYTES},
    {"destination": DESTINATION, "body": "\ud800"}])
def test_invalid_or_failed_issue_reads_never_acknowledge(read_number, fault):
    issue = MemoryIssue()
    issue.read_faults[read_number] = fault
    result, _, receipts = deliver(issue=issue)
    assert_stopped(result)
    assert receipts.commits == 0


def test_exact_body_readback_required_not_notice_substring_match():
    issue = MemoryIssue()
    body = delivery.plan_delivery(**spec())["body"]
    issue.read_faults[2] = {"destination": DESTINATION, "body": body + "\n"}
    result, _, receipts = deliver(issue=issue)
    assert_stopped(result)
    assert result["reason"] == "issue_readback_mismatch" and receipts.commits == 0


def test_bootstrap_never_overwrites_unrelated_issue_content():
    result, issue, _ = deliver(issue=MemoryIssue("Human-authored existing issue"))
    assert_stopped(result)
    assert issue.updates == 0


@pytest.mark.parametrize("fault", ["raise", "reject", "after_write"])
def test_failed_receipt_commit_never_acknowledges(fault):
    receipts = MemoryReceipts()
    receipts.commit_fault = fault
    result, issue, _ = deliver(receipts=receipts)
    assert_stopped(result)
    assert result["reason"] == "receipt_commit_failed"
    assert issue.updates == 1 and receipts.commits == 1


@pytest.mark.parametrize("read_number", [1, 2])
@pytest.mark.parametrize("fault", [OSError("private storage token"), b"{", b"", "not bytes"])
def test_receipt_read_errors_and_corruption_fail_closed(read_number, fault):
    receipts = MemoryReceipts()
    receipts.read_faults[read_number] = fault
    result, issue, _ = deliver(receipts=receipts)
    assert_stopped(result)
    if read_number == 1:
        assert issue.reads == 0


@pytest.mark.parametrize("phase", ["send", "commit"])
def test_restart_after_interruption_reconciles_exact_attempt_without_resend(phase):
    issue, receipts = MemoryIssue(), MemoryReceipts()
    if phase == "send":
        issue.send_fault = "interrupt"
    else:
        receipts.commit_fault = "interrupt"
    with pytest.raises(KeyboardInterrupt):
        deliver(issue=issue, receipts=receipts)
    result, new_issue, new_receipts = deliver(issue=MemoryIssue(issue.body),
                                              receipts=MemoryReceipts(receipts.content))
    assert result["status"] == "verified"
    assert new_issue.updates == 0
    assert new_receipts.commits == (1 if phase == "send" else 0)


def test_repeat_still_requires_destination_readback_before_acknowledging():
    _, _, receipts = deliver()
    result, issue, _ = deliver(restart(receipts), MemoryIssue("tampered"), receipts)
    assert_stopped(result)
    assert issue.updates == 0


@pytest.mark.parametrize("changes", [
    {"bootstrap": False}, {"bootstrap": "yes"},
    {"expected_receipt_sha256": "f" * 64},
    {"previous_receipt": b"{}", "bootstrap": False},
    {"destination": "https://token@host/issue"},
    {"monitor": {**MONITOR, "token": "private"}},
    {"monitor": {**MONITOR, "stateSha256": True}},
])
def test_invalid_bootstrap_identity_and_missing_pins_fail_before_io(changes):
    with pytest.raises(delivery.DeliveryError):
        delivery.plan_delivery(**spec(**changes))
    result, issue, receipts = deliver(spec(**changes))
    assert_stopped(result)
    assert issue.reads == receipts.reads == 0


@pytest.mark.parametrize("change", [
    {"status": "pending"}, {"status": "stopped"}, {"schemaVersion": True},
    {"generation": 0}, {"previousReceiptSha256": "a" * 64},
    {"destination": "owner/repository#8"}, {"issueBodySha256": "f" * 64},
    {"monitor": {**MONITOR, "catalogSha256": "e" * 64}},
    {"notices": []}, {"private": "secret"},
])
def test_interrupted_or_invalid_prior_receipt_rejected_even_with_matching_hash(change):
    _, _, receipts = deliver()
    broken = encoded({**json.loads(receipts.content), **change})
    arguments = spec(bootstrap=False, previous_receipt=broken,
                     expected_receipt_sha256=digest(broken))
    with pytest.raises(delivery.DeliveryError):
        delivery.plan_delivery(**arguments)
    result, issue, store = deliver(arguments)
    assert_stopped(result)
    assert issue.reads == store.reads == 0


@pytest.mark.parametrize("change", [lambda raw: raw[:-1], lambda raw: raw + b" ",
    lambda raw: raw.replace(b'"schemaVersion":1', b'"schemaVersion":1,"schemaVersion":1'),
    lambda raw: b"[" * 2000, lambda raw: b"x" * (delivery.MAX_RECEIPT_BYTES + 1)])
def test_noncanonical_truncated_duplicate_or_oversized_receipt_is_not_restored(change):
    _, _, receipts = deliver()
    broken = change(receipts.content)
    with pytest.raises(delivery.DeliveryError):
        delivery.plan_delivery(**spec(bootstrap=False, previous_receipt=broken,
                                     expected_receipt_sha256=digest(broken)))


def test_missing_or_rolled_back_store_cannot_be_treated_as_first_run():
    _, issue, receipts = deliver()
    arguments = restart(receipts)
    for content in [None, b"{}"]:
        result, new_issue, _ = deliver(arguments, MemoryIssue(issue.body), MemoryReceipts(content))
        assert_stopped(result)
        assert new_issue.reads == 0


@pytest.mark.parametrize("change", [
    {"id": "wrong"}, {"episode": True}, {"episode": 2}, {"sourceKey": "bad\nkey"},
    {"kind": "secret"}, {"kind": []}, {"reasons": ["token=private"]},
    {"reasons": [["timeout"]]}, {"reasons": ["timeout", "timeout"]},
    {"createdAt": "2026-09-09"}, {"createdAt": "2026-02-30T00:00:00Z"},
    {"createdAt": "2026-09-09T00:00:00+15:00"}, {"token": "private"},
])
def test_notice_validation_cannot_forward_free_text_or_report_fields(change):
    notices = [{**intents()[0], **change}]
    with pytest.raises(delivery.DeliveryError):
        delivery.plan_delivery(**spec(notices))


def test_conflicting_payload_for_same_exact_id_is_not_silently_deduplicated():
    changed = {**intents()[0], "reasons": ["http_error"]}
    with pytest.raises(delivery.DeliveryError, match="STOP_NOTICE_CONFLICT"):
        delivery.plan_delivery(**spec(intents() + [changed]))
    _, _, receipts = deliver()
    with pytest.raises(delivery.DeliveryError, match="STOP_NOTICE_CONFLICT"):
        delivery.plan_delivery(**restart(receipts, [changed]))


def test_empty_bootstrap_does_nothing_and_does_not_establish_a_receipt():
    result, issue, receipts = deliver(spec([]))
    assert result == {"status": "noop", "reason": "no_notices",
                      "acknowledgedIds": [], "receiptSha256": None}
    assert issue.reads == receipts.reads == 0


def test_capacity_failures_never_prune_or_make_transport_calls(monkeypatch):
    with pytest.raises(delivery.DeliveryError, match="STOP_NOTICE_BOUND"):
        delivery.plan_delivery(**spec(intents() * (delivery.MAX_NOTICES + 1)))
    _, _, receipts = deliver()
    monkeypatch.setattr(delivery, "MAX_NOTICES", 1)
    arguments = restart(receipts, failed("other_source")["pendingNotices"])
    with pytest.raises(delivery.DeliveryError, match="STOP_LEDGER_FULL"):
        delivery.plan_delivery(**arguments)
    monkeypatch.setattr(delivery, "MAX_ISSUE_BYTES", 10)
    with pytest.raises(delivery.DeliveryError, match="STOP_ISSUE_BOUND"):
        delivery.plan_delivery(**spec())


def test_report_state_and_metadata_tokens_never_enter_issue_or_change_inputs():
    state = failed()
    original = deepcopy(state)
    report = {"pendingNotices": state["pendingNotices"], "token": "PRIVATE_TOKEN",
              "transport": {"url": "https://private.example/secret"}}
    report_bytes, state_bytes = encoded(report), encoded(state)
    monitor = {**MONITOR, "stateSha256": digest(state_bytes), "reportSha256": digest(report_bytes)}
    result, issue, receipts = deliver(spec(report["pendingNotices"], monitor=monitor))
    assert result["status"] == "verified"
    assert state == original and encoded(state) == state_bytes and encoded(report) == report_bytes
    assert "PRIVATE_TOKEN" not in issue.body and "private.example" not in issue.body
    assert monitor["reportSha256"] not in issue.body and monitor["stateSha256"] not in issue.body
    assert state["pendingNotices"] != [] and state["lastAcknowledgedAt"] is None
    copied = acknowledge(state, result["acknowledgedIds"], LATER)
    assert copied["pendingNotices"] == [] and state == original
    assert json.loads(receipts.content)["monitor"] == monitor


@pytest.mark.parametrize("phase", ["send", "commit"])
def test_restart_of_later_generation_reconciles_only_exact_inflight_attempt(phase):
    _, issue, receipts = deliver()
    arguments = restart(receipts, failed("traffic_signals")["pendingNotices"])
    if phase == "send":
        issue.send_fault = "interrupt"
    else:
        receipts.commit_fault = "interrupt"
    with pytest.raises(KeyboardInterrupt):
        deliver(arguments, issue, receipts)
    result, resumed_issue, resumed_store = deliver(arguments, MemoryIssue(issue.body),
                                                   MemoryReceipts(receipts.content))
    assert result["status"] == "verified" and resumed_issue.updates == 0
    assert json.loads(resumed_store.content)["generation"] == 2
    assert result["acknowledgedIds"] == [arguments["notices"][0]["id"]]


def test_changed_attempt_after_interrupted_send_does_not_overwrite_unknown_body():
    issue, receipts = MemoryIssue(), MemoryReceipts()
    issue.send_fault = "after_write"
    result, _, _ = deliver(issue=issue, receipts=receipts)
    assert_stopped(result)
    different = spec(failed("traffic_signals")["pendingNotices"])
    result, new_issue, _ = deliver(different, MemoryIssue(issue.body), receipts)
    assert_stopped(result)
    assert new_issue.updates == 0 and receipts.commits == 0


def test_receipt_claiming_completed_attempt_does_not_authorize_repairing_issue():
    _, _, receipts = deliver()
    result, issue, _ = deliver(spec(), MemoryIssue(), receipts)
    assert_stopped(result)
    assert issue.updates == 0


def test_concurrent_issue_change_is_not_overwritten(monkeypatch):
    issue = MemoryIssue()

    def concurrent_update(destination, body, **kwargs):
        issue.body = "Concurrent owner change"
        assert kwargs["expected_body_sha256"] != digest(issue.body.encode())
        return False

    monkeypatch.setattr(issue, "update", concurrent_update)
    result, _, receipts = deliver(issue=issue)
    assert_stopped(result)
    assert issue.body == "Concurrent owner change" and receipts.commits == 0


def test_concurrent_receipt_change_is_not_overwritten(monkeypatch):
    receipts = MemoryReceipts()

    def concurrent_commit(receipt, **kwargs):
        receipts.content = b"other writer"
        assert kwargs["expected_sha256"] is None
        return False

    monkeypatch.setattr(receipts, "commit", concurrent_commit)
    result, _, _ = deliver(receipts=receipts)
    assert_stopped(result)
    assert receipts.content == b"other writer"


@pytest.mark.parametrize("operation", ["update", "commit"])
@pytest.mark.parametrize("response", [None, 1, "success", {"ok": True}])
def test_truthy_provider_responses_are_not_explicit_success(monkeypatch, operation, response):
    issue, receipts = MemoryIssue(), MemoryReceipts()
    target = issue if operation == "update" else receipts
    monkeypatch.setattr(target, operation, lambda *args, **kwargs: response)
    result, _, _ = deliver(issue=issue, receipts=receipts)
    assert_stopped(result)


def test_caller_input_mutation_after_planning_cannot_change_plan():
    arguments = spec()
    plan = delivery.plan_delivery(**arguments)
    snapshot = deepcopy(plan)
    arguments["notices"][0]["reasons"].append("http_error")
    arguments["monitor"]["catalogSha256"] = "d" * 64
    assert plan == snapshot


def test_exact_id_matching_does_not_confuse_episode_prefixes():
    one = intents()[0]
    ten = {**one, "episode": 10, "id": one["id"].replace(":1:", ":10:")}
    _, issue, receipts = deliver(spec([one]))
    result, _, _ = deliver(restart(receipts, [ten]), issue, receipts)
    assert result["acknowledgedIds"] == [ten["id"]]
    assert len(json.loads(receipts.content)["notices"]) == 2


def test_equivalent_instants_and_reason_order_plan_identically():
    first = {**intents()[0], "reasons": ["timeout", "baseline_stale"]}
    second = {**first, "reasons": list(reversed(first["reasons"])),
              "createdAt": "2026-09-09T08:00:00+08:00"}
    assert delivery.plan_delivery(**spec([first])) == delivery.plan_delivery(**spec([second]))


def test_receipt_maximum_counts_verified_status_bytes(monkeypatch):
    plan = delivery.plan_delivery(**spec())
    completed_size = len(encoded({**plan["receiptCandidate"], "status": "verified"}))
    monkeypatch.setattr(delivery, "MAX_RECEIPT_BYTES", completed_size)
    assert delivery.plan_delivery(**spec()) == plan
    monkeypatch.setattr(delivery, "MAX_RECEIPT_BYTES", completed_size - 1)
    with pytest.raises(delivery.DeliveryError, match="STOP_RECEIPT_BOUND"):
        delivery.plan_delivery(**spec())


def test_hash_pin_mismatch_or_catalog_change_is_not_silently_rebased():
    _, _, receipts = deliver()
    arguments = restart(receipts)
    for changed in [{**arguments, "expected_receipt_sha256": "f" * 64},
                    {**arguments, "monitor": {**MONITOR, "catalogSha256": "f" * 64}}]:
        result, issue, store = deliver(changed)
        assert_stopped(result)
        assert issue.reads == store.reads == 0


def test_generation_exhaustion_does_not_reset_history():
    _, _, receipts = deliver()
    prior = {**json.loads(receipts.content), "generation": 2**53 - 1,
             "previousReceiptSha256": "e" * 64}
    raw = encoded(prior)
    arguments = spec(failed("traffic_signals")["pendingNotices"], bootstrap=False,
                     previous_receipt=raw, expected_receipt_sha256=digest(raw))
    with pytest.raises(delivery.DeliveryError, match="STOP_RECEIPT_BOUND"):
        delivery.plan_delivery(**arguments)
