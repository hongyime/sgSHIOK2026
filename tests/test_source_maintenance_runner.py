"""Real local checker/journal/ack integration; all provider responses are synthetic."""

from copy import deepcopy
from datetime import timedelta
import json
from pathlib import Path

import pytest

from scripts import run_source_maintenance as runner
from scripts import source_metadata_comments as comments
from scripts import source_metadata_request_budget as budgets
from scripts import check_source_metadata as monitor
from scripts.source_metadata_github import GitHubCommentClient
from scripts.inspect_source_notice_journal import inspect_journal
from tests.test_source_metadata_cli import Client, NOW, project  # noqa: F401
from tests.test_source_metadata_request_budget import Clock, response, snapshot
from tests.test_source_metadata_request_budget import deny_network_and_processes  # noqa: F401


class Provider:
    def __init__(self):
        self.values = {}
        self.calls = []
        self.hook = None

    def request(self, value):
        self.calls.append(value["method"])
        if self.hook:
            fault = self.hook(value)
            if fault is not None:
                return fault
        if value["method"] == "POST":
            identifier = 100 + len(self.values)
            data = {"id": identifier, "body": value["payload"]["body"], "user": {"id": 1234},
                    "issue_url": "https://api.github.com/repos/owner/source-notices/issues/7"}
            self.values[identifier] = data
        elif "?" in value["target"]:
            data = list(self.values.values())
        else:
            data = self.values[int(value["target"].rsplit("/", 1)[1])]
        return {"data": data, "nextPage": None, **response(201 if value["method"] == "POST" else 200)}


@pytest.fixture
def setup(project, monkeypatch):
    root, catalog = project
    assert root.is_relative_to(Path(r"C:\sgSHIOK2026\tmp"))
    monkeypatch.setattr(comments, "ROOT", root)
    journal = comments.LocalCommentJournal.initialize(root / "tmp/source-notice-journals/test")
    budgets.GitHubRequestBudget.initialize(journal)
    clock, provider = Clock(), Provider()
    clients = []

    def factory():
        budget = budgets.GitHubRequestBudget(journal, clock=clock.time,
                                              monotonic=clock.monotonic, sleep=clock.sleep)
        client = GitHubCommentClient("owner/source-notices#7", author_id=1234, token="synthetic-token",
                                     request=provider.request, budget=budget)
        clients.append(client)
        return client

    return {"root": root, "catalog": catalog, "journal": journal, "clock": clock,
            "provider": provider, "factory": factory, "clients": clients}


def metadata():
    return Client([{"outcome": "rate_limited", "attempted": True, "statusCode": 429,
                    "retryAt": (NOW + timedelta(days=3)).isoformat()}])


def cycle(value, label="first", **changes):
    return runner.run_cycle(value["root"], value["root"] / f"qa/source-monitor/{label}-check",
        value["root"] / f"qa/source-monitor/{label}-ack",
        **{"bootstrap": True, "metadata_client": metadata(), "journal": value["journal"],
           "transport_factory": value["factory"], "clock": lambda: NOW, **changes})


def ref(value):
    return runner.StateRef(Path(value["path"]), value["stateSha256"], value["reportSha256"])


def resume(value, result, label="resume", **changes):
    return runner.resume_pending(value["root"], value["root"] / f"qa/source-monitor/{label}",
        **{"origin": ref(result["originState"]), "current": ref(result["currentState"]),
           "journal": value["journal"], "transport": value["factory"](),
           "clock": lambda: NOW + timedelta(hours=1), **changes})


def test_one_real_local_cycle_checks_posts_reads_and_acknowledges_without_rewriting(setup):
    before = snapshot(setup["root"])
    result = cycle(setup)
    assert result["status"] == "acknowledged" and result["pendingCount"] == 0
    assert result["githubRequests"] == 3 and setup["provider"].calls == ["POST", "GET", "GET"]
    assert result["metadataRequests"] == 1
    assert result["sourceHealth"] == "attention_required" and result["checkExitCode"] == 1
    assert len(result["acknowledgedIds"]) == 1
    for path, content in before.items():
        assert snapshot(setup["root"])[path] == content
    origin = json.loads(ref(result["originState"]).path.read_bytes())
    current = json.loads(ref(result["currentState"]).path.read_bytes())
    assert origin["sources"]["rail"]["pendingNotices"]
    assert current["sources"]["rail"]["pendingNotices"] == []
    assert current["sources"]["rail"]["retryAt"] == origin["sources"]["rail"]["retryAt"]


def test_healthy_check_does_not_post_or_create_ack_directory(setup):
    result = cycle(setup, metadata_client=Client())
    assert result["status"] == "no_pending_notices" and result["checkExitCode"] == 0
    assert setup["provider"].calls == []
    assert result["currentState"] == result["originState"]
    assert not (setup["root"] / "qa/source-monitor/first-ack").exists()


def test_following_check_restores_acknowledged_state_and_source_cooldown(setup):
    first = cycle(setup)
    client = Client()
    result = cycle(setup, "second", bootstrap=False, previous=ref(first["currentState"]),
                   metadata_client=client, clock=lambda: NOW + timedelta(hours=1))
    assert client.calls == [] and result["metadataRequests"] == 0
    assert result["checkExitCode"] == 1 and result["status"] == "no_pending_notices"
    assert setup["provider"].calls.count("POST") == 1


def test_github_budget_starts_after_metadata_phase_without_per_notice_reset(setup):
    client = metadata()
    original = client.get_json

    def slow(*args):
        setup["clock"].advance(301)
        return original(*args)

    client.get_json = slow
    result = cycle(setup, metadata_client=client)
    assert result["status"] == "acknowledged"
    assert len(setup["clients"]) == 1 and setup["clients"][0]._budget.started == 301


def test_nine_notices_are_processed_as_eight_then_one_with_original_plans(setup):
    base = setup["catalog"]["sources"][0]
    setup["catalog"]["sources"] = [{**deepcopy(base), "key": f"rail_{i}"} for i in range(9)]
    (setup["root"] / "source-metadata-catalog.json").write_text(json.dumps(setup["catalog"]), encoding="utf8")
    client = metadata()
    client.responses *= 9
    first = cycle(setup, metadata_client=client)
    assert first["pendingCount"] == 1 and len(first["acknowledgedIds"]) == 8
    assert first["githubRequests"] == 24 and len(setup["clients"]) == 1
    before = snapshot(setup["root"] / "qa/source-monitor")
    second = resume(setup, first)
    assert second["pendingCount"] == 0 and second["githubRequests"] == 3
    assert setup["provider"].calls.count("POST") == 9
    for path, content in before.items():
        assert snapshot(setup["root"] / "qa/source-monitor")[path] == content
    original_sha = first["originState"]["stateSha256"]
    assert all(original_sha in value["body"] for value in setup["provider"].values.values())


def test_failed_readback_retains_id_and_resume_never_reposts(setup):
    setup["provider"].hook = lambda value: {"data": {}, "nextPage": None, **response(503)} if value["method"] == "GET" else None
    first = cycle(setup)
    assert first["status"] == "stopped" and first["reason"] == "comment_readback_failed"
    assert first["currentState"] == first["originState"] and first["acknowledgedIds"] == []
    setup["provider"].hook = None
    second = resume(setup, first)
    assert second["status"] == "acknowledged"
    assert setup["provider"].calls == ["POST", "GET", "GET", "GET"]


def test_unknown_post_outcome_requires_operator_and_preserves_all_history(setup):
    def fail(_):
        raise TimeoutError("synthetic secret must not escape")
    setup["provider"].hook = fail
    result = cycle(setup)
    assert result["status"] == "stopped" and result["reason"] == "post_outcome_uncertain"
    assert "secret" not in json.dumps(result) and setup["provider"].calls == ["POST"]
    before = snapshot(setup["journal"].path)
    with pytest.raises(comments.DeliveryError, match="STOP_GITHUB_REQUEST_UNRESOLVED"):
        resume(setup, result)
    inspected = inspect_journal(setup["journal"].path, setup["journal"].identity_sha256, now=setup["clock"].wall)
    assert inspected["requestBudget"]["status"] == "blocked"
    assert inspected["attempts"][0]["status"] == "post_outcome_unknown"
    assert snapshot(setup["journal"].path) == before


def test_pending_predecessor_stops_before_new_metadata_or_transport(setup):
    setup["provider"].hook = lambda value: {"data": {}, "nextPage": None, **response(503)}
    first = cycle(setup)
    client, factory_count = Client(), len(setup["clients"])
    with pytest.raises(monitor.MonitorError, match="STOP_RUNNER_PENDING"):
        cycle(setup, "second", bootstrap=False, previous=ref(first["currentState"]), metadata_client=client)
    assert client.calls == [] and len(setup["clients"]) == factory_count
    assert not (setup["root"] / "qa/source-monitor/second-check").exists()


@pytest.mark.parametrize("which", ["state_sha256", "report_sha256"])
def test_pin_mismatch_stops_before_new_check_with_actual_hash(setup, which):
    first = cycle(setup)
    values = vars(ref(first["currentState"])) | {which: "0" * 64}
    client = Client()
    with pytest.raises(monitor.MonitorError, match=r"STOP_RUNNER_PIN_MISMATCH.*expected=0{64} actual=[a-f0-9]{64}"):
        cycle(setup, "second", bootstrap=False, previous=runner.StateRef(**values), metadata_client=client)
    assert client.calls == []


@pytest.mark.parametrize("changes", [{"bootstrap": False}, {"bootstrap": 1}, {"previous": "state.json"}])
def test_invalid_initialization_has_no_network_or_output(setup, changes):
    with pytest.raises(monitor.MonitorError, match="STOP_INITIALIZATION"):
        cycle(setup, **changes)
    assert setup["provider"].calls == []
    assert not (setup["root"] / "qa/source-monitor").exists()


@pytest.mark.parametrize("existing", ["first-check", "first-ack"])
def test_existing_output_is_never_reused(setup, existing):
    output = setup["root"] / "qa/source-monitor" / existing
    output.mkdir(parents=True)
    (output / "sentinel").write_bytes(b"retain")
    with pytest.raises(monitor.MonitorError, match="STOP_RUNNER_OUTPUT"):
        cycle(setup)
    assert (output / "sentinel").read_bytes() == b"retain" and setup["provider"].calls == []


def test_acknowledgement_failure_does_not_clear_pending_or_resend(setup):
    def fail_third(value):
        if len(setup["provider"].calls) == 3:
            return {"data": {}, "nextPage": None, **response(503)}
    setup["provider"].hook = fail_third
    first = cycle(setup)
    assert first["status"] == "stopped" and first["reason"] == "acknowledgement_failed"
    assert first["acknowledgedIds"] == [] and first["currentState"] == first["originState"]
    setup["provider"].hook = None
    result = resume(setup, first)
    assert result["status"] == "acknowledged" and setup["provider"].calls.count("POST") == 1


def test_acknowledged_checkpoint_cannot_masquerade_as_original_check(setup):
    first = cycle(setup)
    with pytest.raises(monitor.MonitorError, match="STOP_RUNNER_ORIGIN"):
        resume(setup, first, origin=ref(first["currentState"]))


def test_input_mismatch_during_check_never_constructs_github_transport(setup):
    client = metadata()
    original = client.get_json
    def change(*args):
        (setup["root"] / "raw/manifest.json").write_bytes(b"synthetic changed anchor")
        return original(*args)
    client.get_json = change
    result = cycle(setup, metadata_client=client)
    assert result["reason"] == "metadata_check_stopped" and result["checkExitCode"] == 2
    assert setup["clients"] == [] and setup["provider"].calls == []


def test_unbudgeted_client_is_rejected(setup):
    bad = GitHubCommentClient("owner/source-notices#7", author_id=1234,
                              token="synthetic-token", request=setup["provider"].request)
    with pytest.raises(monitor.MonitorError, match="STOP_RUNNER_BOUNDED_CLIENT_REQUIRED"):
        cycle(setup, transport_factory=lambda: bad)
    assert setup["provider"].calls == []


def test_none_metadata_client_cannot_activate_checker_default(setup):
    with pytest.raises(monitor.MonitorError, match="STOP_RUNNER_METADATA_CLIENT_REQUIRED"):
        cycle(setup, metadata_client=None)
    assert setup["clients"] == [] and setup["provider"].calls == []
    assert not (setup["root"] / "qa/source-monitor").exists()


def test_valid_predecessor_substitution_is_rejected_before_github(setup, monkeypatch):
    first = cycle(setup, metadata_client=Client())
    prior = ref(first["currentState"])
    replacement = setup["root"] / "qa/source-monitor/replacement"
    monitor.run_check(setup["root"], replacement, bootstrap=True, client=metadata(), clock=lambda: NOW)
    original = monitor.run_check

    def substitute(*args, **kwargs):
        for name in ["state.json", "report.json"]:
            prior.path.with_name(name).write_bytes((replacement / name).read_bytes())
        return original(*args, **kwargs)

    monkeypatch.setattr(monitor, "run_check", substitute)
    count = len(setup["clients"])
    with pytest.raises(monitor.MonitorError, match="STOP_RUNNER_CONSUMED_STATE_PIN_MISMATCH"):
        cycle(setup, "next", bootstrap=False, previous=prior, metadata_client=Client(),
              clock=lambda: NOW + timedelta(hours=1))
    assert len(setup["clients"]) == count and setup["provider"].calls == []


def test_valid_report_substitution_at_ack_handoff_is_not_adopted(setup, monkeypatch):
    first = cycle(setup)
    current = setup["root"] / "qa/source-monitor/carried"
    monitor.run_check(setup["root"], current, previous=ref(first["originState"]).path,
                      client=Client(), clock=lambda: NOW + timedelta(minutes=30))
    first["currentState"] = runner._reference(runner._pin(current / "state.json"))
    original = runner.publish_checkpoint

    def substitute(root, output, **kwargs):
        path = kwargs["previous"].with_name("report.json")
        report = json.loads(path.read_bytes())
        report["elapsedSeconds"] += 1
        path.write_text(json.dumps(report), encoding="utf8")
        return original(root, output, **kwargs)

    monkeypatch.setattr(runner, "publish_checkpoint", substitute)
    result = resume(setup, first)
    assert result["status"] == "stopped" and result["reason"] == "acknowledgement_failed"
    assert result["detail"] == "STOP_RUNNER_ACK_PIN_MISMATCH"
    assert result["currentState"] == first["currentState"] and result["acknowledgedIds"] == []
    assert (setup["root"] / "qa/source-monitor/resume/report.json").exists()


@pytest.mark.parametrize("phase", ["write", "readback"])
def test_local_ack_io_failure_returns_original_pins_and_retains_receipts(setup, monkeypatch, phase):
    if phase == "write":
        original = monitor._write
        def fail(path, value):
            if path.parent.name == "first-ack":
                raise OSError(28, "synthetic private disk detail")
            return original(path, value)
        monkeypatch.setattr(monitor, "_write", fail)
    else:
        original = runner._pin
        def fail(path):
            if path.parent.name == "first-ack":
                raise OSError(28, "synthetic private disk detail")
            return original(path)
        monkeypatch.setattr(runner, "_pin", fail)
    result = cycle(setup)
    assert result["status"] == "stopped" and result["reason"] == "acknowledgement_failed"
    assert result["detail"] == "STOP_LOCAL_PUBLICATION" and result["osError"] == 28
    assert "private" not in json.dumps(result)
    assert result["currentState"] == result["originState"] and result["acknowledgedIds"] == []
    assert result["deliveries"][0]["receiptSha256"]
    assert (setup["root"] / "qa/source-monitor/first-ack").exists()


def test_rate_limit_is_persisted_and_prevents_subsequent_posts(setup):
    setup["provider"].hook = lambda value: {"data": {}, "nextPage": None,
                                           **response(429, retry_after="120")}
    result = cycle(setup)
    assert result["status"] == "stopped"
    before = snapshot(setup["journal"].path)
    setup["provider"].hook = None
    again = resume(setup, result)
    assert again["status"] == "stopped" and setup["provider"].calls == ["POST"]
    assert snapshot(setup["journal"].path) == before


@pytest.mark.parametrize("notices", [1, 2])
def test_pin_read_failure_after_first_delivery_preserves_receipts(setup, monkeypatch, notices):
    if notices == 2:
        base = setup["catalog"]["sources"][0]
        setup["catalog"]["sources"].append({**deepcopy(base), "key": "bus"})
        (setup["root"] / "source-metadata-catalog.json").write_text(json.dumps(setup["catalog"]), encoding="utf8")
    original = runner._load
    def fail(*args):
        if len(setup["provider"].calls) >= 2:
            raise OSError(28, "private path detail")
        return original(*args)
    monkeypatch.setattr(runner, "_load", fail)
    client = metadata()
    client.responses *= notices
    result = cycle(setup, metadata_client=client)
    assert result["status"] == "stopped"
    assert result["reason"] == ("acknowledgement_failed" if notices == 1 else "input_revalidation_failed")
    assert result["deliveries"][0]["receiptSha256"] and result["acknowledgedIds"] == []
    assert result["currentState"] == result["originState"]
    assert setup["provider"].calls == ["POST", "GET"]
    assert "private" not in json.dumps(result)
