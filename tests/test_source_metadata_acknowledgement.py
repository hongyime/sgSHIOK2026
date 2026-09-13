"""Immutable checkpoint integration using synthetic monitor checks and fake comment GETs."""

from copy import deepcopy
from datetime import timedelta
import hashlib
import json
from pathlib import Path
import socket
import subprocess
import sys
from uuid import uuid4

import pytest

from scripts import acknowledge_source_notices as ack
from scripts import check_source_metadata as monitor
from scripts.source_metadata_comments import LocalCommentJournal, ROOT, deliver_comment, plan_comment
from tests.test_source_metadata_cli import Client, NOW, project  # noqa: F401 - Explicit local fixture.


DESTINATION, AUTHOR = "owner/source-notices#7", 1234
LATER = NOW + timedelta(hours=2)
COOLDOWN = (NOW + timedelta(days=3)).isoformat()


@pytest.fixture(autouse=True)
def deny_external_network_and_workers(monkeypatch):
    def forbidden(*args, **kwargs):
        pytest.fail("This integration suite permits only synthetic source/comment responses")
    monkeypatch.setattr(socket, "getaddrinfo", forbidden)
    monkeypatch.setattr(socket.socket, "connect", forbidden)
    monkeypatch.setattr(socket.socket, "connect_ex", forbidden)
    monkeypatch.setattr(subprocess, "run", forbidden)
    monkeypatch.setattr(subprocess, "Popen", forbidden)


def sha(value):
    return hashlib.sha256(value).hexdigest()


def load(path):
    return json.loads(path.read_bytes())


def all_bytes(root):
    return {str(path.relative_to(root)): path.read_bytes() for path in root.rglob("*") if path.is_file()}


class Comments:
    def __init__(self):
        self.values = {}
        self.calls = []
        self.read_fault = None
        self.change = None

    def create(self, plan):
        identifier = 100 + len(self.values)
        value = {"id": identifier, "destination": plan.destination, "authorId": plan.author_id, "body": plan.body}
        self.values[identifier] = value
        self.calls.append("POST")
        return value

    def read(self, plan, identifier):
        self.calls.append("GET")
        if self.change:
            self.change()
        if self.read_fault:
            raise self.read_fault
        return self.values[identifier]

    def find(self, *_):
        pytest.fail("Checkpoint must never list or reconcile comments")


def prepare_project(project):
    root, catalog = project
    client = Client([{"outcome": "rate_limited", "attempted": True, "statusCode": 429, "retryAt": COOLDOWN}
                     for _ in catalog["sources"]])
    origin = root / "qa/source-monitor/origin"
    report, code = monitor.run_check(root, origin, bootstrap=True, client=client, clock=lambda: NOW)
    assert code == 1 and len(report["pendingNotices"]) == len(catalog["sources"])
    identity = {"catalogSha256": sha((root / "source-metadata-catalog.json").read_bytes()),
                "stateSha256": sha((origin / "state.json").read_bytes()),
                "reportSha256": sha((origin / "report.json").read_bytes())}
    notice = report["pendingNotices"][0]
    plan = plan_comment(DESTINATION, identity, notice, author_id=AUTHOR)
    journal = LocalCommentJournal.initialize(ROOT / "tmp/source-notice-journals" / ("ack-fixture-" + uuid4().hex))
    transport = Comments()
    delivered = deliver_comment(plan, journal=journal, transport=transport)
    assert delivered["status"] == "verified"
    transport.calls.clear()
    proof = {"originState": str(origin / "state.json"), "noticeId": notice["id"], "receiptSha256": delivered["receiptSha256"]}
    return {"root": root, "catalog": catalog, "origin": origin, "proof": proof,
            "journal": journal, "transport": transport, "identity": identity, "plan": plan}


@pytest.fixture
def prepared(project):
    return prepare_project(project)


def checkpoint(value, label="acknowledged", **changes):
    arguments = {"previous": value["origin"] / "state.json", "proofs": [value["proof"]],
                 "destination": DESTINATION, "author_id": AUTHOR, "journal": value["journal"],
                 "transport": value["transport"], "clock": lambda: LATER, **changes}
    return ack.publish_checkpoint(value["root"], value["root"] / "qa/source-monitor" / label, **arguments)


def test_checkpoint_only_changes_acknowledgement_and_preserves_all_original_bytes(prepared):
    value = prepared
    root, origin = value["root"], value["origin"]
    original_files = all_bytes(root)
    journal_files = all_bytes(value["journal"].path)
    before = load(origin / "state.json")["sources"]["rail"]
    result = checkpoint(value)
    after = load(root / "qa/source-monitor/acknowledged/state.json")["sources"]["rail"]
    assert result["operation"] == "notice_acknowledgement"
    assert result["sourceHealth"] == "not_rechecked"
    assert result["metadataRequests"] == 0 and result["commentReads"] == 1
    assert result["checkCompleted"] is False
    assert result["pendingNotices"] == []
    assert after["pendingNotices"] == []
    assert after["lastAcknowledgedAt"] == "2026-09-09T02:00:00Z"
    assert {key for key in before if before[key] != after[key]} == {"pendingNotices", "lastAcknowledgedAt"}
    for path, content in original_files.items():
        assert (root / path).read_bytes() == content
    assert all_bytes(value["journal"].path) == journal_files
    assert value["transport"].calls == ["GET"]


def test_normal_checker_restores_checkpoint_without_resetting_notice_or_host_cooldown(prepared):
    value = prepared
    checkpoint(value)
    client = Client()
    result, code = monitor.run_check(value["root"], value["root"] / "qa/source-monitor/next",
        previous=value["root"] / "qa/source-monitor/acknowledged/state.json", client=client,
        clock=lambda: LATER + timedelta(hours=1))
    state = result["sources"][0]["state"]
    assert code == 1  # Delivery success is not a healthy/up-to-date source.
    assert client.calls == []
    assert client.blocked_hosts == {"api-production.data.gov.sg": "2026-09-12T00:00:00Z"}
    assert state["pendingNotices"] == []
    assert state["lastAttemptAt"] == "2026-09-09T00:00:00Z"
    assert state["lastAcknowledgedAt"] == "2026-09-09T02:00:00Z"
    assert state["retryAt"] == "2026-09-12T00:00:00Z"


def test_original_receipt_can_clear_same_notice_in_later_current_state(prepared):
    value = prepared
    root = value["root"]
    current = root / "qa/source-monitor/current"
    monitor.run_check(root, current, previous=value["origin"] / "state.json", client=Client(),
                      clock=lambda: NOW + timedelta(hours=1))
    before = load(current / "state.json")["sources"]["rail"]
    result = checkpoint(value, previous=current / "state.json")
    assert result["previousStateSha256"] == sha((current / "state.json").read_bytes())
    assert result["previousReportSha256"] != value["identity"]["reportSha256"]
    assert result["acknowledgements"][0]["originReportSha256"] == value["identity"]["reportSha256"]
    after = load(root / "qa/source-monitor/acknowledged/state.json")["sources"]["rail"]
    assert after["evaluatedAt"] == before["evaluatedAt"]
    assert after["evaluatedAt"] != load(value["origin"] / "state.json")["sources"]["rail"]["evaluatedAt"]
    monitor._restore(root, root / "qa/source-monitor/acknowledged/state.json", value["catalog"],
                     value["identity"]["catalogSha256"], LATER)


def test_partial_acknowledgement_preserves_other_sources_and_pending_notices(project):
    root, catalog = project
    catalog["sources"].append({**deepcopy(catalog["sources"][0]), "key": "bus", "name": "Bus", "datasetId": "d_def"})
    (root / "source-metadata-catalog.json").write_text(json.dumps(catalog), encoding="utf8")
    value = prepare_project(project)
    before = load(value["origin"] / "state.json")["sources"]
    result = checkpoint(value)
    after = load(root / "qa/source-monitor/acknowledged/state.json")["sources"]
    selected = value["proof"]["noticeId"].split(":", 1)[0]
    other = next(key for key in before if key != selected)
    assert after[other] == before[other]
    assert after[selected]["pendingNotices"] == []
    assert result["pendingNotices"] == before[other]["pendingNotices"]
    monitor._restore(root, root / "qa/source-monitor/acknowledged/state.json", catalog,
                     value["identity"]["catalogSha256"], LATER)


def test_successive_partial_checkpoints_retain_original_receipt_binding(project):
    root, catalog = project
    catalog["sources"].append({**deepcopy(catalog["sources"][0]), "key": "bus", "name": "Bus", "datasetId": "d_def"})
    (root / "source-metadata-catalog.json").write_text(json.dumps(catalog), encoding="utf8")
    value = prepare_project(project)
    first = checkpoint(value)
    remaining = first["pendingNotices"][0]
    original_plan = plan_comment(DESTINATION, value["identity"], remaining, author_id=AUTHOR)
    delivered = deliver_comment(original_plan, journal=value["journal"], transport=value["transport"])
    assert delivered["status"] == "verified"
    proof = {"originState": str(value["origin"] / "state.json"), "noticeId": remaining["id"], "receiptSha256": delivered["receiptSha256"]}
    result = checkpoint(value, "second", previous=root / "qa/source-monitor/acknowledged/state.json",
                        proofs=[proof], clock=lambda: LATER + timedelta(hours=1))
    assert result["pendingNotices"] == []
    client = Client()
    following, code = monitor.run_check(root, root / "qa/source-monitor/next", previous=root / "qa/source-monitor/second/state.json",
                                        client=client, clock=lambda: LATER + timedelta(hours=2))
    assert code == 1 and client.calls == [] and following["pendingNotices"] == []
    assert all(entry["state"]["retryAt"] == "2026-09-12T00:00:00Z" for entry in following["sources"])


def test_etag_and_successful_observation_survive_ack_and_next_conditional_check(prepared):
    value = prepared
    root = value["root"]
    recovered_at = NOW + timedelta(days=4)
    recovered = root / "qa/source-monitor/recovered"
    response = {"outcome": "response", "attempted": True, "statusCode": 200, "etag": '"v1"',
                "data": {"data": {"datasetId": "d_abc", "lastUpdatedAt": "2026-08-01T00:00:00Z"}}}
    result, _ = monitor.run_check(root, recovered, previous=value["origin"] / "state.json", client=Client([response]),
                                  clock=lambda: recovered_at)
    notice = result["pendingNotices"][0]
    identity = {"catalogSha256": value["identity"]["catalogSha256"], "stateSha256": sha((recovered / "state.json").read_bytes()),
                "reportSha256": sha((recovered / "report.json").read_bytes())}
    plan = plan_comment(DESTINATION, identity, notice, author_id=AUTHOR)
    delivered = deliver_comment(plan, journal=value["journal"], transport=value["transport"])
    assert delivered["status"] == "verified"
    proof = {"originState": str(recovered / "state.json"), "noticeId": notice["id"], "receiptSha256": delivered["receiptSha256"]}
    checkpoint(value, previous=recovered / "state.json", proofs=[proof], clock=lambda: recovered_at + timedelta(hours=1))
    saved = load(root / "qa/source-monitor/acknowledged/state.json")["sources"]["rail"]
    before = load(recovered / "state.json")["sources"]["rail"]
    for field in ("latestObservation", "lastKnownRevision", "lastSuccessfulCheckAt", "evaluatedAt", "freshness", "observedFreshness"):
        assert saved[field] == before[field]
    client = Client([{"outcome": "not_modified", "attempted": True, "statusCode": 304}])
    client.wall_clock = lambda: recovered_at + timedelta(hours=2)
    following, code = monitor.run_check(root, root / "qa/source-monitor/conditional", previous=root / "qa/source-monitor/acknowledged/state.json",
                                        client=client, clock=lambda: recovered_at + timedelta(hours=2))
    assert client.calls[0][1]["If-None-Match"] == '"v1"'
    assert following["sources"][0]["state"]["comparison"] == "revision_unchanged"
    assert following["pendingNotices"] == [] and code == 0


@pytest.mark.parametrize("proofs", [[], [{}], "bad", None, [{"originState": "wrong", "noticeId": "x", "receiptSha256": "bad"}]])
def test_invalid_proofs_stop_before_clock_or_io(proofs, monkeypatch):
    def forbidden(*_):
        pytest.fail("Invalid proofs must stop before any IO")
    monkeypatch.setattr(monitor, "_safe_path", forbidden)
    with pytest.raises(monitor.MonitorError, match="STOP_ACK_PROOFS"):
        ack.publish_checkpoint(ROOT, ROOT / "qa/source-monitor/unused", previous=ROOT / "missing",
            proofs=proofs, destination=DESTINATION, author_id=AUTHOR, journal=None, transport=None, clock=forbidden)


@pytest.mark.parametrize("count", [2, 9])
def test_duplicate_or_over_bound_proofs_are_rejected(prepared, count):
    with pytest.raises(monitor.MonitorError, match="STOP_ACK_PROOFS"):
        checkpoint(prepared, proofs=[deepcopy(prepared["proof"]) for _ in range(count)])
    assert prepared["transport"].calls == []


@pytest.mark.parametrize("change", ["receipt_pin", "missing_origin", "notice", "destination", "author"])
def test_wrong_proof_identity_never_creates_checkpoint(prepared, change):
    proof = deepcopy(prepared["proof"])
    changes = {}
    if change == "receipt_pin":
        proof["receiptSha256"] = "0" * 64
    elif change == "missing_origin":
        proof["originState"] = str(prepared["root"] / "qa/source-monitor/missing/state.json")
    elif change == "notice":
        proof["noticeId"] += "x"
    elif change == "destination":
        changes["destination"] = "other/repository#7"
    else:
        changes["author_id"] = AUTHOR + 1
    with pytest.raises((monitor.MonitorError, ValueError)):
        checkpoint(prepared, proofs=[proof], **changes)
    assert not (prepared["root"] / "qa/source-monitor/acknowledged").exists()
    assert prepared["transport"].calls == []


@pytest.mark.parametrize("fault", [TimeoutError("private token"), OSError("private token")])
def test_remote_read_failure_preserves_pending_state_and_creates_no_output(prepared, fault):
    before = all_bytes(prepared["root"])
    prepared["transport"].read_fault = fault
    with pytest.raises(monitor.MonitorError, match="STOP_ACK_RECEIPT") as error:
        checkpoint(prepared)
    assert "private token" not in str(error.value)
    assert all_bytes(prepared["root"]) == before


def test_superseded_notice_cannot_be_acknowledged(prepared):
    value = prepared
    current = value["root"] / "qa/source-monitor/recovered"
    monitor.run_check(value["root"], current, previous=value["origin"] / "state.json", client=Client(),
                      clock=lambda: NOW + timedelta(days=4))
    with pytest.raises(monitor.MonitorError, match="STOP_ACK_NOTICE"):
        checkpoint(value, previous=current / "state.json", clock=lambda: NOW + timedelta(days=4, hours=1))
    assert value["transport"].calls == []


def test_already_acknowledged_notice_is_not_a_false_success(prepared):
    checkpoint(prepared)
    prepared["transport"].calls.clear()
    with pytest.raises(monitor.MonitorError, match="STOP_ACK_NOTICE"):
        checkpoint(prepared, "second", previous=prepared["root"] / "qa/source-monitor/acknowledged/state.json")
    assert prepared["transport"].calls == []
    assert not (prepared["root"] / "qa/source-monitor/second").exists()


@pytest.mark.parametrize("when", [NOW - timedelta(seconds=1), NOW.replace(tzinfo=None)])
def test_future_predecessor_or_naive_clock_stops(prepared, when):
    with pytest.raises(monitor.MonitorError):
        checkpoint(prepared, clock=lambda: when)
    assert prepared["transport"].calls == []


def test_clock_rollback_after_get_stops_without_publication(prepared):
    values = iter([LATER, NOW])
    with pytest.raises(monitor.MonitorError, match="STOP_ACK_CLOCK"):
        checkpoint(prepared, clock=lambda: next(values))
    assert prepared["transport"].calls == ["GET"]
    assert not (prepared["root"] / "qa/source-monitor/acknowledged").exists()


def test_input_change_during_get_stops_without_publication(prepared):
    path = prepared["origin"] / "report.json"
    def change_fixture():
        path.write_bytes(path.read_bytes() + b" \n")
    prepared["transport"].change = change_fixture
    with pytest.raises(monitor.MonitorError, match="STOP_ACK_INPUT_CHANGED"):
        checkpoint(prepared)
    assert not (prepared["root"] / "qa/source-monitor/acknowledged").exists()


def test_report_state_notice_disagreement_stops_before_get(prepared):
    path = prepared["origin"] / "report.json"
    value = load(path)
    value["pendingNotices"] = []
    path.write_text(json.dumps(value), encoding="utf8")
    with pytest.raises(monitor.MonitorError, match="STOP_PAIR_CONTENT"):
        checkpoint(prepared)
    assert prepared["transport"].calls == []


def test_output_never_overwrites_existing_directory(prepared):
    checkpoint(prepared)
    before = all_bytes(prepared["root"])
    prepared["transport"].calls.clear()
    with pytest.raises(monitor.MonitorError, match="STOP_ACK_OUTPUT"):
        checkpoint(prepared)
    assert all_bytes(prepared["root"]) == before
    assert prepared["transport"].calls == []


@pytest.mark.parametrize("failure", ["state_write", "report_publish", "state_readback"])
def test_partial_publication_cannot_be_restored(prepared, monkeypatch, failure):
    original_write, original_read = monitor._write, monitor._read
    target = prepared["root"] / "qa/source-monitor/acknowledged"
    def write(path, value):
        if path == target / "state.json" and failure == "state_write":
            raise OSError("synthetic disk failure")
        original_write(path, value)
    def read(path):
        value = original_read(path)
        return value + b" " if failure == "state_readback" and path == target / "state.json" else value
    def failed_report(*_):
        raise OSError("synthetic publication failure")
    monkeypatch.setattr(monitor, "_write", write)
    monkeypatch.setattr(monitor, "_read", read)
    if failure == "report_publish":
        monkeypatch.setattr(monitor, "_publish_report", failed_report)
    with pytest.raises((monitor.MonitorError, OSError)):
        checkpoint(prepared)
    assert not (target / "report.json").exists()
    with pytest.raises(monitor.MonitorError):
        monitor._restore(prepared["root"], target / "state.json", prepared["catalog"],
                         prepared["identity"]["catalogSha256"], LATER)


@pytest.mark.parametrize("field,value", [("metadataRequests", 1), ("metadataRequests", False),
    ("checkCompleted", True), ("sourceHealth", "current"), ("operation", "metadata_check"),
    ("commentReads", 0), ("authorId", True), ("previousStateSha256", "0" * 64),
    ("pendingNotices", [{}]), ("acknowledgements", [])])
def test_corrupt_checkpoint_semantics_rejected_before_next_source_request(prepared, field, value):
    checkpoint(prepared)
    path = prepared["root"] / "qa/source-monitor/acknowledged/report.json"
    report = load(path)
    report[field] = value
    path.write_text(json.dumps(report), encoding="utf8")
    client = Client()
    with pytest.raises(monitor.MonitorError):
        monitor.run_check(prepared["root"], prepared["root"] / "qa/source-monitor/next",
            previous=path.with_name("state.json"), client=client, clock=lambda: LATER)
    assert client.calls == []


def test_rehashed_checkpoint_cannot_change_non_acknowledgement_state(prepared):
    checkpoint(prepared)
    folder = prepared["root"] / "qa/source-monitor/acknowledged"
    state = load(folder / "state.json")
    state["sources"]["rail"]["retryAt"] = None
    (folder / "state.json").write_text(json.dumps(state), encoding="utf8")
    report = load(folder / "report.json")
    report["persistence"]["stateSha256"] = sha((folder / "state.json").read_bytes())
    (folder / "report.json").write_text(json.dumps(report), encoding="utf8")
    with pytest.raises(monitor.MonitorError, match="invalid acknowledgement checkpoint"):
        monitor._restore(prepared["root"], folder / "state.json", prepared["catalog"],
                         prepared["identity"]["catalogSha256"], LATER)


def test_stripped_operation_cannot_bypass_acknowledgement_replay(prepared):
    checkpoint(prepared)
    folder = prepared["root"] / "qa/source-monitor/acknowledged"
    state = load(folder / "state.json")
    state["sources"]["rail"]["retryAt"] = None
    (folder / "state.json").write_text(json.dumps(state), encoding="utf8")
    report = load(folder / "report.json")
    report.pop("operation")
    report["persistence"]["stateSha256"] = sha((folder / "state.json").read_bytes())
    (folder / "report.json").write_text(json.dumps(report), encoding="utf8")
    client = Client()
    with pytest.raises(monitor.MonitorError, match="STOP_PAIR_CONTENT"):
        monitor.run_check(prepared["root"], prepared["root"] / "qa/source-monitor/next", previous=folder / "state.json",
                          client=client, clock=lambda: LATER)
    assert client.calls == []


def test_equivalent_but_not_exact_notice_stops_before_get(prepared):
    value = prepared
    current = value["root"] / "qa/source-monitor/current"
    monitor.run_check(value["root"], current, previous=value["origin"] / "state.json", client=Client(), clock=lambda: NOW)
    state = load(current / "state.json")
    state["sources"]["rail"]["pendingNotices"][0]["createdAt"] = "2026-09-09T08:00:00+08:00"
    (current / "state.json").write_text(json.dumps(state), encoding="utf8")
    report = load(current / "report.json")
    report["sources"][0]["state"] = deepcopy(state["sources"]["rail"])
    report["pendingNotices"] = deepcopy(state["sources"]["rail"]["pendingNotices"])
    report["persistence"]["stateSha256"] = sha((current / "state.json").read_bytes())
    (current / "report.json").write_text(json.dumps(report), encoding="utf8")
    with pytest.raises(monitor.MonitorError, match="STOP_ACK_NOTICE"):
        checkpoint(value, previous=current / "state.json")
    assert value["transport"].calls == []
    assert not (value["root"] / "qa/source-monitor/acknowledged").exists()


def test_replay_rejects_predecessor_state_postdating_its_completion(prepared):
    checkpoint(prepared)
    origin = prepared["origin"]
    state = load(origin / "state.json")
    state["finishedAt"] = (NOW - timedelta(seconds=1)).isoformat()
    (origin / "state.json").write_text(json.dumps(state), encoding="utf8")
    original_report = load(origin / "report.json")
    original_report["finishedAt"] = state["finishedAt"]
    original_report["persistence"]["stateSha256"] = sha((origin / "state.json").read_bytes())
    (origin / "report.json").write_text(json.dumps(original_report), encoding="utf8")
    folder = prepared["root"] / "qa/source-monitor/acknowledged"
    report = load(folder / "report.json")
    report["previousStateSha256"] = report["acknowledgements"][0]["originStateSha256"] = sha((origin / "state.json").read_bytes())
    report["previousReportSha256"] = report["acknowledgements"][0]["originReportSha256"] = sha((origin / "report.json").read_bytes())
    (folder / "report.json").write_text(json.dumps(report), encoding="utf8")
    with pytest.raises(monitor.MonitorError, match="invalid acknowledgement checkpoint"):
        monitor._restore(prepared["root"], folder / "state.json", prepared["catalog"],
                         prepared["identity"]["catalogSha256"], LATER)


def test_cli_success_identifies_acknowledgement_not_a_source_check(monkeypatch, capsys):
    paths = {key: ROOT / "tmp" / key for key in ("output", "previous", "proofs", "journal")}
    arguments = ["acknowledge_source_notices"]
    for key, path in paths.items():
        arguments.extend(["--" + key, str(path)])
    arguments.extend(["--journal-sha256", "a" * 64, "--destination", DESTINATION, "--author-id", str(AUTHOR)])
    monkeypatch.setattr(sys, "argv", arguments)
    monkeypatch.setattr(monitor, "_read", lambda *_: b"[]")
    monkeypatch.setattr(ack, "LocalCommentJournal", lambda *args, **kwargs: object())
    monkeypatch.setattr(ack, "GitHubCommentClient", lambda *args, **kwargs: object())
    monkeypatch.setattr(ack, "GitHubRequestBudget", lambda *args, **kwargs: object())
    monkeypatch.setattr(ack, "publish_checkpoint", lambda *args, **kwargs: {
        "operation": "notice_acknowledgement", "acknowledgements": [{}], "pendingNotices": []})
    assert ack.main() == 0
    result = json.loads(capsys.readouterr().out)
    assert result == {"output": str(paths["output"]), "operation": "notice_acknowledgement", "exitCode": 0,
                      "metadataRequests": 0, "acknowledged": 1, "remainingPending": 0, "sourceHealth": "not_rechecked"}


@pytest.mark.parametrize("failure", [monitor.MonitorError("STOP_ACK_NOTICE: safe fixed diagnostic"), OSError("secret token")])
def test_cli_failure_retains_safe_signal_but_hides_private_errors(monkeypatch, capsys, failure):
    args = ["acknowledge_source_notices"]
    for key in ("output", "previous", "proofs", "journal"):
        args.extend(["--" + key, str(ROOT / "tmp" / key)])
    args.extend(["--journal-sha256", "a" * 64, "--destination", DESTINATION, "--author-id", str(AUTHOR)])
    monkeypatch.setattr(sys, "argv", args)
    monkeypatch.setattr(monitor, "_read", lambda *_: (_ for _ in ()).throw(failure))
    assert ack.main() == 2
    result = json.loads(capsys.readouterr().out)
    assert result["exitCode"] == 2 and result["operation"] == "notice_acknowledgement"
    assert "secret token" not in result["error"]
    assert result["error"].startswith("STOP_ACK_NOTICE" if isinstance(failure, monitor.MonitorError) else "STOP_ACK:")


@pytest.mark.parametrize("which", ["predecessor", "origin"])
def test_replay_guards_companion_report_paths_before_reading(prepared, monkeypatch, which):
    value = prepared
    previous = value["origin"] / "state.json"
    if which == "origin":
        previous = value["root"] / "qa/source-monitor/current/state.json"
        monitor.run_check(value["root"], previous.parent, previous=value["origin"] / "state.json",
                          client=Client(), clock=lambda: NOW + timedelta(hours=1))
    checkpoint(value, previous=previous)
    forbidden = value["origin"] / "report.json"
    original_is_link, original_read = Path.is_symlink, monitor._read
    monkeypatch.setattr(Path, "is_symlink", lambda path: path == forbidden or original_is_link(path))
    def read(path):
        if path == forbidden:
            pytest.fail("Companion path must be rejected before reading")
        return original_read(path)
    monkeypatch.setattr(monitor, "_read", read)
    with pytest.raises(monitor.MonitorError):
        monitor._restore(value["root"], value["root"] / "qa/source-monitor/acknowledged/state.json", value["catalog"],
                         value["identity"]["catalogSha256"], LATER)
