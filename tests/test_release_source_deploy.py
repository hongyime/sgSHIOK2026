"""Focused consumer tests: synthetic binary parts, no external requests or secrets."""

import hashlib
import json
from pathlib import Path

import pytest

from scripts import release_source_archive as archive
from scripts import release_source_deploy as deploy


@pytest.fixture
def source(tmp_path, monkeypatch):
    monkeypatch.setattr(archive, "PART_BYTES", 256)
    root = tmp_path / "repo"
    directory = root / "tmp/archive"
    (directory / ".vercel").mkdir(parents=True)
    parts = []
    for index in range(1, 6):
        content = bytes(range(256)) if index < 5 else b"\x00\xff\x80\r\nlast"
        name = f".vercel/source.tgz.part{index}"
        (directory / name).write_bytes(content)
        parts.append({"file": name, "size": len(content), "mode": 438,
                      "sha": hashlib.sha1(content).hexdigest(), "sha256": hashlib.sha256(content).hexdigest()})
    receipt = {"repoRoot": str(root), "schemaVersion": 1, "kind": "sgshiok-source-archive",
               "scope": "source-archive", "status": "verified-not-deployed", "completeSourceInventory": True,
               "pilotMaxBytes": None, "cliReference": archive.CLI_REFERENCE, "partBytes": 256, "parts": parts,
               "compressedBytes": sum(p["size"] for p in parts), "sourceRevision": "a" * 40,
               "artifacts": {"main": "generated_20260805_prefer_scored_routed", "overlay": "lamp_posts_v1"},
               "deploymentFiles": [{k: p[k] for k in ("file", "sha", "size", "mode")} for p in parts]}
    receipt["verification"] = {"compressedBytes": receipt["compressedBytes"]}
    path = directory / archive.RECEIPT_NAME
    path.write_bytes(archive._json_bytes(receipt))
    return {"repo_root": root, "receipt_path": path,
            "receipt_sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "target": "preview"}


class Provider:
    def __init__(self, fail_at=None, status=500, response=None):
        self.calls = []
        self.fail_at, self.status, self.response = fail_at, status, response

    def __call__(self, path, headers, body, budget):
        content = b"".join(body)
        self.calls.append((path, headers, content))
        if len(self.calls) == self.fail_at:
            if self.status is None:
                raise OSError("synthetic transport failure")
            return self.status, b"untrusted provider text"
        if path.startswith("/v2/files"):
            return 200, b""
        return 200, self.response if self.response is not None else json.dumps({
            "id": "dpl_fixture", "url": "fixture.vercel.app", "readyState": "BUILDING",
            "target": json.loads(content).get("target"),
        }).encode()


def submit(source, provider, **overrides):
    options = {**source, "request_sha256": deploy.prepare_source_deployment(**source)["requestSha256"],
               "token": "synthetic-test-token", "output_dir": source["repo_root"] / "tmp/attempt",
               "timeout_seconds": 30, "transport": provider}
    options.update(overrides)
    return deploy.submit_source_deployment(**options)


def test_prepare_reads_only_receipt_and_keeps_controls_off(source, monkeypatch):
    original = archive._open_plain
    def guarded(path, budget):
        assert path == source["receipt_path"]
        return original(path, budget)
    monkeypatch.setattr(archive, "_open_plain", guarded)
    plan = deploy.prepare_source_deployment(**source)
    assert "target" not in plan["request"]
    assert plan["request"]["project"] == deploy.PROJECT_ID
    assert plan["request"]["projectSettings"]["rootDirectory"] == "web"
    assert plan["request"]["env"] == plan["request"]["build"]["env"]
    assert plan["request"]["env"]["SHIOK_REPORTS_ENABLED"] == "false"
    assert plan["request"]["env"]["SHIOK_MODERATION_ENABLED"] == "false"
    assert len(plan["request"]["files"]) == 5


@pytest.mark.parametrize("target", ["preview", "production"])
def test_exact_five_binary_posts_then_one_create(source, target):
    source["target"] = target
    provider = Provider()
    result = submit(source, provider)
    assert result["ok"] and result["state"] == "created"
    assert result["deployment"]["readyState"] == "BUILDING"
    assert result["productionSmokeVerified"] is False
    assert len(provider.calls) == 6
    for index, (path, headers, content) in enumerate(provider.calls[:5], 1):
        assert path == f"/v2/files?teamId={deploy.TEAM_ID}"
        assert content == (source["receipt_path"].parent / f".vercel/source.tgz.part{index}").read_bytes()
        assert headers["Content-Type"] == "application/octet-stream"
        assert int(headers["Content-Length"]) == len(content)
        assert headers["x-vercel-digest"] == hashlib.sha1(content).hexdigest()
    assert provider.calls[5][0] == f"/v13/deployments?teamId={deploy.TEAM_ID}"
    request = json.loads(provider.calls[5][2])
    assert request == deploy.prepare_source_deployment(**source)["request"]
    assert "autoAssignCustomDomains" not in request
    for path in (source["repo_root"] / "tmp/attempt").iterdir():
        assert b"synthetic-test-token" not in path.read_bytes()


def test_staged_production_uses_reviewed_request_without_domain_assignment(source):
    source.update(target="production", skip_domain=True)
    plan = deploy.prepare_source_deployment(**source)
    assert plan["request"]["target"] == "production"
    assert plan["request"]["autoAssignCustomDomains"] is False
    assert plan["requestSha256"] != deploy.prepare_source_deployment(
        **{**source, "skip_domain": False})["requestSha256"]
    provider = Provider()
    assert submit(source, provider)["ok"]
    assert len(provider.calls) == 6
    assert json.loads(provider.calls[-1][2]) == plan["request"]


@pytest.mark.parametrize("target,skip_domain", [("preview", True), ("production", "false"),
                                               ("production", 1), ("production", None)])
def test_invalid_skip_domain_makes_no_requests(source, target, skip_domain):
    provider = Provider()
    with pytest.raises(ValueError, match="skip_domain"):
        submit(source, provider, target=target, skip_domain=skip_domain)
    assert provider.calls == []


@pytest.mark.parametrize("reviewed_skip,submitted_skip", [(True, False), (False, True)])
def test_domain_assignment_cannot_change_after_request_review(source, reviewed_skip, submitted_skip):
    source.update(target="production", skip_domain=reviewed_skip)
    provider = Provider()
    with pytest.raises(ValueError, match="request hash mismatch"):
        submit(source, provider, skip_domain=submitted_skip)
    assert provider.calls == []


@pytest.mark.parametrize("change", ["pin", "part", "request", "token", "output"])
def test_preflight_failure_makes_no_requests(source, change):
    provider = Provider()
    overrides = {}
    if change == "pin":
        overrides["receipt_sha256"] = "0" * 64
    elif change == "part":
        (source["receipt_path"].parent / ".vercel/source.tgz.part5").write_bytes(b"bad")
    elif change == "request":
        overrides["request_sha256"] = "0" * 64
    elif change == "token":
        overrides["token"] = "invalid\r\nheader"
    else:
        overrides["output_dir"] = source["receipt_path"].parent / "nested"
    with pytest.raises((ValueError, OSError)):
        submit(source, provider, **overrides)
    assert provider.calls == []


@pytest.mark.parametrize("change", ["pilot", "order", "references", "artifacts"])
def test_invalid_receipt_refused(source, change):
    path = source["receipt_path"]
    value = json.loads(path.read_bytes())
    if change == "pilot":
        value["scope"] = "pilot-not-deployable"
    elif change == "order":
        value["parts"].reverse()
    elif change == "references":
        value["deploymentFiles"][0]["sha"] = "0" * 40
    else:
        value["artifacts"]["main"] = "different"
    path.write_bytes(archive._json_bytes(value))
    source["receipt_sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
    with pytest.raises(ValueError):
        deploy.prepare_source_deployment(**source)


@pytest.mark.parametrize("status", [302, 401, 413, 429, 500, None])
def test_partial_upload_never_creates_or_retries(source, status):
    provider = Provider(fail_at=3, status=status)
    with pytest.raises(deploy.SubmissionError) as error:
        submit(source, provider)
    assert len(provider.calls) == 3
    assert error.value.result["state"] == "upload_stopped"
    assert len(error.value.result["uploaded"]) == 2
    assert not (source["repo_root"] / "tmp/attempt/create-attempt.json").exists()


@pytest.mark.parametrize("response", [None, b"not json", b'{"id":"dpl_x"}', b'{"id":"dpl_x","id":"dpl_y"}'])
def test_uncertain_creation_preserved_without_retry(source, response):
    provider = Provider(fail_at=6, status=None) if response is None else Provider(response=response)
    with pytest.raises(deploy.SubmissionError) as error:
        submit(source, provider)
    assert error.value.result["state"] == "create_outcome_unknown"
    assert len(provider.calls) == 6
    output = source["repo_root"] / "tmp/attempt"
    assert (output / "create-attempt.json").is_file()
    assert json.loads((output / "result.json").read_bytes())["ok"] is False
    with pytest.raises(ValueError, match="new scratch"):
        submit(source, provider)
    assert len(provider.calls) == 6


def test_stream_change_after_preflight_prevents_create(source):
    provider = Provider()
    def changed(path, headers, body, budget):
        if not provider.calls:
            (source["receipt_path"].parent / ".vercel/source.tgz.part5").write_bytes(b"changed")
        return provider(path, headers, body, budget)
    with pytest.raises(deploy.SubmissionError):
        submit(source, changed)
    assert len(provider.calls) == 4


def test_create_error_with_valid_identity_is_not_success(source):
    provider = Provider(response=json.dumps({
        "id": "dpl_fixture", "url": "fixture.vercel.app", "readyState": "BUILDING",
        "target": None, "error": {"code": "synthetic_provider_error"},
    }).encode())
    with pytest.raises(deploy.SubmissionError) as error:
        submit(source, provider)
    assert error.value.result["state"] == "create_outcome_unknown"
    assert error.value.result["ok"] is False
    assert len(provider.calls) == 6
    receipt = source["repo_root"] / "tmp/attempt/result.json"
    assert json.loads(receipt.read_bytes())["ok"] is False


@pytest.mark.parametrize("stage", ["frontend/web", "data-stage/web/public/data"])
def test_output_cannot_be_nested_in_existing_stage(source, stage):
    directory = source["repo_root"] / "tmp" / stage
    directory.mkdir(parents=True)
    marker = directory / "unchanged.txt"
    marker.write_bytes(b"immutable fixture stage")
    provider = Provider()
    with pytest.raises(ValueError, match="new direct child"):
        submit(source, provider, output_dir=directory / "submission")
    assert provider.calls == []
    assert list(directory.iterdir()) == [marker]
    assert marker.read_bytes() == b"immutable fixture stage"


def test_https_transport_sends_binary_unchanged_and_closes(monkeypatch):
    class Socket:
        def settimeout(self, timeout):
            assert 0 < timeout <= 10
    class Connection:
        def __init__(self, host, timeout):
            assert host == "api.vercel.com"
            self.sock, self.sent, self.closed = Socket(), [], False
            self.status = 200
        def connect(self): pass
        def putrequest(self, method, path):
            assert method == "POST" and path == "/v2/files?teamId=test"
        def putheader(self, key, value): pass
        def endheaders(self): pass
        def send(self, data): self.sent.append(data)
        def getresponse(self): return self
        def read1(self, maximum): return b""
        def close(self): self.closed = True
    connection = Connection("api.vercel.com", 10)
    monkeypatch.setattr(deploy.http.client, "HTTPSConnection", lambda host, timeout: connection)
    binary = bytes(range(256))
    assert deploy._post("/v2/files?teamId=test", {"Content-Length": "256"},
                        [binary[:100], binary[100:]], archive._Budget(10)) == (200, b"")
    assert b"".join(connection.sent) == binary and connection.closed
