"""Offline inspection regressions; all synthetic files stay in the supplied repo temp root."""

import builtins
from contextlib import contextmanager
import io
import json
import os
from pathlib import Path
import socket
import stat
import subprocess
import sys
import time
from typing import Iterator, NoReturn

import pytest

from scripts import inspect_source_notice_journal as inspection
from scripts import source_metadata_comments as comments
from scripts import source_metadata_request_budget as budgets
from scripts.source_metadata_delivery import _encode, _sha


ROOT = Path(r"C:\sgSHIOK2026")
START = 1_800_000_000.0
PRIVATE = "synthetic-private-token-must-never-appear"
MONITOR = {"catalogSha256": "a" * 64, "stateSha256": "b" * 64, "reportSha256": "c" * 64}


def forbidden(*args: object, **kwargs: object) -> NoReturn:
    pytest.fail("Inspection attempted forbidden IO, credentials, transport, or sleep")


def plan(issue: int = 7) -> comments.CommentPlan:
    notice = {"id": "covered_linkway:1:" + "d" * 64, "sourceKey": "covered_linkway",
              "episode": 1, "kind": "action", "reasons": ["timeout"],
              "createdAt": "2026-09-09T00:00:00Z"}
    return comments.plan_comment(f"owner/repository#{issue}", MONITOR, notice, author_id=314)


def snapshot(path: Path) -> dict[str, tuple[bytes | None, int]]:
    saved = {}
    for item in (path, *path.rglob("*")):
        metadata = item.lstat()
        raw = item.read_bytes() if stat.S_ISREG(metadata.st_mode) else None
        saved[item.relative_to(path).as_posix()] = (raw, metadata.st_mtime_ns)
    return saved


@pytest.fixture(autouse=True)
def deny_network_and_processes(monkeypatch: pytest.MonkeyPatch) -> None:
    for target, names in (
        (socket, ("create_connection", "getaddrinfo", "gethostbyname", "gethostbyname_ex")),
        (socket.socket, ("connect", "connect_ex", "send", "sendto", "sendall")),
        (subprocess, ("run", "Popen")),
        (os, ("system", "popen", "startfile")),
    ):
        for name in names:
            if hasattr(target, name):
                monkeypatch.setattr(target, name, forbidden)
    monkeypatch.setenv("SHIOK_NOTICE_TOKEN", PRIVATE)


@pytest.fixture
def journal(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> comments.LocalCommentJournal:
    assert Path.cwd() == ROOT
    assert Path(inspection.__file__).resolve().is_relative_to(ROOT)
    assert tmp_path.resolve().is_relative_to(ROOT / "tmp")
    monkeypatch.setattr(comments, "ROOT", tmp_path)
    return comments.LocalCommentJournal.initialize(
        tmp_path / "tmp" / "source-notice-journals" / "fixture")


@contextmanager
def inspection_only() -> Iterator[None]:
    class NoEnvironment(dict):
        def __getitem__(self, key):
            if any(word in str(key).upper() for word in ("TOKEN", "SECRET", "PASSWORD", "CREDENTIAL", "KEY")):
                forbidden()
            return super().__getitem__(key)

        def get(self, key, default=None):
            try:
                return self[key]
            except KeyError:
                return default

        __iter__ = keys = items = values = forbidden

    def read_only_open(original):
        def open_file(file, mode="r", *args, **kwargs):
            if any(flag in mode for flag in "wax+"):
                forbidden()
            return original(file, mode, *args, **kwargs)
        return open_file

    original_os_open = os.open

    def open_fd(path, flags, *args, **kwargs):
        if flags & (os.O_WRONLY | os.O_RDWR | os.O_CREAT | os.O_TRUNC | os.O_APPEND):
            forbidden()
        return original_os_open(path, flags, *args, **kwargs)

    with pytest.MonkeyPatch.context() as patch:
        for target, names in (
            (comments, ("_publish", "deliver_comment", "verify_recorded_comment")),
            (comments.LocalCommentJournal, ("initialize", "claim", "observe", "verify")),
            (budgets, ("_publish",)),
            (budgets.GitHubRequestBudget, ("initialize", "__init__", "request", "_history")),
            (Path, ("mkdir", "touch", "write_bytes", "write_text", "unlink", "rmdir",
                    "rename", "replace", "symlink_to", "hardlink_to")),
            (os, ("write", "mkdir", "makedirs", "remove", "unlink", "rmdir", "rename",
                  "replace", "link", "symlink", "utime", "chmod", "truncate", "fsync")),
            (time, ("sleep",)),
        ):
            for name in names:
                patch.setattr(target, name, forbidden)
        patch.setattr(builtins, "open", read_only_open(builtins.open))
        patch.setattr(io, "open", read_only_open(io.open))
        patch.setattr(os, "open", open_fd)
        patch.setattr(os, "getenv", forbidden)
        patch.setattr(os, "environ", NoEnvironment())
        yield


def inspect_read_only(journal: comments.LocalCommentJournal, *, path: Path | None = None,
                      pin: str | None = None, now: float = START + 100) -> dict:
    before = snapshot(comments.ROOT)
    with inspection_only():
        result = inspection.inspect_journal(
            journal.path if path is None else path,
            journal.identity_sha256 if pin is None else pin, now=now)
    assert snapshot(comments.ROOT) == before
    output = json.dumps(result, sort_keys=True, allow_nan=False)
    assert PRIVATE not in output
    assert "Source metadata notice; not dataset validation." not in output
    assert "```json" not in output
    assert result["networkRequests"] == result["journalWrites"] == 0
    assert result["remoteChecked"] is False
    assert result["activationAuthorized"] is False
    assert result["automaticResendAllowed"] is False
    if "requestBudget" in result:
        assert result["requestBudget"]["historyCanAuthorizeIO"] is False
    return result


def record_response(journal: comments.LocalCommentJournal, *, status: int = 200,
                    retry_after: str | None = None) -> None:
    budgets.GitHubRequestBudget.initialize(journal)
    budget = budgets.GitHubRequestBudget(
        journal, clock=lambda: START, monotonic=lambda: 0, sleep=forbidden)
    budget.request(lambda: {"rate": {"status": status, "retryAfter": retry_after,
                                    "remaining": None, "reset": None}})


def write_pair(journal: comments.LocalCommentJournal, sequence: int, previous: bytes) -> bytes:
    started = START + sequence * 2
    request = _encode({"sequence": sequence, "previousSha256": _sha(previous),
                       "startedAt": started})
    result = _encode({"requestSha256": _sha(request), "finishedAt": started,
                      "notBefore": started + 1, "status": 200})
    ledger = journal.path / "github-requests"
    (ledger / f"{sequence:06d}.request.json").write_bytes(request)
    (ledger / f"{sequence:06d}.result.json").write_bytes(result)
    return result


@pytest.mark.parametrize(("stage", "status", "exit_code"), [
    ("intent", "post_outcome_unknown", 1),
    ("posted", "post_id_recorded_unverified", 1),
    ("receipt", "receipt_recorded_locally", 0),
    ("posted_and_receipt", "receipt_recorded_locally", 0),
])
def test_valid_local_statuses_never_claim_remote_delivery(
        journal: comments.LocalCommentJournal, stage: str, status: str, exit_code: int) -> None:
    value = plan()
    journal.claim(value)
    budgets.GitHubRequestBudget.initialize(journal)
    if "posted" in stage:
        journal.observe(value, 81)
    if "receipt" in stage:
        journal.verify(value, comments._receipt(value, 81))
    result = inspect_read_only(journal)
    assert result["exitCode"] == exit_code
    assert result["journalIdentitySha256"] == journal.identity_sha256
    attempt, = result["attempts"]
    assert attempt["status"] == status
    assert attempt["attemptKey"] == value.attempt_key
    assert attempt["noticeId"] == value.notice_id
    assert attempt["destination"] == value.destination
    assert attempt["authorId"] == value.author_id
    assert attempt["commentId"] == (None if stage == "intent" else 81)
    assert attempt["remoteChecked"] is attempt["automaticResendAllowed"] is False
    assert attempt["fileSha256"]["intent"] == _sha(value.intent)
    if "receipt" in stage:
        assert attempt["fileSha256"]["receipt"] == _sha(comments._receipt(value, 81))
    if stage == "receipt":
        assert "posted" not in attempt["fileSha256"]
    files = {name: raw for name, (raw, _) in snapshot(journal.path).items() if raw is not None}
    assert result["fileCount"] == len(files)
    assert result["totalBytes"] == sum(map(len, files.values()))
    assert result["snapshotSha256"] == _sha(_encode({name: _sha(raw) for name, raw in files.items()}))


def test_missing_budget_is_attention_not_implicit_setup(journal: comments.LocalCommentJournal) -> None:
    result = inspect_read_only(journal)
    assert result["exitCode"] == 1
    assert result["requestBudget"]["status"] == "not_initialized"
    assert not (journal.path / "github-requests").exists()


@pytest.mark.parametrize("pin", ["0" * 64, "not-a-hash"])
def test_wrong_pin_stops_without_inspecting_attempts(
        journal: comments.LocalCommentJournal, monkeypatch: pytest.MonkeyPatch, pin: str) -> None:
    journal.claim(plan())
    monkeypatch.setattr(inspection, "_snapshot", forbidden)
    result = inspect_read_only(journal, pin=pin)
    assert result["exitCode"] == 2
    assert result["reason"] == "STOP_JOURNAL_IDENTITY"
    assert "attempts" not in result


@pytest.mark.parametrize("kind", ["posted", "receipt"])
def test_orphans_are_invalid_and_never_claim_an_intent(
        journal: comments.LocalCommentJournal, kind: str) -> None:
    value = plan()
    if kind == "posted":
        journal.observe(value, 81)
    else:
        journal.verify(value, comments._receipt(value, 81))
    result = inspect_read_only(journal)
    assert result["exitCode"] == 2
    assert result["attempts"][0]["reason"] == "STOP_ORPHAN_JOURNAL_ENTRY"
    assert not (journal.path / f"{value.attempt_key}.intent.json").exists()


def test_conflicting_observation_and_receipt_are_not_downgraded(
        journal: comments.LocalCommentJournal) -> None:
    value = plan()
    journal.claim(value)
    journal.observe(value, 81)
    journal.verify(value, comments._receipt(value, 82))
    result = inspect_read_only(journal)
    assert result["exitCode"] == 2
    assert result["attempts"][0]["status"] == "invalid_local_history"
    assert result["attempts"][0]["reason"] == "STOP_INSPECTION_COMMENT_CONFLICT"


@pytest.mark.parametrize("fault", ["intent_whitespace", "receipt_whitespace", "boolean_id",
                                   "wrong_body_hash", "wrong_filename", "torn_private_content"])
def test_invalid_attempt_content_is_not_a_valid_lower_state(
        journal: comments.LocalCommentJournal, fault: str) -> None:
    value = plan()
    key = "f" * 64 if fault == "wrong_filename" else value.attempt_key
    intent = value.intent
    if fault == "intent_whitespace":
        intent = b" " + intent
    elif fault == "torn_private_content":
        intent = ('{"body":"' + PRIVATE).encode()
    (journal.path / f"{key}.intent.json").write_bytes(intent)
    if fault in {"receipt_whitespace", "wrong_body_hash"}:
        receipt = comments._receipt(value, 81)
        if fault == "receipt_whitespace":
            receipt += b" "
        else:
            receipt = _encode({**json.loads(receipt), "bodySha256": "0" * 64})
        (journal.path / f"{key}.receipt.json").write_bytes(receipt)
    elif fault == "boolean_id":
        (journal.path / f"{key}.posted.json").write_bytes(comments._observation(value, True))
    result = inspect_read_only(journal)
    assert result["exitCode"] == 2
    assert result["attempts"][0]["status"] == "invalid_local_history"
    assert "commentId" not in result["attempts"][0]


def test_matching_hash_does_not_make_corrupt_identity_valid(
        journal: comments.LocalCommentJournal) -> None:
    raw = ('{"private":"' + PRIVATE).encode()
    (journal.path / "identity.json").write_bytes(raw)
    result = inspect_read_only(journal, pin=_sha(raw))
    assert result["exitCode"] == 2
    assert "attempts" not in result


@pytest.mark.parametrize("kind", ["relative", "parent", "undesignated", "missing"])
def test_unsafe_or_missing_paths_are_not_created_or_opened(
        journal: comments.LocalCommentJournal, monkeypatch: pytest.MonkeyPatch, kind: str) -> None:
    paths = {"relative": Path("tmp/source-notice-journals/fixture"),
             "parent": journal.path / ".." / "escape",
             "undesignated": comments.ROOT / "outside",
             "missing": journal.path.parent / "absent"}
    monkeypatch.setattr(comments, "_read", forbidden)
    result = inspect_read_only(journal, path=paths[kind])
    assert result["exitCode"] == 2
    assert "attempts" not in result


@pytest.mark.parametrize("name", ["identity.json", "f" * 64 + ".intent.json"])
def test_nonregular_files_stop_before_identity_constructor(
        journal: comments.LocalCommentJournal, monkeypatch: pytest.MonkeyPatch, name: str) -> None:
    path = journal.path.parent / "directory-instead-of-file"
    path.mkdir()
    if name != "identity.json":
        (path / "identity.json").write_bytes(journal.identity)
    (path / name).mkdir()
    monkeypatch.setattr(comments.LocalCommentJournal, "__init__", forbidden)
    result = inspect_read_only(journal, path=path)
    assert result["exitCode"] == 2
    assert result["reason"] == "STOP_INSPECTION_FILE_TYPE"


@pytest.mark.parametrize(("method", "target"), [
    ("is_symlink", "ancestor"), ("is_junction", "ledger"),
    ("is_symlink", "identity"), ("is_symlink", "dangling_posted"),
])
def test_links_are_rejected_without_reading_the_target(
        journal: comments.LocalCommentJournal, monkeypatch: pytest.MonkeyPatch,
        method: str, target: str) -> None:
    value = plan()
    budgets.GitHubRequestBudget.initialize(journal)
    journal.claim(value)
    if target == "dangling_posted":
        journal.observe(value, 81)
    linked = {"ancestor": journal.path.parent, "ledger": journal.path / "github-requests",
              "identity": journal.path / "identity.json",
              "dangling_posted": journal.path / f"{value.attempt_key}.posted.json"}[target]
    original = getattr(Path, method)
    monkeypatch.setattr(Path, method, lambda path: path == linked or original(path))
    original_read = comments._read

    def read(path: Path) -> bytes | None:
        if path == linked:
            forbidden()
        return original_read(path)

    monkeypatch.setattr(comments, "_read", read)
    result = inspect_read_only(journal)
    assert result["exitCode"] == 2
    assert result["reason"] == "STOP_JOURNAL_LINK"


@pytest.mark.parametrize("kind", ["identity", "intent"])
def test_real_hardlinks_are_rejected_before_opening_aliases(
        journal: comments.LocalCommentJournal, monkeypatch: pytest.MonkeyPatch, kind: str) -> None:
    path = journal.path.parent / "hardlinked"
    path.mkdir()
    if kind == "identity":
        source = journal.path / "identity.json"
        alias = path / "identity.json"
    else:
        (path / "identity.json").write_bytes(journal.identity)
        source = comments.ROOT / "synthetic-source.json"
        source.write_bytes(plan().intent)
        alias = path / f"{plan().attempt_key}.intent.json"
    alias.hardlink_to(source)
    assert alias.stat().st_nlink > 1
    monkeypatch.setattr(comments.LocalCommentJournal, "__init__", forbidden)
    result = inspect_read_only(journal, path=path)
    assert result["exitCode"] == 2
    assert result["reason"] == "STOP_INSPECTION_HARDLINK"


def test_unknown_filename_is_rejected_without_disclosing_its_content(
        journal: comments.LocalCommentJournal) -> None:
    (journal.path / "unexpected.json").write_text(PRIVATE, encoding="ascii")
    result = inspect_read_only(journal)
    assert result["exitCode"] == 2
    assert result["reason"] == "STOP_INSPECTION_UNEXPECTED_FILE"


@pytest.mark.parametrize("bound", ["file", "snapshot"])
def test_byte_bounds_stop_before_attempt_parsing(
        journal: comments.LocalCommentJournal, monkeypatch: pytest.MonkeyPatch, bound: str) -> None:
    value = plan()
    raw = b"x" * (comments.MAX_FILE_BYTES + 1) if bound == "file" else value.intent
    (journal.path / f"{value.attempt_key}.intent.json").write_bytes(raw)
    if bound == "snapshot":
        monkeypatch.setattr(inspection, "MAX_SNAPSHOT_BYTES", len(journal.identity) + len(raw) - 1)
    monkeypatch.setattr(inspection, "_attempt", forbidden)
    result = inspect_read_only(journal)
    assert result["exitCode"] == 2
    assert result["reason"] == ("STOP_JOURNAL_BOUND" if bound == "file" else "STOP_INSPECTION_BYTE_BOUND")


@pytest.mark.parametrize("ledger", [False, True])
def test_names_are_bounded_as_enumerated_before_any_validator(
        journal: comments.LocalCommentJournal, monkeypatch: pytest.MonkeyPatch, ledger: bool) -> None:
    budgets.GitHubRequestBudget.initialize(journal)
    monkeypatch.setattr(inspection, "MAX_HISTORY", 2)
    limit = 5 if ledger else 8
    path = journal.path / "github-requests" if ledger else journal.path
    for index in range(limit):
        name = f"{index:06d}.request.json" if ledger else f"{index:064x}.intent.json"
        (path / name).write_bytes(b"{}")
    original = os.scandir
    seen = 0

    @contextmanager
    def bounded_scan(candidate: Path):
        nonlocal seen
        with original(candidate) as entries:
            if Path(candidate) != path:
                yield entries
                return

            def counted():
                nonlocal seen
                for entry in entries:
                    seen += 1
                    assert seen <= limit + 1, "Enumeration consumed entries beyond its sentinel"
                    yield entry
            yield counted()

    before = snapshot(comments.ROOT)
    with monkeypatch.context() as patch:
        patch.setattr(inspection.os, "scandir", bounded_scan)
        patch.setattr(inspection, "validate_request_history", forbidden)
        patch.setattr(inspection, "_attempt", forbidden)
        with inspection_only():
            result = inspection.inspect_journal(journal.path, journal.identity_sha256, now=START)
    assert snapshot(comments.ROOT) == before
    assert seen == limit + 1
    assert result["exitCode"] == 2
    assert result["reason"] == "STOP_INSPECTION_ENTRY_BOUND"


@pytest.mark.parametrize(("elapsed", "status", "wait"), [
    (0.25, "cooldown", 60), (60, "locally_consistent", 0),
])
def test_cooldown_deadline_and_expiry_never_authorize_io(
        journal: comments.LocalCommentJournal, elapsed: float, status: str, wait: int) -> None:
    record_response(journal, status=429, retry_after="60")
    result = inspect_read_only(journal, now=START + elapsed)
    budget = result["requestBudget"]
    assert budget["status"] == status
    assert budget["remainingWaitSeconds"] == wait
    assert budget["notBefore"] == START + 60
    assert budget["completedRequests"] == 1
    assert budget["lastResultOrIdentitySha256"] == _sha(
        (journal.path / "github-requests" / "000001.result.json").read_bytes())
    assert result["exitCode"] == (1 if wait else 0)


def test_expired_cooldown_and_valid_receipt_do_not_clear_unresolved_request(
        journal: comments.LocalCommentJournal) -> None:
    record_response(journal, status=429, retry_after="60")
    value = plan()
    journal.claim(value)
    journal.verify(value, comments._receipt(value, 81))
    ledger = journal.path / "github-requests"
    previous = (ledger / "000001.result.json").read_bytes()
    (ledger / "000002.request.json").write_bytes(_encode(
        {"sequence": 2, "previousSha256": _sha(previous), "startedAt": START + 60}))
    result = inspect_read_only(journal, now=START + 600)
    assert result["exitCode"] == 2
    assert result["attempts"][0]["status"] == "receipt_recorded_locally"
    assert result["requestBudget"]["status"] == "blocked"
    assert result["requestBudget"]["reservationWithoutResult"] == ["000002"]
    assert result["requestBudget"]["reason"] == "STOP_GITHUB_REQUEST_UNRESOLVED"
    assert "attemptKey" not in result["requestBudget"]


@pytest.mark.parametrize("fault", ["orphan_result", "gap", "hash", "canonical", "clock"])
def test_ambiguous_or_corrupt_request_history_blocks_inspection(
        journal: comments.LocalCommentJournal, fault: str) -> None:
    budgets.GitHubRequestBudget.initialize(journal)
    ledger = journal.path / "github-requests"
    identity = (ledger / "identity.json").read_bytes()
    if fault == "orphan_result":
        (ledger / "000001.result.json").write_bytes(b"{}\n")
    elif fault == "gap":
        write_pair(journal, 2, identity)
    else:
        raw = write_pair(journal, 1, identity)
        data = json.loads(raw)
        if fault == "hash":
            data["requestSha256"] = "0" * 64
        elif fault == "clock":
            data["finishedAt"] = START - 1
        (ledger / "000001.result.json").write_bytes(
            b" " + raw if fault == "canonical" else _encode(data))
    result = inspect_read_only(journal)
    assert result["exitCode"] == 2
    assert result["requestBudget"]["status"] == "blocked"
    assert result["requestBudget"]["reservationWithoutResult"] == []
    assert result["requestBudget"]["resultWithoutReservation"] == (
        ["000001"] if fault == "orphan_result" else [])
    assert result["requestBudget"]["reason"] == (
        "STOP_GITHUB_REQUEST_UNRESOLVED" if fault in {"gap", "orphan_result"}
        else "STOP_GITHUB_BUDGET_CORRUPT")


@pytest.mark.parametrize("now", [START - 1, float("nan"), True])
def test_invalid_or_rolled_back_inspection_clock_never_succeeds(
        journal: comments.LocalCommentJournal, now: float) -> None:
    record_response(journal)
    result = inspect_read_only(journal, now=now)
    assert result["exitCode"] == 2
    diagnostic = result.get("requestBudget", result)
    assert diagnostic["reason"] == "STOP_INSPECTION_CLOCK"


def test_full_valid_request_history_requires_capacity_review(
        journal: comments.LocalCommentJournal, monkeypatch: pytest.MonkeyPatch) -> None:
    assert inspection.MAX_HISTORY == budgets.MAX_HISTORY == 4096
    budgets.GitHubRequestBudget.initialize(journal)
    monkeypatch.setattr(inspection, "MAX_HISTORY", 2)
    monkeypatch.setattr(budgets, "MAX_HISTORY", 2)
    previous = (journal.path / "github-requests" / "identity.json").read_bytes()
    for index in (1, 2):
        previous = write_pair(journal, index, previous)
    result = inspect_read_only(journal)
    assert result["exitCode"] == 1
    assert result["requestBudget"]["status"] == "history_full"
    assert result["requestBudget"]["completedRequests"] == 2
    assert result["requestBudget"]["action"] == "operator_planning_required"


def test_attempt_count_bound_is_separate_from_directory_entry_bound(
        journal: comments.LocalCommentJournal, monkeypatch: pytest.MonkeyPatch) -> None:
    for issue in (7, 8, 9):
        journal.claim(plan(issue))
    monkeypatch.setattr(inspection, "MAX_HISTORY", 2)
    monkeypatch.setattr(inspection, "_attempt", forbidden)
    result = inspect_read_only(journal)
    assert result["exitCode"] == 2
    assert result["reason"] == "STOP_INSPECTION_ATTEMPT_BOUND"


def test_request_validator_reads_only_the_captured_snapshot(
        journal: comments.LocalCommentJournal, monkeypatch: pytest.MonkeyPatch) -> None:
    record_response(journal)
    original = inspection.validate_request_history
    calls = 0

    def validate(identity, names, read):
        nonlocal calls
        calls += 1
        with monkeypatch.context() as patch:
            patch.setattr(comments, "_read", forbidden)
            patch.setattr(budgets, "_read", forbidden)
            patch.setattr(Path, "iterdir", forbidden)
            patch.setattr(os, "scandir", forbidden)
            return original(identity, names, read)

    monkeypatch.setattr(inspection, "validate_request_history", validate)
    result = inspect_read_only(journal)
    assert result["exitCode"] == 0
    assert calls == 1


def test_live_budget_entry_bound_does_not_hide_eager_directory_enumeration(
        journal: comments.LocalCommentJournal, monkeypatch: pytest.MonkeyPatch) -> None:
    budget = budgets.GitHubRequestBudget.initialize(journal)
    history = budget._history
    monkeypatch.setattr(budgets, "MAX_HISTORY", 2)
    limit = 2 * budgets.MAX_HISTORY + 1
    for index in range(limit + 1):
        (budget.path / f"{index:06d}.request.json").write_bytes(b"{}")
    before = snapshot(comments.ROOT)
    original_scandir, original_listdir = os.scandir, os.listdir
    seen = 0

    @contextmanager
    def scandir(path):
        nonlocal seen
        with original_scandir(path) as entries:
            def counted():
                nonlocal seen
                for entry in entries:
                    seen += 1
                    assert seen <= limit + 1, "Path.iterdir buffered beyond the ledger entry bound"
                    yield entry
            yield counted()

    def listdir(path):
        if Path(path) == budget.path:
            pytest.fail("Path.iterdir used eager os.listdir before the ledger entry bound")
        return original_listdir(path)

    with monkeypatch.context() as patch:
        patch.setattr(os, "scandir", scandir)
        patch.setattr(os, "listdir", listdir)
        patch.setattr(budgets, "validate_request_history", forbidden)
        with inspection_only(), pytest.raises(comments.DeliveryError, match="STOP_GITHUB_HISTORY_BOUND"):
            history()
    assert seen == limit + 1
    assert snapshot(comments.ROOT) == before


@pytest.mark.parametrize("change", ["bytes", "membership", "disappeared", "unreadable"])
def test_changed_or_unreadable_input_never_returns_a_successful_snapshot(
        journal: comments.LocalCommentJournal, monkeypatch: pytest.MonkeyPatch, change: str) -> None:
    value = plan()
    journal.claim(value)
    journal.verify(value, comments._receipt(value, 81))
    budgets.GitHubRequestBudget.initialize(journal)
    target = journal.path / f"{value.attempt_key}.intent.json"
    original_read, original_names = comments._read, inspection._names
    reads = scans = 0

    def read(path: Path) -> bytes | None:
        nonlocal reads
        raw = original_read(path)
        if path == target:
            reads += 1
            if reads == 2:
                if change == "bytes":
                    return raw + b" "
                if change == "disappeared":
                    return None
                if change == "unreadable":
                    raise PermissionError(PRIVATE)
        return raw

    def names(path: Path, **kwargs) -> list[str]:
        nonlocal scans
        found = original_names(path, **kwargs)
        if path == journal.path:
            scans += 1
            if scans == 3 and change == "membership":
                return sorted([*found, "f" * 64 + ".intent.json"])
        return found

    monkeypatch.setattr(comments, "_read", read)
    monkeypatch.setattr(inspection, "_names", names)
    result = inspect_read_only(journal)
    assert result["exitCode"] == 2
    assert result["status"] == "stopped"
    assert "attempts" not in result
    assert "snapshotSha256" not in result
    assert result["reason"] == ("STOP_INSPECTION_INVALID_LOCAL_HISTORY" if change == "unreadable"
                                else "STOP_INSPECTION_CHANGED")


def test_cli_wrong_cwd_stops_before_argument_parsing_or_journal_io(
        monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(Path, "cwd", classmethod(lambda cls: ROOT / "tmp"))
    monkeypatch.setattr(inspection, "inspect_journal", forbidden)
    monkeypatch.setattr(sys, "argv", ["inspect_source_notice_journal", "--help"])
    with inspection_only(), pytest.raises(SystemExit, match="Wrong working root"):
        inspection.main()


def test_cli_help_needs_no_journal_and_performs_no_inspection(
        monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture) -> None:
    assert Path.cwd() == comments.ROOT == ROOT
    monkeypatch.setattr(inspection, "inspect_journal", forbidden)
    monkeypatch.setattr(sys, "argv", ["inspect_source_notice_journal", "--help"])
    with inspection_only(), pytest.raises(SystemExit) as stopped:
        inspection.main()
    assert stopped.value.code == 0
    output = capsys.readouterr()
    assert "--journal-sha256" in output.out
    assert PRIVATE not in output.out
    assert output.err == ""


@pytest.mark.parametrize("corrupt", [False, True])
def test_cli_stdout_is_sanitized_json_with_the_actual_inspection_exit_code(
        journal: comments.LocalCommentJournal, monkeypatch: pytest.MonkeyPatch,
        capsys: pytest.CaptureFixture, corrupt: bool) -> None:
    assert sys.dont_write_bytecode, "Run this isolated test file with Python -B"
    value = plan()
    journal.claim(value)
    journal.verify(value, comments._receipt(value, 81))
    budgets.GitHubRequestBudget.initialize(journal)
    if corrupt:
        (journal.path / f"{value.attempt_key}.receipt.json").write_bytes(PRIVATE.encode())
    fixture_root = comments.ROOT
    before = snapshot(fixture_root)
    inspect = inspection.inspect_journal

    def inspect_fixture(path, pin):
        with monkeypatch.context() as patch:
            patch.setattr(comments, "ROOT", fixture_root)
            return inspect(path, pin, now=START + 100)

    monkeypatch.setattr(comments, "ROOT", ROOT)
    monkeypatch.setattr(inspection, "inspect_journal", inspect_fixture)
    monkeypatch.setattr(sys, "argv", ["inspect_source_notice_journal", "--journal", str(journal.path),
                                     "--journal-sha256", journal.identity_sha256])
    with inspection_only():
        exit_code = inspection.main()
    output = capsys.readouterr()
    result = json.loads(output.out)
    assert exit_code == result["exitCode"] == (2 if corrupt else 0)
    assert result["attempts"][0]["status"] == (
        "invalid_local_history" if corrupt else "receipt_recorded_locally")
    assert result["remoteChecked"] is False
    assert PRIVATE not in output.out
    assert "Source metadata notice; not dataset validation." not in output.out
    assert "```json" not in output.out
    assert output.err == ""
    assert snapshot(fixture_root) == before
