"""Scheduler/checkpoint boundaries; synthetic state only, no external activation."""

from copy import deepcopy
import json
from pathlib import Path
import zipfile

import pytest

from scripts import scheduled_source_metadata as scheduler
from tests.test_source_metadata_cli import Client, project  # noqa: F401
from tests.test_source_metadata_request_budget import deny_network_and_processes  # noqa: F401
from tests.test_source_maintenance_runner import setup  # noqa: F401
from tests.test_source_metadata_request_budget import response


def identity(run=1, attempt=1):
    return {"runId": run, "runNumber": run, "attempt": attempt}


def saved_project(tmp_path):
    root = tmp_path / "original"
    root.mkdir()
    (root / "source-metadata-catalog.json").write_bytes(b"{}")
    name = "qa/source-monitor/ci-1-1-check/state.json"
    path = root / name
    path.parent.mkdir(parents=True)
    path.write_bytes(b'{"preserved":true}\n')
    meta = {**identity(), "schemaVersion": 1, "repository": scheduler.REPOSITORY,
            "workflow": scheduler.WORKFLOW, "anchorProfile": "git", "status": "ready",
            "catalogSha256": scheduler.sha(b"{}")}
    archive = tmp_path / "checkpoint.zip"
    scheduler.pack_checkpoint(root, archive, meta)
    target = tmp_path / "restored"
    target.mkdir()
    (target / "source-metadata-catalog.json").write_bytes(b"{}")
    return root, target, archive, name


def rewrite(archive, target, change):
    with zipfile.ZipFile(archive) as source:
        contents = {item.filename: source.read(item) for item in source.infolist()}
    change(contents)
    with zipfile.ZipFile(target, "x", compression=zipfile.ZIP_DEFLATED) as out:
        for name, raw in contents.items():
            out.writestr(name, raw)


def test_checkpoint_round_trip_preserves_exact_bytes(tmp_path):
    root, target, archive, name = saved_project(tmp_path)
    manifest = scheduler.restore_checkpoint(target, archive, run_id=1, attempt=1)
    assert manifest["anchorProfile"] == "git"
    assert (target / name).read_bytes() == (root / name).read_bytes()
    assert manifest["files"][0]["sha256"] == scheduler.sha((root / name).read_bytes())


@pytest.mark.parametrize("field,value", [
    ("runId", 2), ("attempt", 2), ("repository", "other/project"),
    ("workflow", "other.yml"), ("anchorProfile", "local"),
    ("status", "stopped"), ("catalogSha256", "0" * 64),
])
def test_wrong_or_stopped_checkpoint_rejected_before_restore(tmp_path, field, value):
    _, target, archive, name = saved_project(tmp_path)
    def change(contents):
        meta = json.loads(contents["manifest.json"])
        meta[field] = value
        contents["manifest.json"] = scheduler.encode(meta)
    altered = tmp_path / "altered.zip"
    rewrite(archive, altered, change)
    with pytest.raises(scheduler.ScheduleError, match="IDENTITY_OR_STOPPED"):
        scheduler.restore_checkpoint(target, altered, run_id=1, attempt=1)
    assert not (target / name).exists()


@pytest.mark.parametrize("name", ["../outside", "/absolute", "C:/outside", "web/public/data/input.json", "raw/manifest.json", ".env", scheduler.JOURNAL + "/token.txt"])
def test_archive_paths_are_allowlisted(tmp_path, name):
    with pytest.raises(scheduler.ScheduleError, match="PATH"):
        scheduler.safe_file(tmp_path, name)


def test_hash_mismatch_is_not_repaired(tmp_path):
    _, target, archive, name = saved_project(tmp_path)
    altered = tmp_path / "altered.zip"
    rewrite(archive, altered, lambda contents: contents.update({name: b"changed"}))
    with pytest.raises(scheduler.ScheduleError, match="HASH"):
        scheduler.restore_checkpoint(target, altered, run_id=1, attempt=1)
    assert not (target / name).exists()


def test_existing_file_is_not_overwritten(tmp_path):
    _, target, archive, name = saved_project(tmp_path)
    path = target / name
    path.parent.mkdir(parents=True)
    path.write_bytes(b"existing")
    with pytest.raises(scheduler.ScheduleError, match="COLLISION"):
        scheduler.restore_checkpoint(target, archive, run_id=1, attempt=1)
    assert path.read_bytes() == b"existing"


def test_extra_unlisted_file_prevents_all_writes(tmp_path):
    _, target, archive, name = saved_project(tmp_path)
    altered = tmp_path / "altered.zip"
    rewrite(archive, altered, lambda contents: contents.update({"unlisted.txt": b"secret"}))
    with pytest.raises(scheduler.ScheduleError, match="UNLISTED"):
        scheduler.restore_checkpoint(target, altered, run_id=1, attempt=1)
    assert not (target / name).exists()


def test_snapshot_bounds_total_history(tmp_path, monkeypatch):
    root, _, _, _ = saved_project(tmp_path)
    monkeypatch.setattr(scheduler, "MAX_TOTAL", 1)
    with pytest.raises(scheduler.ScheduleError, match="SIZE_BOUND"):
        scheduler.pack_checkpoint(root, tmp_path / "too-large.zip", {})
    assert not (tmp_path / "too-large.zip").exists()


def run_record(run, *, status="completed", branch="main", event="schedule", attempt=1):
    return {"id": run * 100, "run_number": run, "run_attempt": attempt,
            "status": status, "head_branch": branch, "event": event}


def test_only_explicit_first_workflow_run_can_bootstrap():
    assert scheduler.previous_run({"workflow_runs": [run_record(1, status="in_progress")]},
        run_id=100, run_number=1, attempt=1, bootstrap=True) is None


@pytest.mark.parametrize("number,attempt,bootstrap", [(1, 1, False), (2, 1, True), (2, 1, False), (1, 2, True)])
def test_missing_history_does_not_allow_implicit_or_repeated_bootstrap(number, attempt, bootstrap):
    with pytest.raises(scheduler.ScheduleError):
        scheduler.previous_run({"workflow_runs": []}, run_id=100, run_number=number, attempt=attempt, bootstrap=bootstrap)


def test_latest_failed_attempt_is_predecessor_not_older_success():
    values = [run_record(3, status="in_progress"), run_record(2, attempt=2), run_record(1)]
    assert scheduler.previous_run({"workflow_runs": values}, run_id=300, run_number=3, attempt=1, bootstrap=False) == (200, 2)


@pytest.mark.parametrize("changes", [{"status": "in_progress"}, {"branch": "feature"}, {"event": "pull_request"}])
def test_predecessor_must_be_terminal_main_trusted_event(changes):
    with pytest.raises(scheduler.ScheduleError, match="NOT_TERMINAL_MAIN"):
        scheduler.previous_run({"workflow_runs": [run_record(1, **changes)]}, run_id=200, run_number=2, attempt=1, bootstrap=False)


def test_rerun_requires_a_new_dispatch_not_an_old_attempt():
    with pytest.raises(scheduler.ScheduleError, match="RERUN_UNSAFE_HISTORY"):
        scheduler.previous_run({"workflow_runs": [run_record(2, attempt=3)]}, run_id=200, run_number=2, attempt=3, bootstrap=False)


def test_deleted_intermediate_run_cannot_roll_back_journal():
    with pytest.raises(scheduler.ScheduleError, match="HISTORY_GAP"):
        scheduler.previous_run({"workflow_runs": [run_record(3), run_record(1)]},
            run_id=300, run_number=3, attempt=1, bootstrap=False)


def test_stale_rerun_cannot_roll_back_journal():
    with pytest.raises(scheduler.ScheduleError, match="RERUN_UNSAFE_HISTORY"):
        scheduler.previous_run({"workflow_runs": [run_record(2), run_record(1, attempt=2)]},
            run_id=100, run_number=1, attempt=2, bootstrap=False)


def test_rerun_cannot_bypass_discovery():
    with pytest.raises(scheduler.ScheduleError, match="RERUN_UNSAFE_HISTORY"):
        scheduler.previous_run({"workflow_runs": []}, run_id=200, run_number=2, attempt=2, bootstrap=False)


def test_deleted_newer_run_cannot_make_old_rerun_safe():
    with pytest.raises(scheduler.ScheduleError, match="RERUN_UNSAFE_HISTORY"):
        scheduler.previous_run({"workflow_runs": [run_record(1, attempt=2)]},
            run_id=100, run_number=1, attempt=2, bootstrap=False)


def test_tracked_live_review_evidence_is_not_checkpoint_history(tmp_path):
    root, _, _, _ = saved_project(tmp_path)
    other = root / "qa/source-monitor/live-review-1/state.json"
    other.parent.mkdir(parents=True)
    other.write_bytes(b"unrelated evidence")
    archive = tmp_path / "owned.zip"
    scheduler.pack_checkpoint(root, archive, {})
    with zipfile.ZipFile(archive) as saved:
        assert not any("live-review-1" in name for name in saved.namelist())
    assert other.read_bytes() == b"unrelated evidence"


@pytest.mark.parametrize("limit", ["MAX_TOTAL", "MAX_FILES", "MAX_ZIP"])
def test_capacity_stop_precedes_metadata_notice_and_journal_io(setup, monkeypatch, limit):
    root = setup["root"]
    monkeypatch.setattr(scheduler, limit, 1)
    def forbidden():
        pytest.fail("No external operation before capacity reservation")
    output = root / "output"
    output.mkdir()
    with pytest.raises(scheduler.ScheduleError, match="CAPACITY_BEFORE_IO"):
        scheduler.execute(root, output, identity=identity(), previous=None, token="synthetic",
            credentials={}, metadata_factory=forbidden, transport_factory=lambda _: forbidden())
    assert not (root / scheduler.JOURNAL).exists()
    assert setup["provider"].calls == []
    assert list(output.iterdir()) == []


def test_oversize_archive_is_not_upload_visible(tmp_path, monkeypatch):
    root, _, _, _ = saved_project(tmp_path)
    monkeypatch.setattr(scheduler, "MAX_ZIP", 1)
    output = tmp_path / "oversize.zip"
    with pytest.raises(scheduler.ScheduleError, match="ARCHIVE_BOUND"):
        scheduler.pack_checkpoint(root, output, {})
    assert not output.exists() and not output.with_suffix(".pending.zip").exists()


def test_monitor_and_journal_writers_refuse_oversize_before_creation(tmp_path, monkeypatch):
    from scripts import source_metadata_comments as comments
    monkeypatch.setattr(scheduler.monitor, "MAX_FILE_BYTES", 1)
    monkeypatch.setattr(comments, "MAX_FILE_BYTES", 1)
    path = tmp_path / "oversize.json"
    with pytest.raises(scheduler.monitor.MonitorError, match="OUTPUT_FILE_BOUND"):
        scheduler.monitor._write(path, {"oversized": True})
    assert not path.exists()
    with pytest.raises(comments.DeliveryError, match="JOURNAL_BOUND"):
        comments._publish(path, b"oversized")
    assert not path.exists()


def test_local_invocation_cannot_activate_service():
    with pytest.raises(scheduler.ScheduleError, match="NOT_APPROVED"):
        scheduler.identity_from_env({})


def test_archive_identity_rejects_invalid_ids():
    for values in ((0, 1), (1, 0), (True, 1), ("1", 1)):
        with pytest.raises(scheduler.ScheduleError):
            scheduler.archive_name(*values)


def transport_factory(setup):
    def factory(journal):
        return scheduler.GitHubCommentClient("owner/source-notices#7", author_id=1234, token="synthetic",
            request=setup["provider"].request, budget=scheduler.GitHubRequestBudget(journal,
                clock=setup["clock"].time, monotonic=setup["clock"].monotonic, sleep=setup["clock"].sleep))
    return factory


def test_one_real_synthetic_scheduler_cycle_retains_checkpoint(setup):
    # setup supplies a journal for the older runner fixture; scheduler owns another.
    root = setup["root"]
    output = root / "qa/source-monitor-runs/1-1"
    output.mkdir(parents=True)
    result = scheduler.execute(root, output, identity=identity(), previous=None, token="synthetic",
        credentials={}, metadata_factory=Client, transport_factory=transport_factory(setup))
    assert result["status"] == "ready" and result["exitCode"] == 0
    assert result["metadataCheckPerformed"] and result["batches"] == 1
    assert result["githubNoticeRequests"] == 0
    with zipfile.ZipFile(output / "checkpoint.zip") as archive:
        meta = json.loads(archive.read("manifest.json"))
    assert meta["originState"] == meta["currentState"]
    assert meta["status"] == "ready" and meta["anchorProfile"] == "git"
    assert all(not f["path"].startswith("raw/") for f in meta["files"])


@pytest.mark.parametrize("count,batches,pending", [(9, 2, 0), (27, 3, 3)])
def test_batches_keep_original_notice_identity_and_cap_work(setup, count, batches, pending):
    root = setup["root"]
    base = setup["catalog"]["sources"][0]
    setup["catalog"]["sources"] = [{**deepcopy(base), "key": f"rail_{i}"} for i in range(count)]
    (root / "source-metadata-catalog.json").write_bytes(scheduler.encode(setup["catalog"]))
    client = Client([{"outcome": "error", "attempted": True, "reason": "test_provider_unavailable"}] * count)
    out = root / "qa/source-monitor-runs/1-1"
    out.mkdir(parents=True)
    first = scheduler.execute(root, out, identity=identity(), previous=None, token="synthetic",
        credentials={}, metadata_factory=lambda: client, transport_factory=transport_factory(setup))
    assert first["status"] == "ready" and first["exitCode"] == 1
    assert first["batches"] == batches and first["pendingCount"] == pending
    assert first["githubNoticeRequests"] == 3 * min(count, 24)
    assert setup["provider"].calls.count("POST") == min(count, 24)
    with zipfile.ZipFile(out / "checkpoint.zip") as archive:
        previous = json.loads(archive.read("manifest.json"))
    assert all(previous["originState"]["stateSha256"] in value["body"] for value in setup["provider"].values.values())
    if pending:
        def forbidden():
            raise AssertionError("Drain old notices before new metadata checking")
        out2 = root / "qa/source-monitor-runs/2-1"
        out2.mkdir(parents=True)
        resumed = scheduler.execute(root, out2, identity=identity(2), previous=previous, token="synthetic",
            credentials={}, metadata_factory=forbidden, transport_factory=transport_factory(setup))
        assert resumed["status"] == "ready" and resumed["pendingCount"] == 0
        assert resumed["metadataCheckPerformed"] is False and resumed["sourceHealth"] == "not_rechecked"
        assert setup["provider"].calls.count("POST") == count


def test_uncertain_send_retains_journal_and_stops_instead_of_retrying(setup):
    root = setup["root"]
    setup["provider"].hook = lambda value: {"data": {}, "nextPage": None, **response(503)} if value["method"] == "GET" else None
    out = root / "qa/source-monitor-runs/1-1"
    out.mkdir(parents=True)
    client = Client([{"outcome": "error", "attempted": True, "reason": "test_unavailable"}])
    result = scheduler.execute(root, out, identity=identity(), previous=None, token="synthetic",
        credentials={}, metadata_factory=lambda: client, transport_factory=transport_factory(setup))
    assert result["status"] == "stopped" and result["exitCode"] == 2
    assert setup["provider"].calls == ["POST", "GET"]
    with zipfile.ZipFile(out / "checkpoint.zip") as archive:
        meta = json.loads(archive.read("manifest.json"))
        assert meta["status"] == "stopped"
        assert any(p.endswith('.intent.json') for p in archive.namelist())
        assert any(p.endswith('.posted.json') for p in archive.namelist())
    assert (out / "summary.json").is_file()


def test_workflow_is_schedule_and_manual_only_with_least_privilege():
    import yaml
    path = Path(__file__).resolve().parents[1] / ".github/workflows/source-metadata-weekly.yml"
    workflow = yaml.safe_load(path.read_text(encoding="utf8"))
    events = workflow.get("on", workflow.get(True))
    assert set(events) == {"schedule", "workflow_dispatch"}
    assert events["schedule"] == [{"cron": "17 1 * * 1"}]
    assert workflow["concurrency"]["cancel-in-progress"] is False
    job = workflow["jobs"]["metadata"]
    assert job["permissions"] == {"contents": "read", "actions": "read", "issues": "write"}
    assert job["timeout-minutes"] == 25
    steps = job["steps"]
    assert steps[-1]["if"] == "always()"
    assert steps[-1]["with"]["overwrite"] is False
    assert steps[-1]["with"]["retention-days"] == 30
    assert steps[2]["env"]["GH_TOKEN"] == "${{ github.token }}"
    assert "GH_PAT" not in path.read_text(encoding="utf8")
    assert "pip install" not in path.read_text(encoding="utf8")
    assert "run.py" not in path.read_text(encoding="utf8")
