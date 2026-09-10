"""Publish orchestration uses literal fixtures; no exporter, payload or network."""
import json
import sys
from types import ModuleType
from pathlib import Path

import pytest

from pipeline import publish


@pytest.fixture(autouse=True)
def prohibit_pipeline_imports(monkeypatch):
    forbidden = ModuleType("pipeline.export")
    def blocked(name):
        raise AssertionError(f"Pipeline export access prohibited in fixtures: {name}")
    forbidden.__getattr__ = blocked
    monkeypatch.setitem(sys.modules, "pipeline.export", forbidden)


@pytest.fixture
def release(tmp_path, monkeypatch):
    root = tmp_path / "repo"
    web = root / "web"
    data = web / "public/data/current"
    data.mkdir(parents=True)
    overlay = web / "public/data/lamp_posts_v1"
    overlay.mkdir()
    (web / "data-bundle.json").write_text('{"bundle":"current"}')
    (data / "manifest.json").write_text("{}")
    (overlay / "manifest.json").write_text("{}")
    monkeypatch.setattr(publish, "PROJECT_ROOT", root)
    for name in ("SHIOK_DATA_BUNDLE", "NEXT_PUBLIC_DATA_BASE", "VERCEL_SCOPE", "VERCEL_PROJECT"):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv("VERCEL_PROJECT_ID", "prj_approved")
    monkeypatch.setenv("VERCEL_ORG_ID", "team_approved")
    monkeypatch.setattr(publish, "committed_pointer", lambda root: ("a" * 40, b'{"bundle":"current"}'))
    return root, web, data


def test_no_confirmation_does_not_even_inspect_inputs(monkeypatch):
    monkeypatch.setattr(publish, "publish_preflight", lambda **kw: pytest.fail("preflight called"))
    ok, report = publish.publish_production(Path("missing"), Path("missing"), confirm=False)
    assert not ok
    assert report["state"] == "confirmation_required"
    assert report["deploy_executed"] is False


def test_prepare_requires_own_confirmation_before_inspecting(release, monkeypatch):
    _, web, data = release
    monkeypatch.setattr(publish, "release_selection", lambda *a: pytest.fail("inputs read"))
    ok, report = publish.publish_preflight(data, web, run_external_checks=True)
    assert not ok
    assert report["state"] == "confirmation_required"


def test_default_preflight_is_plan_not_readiness(release, monkeypatch):
    _, web, data = release
    monkeypatch.setattr(publish, "prepare_vercel_source", lambda *a, **kw: pytest.fail("copy"))
    monkeypatch.setattr(publish, "run_command", lambda *a, **kw: pytest.fail("external"))
    ok, report = publish.publish_preflight(data, web)
    assert ok
    assert report["state"] == "plan_only"
    assert report["ready_to_submit"] is False
    assert report["production_smoke_verified"] is False


@pytest.mark.parametrize("name,value", [
    ("SHIOK_DATA_BUNDLE", "different"),
    ("NEXT_PUBLIC_DATA_BASE", "https://elsewhere.invalid/data/"),
])
def test_conflicting_environment_cannot_silently_change_artifact(release, monkeypatch, name, value):
    _, web, data = release
    monkeypatch.setenv(name, value)
    ok, report = publish.publish_preflight(data, web)
    assert not ok
    assert "override" in report["errors"][0]


def test_frontend_publish_rejects_different_bundle(release):
    _, web, data = release
    other = data.parent / "other"
    other.mkdir()
    ok, report = publish.publish_preflight(other, web)
    assert not ok
    assert "pinned" in report["errors"][0]


def test_missing_overlay_blocks_even_plan(release):
    _, web, data = release
    (data.parent / "lamp_posts_v1/manifest.json").unlink()
    ok, report = publish.publish_preflight(data, web)
    assert not ok
    assert "overlay" in report["errors"][0]


def test_changed_pointer_is_not_replaced_silently(release):
    _, web, data = release
    (web / "data-bundle.json").write_text('{"bundle":"changed"}')
    ok, report = publish.publish_preflight(data, web)
    assert not ok
    assert "committed" in report["errors"][0]


@pytest.fixture
def prepared(release, monkeypatch):
    root, web, data = release
    stage = root / "tmp/release"
    (stage / "web").mkdir(parents=True)
    calls = []
    monkeypatch.setattr(publish, "prepare_vercel_source", lambda *a, **kw: {
        "stageRoot": str(stage), "releaseManifestSha256": "1" * 64,
    })
    monkeypatch.setattr(publish, "verify_stage", lambda *a: {"ok": True, "releaseManifestSha256": "1" * 64})
    monkeypatch.setattr(publish, "validate_stage", lambda *a: {"ok": True, "static": {}, "overlay": {}})
    monkeypatch.setattr(publish, "link_build_dependencies", lambda *a: calls.append("link"))
    monkeypatch.setattr(publish, "check_build_dependencies", lambda *a: None)

    def run(cmd, cwd, **kwargs):
        calls.append(cmd)
        stdout = ""
        if "audit" in cmd:
            stdout = '{"metadata":{"vulnerabilities":{"total":0}}}'
        elif "deploy" in cmd:
            stdout = "https://deployment-unique.vercel.app"
        elif "inspect" in cmd:
            stdout = json.dumps({
                "id": "dpl_unique", "url": "deployment-unique.vercel.app",
                "target": "production", "readyState": "READY",
                "name": "sgshiok", "contextName": "theprawnvercel",
            })
        elif "api" in cmd:
            stdout = json.dumps({"envs": []} if cmd[2].endswith("/env") else {
                "id": "prj_approved", "accountId": "team_approved", "name": "sgshiok",
                "rootDirectory": "web", "framework": "nextjs", "outputDirectory": None,
            })
        return {"ok": True, "returncode": 0, "stdout": stdout, "stderr": ""}
    monkeypatch.setattr(publish, "run_command", run)
    return root, web, data, stage, calls, run


def test_preparation_never_deploys_and_builds_stage_directly(prepared):
    _, web, data, stage, calls, _ = prepared
    ok, report = publish.publish_preflight(data, web, run_external_checks=True, confirm_preparation=True)
    assert ok, report
    assert report["state"] == "prepared"
    assert report["ready_to_submit"] is False
    assert report["deploy_executed"] is False
    commands = [cmd for cmd in calls if isinstance(cmd, list)]
    assert not any("deploy" in cmd for cmd in commands)
    build = next(cmd for cmd in commands if "build" in cmd)
    assert build[-1] == "build"
    assert "next" in build[1]
    assert not any("install" in cmd or "ci" in cmd or "ensure-data-bundle" in str(cmd) for cmd in commands)
    assert str(stage) in report["deploy_source_dir"]


@pytest.mark.parametrize("gate", ["dependencies", "staging", "identity", "validation", "audit", "tests", "build"])
def test_every_pre_submission_failure_prevents_deploy(prepared, monkeypatch, gate):
    _, web, data, _, calls, original = prepared
    def fail(*a, **kw):
        raise ValueError("injected failure")
    if gate == "dependencies":
        monkeypatch.setattr(publish, "check_build_dependencies", fail)
    elif gate == "staging":
        monkeypatch.setattr(publish, "prepare_vercel_source", fail)
    elif gate == "identity":
        monkeypatch.setattr(publish, "verify_stage", lambda *a: {"ok": False})
    elif gate == "validation":
        monkeypatch.setattr(publish, "validate_stage", lambda *a: {"ok": False})
    else:
        def run(cmd, cwd, **kw):
            result = original(cmd, cwd, **kw)
            match = gate in cmd or (gate == "tests" and any("test-web.mjs" in part for part in cmd))
            return {**result, "ok": False, "returncode": 1} if match else result
        monkeypatch.setattr(publish, "run_command", run)
    ok, report = publish.publish_production(data, web, confirm=True)
    assert not ok
    assert report["deploy_executed"] is False
    assert not any(isinstance(cmd, list) and "deploy" in cmd for cmd in calls)
    assert (web / "data-bundle.json").read_text() == '{"bundle":"current"}'


@pytest.mark.parametrize("audit", [
    "not JSON", "{}", '{"metadata":{"vulnerabilities":{"total":2}}}',
    '{"metadata":{"vulnerabilities":{"total":null}}}',
    '{"metadata":{"vulnerabilities":{"total":false}}}',
])
def test_missing_or_nonzero_audit_total_blocks(prepared, monkeypatch, audit):
    _, web, data, _, calls, original = prepared
    def run(cmd, cwd, **kw):
        result = original(cmd, cwd, **kw)
        return {**result, "stdout": audit} if "audit" in cmd else result
    monkeypatch.setattr(publish, "run_command", run)
    ok, report = publish.publish_production(data, web, confirm=True)
    assert not ok
    assert report["deploy_executed"] is False
    assert not any(isinstance(cmd, list) and "build" in cmd for cmd in calls)


@pytest.mark.parametrize("error", [TypeError("shape"), AttributeError("null record has no get"), KeyError("missing")])
def test_validation_exception_is_a_block_not_a_deploy(prepared, monkeypatch, error):
    _, web, data, _, _, _ = prepared
    monkeypatch.setattr(publish, "validate_stage", lambda *a: (_ for _ in ()).throw(error))
    ok, report = publish.publish_production(data, web, confirm=True)
    assert not ok
    assert report["state"] == "blocked_before_submission"


def test_changed_stage_after_build_prevents_submission(prepared, monkeypatch):
    _, web, data, _, _, _ = prepared
    checks = iter([{"ok": True, "releaseManifestSha256": "1" * 64}, {"ok": False}])
    monkeypatch.setattr(publish, "verify_stage", lambda *a: next(checks))
    ok, report = publish.publish_production(data, web, confirm=True)
    assert not ok
    assert not report["deploy_executed"]


def test_rewritten_ledger_cannot_self_approve_changed_contents(prepared, monkeypatch):
    _, web, data, _, _, _ = prepared
    checks = iter([
        {"ok": True, "releaseManifestSha256": "1" * 64},
        {"ok": True, "releaseManifestSha256": "2" * 64},
    ])
    monkeypatch.setattr(publish, "verify_stage", lambda *a: next(checks))
    ok, report = publish.publish_production(data, web, confirm=True)
    assert not ok and not report["deploy_executed"]
    assert report["checks"]["post_build_identity"]["error"] == "release_ledger_changed"


def test_command_environment_does_not_inherit_build_overrides(monkeypatch):
    monkeypatch.setenv("NODE_OPTIONS", "--require untrusted.js")
    monkeypatch.setenv("NEXT_PUBLIC_DATA_BASE", "https://elsewhere.invalid/")
    monkeypatch.setenv("SHIOK_DATA_BUNDLE", "other")
    monkeypatch.setenv("VERCEL_PROJECT_ID", "prj_wrong")
    monkeypatch.setenv("VERCEL_TOKEN", "test-only")
    result = publish.command_environment()
    assert not {"NODE_OPTIONS", "NEXT_PUBLIC_DATA_BASE", "SHIOK_DATA_BUNDLE", "VERCEL_PROJECT_ID"} & result.keys()
    assert result["VERCEL_TOKEN"] == "test-only"


def test_queued_submission_must_be_inspected_by_exact_url(prepared):
    _, web, data, stage, calls, _ = prepared
    ok, report = publish.publish_production(data, web, confirm=True)
    assert ok, report
    assert report["state"] == "provider_ready"
    assert report["production_smoke_verified"] is False
    submit = next(cmd for cmd in calls if isinstance(cmd, list) and "deploy" in cmd)
    inspect = next(cmd for cmd in calls if isinstance(cmd, list) and "inspect" in cmd)
    assert str(stage) in submit
    assert submit[submit.index("--local-config") + 1] == str(stage / "web/vercel.json")
    assert submit[submit.index("--project") + 1] == "prj_approved"
    assert "NEXT_PUBLIC_DATA_BASE=/data/current/" in submit
    assert "NEXT_PUBLIC_LAMP_OVERLAY_BASE=/data/lamp_posts_v1/" in submit
    assert "NODE_OPTIONS=" in submit
    assert inspect[2] == "https://deployment-unique.vercel.app"
    assert "--wait" in inspect and "--json" in inspect
    assert "--timeout=5m" in inspect
    assert sum(isinstance(cmd, list) and "deploy" in cmd for cmd in calls) == 1


@pytest.mark.parametrize("patch", [
    {"readyState": "QUEUED"}, {"readyState": "BUILDING"}, {"readyState": "ERROR"},
    {"readyState": "CANCELED"}, {"url": "another.vercel.app"}, {"target": "preview"},
    {"name": "another-project"}, {"contextName": "another-team"}, {"id": ""},
    {"contextName": None},
])
def test_inspect_exit_zero_does_not_prove_ready_or_identity(prepared, monkeypatch, patch):
    _, web, data, _, _, original = prepared
    def run(cmd, cwd, **kw):
        result = original(cmd, cwd, **kw)
        if "inspect" in cmd:
            result["stdout"] = json.dumps({**json.loads(result["stdout"]), **patch})
        return result
    monkeypatch.setattr(publish, "run_command", run)
    ok, report = publish.publish_production(data, web, confirm=True)
    assert not ok
    assert report["deploy_executed"]
    assert report["state"] == "submission_unverified"
    assert not report["production_smoke_verified"]


@pytest.mark.parametrize("output", ["", "garbage", "https://evil.invalid", "https://user@x.vercel.app", "https://x.vercel.app/a"])
def test_unknown_submission_output_is_never_retried(prepared, monkeypatch, output):
    _, web, data, _, calls, original = prepared
    def run(cmd, cwd, **kw):
        result = original(cmd, cwd, **kw)
        if "deploy" in cmd:
            result["stdout"] = output
        return result
    monkeypatch.setattr(publish, "run_command", run)
    ok, report = publish.publish_production(data, web, confirm=True)
    assert not ok
    assert report["state"] == "submission_unverified"
    assert report["deploy_executed"]
    assert sum(isinstance(cmd, list) and "deploy" in cmd for cmd in calls) == 1


def test_authentication_failure_prevents_submission(prepared, monkeypatch):
    _, web, data, _, _, original = prepared
    def run(cmd, cwd, **kw):
        result = original(cmd, cwd, **kw)
        return {**result, "ok": False} if "whoami" in cmd else result
    monkeypatch.setattr(publish, "run_command", run)
    ok, report = publish.publish_production(data, web, confirm=True)
    assert not ok
    assert not report["deploy_executed"]


def test_deploy_timeout_leaves_remote_state_unknown(prepared, monkeypatch):
    _, web, data, _, calls, original = prepared
    def run(cmd, cwd, **kw):
        if "deploy" in cmd:
            calls.append(cmd)
            raise TimeoutError("timeout")
        return original(cmd, cwd, **kw)
    monkeypatch.setattr(publish, "run_command", run)
    ok, report = publish.publish_production(data, web, confirm=True)
    assert not ok
    assert report["deploy_executed"]
    assert report["state"] == "submission_unverified"


def test_target_is_explicit_and_no_private_link_required(monkeypatch):
    monkeypatch.setenv("VERCEL_SCOPE", "custom-team")
    monkeypatch.setenv("VERCEL_PROJECT", "custom-project")
    command = publish.deploy_command(Path("source"))
    assert command[command.index("--scope") + 1] == "custom-team"
    assert command[command.index("--project") + 1] == "custom-project"
    assert "--prod" in command and "--no-wait" in command


@pytest.mark.parametrize("patch", [
    {"id": "prj_wrong"}, {"accountId": "team_wrong"}, {"name": "another"},
    {"rootDirectory": None}, {"rootDirectory": "other"}, {"framework": None},
    {"framework": "vite"}, {"outputDirectory": "public"},
    {"commandForIgnoringBuildStep": "unsafe command"},
])
def test_wrong_remote_project_configuration_blocks_before_staging(prepared, monkeypatch, patch):
    _, web, data, _, calls, original = prepared
    def run(cmd, cwd, **kw):
        result = original(cmd, cwd, **kw)
        if "api" in cmd and not cmd[2].endswith("/env"):
            result["stdout"] = json.dumps({**json.loads(result["stdout"]), **patch})
        return result
    monkeypatch.setattr(publish, "run_command", run)
    monkeypatch.setattr(publish, "prepare_vercel_source", lambda *a, **kw: pytest.fail("staging before config"))
    ok, report = publish.publish_production(data, web, confirm=True)
    assert not ok and not report["deploy_executed"]
    assert "project configuration mismatch" in report["errors"][0]
    assert not any("deploy" in cmd for cmd in calls if isinstance(cmd, list))


@pytest.mark.parametrize("entry", [
    {"key": "NEXT_PUBLIC_DATA_BASE", "value": "/data/wrong/", "type": "plain", "target": ["production"]},
    {"key": "SHIOK_DATA_BUNDLE", "value": "encrypted", "type": "encrypted", "target": ["production"]},
    {"key": "NEXT_PUBLIC_LAMP_OVERLAY_BASE", "value": "/data/lamp_posts_v1/", "type": "plain"},
    {"key": "NODE_OPTIONS", "value": "--require arbitrary.js", "type": "plain", "target": ["production"]},
])
def test_unverifiable_production_environment_blocks_without_disclosing_values(prepared, monkeypatch, entry):
    _, web, data, _, _, original = prepared
    def run(cmd, cwd, **kw):
        result = original(cmd, cwd, **kw)
        if "api" in cmd and cmd[2].endswith("/env"):
            result["stdout"] = json.dumps({"envs": [entry]})
        return result
    monkeypatch.setattr(publish, "run_command", run)
    ok, report = publish.publish_production(data, web, confirm=True)
    assert not ok and not report["deploy_executed"]
    assert entry["key"] in report["errors"][0]
    assert entry["value"] not in json.dumps(report)


def test_missing_reviewed_ids_does_not_query_or_prepare(prepared, monkeypatch):
    _, web, data, _, _, _ = prepared
    monkeypatch.delenv("VERCEL_PROJECT_ID")
    monkeypatch.setattr(publish, "run_command", lambda *a, **kw: pytest.fail("external action"))
    ok, report = publish.publish_production(data, web, confirm=True)
    assert not ok and not report["deploy_executed"]
    assert "reviewed VERCEL_PROJECT_ID" in report["errors"][0]


def test_configuration_is_rechecked_immediately_before_submission(prepared, monkeypatch):
    _, web, data, _, _, original = prepared
    requests = 0
    def run(cmd, cwd, **kw):
        nonlocal requests
        result = original(cmd, cwd, **kw)
        if "api" in cmd and not cmd[2].endswith("/env"):
            requests += 1
            if requests == 2:
                result["stdout"] = json.dumps({**json.loads(result["stdout"]), "rootDirectory": "changed"})
        return result
    monkeypatch.setattr(publish, "run_command", run)
    ok, report = publish.publish_production(data, web, confirm=True)
    assert requests == 2
    assert not ok and not report["deploy_executed"]


def test_creation_ledger_identity_is_checked_on_first_verification(prepared, monkeypatch):
    _, web, data, _, _, _ = prepared
    monkeypatch.setattr(publish, "verify_stage", lambda *a: {"ok": True, "releaseManifestSha256": "9" * 64})
    monkeypatch.setattr(publish, "validate_stage", lambda *a: pytest.fail("validation of untrusted ledger"))
    ok, report = publish.publish_production(data, web, confirm=True)
    assert not ok and not report["deploy_executed"]
    assert report["checks"]["input_identity"]["error"] == "release_ledger_changed"


def test_staging_adapters_forward_the_pinned_revision_overlay_and_creation_hash(release, monkeypatch):
    from scripts import release_staging
    root, web, data = release
    called = {}
    def prepare(repo, main, **kwargs):
        called.update(repo=repo, main=main, **kwargs)
        return {"stageRoot": str(kwargs["stage_dir"]), "releaseManifestSha256": "1" * 64}
    def verify(repo, stage, **kwargs):
        assert repo == root and stage == Path(called["stage_dir"])
        assert kwargs == {"expected_manifest_sha256": "1" * 64}
        return {"status": "verified_not_deployed", "releaseManifestSha256": "1" * 64}
    monkeypatch.setattr(release_staging, "prepare_release_stage", prepare)
    monkeypatch.setattr(release_staging, "verify_release_stage", verify)
    result = publish.prepare_vercel_source(web, data, revision="a" * 40)
    assert called["repo"] == root and called["main"] == data
    assert called["revision"] == "a" * 40 and called["overlay_dir"] == data.parent / "lamp_posts_v1"
    assert publish.verify_stage(Path(result["stageRoot"]), result["releaseManifestSha256"])["ok"]


@pytest.mark.parametrize("envelope", [
    {"envs": [], "pagination": {"next": 123}}, {"envs": [], "pagination": {}},
    {"envs": [], "pagination": None}, {"envs": [], "hiddenProductionEnvCount": 1},
    {"envs": [], "hiddenProductionEnvCount": False}, {"error": "not readable"},
])
def test_partial_environment_responses_do_not_prove_absence(prepared, monkeypatch, envelope):
    _, web, data, _, _, original = prepared
    def run(cmd, cwd, **kw):
        result = original(cmd, cwd, **kw)
        if "api" in cmd:
            assert "--raw" in cmd and cmd[cmd.index("--method") + 1] == "GET"
            if cmd[2].endswith("/env"):
                result["stdout"] = json.dumps(envelope)
        return result
    monkeypatch.setattr(publish, "run_command", run)
    ok, report = publish.publish_production(data, web, confirm=True)
    assert not ok and not report["deploy_executed"]


@pytest.mark.parametrize("restriction", [{"gitBranch": "other"}, {"customEnvironmentIds": ["env_other"]}, {"visibility": "secret"}])
def test_ambiguous_production_variable_restrictions_block(prepared, monkeypatch, restriction):
    _, web, data, _, _, original = prepared
    def run(cmd, cwd, **kw):
        result = original(cmd, cwd, **kw)
        if "api" in cmd and cmd[2].endswith("/env"):
            result["stdout"] = json.dumps({"envs": [{
                "key": "NEXT_PUBLIC_DATA_BASE", "value": "/data/current/",
                "type": "plain", "target": "production", **restriction,
            }]})
        return result
    monkeypatch.setattr(publish, "run_command", run)
    ok, report = publish.publish_production(data, web, confirm=True)
    assert not ok and not report["deploy_executed"]


def test_supported_string_target_and_terminal_pagination(prepared, monkeypatch):
    _, web, data, _, _, original = prepared
    def run(cmd, cwd, **kw):
        result = original(cmd, cwd, **kw)
        if "api" in cmd and cmd[2].endswith("/env"):
            result["stdout"] = json.dumps({"envs": [{
                "key": "NEXT_PUBLIC_DATA_BASE", "value": "/data/current/", "type": "plain", "target": "production",
            }], "pagination": {"next": None}, "hiddenProductionEnvCount": 0})
        return result
    monkeypatch.setattr(publish, "run_command", run)
    ok, report = publish.publish_production(data, web, confirm=True)
    assert ok, report
    assert report["checks"]["remote_configuration"]["production_variable_keys_checked"] == ["NEXT_PUBLIC_DATA_BASE"]
