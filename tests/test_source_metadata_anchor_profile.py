"""Explicit anchor representations; synthetic files and provider responses only."""

from copy import deepcopy
from datetime import timedelta
import json

import pytest

from scripts import acknowledge_source_notices as ack
from scripts import check_source_metadata as monitor
from scripts import run_source_maintenance as runner
from tests.test_source_metadata_cli import Client, NOW, project, sha  # noqa: F401
from tests.test_source_maintenance_runner import cycle, metadata, ref, resume, setup  # noqa: F401
from tests.test_source_metadata_request_budget import response, snapshot
from tests.test_source_metadata_request_budget import deny_network_and_processes  # noqa: F401


ANCHOR_BYTES = {
    "local": {"pipeline/config/sources.yaml": b"sources: []\r\n", "raw/manifest.json": b"{}\r\n"},
    "git": {"pipeline/config/sources.yaml": b"sources: []\n", "raw/manifest.json": b"{}\n"},
}


def representation(root, profile):
    for relative, content in ANCHOR_BYTES[profile].items():
        (root / relative).write_bytes(content)


def configure(root, catalog, profile):
    for selected, field in (("local", "anchors"), ("git", "gitAnchors")):
        catalog[field] = {relative: sha(content) for relative, content in ANCHOR_BYTES[selected].items()}
    (root / "source-metadata-catalog.json").write_text(json.dumps(catalog), encoding="utf8")
    representation(root, profile)


def check(root, label="check", **changes):
    return monitor.run_check(root, root / "qa/source-monitor" / label,
        **{"bootstrap": True, "client": Client(), "clock": lambda: NOW, **changes})


@pytest.mark.parametrize("entry", ["check", "cycle", "resume", "ack"])
@pytest.mark.parametrize("profile", [None, True, 0, "", "LOCAL", "Git", "auto", [], {}])
def test_invalid_profile_rejected_before_clock_paths_clients_or_io(monkeypatch, entry, profile):
    def forbidden(*args, **kwargs):
        pytest.fail("Invalid profile must fail before any IO or client construction")

    for name in ("_read", "_write", "_safe_path", "MetadataClient"):
        monkeypatch.setattr(monitor, name, forbidden)
    monkeypatch.setattr(runner, "_fresh", forbidden)
    root = monitor.ROOT
    arguments = {"anchor_profile": profile, "clock": forbidden}
    with pytest.raises(monitor.MonitorError, match="STOP_ANCHOR_PROFILE"):
        if entry == "check":
            monitor.run_check(root, root / "unused", bootstrap=True, **arguments)
        elif entry == "cycle":
            runner.run_cycle(root, root / "unused", root / "unused-ack", bootstrap=True,
                metadata_client=None, journal=None, transport_factory=forbidden, **arguments)
        elif entry == "resume":
            runner.resume_pending(root, root / "unused", origin=None, current=None,
                journal=None, transport=None, **arguments)
        else:
            ack.publish_checkpoint(root, root / "unused", previous=None, proofs=[],
                destination="", author_id=0, journal=None, transport=None, **arguments)


@pytest.mark.parametrize("physical", ["local", "git"])
@pytest.mark.parametrize("selected", [None, "local", "git"])
def test_exact_selected_representation_without_conversion_or_fallback(project, physical, selected):
    root, catalog = project
    configure(root, catalog, physical)
    before = snapshot(root)
    client = Client()
    profile = selected or "local"
    arguments = {} if selected is None else {"anchor_profile": selected}
    if profile != physical:
        with pytest.raises(monitor.MonitorError, match="STOP_INPUT_MISMATCH.*expected=.*actual="):
            check(root, client=client, **arguments)
        assert client.calls == [] and snapshot(root) == before
    else:
        report, code = check(root, client=client, **arguments)
        assert code == 0 and len(client.calls) == 1
        assert report["anchorProfile"] == profile
        expected = catalog["anchors" if profile == "local" else "gitAnchors"]
        assert report["integrity"] == {"status": "ok", "before": expected, "after": expected}
        started = json.loads((root / "qa/source-monitor/check/started.json").read_bytes())
        assert started["anchorProfile"] == profile
        envelope = json.loads((root / "qa/source-monitor/check/state.json").read_bytes())
        assert set(envelope) == {"schemaVersion", "catalogSha256", "finishedAt", "sources"}
        for path, content in before.items():
            assert snapshot(root)[path] == content


@pytest.mark.parametrize("profile", ["local", "git"])
@pytest.mark.parametrize("relative", sorted(monitor.ANCHORS))
@pytest.mark.parametrize("when", ["before", "during"])
def test_each_selected_anchor_is_checked_before_and_after_metadata(project, profile, relative, when):
    root, catalog = project
    configure(root, catalog, profile)
    path = root / relative
    alternate = ANCHOR_BYTES["git" if profile == "local" else "local"][relative]
    client = Client()
    if when == "before":
        path.write_bytes(alternate)
        with pytest.raises(monitor.MonitorError, match="STOP_INPUT_MISMATCH"):
            check(root, client=client, anchor_profile=profile)
        assert client.calls == [] and not (root / "qa/source-monitor").exists()
    else:
        original = client.get_json

        def mutate(*args):
            path.write_bytes(alternate)
            return original(*args)

        client.get_json = mutate
        report, code = check(root, client=client, anchor_profile=profile)
        assert code == 2 and report["anchorProfile"] == profile
        assert report["integrity"]["status"] == "failed"
        assert "STOP_INPUT_MISMATCH" in report["integrity"]["error"]
        assert not (root / "qa/source-monitor/check/state.json").exists()
    assert path.read_bytes() == alternate


@pytest.mark.parametrize("prior_profile", ["local", "git", "legacy"])
@pytest.mark.parametrize("selected", ["local", "git"])
def test_profile_is_required_even_when_both_anchor_sets_are_identical(project, prior_profile, selected):
    root, _ = project
    check(root, "first", anchor_profile="local" if prior_profile == "legacy" else prior_profile)
    prior = root / "qa/source-monitor/first/state.json"
    if prior_profile == "legacy":
        report = json.loads(prior.with_name("report.json").read_bytes())
        report.pop("anchorProfile")
        prior.with_name("report.json").write_text(json.dumps(report), encoding="utf8")
    before = snapshot(root)
    client = Client()
    if selected != ("local" if prior_profile == "legacy" else prior_profile):
        with pytest.raises(monitor.MonitorError, match="anchor profile differs"):
            check(root, "next", bootstrap=False, previous=prior, client=client, anchor_profile=selected)
        assert client.calls == [] and snapshot(root) == before
    else:
        report, code = check(root, "next", bootstrap=False, previous=prior, client=client, anchor_profile=selected)
        assert code == 0 and report["stateRestored"] and report["anchorProfile"] == selected


@pytest.mark.parametrize("profile", [None, "auto", True, []])
def test_invalid_report_profile_is_not_legacy_local(project, profile):
    root, _ = project
    check(root, "first")
    prior = root / "qa/source-monitor/first/state.json"
    report = json.loads(prior.with_name("report.json").read_bytes())
    report["anchorProfile"] = profile
    prior.with_name("report.json").write_text(json.dumps(report), encoding="utf8")
    client = Client()
    with pytest.raises(monitor.MonitorError, match="anchor profile differs"):
        check(root, "next", bootstrap=False, previous=prior, client=client)
    assert client.calls == []


def test_git_cycle_checkpoint_and_next_check_preserve_profile_and_cooldown(setup):
    configure(setup["root"], setup["catalog"], "git")
    before = snapshot(setup["root"])
    first = cycle(setup, anchor_profile="git")
    assert first["status"] == "acknowledged" and first["anchorProfile"] == "git"
    assert first["githubRequests"] == 3 and setup["provider"].calls == ["POST", "GET", "GET"]
    for key in ("originState", "currentState"):
        path = ref(first[key]).path.with_name("report.json")
        assert json.loads(path.read_bytes())["anchorProfile"] == "git"
    for path, content in before.items():
        assert snapshot(setup["root"])[path] == content
    client = Client()
    second = cycle(setup, "next", bootstrap=False, previous=ref(first["currentState"]),
        metadata_client=client, anchor_profile="git", clock=lambda: NOW + timedelta(hours=1))
    assert second["status"] == "no_pending_notices" and second["anchorProfile"] == "git"
    assert second["metadataRequests"] == 0 and client.calls == []
    assert setup["provider"].calls.count("POST") == 1


@pytest.mark.parametrize("profile", ["local", "git"])
def test_runner_cross_profile_predecessor_and_resume_stop_before_io(setup, profile):
    first = cycle(setup, anchor_profile=profile)
    other = "git" if profile == "local" else "local"
    before = snapshot(setup["root"])
    client, factory_count = Client(), len(setup["clients"])
    with pytest.raises(monitor.MonitorError, match="anchor profile differs"):
        cycle(setup, "next", bootstrap=False, previous=ref(first["currentState"]),
            metadata_client=client, anchor_profile=other)
    assert client.calls == [] and len(setup["clients"]) == factory_count
    with pytest.raises(monitor.MonitorError, match="anchor profile differs"):
        resume(setup, first, anchor_profile=other)
    assert snapshot(setup["root"]) == before
    assert setup["provider"].calls == ["POST", "GET", "GET"]


def test_git_resume_uses_one_24_request_budget_for_eight_then_one_notices(setup):
    base = setup["catalog"]["sources"][0]
    setup["catalog"]["sources"] = [{**deepcopy(base), "key": f"rail_{i}"} for i in range(9)]
    configure(setup["root"], setup["catalog"], "git")
    client = metadata()
    client.responses *= 9
    first = cycle(setup, metadata_client=client, anchor_profile="git")
    assert first["pendingCount"] == 1 and len(first["acknowledgedIds"]) == 8
    assert first["githubRequests"] == 24 and len(setup["clients"]) == 1
    second = resume(setup, first, anchor_profile="git")
    assert second["status"] == "acknowledged" and second["pendingCount"] == 0
    assert second["githubRequests"] == 3 and second["anchorProfile"] == "git"
    assert setup["provider"].calls.count("POST") == 9
    for value in setup["provider"].values.values():
        assert first["originState"]["reportSha256"] in value["body"]


def test_git_failed_readback_resume_never_reposts(setup):
    configure(setup["root"], setup["catalog"], "git")
    setup["provider"].hook = lambda value: {"data": {}, "nextPage": None, **response(503)} if value["method"] == "GET" else None
    first = cycle(setup, anchor_profile="git")
    assert first["status"] == "stopped" and first["anchorProfile"] == "git"
    assert first["currentState"] == first["originState"]
    setup["provider"].hook = None
    second = resume(setup, first, anchor_profile="git")
    assert second["status"] == "acknowledged"
    assert setup["provider"].calls == ["POST", "GET", "GET", "GET"]


@pytest.mark.parametrize("phase", ["metadata", "post", "readback", "ack"])
def test_git_anchor_changes_during_cycle_stop_without_adopting_state_or_reposting(setup, phase):
    root = setup["root"]
    configure(root, setup["catalog"], "git")
    path = root / "raw/manifest.json"
    client = metadata()
    if phase == "metadata":
        original = client.get_json

        def change(*args):
            path.write_bytes(ANCHOR_BYTES["local"]["raw/manifest.json"])
            return original(*args)

        client.get_json = change
    else:
        target = {"post": 1, "readback": 2, "ack": 3}[phase]

        def change(value):
            if len(setup["provider"].calls) == target:
                path.write_bytes(ANCHOR_BYTES["local"]["raw/manifest.json"])

        setup["provider"].hook = change
    result = cycle(setup, metadata_client=client, anchor_profile="git")
    assert result["status"] == "stopped" and result["anchorProfile"] == "git"
    assert not (root / "qa/source-monitor/first-ack").exists()
    if phase == "metadata":
        assert result["reason"] == "metadata_check_stopped" and setup["clients"] == []
        assert setup["provider"].calls == []
    else:
        assert result["currentState"] == result["originState"] and result["acknowledgedIds"] == []
        assert len(setup["provider"].calls) == target
        if phase in ("readback", "ack"):
            assert result["deliveries"][0]["receiptSha256"]
        setup["provider"].hook = None
        path.write_bytes(ANCHOR_BYTES["git"]["raw/manifest.json"])
        resumed = resume(setup, result, anchor_profile="git")
        assert resumed["status"] == "acknowledged"
        assert setup["provider"].calls.count("POST") == 1


@pytest.mark.parametrize("which", ["predecessor", "origin"])
def test_ack_replay_rejects_cross_profile_ancestry_even_with_updated_pins(setup, which):
    first = cycle(setup, anchor_profile="git")
    ack_path = ref(first["currentState"]).path.with_name("report.json")
    report = json.loads(ack_path.read_bytes())
    if which == "predecessor":
        target = setup["root"] / "qa/source-monitor/other/state.json"
        check(setup["root"], "other", client=metadata())
        report["previousState"] = target.relative_to(setup["root"]).as_posix()
        report["previousStateSha256"] = sha(target.read_bytes())
        report["previousReportSha256"] = sha(target.with_name("report.json").read_bytes())
    else:
        target = ref(first["originState"]).path.with_name("report.json")
        origin = json.loads(target.read_bytes())
        origin["anchorProfile"] = "local"
        target.write_text(json.dumps(origin), encoding="utf8")
        report["acknowledgements"][0]["originReportSha256"] = sha(target.read_bytes())
        # Keep the predecessor git-profiled, so the origin-specific gate is exercised.
        check(setup["root"], "other", client=metadata(), anchor_profile="git")
        prior = setup["root"] / "qa/source-monitor/other/state.json"
        report["previousState"] = prior.relative_to(setup["root"]).as_posix()
        report["previousStateSha256"] = sha(prior.read_bytes())
        report["previousReportSha256"] = sha(prior.with_name("report.json").read_bytes())
    ack_path.write_text(json.dumps(report), encoding="utf8")
    client = Client()
    with pytest.raises(monitor.MonitorError, match="invalid acknowledgement checkpoint"):
        check(setup["root"], "next", bootstrap=False, previous=ack_path.with_name("state.json"),
            client=client, anchor_profile="git")
    assert client.calls == []


@pytest.mark.parametrize("profile", ["local", "git"])
def test_resume_rejects_cross_profile_current_with_matching_origin(setup, profile):
    first = cycle(setup, anchor_profile=profile)
    other = "git" if profile == "local" else "local"
    check(setup["root"], "other", client=metadata(), anchor_profile=other)
    current = runner._pin(setup["root"] / "qa/source-monitor/other/state.json")
    before = snapshot(setup["root"])
    with pytest.raises(monitor.MonitorError, match="anchor profile differs"):
        resume(setup, first, current=current, anchor_profile=profile)
    assert setup["provider"].calls == ["POST", "GET", "GET"]
    assert snapshot(setup["root"]) == before


def test_legacy_local_check_and_acknowledgement_reports_remain_restorable(setup, monkeypatch):
    original = monitor._publish_report

    def legacy(output, report):
        report.pop("anchorProfile")
        return original(output, report)

    monkeypatch.setattr(monitor, "_publish_report", legacy)
    first = cycle(setup)
    for key in ("originState", "currentState"):
        report = json.loads(ref(first[key]).path.with_name("report.json").read_bytes())
        assert "anchorProfile" not in report
    monkeypatch.setattr(monitor, "_publish_report", original)
    result = cycle(setup, "next", bootstrap=False, previous=ref(first["currentState"]),
        clock=lambda: NOW + timedelta(hours=1))
    assert result["status"] == "no_pending_notices" and result["anchorProfile"] == "local"
    assert setup["provider"].calls.count("POST") == 1


@pytest.mark.parametrize("profile", ["local", "git"])
@pytest.mark.parametrize("failure", ["profile", "anchor_before", "anchor_during"])
def test_direct_checkpoint_enforces_profile_and_exact_anchors_before_publication(setup, profile, failure):
    root = setup["root"]
    if failure != "profile":
        configure(root, setup["catalog"], profile)
    first = cycle(setup, anchor_profile=profile)
    selected = ("git" if profile == "local" else "local") if failure == "profile" else profile
    if failure == "anchor_before":
        representation(root, "git" if profile == "local" else "local")
    elif failure == "anchor_during":
        def mutate(value):
            representation(root, "git" if profile == "local" else "local")

        setup["provider"].hook = mutate
    count = len(setup["provider"].calls)
    output = root / "qa/source-monitor/direct"
    proof = {"originState": first["originState"]["path"],
             "noticeId": first["deliveries"][0]["noticeId"],
             "receiptSha256": first["deliveries"][0]["receiptSha256"]}
    transport = setup["factory"]()
    journal_before = snapshot(setup["journal"].path)
    with pytest.raises(monitor.MonitorError, match="anchor profile differs" if failure == "profile" else "STOP_INPUT_MISMATCH"):
        ack.publish_checkpoint(root, output, previous=ref(first["originState"]).path,
            proofs=[proof], destination=transport.destination, author_id=transport.author_id,
            journal=setup["journal"], transport=transport, anchor_profile=selected,
            clock=lambda: NOW + timedelta(hours=1))
    assert not output.exists()
    assert len(setup["provider"].calls) == count + (failure == "anchor_during")
    if failure != "anchor_during":
        assert snapshot(setup["journal"].path) == journal_before
