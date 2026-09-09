from copy import deepcopy
from datetime import UTC, datetime
import hashlib
import json
from pathlib import Path

import pytest

from scripts import check_source_metadata as monitor
from scripts.check_source_metadata import MonitorError, run_check
from scripts.source_metadata_state import acknowledge, transition


NOW = datetime(2026, 9, 9, tzinfo=UTC)


def sha(content):
    return hashlib.sha256(content).hexdigest()


@pytest.fixture
def project(tmp_path):
    for relative in ("pipeline/config/sources.yaml", "raw/manifest.json"):
        path = tmp_path / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(b"{}\n")
    catalog = {
        "schemaVersion": 1, "generatedAt": "2026-09-08T00:00:00Z", "baselineMeaning": "Fixture input metadata only",
        "anchors": {p: sha(b"{}\n") for p in ("pipeline/config/sources.yaml", "raw/manifest.json")},
        "gitAnchors": {p: sha(b"{}\n") for p in ("pipeline/config/sources.yaml", "raw/manifest.json")},
        "sources": [{"key": "rail", "name": "Rail", "mode": "automatic", "adapter": "datagov_metadata",
                     "datasetId": "d_abc", "staleAfterDays": 120, "expectedCadence": "quarterly",
                     "baseline": {"publisherUpdatedAt": "2026-08-01T00:00:00Z", "sha256": "a" * 64, "present": True}}],
    }
    (tmp_path / "source-metadata-catalog.json").write_text(json.dumps(catalog), encoding="utf8")
    return tmp_path, catalog


def persist_catalog(project):
    root, catalog = project
    (root / "source-metadata-catalog.json").write_text(json.dumps(catalog), encoding="utf8")


class Client:
    def __init__(self, responses=None):
        self.responses = list(responses or [{"outcome": "response", "attempted": True, "statusCode": 200,
                                            "data": {"data": {"datasetId": "d_abc", "lastUpdatedAt": "2026-08-01T00:00:00Z"}}}])
        self.calls = []
        self.blocked_hosts = {}
        self.stats = {"requests": 0, "bodyBytes": 0, "responses": []}
        self.wall_clock = lambda: NOW

    def get_json(self, url, headers):
        self.calls.append((url, headers))
        self.stats["requests"] += 1
        return deepcopy(self.responses.pop(0))


def run(project, label="run1", client=None, previous=None):
    root, _ = project
    client = client or Client()
    result = run_check(root, root / "qa/source-monitor" / label, previous=previous,
                       client=client, credentials={}, clock=lambda: NOW)
    return result, client


def previous_state(project, state):
    root, catalog = project
    path = root / "qa/source-monitor/prior/state.json"
    path.parent.mkdir(parents=True)
    envelope = {"schemaVersion": 1, "catalogSha256": sha((root / "source-metadata-catalog.json").read_bytes()),
                "finishedAt": "2026-09-09T00:00:00Z", "sources": {catalog["sources"][0]["key"]: state}}
    path.write_text(json.dumps(envelope), encoding="utf8")
    report = {"schemaVersion": 1, "catalogSha256": envelope["catalogSha256"], "finishedAt": envelope["finishedAt"],
              "exitCode": 1, "runStatus": "attention_required",
              "persistence": {"status": "verified", "stateSha256": sha(path.read_bytes())}}
    (path.parent / "report.json").write_text(json.dumps(report), encoding="utf8")
    return path


def test_first_observation_writes_fresh_report_and_restorable_state_without_delivery(project):
    (report, code), client = run(project)
    root, _ = project
    assert code == 0 and len(client.calls) == 1
    assert report["sources"][0]["state"]["comparison"] == "first_observation"
    assert report["stateRestored"] is False and report["noticeDelivery"] == "not_configured"
    assert (root / "qa/source-monitor/run1/state.json").is_file()
    assert len((root / "qa/source-monitor/run1/observations.jsonl").read_text().splitlines()) == 1
    assert (root / "raw/manifest.json").read_bytes() == b"{}\n"


def test_restored_valid_etag_is_used_and_304_preserves_publication_date(project):
    source = project[1]["sources"][0]
    state = transition(source, None, {"outcome": "observed", "attempted": True, "metadata": {
        "identity": "a" * 64, "publisherUpdatedAt": "2026-08-01T00:00:00Z", "kind": "catalogue_revision", "etag": '"v1"'}}, NOW)
    prior = previous_state(project, state)
    client = Client([{"outcome": "not_modified", "attempted": True, "statusCode": 304}])
    (report, _), _ = run(project, client=client, previous=prior)
    assert client.calls[0][1] == {"If-None-Match": '"v1"'}
    assert report["stateRestored"] is True
    assert report["sources"][0]["state"]["comparison"] == "revision_unchanged"
    assert report["sources"][0]["state"]["freshness"]["publisherUpdatedAt"] == "2026-08-01T00:00:00Z"


def test_persisted_long_rate_limit_prevents_all_host_requests(project):
    state = transition(project[1]["sources"][0], None, {"outcome": "rate_limited", "attempted": True,
                       "statusCode": 429, "retryAt": "2026-09-12T00:00:00Z"}, NOW)
    prior = previous_state(project, state)
    (report, code), client = run(project, previous=prior)
    assert code == 1 and client.calls == []
    entry = report["sources"][0]
    assert entry["result"]["outcome"] == "deferred" and entry["state"]["retryAt"] == "2026-09-12T00:00:00Z"


@pytest.mark.parametrize("adapter,outcome", [("manual", "manual"), ("unsupported", "unsupported"), ("datamall_listing", "credentials_required")])
def test_uncheckable_sources_are_explicit_without_requests(project, adapter, outcome):
    source = project[1]["sources"][0]
    source.update(adapter=adapter, mode="manual" if adapter == "manual" else "automatic")
    source.pop("datasetId")
    if adapter == "datamall_listing":
        source["keyword"] = "CoveredLinkWay"
    persist_catalog(project)
    (report, code), client = run(project)
    assert client.calls == [] and report["sources"][0]["result"]["outcome"] == outcome
    assert code == (0 if adapter == "manual" else 1)


@pytest.mark.parametrize("mutation", [
    lambda c: c.update(schemaVersion=2),
    lambda c: c["sources"].append(deepcopy(c["sources"][0])),
    lambda c: c["sources"][0].update(datasetId="../download"),
    lambda c: c["anchors"].update({"../private": "b" * 64}),
    lambda c: c.pop("gitAnchors"),
    lambda c: c["gitAnchors"].update({"raw/manifest.json": "invalid"}),
    lambda c: c["sources"][0].update(mode="manual"),
    lambda c: c["sources"][0].update(staleAfterDays=True),
    lambda c: c["sources"][0]["baseline"].update(publisherUpdatedAt="2026-09-09"),
    lambda c: c["sources"][0]["baseline"].update(sha256="bad"),
])
def test_invalid_catalog_fails_before_network_or_output(project, mutation):
    mutation(project[1])
    persist_catalog(project)
    client = Client()
    with pytest.raises(MonitorError):
        run(project, client=client)
    assert not client.calls and not (project[0] / "qa/source-monitor/run1").exists()


def test_input_hash_mismatch_stops_without_rebuilding(project):
    path = project[0] / "raw/manifest.json"
    path.write_bytes(b"different")
    client = Client()
    with pytest.raises(MonitorError, match="STOP_INPUT_MISMATCH.*actual=" + sha(b"different")):
        run(project, client=client)
    assert not client.calls and path.read_bytes() == b"different"


@pytest.mark.parametrize("content", [b"{", b'{"x": NaN}', b'{"schemaVersion":1,"schemaVersion":2}'])
def test_bad_or_duplicate_json_never_authorizes_requests(project, content):
    (project[0] / "source-metadata-catalog.json").write_bytes(content)
    with pytest.raises(MonitorError):
        run(project)


@pytest.mark.parametrize("case", ["invalid_state", "wrong_catalog", "missing_key", "future_state", "missing_file", "truncated", "oversized"])
def test_bad_previous_state_fails_closed_without_conditional_request(project, case):
    source = project[1]["sources"][0]
    state = transition(source, None, {"outcome": "timeout", "attempted": True}, NOW)
    path = previous_state(project, state)
    envelope = json.loads(path.read_text())
    if case == "invalid_state":
        envelope["sources"]["rail"]["latestObservation"] = {"etag": "unchecked"}
    elif case == "wrong_catalog":
        envelope["catalogSha256"] = "f" * 64
    elif case == "missing_key":
        envelope["sources"] = {}
    elif case == "future_state":
        envelope["sources"]["rail"] = transition(source, state, {"outcome": "timeout", "attempted": True}, "2026-09-10T00:00:00Z")
    path.write_text(json.dumps(envelope))
    if case == "missing_file":
        path = path.parent / "absent.json"
    elif case == "truncated":
        path.write_bytes(b"{")
    elif case == "oversized":
        path.write_bytes(b" " * (1024 * 1024 + 1))
    client = Client()
    with pytest.raises(MonitorError):
        run(project, client=client, previous=path)
    assert not client.calls


@pytest.mark.parametrize("relative", ["web/public/data/new", "qa/p10_evidence/new", "raw/new", "qa/source-monitor", "tmp/new", "qa/source-monitor/a/b"])
def test_output_scope_rejects_non_fresh_monitor_directory(project, relative):
    root = project[0]
    with pytest.raises(MonitorError):
        run_check(root, root / relative, client=Client(), credentials={}, clock=lambda: NOW)


def test_existing_output_is_never_overwritten(project):
    run(project)
    before = (project[0] / "qa/source-monitor/run1/report.json").read_bytes()
    client = Client()
    with pytest.raises(MonitorError):
        run(project, client=client)
    assert not client.calls
    assert (project[0] / "qa/source-monitor/run1/report.json").read_bytes() == before


def test_mid_run_anchor_change_is_preserved_as_failure_not_success(project):
    client = Client()
    original = client.get_json

    def mutate(url, headers):
        result = original(url, headers)
        (project[0] / "raw/manifest.json").write_bytes(b"changed during fixture request")
        return result

    client.get_json = mutate
    (report, code), _ = run(project, client=client)
    assert code == 2 and report["integrity"]["status"] == "failed"
    assert "STOP_INPUT_MISMATCH" in report["integrity"]["error"]
    assert len(report["sources"]) == 1


def test_unchanged_rerun_preserves_pending_notice_id_without_claiming_delivery(project):
    project[1]["sources"][0]["baseline"]["publisherUpdatedAt"] = "2025-01-01T00:00:00Z"
    persist_catalog(project)
    (first, code), _ = run(project)
    prior = project[0] / "qa/source-monitor/run1/state.json"
    (second, code2), _ = run(project, "run2", previous=prior)
    assert code == code2 == 1
    assert first["pendingNotices"] == second["pendingNotices"]
    assert second["noticeDelivery"] == "not_configured"


def test_deferred_previously_available_source_is_not_an_all_clear(project):
    run(project)
    client = Client([{"outcome": "deferred", "attempted": False, "reason": "request_budget"}])
    (report, code), _ = run(project, "run2", client, project[0] / "qa/source-monitor/run1/state.json")
    assert code == 1 and report["checkCompleted"] is False
    assert report["sources"][0]["state"]["availability"] == "available"
    assert report["sources"][0]["result"]["attempted"] is False


def test_acknowledged_staleness_still_requires_attention(project):
    project[1]["sources"][0]["baseline"]["publisherUpdatedAt"] = "2025-01-01T00:00:00Z"
    persist_catalog(project)
    (report, _), _ = run(project)
    state = report["sources"][0]["state"]
    state = acknowledge(state, [n["id"] for n in state["pendingNotices"]], NOW)
    prior = previous_state(project, state)
    (second, code), _ = run(project, "run2", previous=prior)
    assert second["pendingNotices"] == [] and code == 1
    assert second["runStatus"] == "attention_required"


def test_cooldown_on_one_dataset_defers_other_datasets_on_same_host(project):
    second = deepcopy(project[1]["sources"][0])
    second.update(key="bus", name="Bus", datasetId="d_other")
    project[1]["sources"].append(second)
    persist_catalog(project)
    client = Client([{"outcome": "rate_limited", "attempted": True, "statusCode": 429, "retryAt": "2026-09-12T00:00:00Z"}])
    original = client.get_json

    def rate_limit(url, headers):
        result = original(url, headers)
        client.blocked_hosts["api-production.data.gov.sg"] = result["retryAt"]
        return result

    client.get_json = rate_limit
    (report, code), _ = run(project, client=client)
    assert code == 1 and len(client.calls) == 1
    assert report["counts"]["outcomes"] == {"rate_limited": 1, "deferred": 1}
    restored = Client([])
    (next_report, _), _ = run(project, "run2", restored, project[0] / "qa/source-monitor/run1/state.json")
    assert not restored.calls and next_report["counts"]["outcomes"] == {"deferred": 2}


def test_outside_or_linked_output_is_rejected_before_any_requests(project, monkeypatch):
    root = project[0]
    output = root / "qa/source-monitor/link"
    real_resolve = Path.resolve
    monkeypatch.setattr(Path, "resolve", lambda self, *a, **kw: root.parent / "escape" if self == output else real_resolve(self, *a, **kw))
    with pytest.raises(MonitorError, match="linked"):
        run_check(root, output, client=Client(), credentials={}, clock=lambda: NOW)


def test_invalid_credentials_stop_without_echoing_or_network(project):
    client = Client()
    with pytest.raises(MonitorError) as failure:
        run_check(project[0], project[0] / "qa/source-monitor/invalid", client=client,
                  credentials={"LTA_DATAMALL_ACCOUNT_KEY": "private\nvalue"}, clock=lambda: NOW)
    assert "private" not in str(failure.value) and not client.calls


def test_runtime_anchor_never_uses_git_identity_in_place_of_recorded_local_bytes(project):
    root, catalog = project
    path = root / "raw/manifest.json"
    path.write_bytes(b'{}\r\n')
    catalog["anchors"]["raw/manifest.json"] = sha(b'{}\r\n')
    persist_catalog(project)
    run(project)
    path.write_bytes(b'{}\n')
    client = Client()
    with pytest.raises(MonitorError, match="STOP_INPUT_MISMATCH"):
        run(project, "run2", client)
    assert not client.calls


def test_success_report_follows_verified_state_persistence(project, monkeypatch):
    writes = []
    original = monitor._write

    def inspect(path, value):
        if path.name == "report.pending.json":
            assert writes == ["started.json", "state.json"]
            assert value["persistence"]["status"] == "verified"
            assert value["persistence"]["stateSha256"] == sha((path.parent / "state.json").read_bytes())
        original(path, value)
        writes.append(path.name)

    monkeypatch.setattr(monitor, "_write", inspect)
    (report, code), _ = run(project)
    assert code == 0 and report["persistence"]["status"] == "verified"
    assert writes == ["started.json", "state.json", "report.pending.json"]
    output = project[0] / "qa/source-monitor/run1"
    assert (output / "report.json").read_bytes() == (output / "report.pending.json").read_bytes()


@pytest.mark.parametrize("partial", [False, True])
def test_failed_state_write_can_only_leave_a_failure_report(project, monkeypatch, partial):
    original = monitor._write

    def fail(path, value):
        if path.name == "state.json":
            if partial:
                path.write_bytes(b'{"partial":')
            raise OSError("private disk diagnostic")
        original(path, value)

    monkeypatch.setattr(monitor, "_write", fail)
    (report, code), _ = run(project)
    assert code == 2 and report["runStatus"] == "stopped"
    assert report["persistence"] == {"status": "failed", "reason": "state_persistence_failed"}
    stored = json.loads((project[0] / "qa/source-monitor/run1/report.json").read_bytes())
    assert stored["exitCode"] == 2 and "private disk diagnostic" not in json.dumps(stored)
    assert len(stored["sources"]) == 1


@pytest.mark.parametrize("replacement", [b"{}", b"{", b" " * (1024 * 1024 + 1)],
                         ids=["different-valid-json", "truncated-json", "oversized-state"])
def test_state_readback_failure_is_not_reported_as_success(project, monkeypatch, replacement):
    original = monitor._write

    def change(path, value):
        original(path, value)
        if path.name == "state.json":
            path.write_bytes(replacement)

    monkeypatch.setattr(monitor, "_write", change)
    (report, code), _ = run(project)
    assert code == 2 and report["persistence"]["status"] == "failed"


def test_state_fsync_failure_does_not_authorize_a_completion_report_or_restore(project, monkeypatch):
    original_write, original_fsync = monitor._write, monitor.os.fsync
    active = []

    def write(path, value):
        active.append(path.name)
        try:
            original_write(path, value)
        finally:
            active.pop()

    def fsync(fd):
        if active and active[-1] == "state.json":
            raise OSError("private sync diagnostic")
        return original_fsync(fd)

    monkeypatch.setattr(monitor, "_write", write)
    monkeypatch.setattr(monitor.os, "fsync", fsync)
    (report, code), _ = run(project)
    assert code == 2 and report["persistence"]["status"] == "failed"
    prior = project[0] / "qa/source-monitor/run1/state.json"
    client = Client()
    with pytest.raises(MonitorError):
        run(project, "run2", client, prior)
    assert not client.calls


@pytest.mark.parametrize("case", ["missing", "bad_hash", "failed", "unverified", "different_catalog", "different_finish"])
def test_previous_state_requires_matching_verified_completion_receipt(project, case):
    source = project[1]["sources"][0]
    state = transition(source, None, {"outcome": "timeout", "attempted": True}, NOW)
    path = previous_state(project, state)
    report_path = path.parent / "report.json"
    report = json.loads(report_path.read_bytes())
    if case == "missing":
        report_path.write_bytes(b"")
    else:
        if case == "bad_hash":
            report["persistence"]["stateSha256"] = "0" * 64
        elif case == "failed":
            report.update(exitCode=2, runStatus="stopped")
        elif case == "unverified":
            report["persistence"]["status"] = "failed"
        elif case == "different_catalog":
            report["catalogSha256"] = "f" * 64
        elif case == "different_finish":
            report["finishedAt"] = "2026-09-08T00:00:00Z"
        report_path.write_text(json.dumps(report))
    client = Client()
    with pytest.raises(MonitorError):
        run(project, client=client, previous=path)
    assert not client.calls


@pytest.mark.parametrize("when", ["before-write", "after-write"])
def test_report_write_or_close_error_cannot_publish_success(project, monkeypatch, when):
    original = monitor._write

    def fail(path, value):
        if path.name in {"report.pending.json", "report.json"}:
            if when == "after-write":
                original(path, value)
            raise OSError("private report write or close diagnostic")
        original(path, value)

    monkeypatch.setattr(monitor, "_write", fail)
    with pytest.raises(MonitorError, match="STOP_REPORT_PUBLICATION"):
        run(project)
    output = project[0] / "qa/source-monitor/run1"
    assert not (output / "report.json").exists()
    with pytest.raises(MonitorError):
        run(project, "run2", previous=output / "state.json")


def test_report_fsync_error_cannot_publish_success(project, monkeypatch):
    original_write, original_fsync = monitor._write, monitor.os.fsync
    active = []

    def write(path, value):
        active.append(path.name)
        try:
            original_write(path, value)
        finally:
            active.pop()

    def fsync(fd):
        if active and active[-1] in {"report.pending.json", "report.json"}:
            raise OSError("private report fsync diagnostic")
        original_fsync(fd)

    monkeypatch.setattr(monitor, "_write", write)
    monkeypatch.setattr(monitor.os, "fsync", fsync)
    with pytest.raises(MonitorError, match="STOP_REPORT_PUBLICATION"):
        run(project)
    assert not (project[0] / "qa/source-monitor/run1/report.json").exists()


def test_report_readback_mismatch_never_publishes_success(project, monkeypatch):
    original = monitor._write

    def alter(path, value):
        original(path, value)
        if path.name in {"report.pending.json", "report.json"}:
            path.write_bytes(b"{}")

    monkeypatch.setattr(monitor, "_write", alter)
    with pytest.raises(MonitorError, match="STOP_REPORT_READBACK_MISMATCH"):
        run(project)
    assert not (project[0] / "qa/source-monitor/run1/report.json").exists()


@pytest.mark.parametrize("existing", [False, True])
def test_report_publication_error_preserves_prior_files_without_fallback_write(project, monkeypatch, existing):
    def fail_link(source, target):
        if existing:
            Path(target).write_bytes(b"another writer's file")
            raise FileExistsError("existing report")
        raise OSError("hard links unavailable")

    monkeypatch.setattr(monitor.os, "link", fail_link)
    with pytest.raises(MonitorError, match="STOP_REPORT_PUBLICATION"):
        run(project)
    output = project[0] / "qa/source-monitor/run1"
    assert (output / "report.pending.json").exists()
    if existing:
        assert (output / "report.json").read_bytes() == b"another writer's file"
    else:
        assert not (output / "report.json").exists()
