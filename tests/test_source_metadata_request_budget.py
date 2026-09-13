"""Durable request pacing with synthetic operations and repo-contained journals."""

from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import UTC, datetime
from email.utils import format_datetime
import hashlib
import json
import os
from pathlib import Path
import socket
import subprocess
from threading import Barrier
from typing import NoReturn

import pytest

from scripts import source_metadata_comments as comments
from scripts import source_metadata_request_budget as budgets
from scripts.source_metadata_delivery import DeliveryError, _encode


ROOT = Path(r"C:\sgSHIOK2026")
START = 1_800_000_000.0


@dataclass
class Clock:
    wall: float = START
    ticks: float = 0.0
    sleeps: list[float] = field(default_factory=list)

    def time(self) -> float:
        return self.wall

    def monotonic(self) -> float:
        return self.ticks

    def advance(self, seconds: float) -> None:
        self.wall += seconds
        self.ticks += seconds

    def sleep(self, seconds: float) -> None:
        assert seconds > 0
        self.sleeps.append(seconds)
        self.advance(seconds)


def response(status: int = 200, *, retry_after: str | None = None,
             remaining: str | None = None, reset: str | None = None) -> dict:
    return {"rate": {"status": status, "retryAfter": retry_after,
                     "remaining": remaining, "reset": reset}}


def no_io() -> NoReturn:
    pytest.fail("A stopped budget must not invoke the operation")


def snapshot(path: Path) -> dict[str, tuple[bytes, int]]:
    return {item.relative_to(path).as_posix(): (item.read_bytes(), item.stat().st_mtime_ns)
            for item in path.rglob("*") if item.is_file()}


def reopen(journal: comments.LocalCommentJournal, clock: Clock) -> budgets.GitHubRequestBudget:
    opened = comments.LocalCommentJournal(
        journal.path, expected_identity_sha256=journal.identity_sha256)
    return budgets.GitHubRequestBudget(
        opened, clock=clock.time, monotonic=clock.monotonic, sleep=clock.sleep)


@pytest.fixture(autouse=True)
def deny_network_and_processes(monkeypatch: pytest.MonkeyPatch) -> None:
    def forbidden(*args: object, **kwargs: object) -> NoReturn:
        pytest.fail("Real network or process access is forbidden in request budget tests")

    for target, names in (
        (socket, ("create_connection", "getaddrinfo", "gethostbyname", "gethostbyname_ex")),
        (socket.socket, ("connect", "connect_ex", "sendto", "sendall")),
        (subprocess, ("run", "Popen")),
        (os, ("system", "popen", "startfile")),
    ):
        for name in names:
            if hasattr(target, name):
                monkeypatch.setattr(target, name, forbidden)


@pytest.fixture
def clock() -> Clock:
    return Clock()


@pytest.fixture
def journal(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> comments.LocalCommentJournal:
    assert Path.cwd() == ROOT
    assert Path(budgets.__file__).resolve().is_relative_to(ROOT)
    assert tmp_path.resolve().is_relative_to(ROOT / "tmp")
    monkeypatch.setattr(comments, "ROOT", tmp_path)
    return comments.LocalCommentJournal.initialize(
        tmp_path / "tmp" / "source-notice-journals" / "fixture")


@pytest.fixture
def budget(journal: comments.LocalCommentJournal, clock: Clock) -> budgets.GitHubRequestBudget:
    budgets.GitHubRequestBudget.initialize(journal)
    return reopen(journal, clock)


def test_open_requires_explicit_initialization_without_bootstrapping(
        journal: comments.LocalCommentJournal, clock: Clock) -> None:
    before = snapshot(journal.path)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_BUDGET_IDENTITY$"):
        reopen(journal, clock).request(no_io)
    assert not (journal.path / "github-requests").exists()
    assert snapshot(journal.path) == before


def test_initialize_is_unique_and_reopen_preserves_pinned_identity(
        budget: budgets.GitHubRequestBudget, journal: comments.LocalCommentJournal,
        clock: Clock) -> None:
    identity = json.loads((budget.path / "identity.json").read_bytes())
    assert identity == {"schemaVersion": 1, "host": "api.github.com",
                        "journalIdentitySha256": journal.identity_sha256}
    before = snapshot(journal.path)
    opened = reopen(journal, clock)
    assert opened.path == budget.path
    with pytest.raises(FileExistsError):
        budgets.GitHubRequestBudget.initialize(journal)
    assert snapshot(journal.path) == before


def test_reservation_precedes_io_and_result_is_minimal_hash_linked_history(
        budget: budgets.GitHubRequestBudget, journal: comments.LocalCommentJournal,
        clock: Clock) -> None:
    value = {**response(201), "id": 81, "body": "synthetic-private-body"}
    request_path = budget.path / "000001.request.json"
    result_path = budget.path / "000001.result.json"

    def post() -> dict:
        assert json.loads(request_path.read_bytes()) == {
            "sequence": 1, "startedAt": START,
            "previousSha256": hashlib.sha256((budget.path / "identity.json").read_bytes()).hexdigest(),
        }
        assert not result_path.exists()
        clock.advance(2)
        return value

    assert budget.request(post) is value
    assert json.loads(result_path.read_bytes()) == {
        "requestSha256": hashlib.sha256(request_path.read_bytes()).hexdigest(),
        "finishedAt": START + 2, "notBefore": START + 3, "status": 201,
    }
    before = snapshot(budget.path)
    reopened = reopen(journal, clock)
    assert snapshot(budget.path) == before
    reopened.request(response)
    second = json.loads((budget.path / "000002.request.json").read_bytes())
    assert second["sequence"] == 2
    assert second["previousSha256"] == hashlib.sha256(result_path.read_bytes()).hexdigest()
    assert all(snapshot(budget.path)[name] == saved for name, saved in before.items())
    assert b"synthetic-private-body" not in b"".join(raw for raw, _ in snapshot(budget.path).values())


def test_spacing_is_measured_from_completion_and_survives_reopen(
        budget: budgets.GitHubRequestBudget, journal: comments.LocalCommentJournal,
        clock: Clock) -> None:
    calls = []

    def operation() -> dict:
        calls.append(clock.wall)
        clock.advance(2)
        return response()

    budget.request(operation)
    assert clock.sleeps == []
    clock.advance(0.25)
    reopened = reopen(journal, clock)
    reopened.request(operation)
    reopened.request(operation)
    assert calls == [START, START + 3, START + 6]
    assert clock.sleeps == [0.75, 1.0]


def test_forward_wall_clock_jump_cannot_bypass_same_object_monotonic_spacing(
        budget: budgets.GitHubRequestBudget, clock: Clock) -> None:
    def first_operation() -> dict:
        clock.advance(2)
        return response()

    budget.request(first_operation)
    finished = clock.monotonic()
    assert clock.sleeps == []
    clock.advance(0.25)
    clock.wall += 3600

    def next_operation() -> dict:
        assert clock.monotonic() - finished == 1.0
        return response()

    assert budget.request(next_operation) == response()
    assert clock.sleeps == [0.75]
    assert (budget.path / "000002.result.json").exists()


@pytest.mark.parametrize("retry_after,seconds", [
    pytest.param(None, 60, id="default-cooldown"),
    pytest.param("120", 120, id="delta-seconds"),
    pytest.param(format_datetime(datetime.fromtimestamp(START + 120, UTC), usegmt=True),
                 120, id="http-date"),
])
def test_429_cooldown_persists_across_reopen_until_expiry(
        budget: budgets.GitHubRequestBudget, journal: comments.LocalCommentJournal,
        clock: Clock, retry_after: str | None, seconds: int) -> None:
    value = response(429, retry_after=retry_after)
    assert budget.request(lambda: value) is value
    result = json.loads((budget.path / "000001.result.json").read_bytes())
    assert result["notBefore"] == START + seconds
    before = snapshot(budget.path)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_RUN_STOPPED$"):
        budget.request(no_io)
    clock.advance(seconds - 2)
    waiting = reopen(journal, clock)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_COOLDOWN$"):
        waiting.request(no_io)
    assert snapshot(budget.path) == before
    assert clock.sleeps == []
    clock.advance(2)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_RUN_STOPPED$"):
        waiting.request(no_io)
    assert reopen(journal, clock).request(response) == response()
    assert (budget.path / "000002.result.json").exists()


def test_successful_post_with_exhausted_rate_returns_id_then_stops_next_request(
        budget: budgets.GitHubRequestBudget, journal: comments.LocalCommentJournal,
        clock: Clock) -> None:
    value = {**response(201, remaining="0", reset=str(int(START + 90))), "id": 81}
    assert budget.request(lambda: value) is value
    saved = json.loads((budget.path / "000001.result.json").read_bytes())
    assert saved["status"] == 201 and saved["notBefore"] == START + 91
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_RUN_STOPPED$"):
        budget.request(no_io)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_COOLDOWN$"):
        reopen(journal, clock).request(no_io)
    assert not (budget.path / "000002.request.json").exists()
    clock.advance(91)
    assert reopen(journal, clock).request(response) == response()


def test_twenty_four_requests_are_allowed_but_twenty_fifth_never_reserves_or_runs(
        budget: budgets.GitHubRequestBudget) -> None:
    calls = []

    def operation() -> dict:
        calls.append("GET")
        return response()

    for _ in range(24):
        budget.request(operation)
    before = snapshot(budget.path)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_RUN_BUDGET$"):
        budget.request(no_io)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_RUN_STOPPED$"):
        budget.request(no_io)
    assert len(calls) == 24
    assert len(list(budget.path.glob("*.request.json"))) == 24
    assert len(list(budget.path.glob("*.result.json"))) == 24
    assert snapshot(budget.path) == before


@pytest.mark.parametrize("elapsed", [290.0, 290.001], ids=["ten-seconds-left", "too-late"])
def test_run_deadline_leaves_ten_seconds_within_three_hundred_second_window(
        budget: budgets.GitHubRequestBudget, clock: Clock, elapsed: float) -> None:
    clock.advance(elapsed)
    before = snapshot(budget.path)
    if elapsed > 290:
        with pytest.raises(DeliveryError, match="^STOP_GITHUB_RUN_BUDGET$"):
            budget.request(no_io)
        assert snapshot(budget.path) == before
        return

    def operation() -> dict:
        clock.advance(10)
        return response()

    assert budget.request(operation) == response()
    assert clock.ticks == 300
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_RUN_BUDGET$"):
        budget.request(no_io)
    assert not (budget.path / "000002.request.json").exists()


def test_spacing_cannot_spend_the_remaining_request_deadline(
        budget: budgets.GitHubRequestBudget, clock: Clock) -> None:
    clock.advance(289.5)
    budget.request(response)
    before = snapshot(budget.path)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_RUN_BUDGET$"):
        budget.request(no_io)
    assert clock.sleeps == [1.0]
    assert snapshot(budget.path) == before


def test_reservation_write_crossing_dispatch_deadline_never_runs_operation(
        budget: budgets.GitHubRequestBudget, journal: comments.LocalCommentJournal,
        clock: Clock, monkeypatch: pytest.MonkeyPatch) -> None:
    clock.advance(289)
    publish = budgets._publish
    request_path = budget.path / "000001.request.json"

    def slow_publish(path: Path, raw: bytes) -> bool:
        published = publish(path, raw)
        if path == request_path:
            assert published and path.read_bytes() == raw
            clock.advance(2.5)
        return published

    monkeypatch.setattr(budgets, "_publish", slow_publish)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_RUN_BUDGET$"):
        budget.request(no_io)
    assert clock.ticks == 291.5
    assert json.loads(request_path.read_bytes())["startedAt"] == START + 289
    assert not (budget.path / "000001.result.json").exists()
    before = snapshot(budget.path)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_RUN_STOPPED$"):
        budget.request(no_io)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_REQUEST_UNRESOLVED$"):
        reopen(journal, clock).request(no_io)
    assert snapshot(budget.path) == before


@pytest.mark.parametrize("fault", [TimeoutError("synthetic-unknown-outcome"), KeyboardInterrupt()],
                         ids=["lost-response", "interrupted"])
def test_unknown_operation_outcome_retains_unresolved_reservation_and_blocks_reopen(
        budget: budgets.GitHubRequestBudget, journal: comments.LocalCommentJournal,
        clock: Clock, fault: BaseException) -> None:
    calls = []

    def operation() -> dict:
        calls.append("POST")
        assert (budget.path / "000001.request.json").exists()
        raise fault

    with pytest.raises(type(fault)) as caught:
        budget.request(operation)
    assert caught.value is fault
    assert not (budget.path / "000001.result.json").exists()
    before = snapshot(budget.path)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_RUN_STOPPED$"):
        budget.request(no_io)
    clock.advance(600)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_REQUEST_UNRESOLVED$"):
        reopen(journal, clock).request(no_io)
    assert calls == ["POST"]
    assert snapshot(budget.path) == before


@pytest.mark.parametrize("value", [
    pytest.param({"id": 81}, id="missing-rate"),
    pytest.param({"rate": {"status": 200, "retryAfter": None, "remaining": 0, "reset": None}},
                 id="non-string-header"),
])
def test_invalid_operation_result_cannot_complete_reservation(
        budget: budgets.GitHubRequestBudget, journal: comments.LocalCommentJournal,
        clock: Clock, value: dict) -> None:
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_RATE_HEADERS$"):
        budget.request(lambda: value)
    assert (budget.path / "000001.request.json").exists()
    assert not (budget.path / "000001.result.json").exists()
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_REQUEST_UNRESOLVED$"):
        reopen(journal, clock).request(no_io)


def test_retry_after_date_with_trailing_garbage_leaves_unresolved_reservation(
        budget: budgets.GitHubRequestBudget, journal: comments.LocalCommentJournal,
        clock: Clock) -> None:
    date = format_datetime(datetime.fromtimestamp(START + 120, UTC), usegmt=True)
    value = response(429, retry_after=date + " garbage")
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_RATE_HEADERS$"):
        budget.request(lambda: value)
    assert (budget.path / "000001.request.json").exists()
    assert not (budget.path / "000001.result.json").exists()
    before = snapshot(budget.path)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_RUN_STOPPED$"):
        budget.request(no_io)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_REQUEST_UNRESOLVED$"):
        reopen(journal, clock).request(no_io)
    assert snapshot(budget.path) == before


def test_wall_clock_rollback_after_reopen_stops_before_operation(
        budget: budgets.GitHubRequestBudget, journal: comments.LocalCommentJournal,
        clock: Clock) -> None:
    budget.request(response)
    before = snapshot(budget.path)
    clock.wall -= 1
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_CLOCK$"):
        reopen(journal, clock).request(no_io)
    assert clock.sleeps == []
    assert snapshot(budget.path) == before


def test_wall_clock_rollback_during_operation_leaves_unresolved_reservation(
        budget: budgets.GitHubRequestBudget, journal: comments.LocalCommentJournal,
        clock: Clock) -> None:
    def operation() -> dict:
        clock.wall -= 1
        return response()

    with pytest.raises(DeliveryError, match="^STOP_GITHUB_CLOCK$"):
        budget.request(operation)
    assert (budget.path / "000001.request.json").exists()
    assert not (budget.path / "000001.result.json").exists()
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_REQUEST_UNRESOLVED$"):
        reopen(journal, clock).request(no_io)


def test_concurrent_next_slot_claim_allows_exactly_one_operation(
        budget: budgets.GitHubRequestBudget, journal: comments.LocalCommentJournal,
        clock: Clock, monkeypatch: pytest.MonkeyPatch) -> None:
    other = reopen(journal, clock)
    barrier = Barrier(2, timeout=10)
    publish = budgets._publish
    calls = []

    def synchronized_publish(path: Path, raw: bytes) -> bool:
        if path.name == "000001.request.json":
            # Both independent readers must reach the same unclaimed slot.
            barrier.wait()
        return publish(path, raw)

    def operation() -> dict:
        calls.append("POST")
        return response(201)

    def invoke(client: budgets.GitHubRequestBudget) -> dict | str:
        try:
            return client.request(operation)
        except DeliveryError as error:
            return str(error)

    monkeypatch.setattr(budgets, "_publish", synchronized_publish)
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(invoke, client) for client in (budget, other)]
        results = [future.result(timeout=15) for future in futures]
    assert calls == ["POST"]
    assert results.count(response(201)) == 1
    assert len([item for item in results if item in (
        "STOP_GITHUB_REQUEST_ALREADY_CLAIMED", "STOP_JOURNAL_CONFLICT")]) == 1
    assert len(list(budget.path.glob("*.request.json"))) == 1
    assert len(list(budget.path.glob("*.result.json"))) == 1
    before = snapshot(budget.path)
    reopen(journal, clock)
    assert snapshot(budget.path) == before


@pytest.mark.parametrize("record,field_name", [("request", "previousSha256"),
                                              ("result", "requestSha256")])
def test_corrupt_hash_link_stops_cached_and_reopened_budget_before_io(
        budget: budgets.GitHubRequestBudget, journal: comments.LocalCommentJournal,
        clock: Clock, record: str, field_name: str) -> None:
    budget.request(response)
    path = budget.path / f"000001.{record}.json"
    data = json.loads(path.read_bytes())
    data[field_name] = "0" * 64
    path.write_bytes(_encode(data))
    before = snapshot(budget.path)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_BUDGET_CORRUPT$"):
        budget.request(no_io)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_BUDGET_CORRUPT$"):
        reopen(journal, clock).request(no_io)
    assert snapshot(budget.path) == before


@pytest.mark.parametrize("owner", ["budget", "journal"])
def test_changed_identity_stops_before_io_without_reinitializing(
        budget: budgets.GitHubRequestBudget, journal: comments.LocalCommentJournal,
        clock: Clock, owner: str) -> None:
    path = (budget.path if owner == "budget" else journal.path) / "identity.json"
    identity = json.loads(path.read_bytes())
    identity["schemaVersion"] = 2
    path.write_bytes(_encode(identity))
    before = snapshot(journal.path)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_BUDGET_IDENTITY$"):
        budget.request(no_io)
    reason = "STOP_GITHUB_BUDGET_IDENTITY" if owner == "budget" else "STOP_JOURNAL_IDENTITY"
    with pytest.raises(DeliveryError, match=f"^{reason}$"):
        reopen(journal, clock).request(no_io)
    assert snapshot(journal.path) == before


@pytest.mark.parametrize("name,reason", [
    ("000001.result.json", "STOP_GITHUB_REQUEST_UNRESOLVED"),
    ("identity.json", "STOP_GITHUB_BUDGET_IDENTITY"),
])
def test_missing_durable_file_stops_cached_and_reopened_budget_without_repair(
        budget: budgets.GitHubRequestBudget, journal: comments.LocalCommentJournal,
        clock: Clock, name: str, reason: str) -> None:
    budget.request(response)
    # Retain displaced fixture bytes outside the ledger instead of deleting files.
    (budget.path / name).rename(journal.path / f"retained-{name}")
    before = snapshot(journal.path)
    with pytest.raises(DeliveryError, match=f"^{reason}$"):
        budget.request(no_io)
    with pytest.raises(DeliveryError, match=f"^{reason}$"):
        reopen(journal, clock).request(no_io)
    assert snapshot(journal.path) == before
