"""Single-journal GitHub pacing; explicit initialization, no history repair.

Reservations precede network IO and results are create-only. An interrupted
reservation blocks further IO until an operator investigates. This is not a
credential-wide/distributed limiter or protection against rollback of local files.
Use one retained, pinned journal for all this monitor's callers.
"""

from email.utils import format_datetime, parsedate_to_datetime
import json
import time
from typing import Callable

from scripts.source_metadata_comments import LocalCommentJournal, _publish, _read, _safe_root
from scripts.source_metadata_delivery import DeliveryError, _encode, _sha

MAX_REQUESTS = 24
RUN_SECONDS = 300
MAX_HISTORY = 4096
SPACING_SECONDS = 1


def _number(value: object) -> bool:
    return type(value) in (int, float) and 0 <= value <= 253402300799


def _cooldown(rate: dict, now: float) -> tuple[float, bool]:
    if (not isinstance(rate, dict) or set(rate) != {"status", "retryAfter", "remaining", "reset"}
            or type(rate["status"]) is not int or not 100 <= rate["status"] <= 599):
        raise DeliveryError("STOP_GITHUB_RATE_HEADERS")
    for key in ("retryAfter", "remaining", "reset"):
        value = rate[key]
        if value is not None and (not isinstance(value, str) or not 1 <= len(value) <= 128):
            raise DeliveryError("STOP_GITHUB_RATE_HEADERS")
    blocked = rate["status"] in (403, 429)
    until = now + (60 if blocked else SPACING_SECONDS)
    retry = rate["retryAfter"]
    try:
        if retry is not None:
            if retry.isascii() and retry.isdecimal():
                until = max(until, now + int(retry))
            else:
                date = parsedate_to_datetime(retry)
                if date.tzinfo is None or format_datetime(date, usegmt=True) != retry:
                    raise ValueError
                until = max(until, date.timestamp())
            blocked = True
        remaining = rate["remaining"]
        if remaining is not None:
            if not remaining.isascii() or not remaining.isdecimal():
                raise ValueError
            if int(remaining) == 0:
                reset = rate["reset"]
                if reset is None or not reset.isascii() or not reset.isdecimal():
                    raise ValueError
                until = max(until, int(reset) + 1)
                blocked = True
        if not _number(until):
            raise ValueError
    except (ValueError, TypeError, OverflowError):
        raise DeliveryError("STOP_GITHUB_RATE_HEADERS") from None
    return until, blocked


class GitHubRequestBudget:
    """One api.github.com ledger inside the existing comment journal.

    No tokens, comment bodies, targets, response bodies or rate header text are
    written. The pinned identity belongs to the separately retained journal.
    Trusted stable ancestors are required, as for LocalCommentJournal.
    """

    @classmethod
    def initialize(cls, journal: LocalCommentJournal) -> "GitHubRequestBudget":
        path = _safe_root(journal.path / "github-requests")
        path.mkdir(exist_ok=False)
        _publish(path / "identity.json", cls._identity(journal))
        return cls(journal)

    @staticmethod
    def _identity(journal: LocalCommentJournal) -> bytes:
        return _encode({"schemaVersion": 1, "host": "api.github.com",
                        "journalIdentitySha256": journal.identity_sha256})

    def __init__(self, journal: LocalCommentJournal, *, clock: Callable = time.time,
                 monotonic: Callable = time.monotonic, sleep: Callable = time.sleep):
        self.journal = journal
        self.path = journal.path / "github-requests"
        self.clock, self.monotonic, self.sleep = clock, monotonic, sleep
        self.started = monotonic()
        self.count = 0
        self.stopped = False
        self.last_finished_monotonic = None
        self._history()

    def _history(self) -> tuple[int, str, float, float]:
        journal = self.journal
        if (_safe_root(self.path) != self.path or _read(journal.path / "identity.json") != journal.identity
                or _read(self.path / "identity.json") != self._identity(journal)):
            raise DeliveryError("STOP_GITHUB_BUDGET_IDENTITY")
        names = {p.name for p in self.path.iterdir()}
        names.remove("identity.json")
        if len(names) > 2 * MAX_HISTORY:
            raise DeliveryError("STOP_GITHUB_HISTORY_BOUND")
        previous, finished, until = _sha(self._identity(journal)), 0, 0
        index = 1
        while names:
            reservation_name, result_name = f"{index:06d}.request.json", f"{index:06d}.result.json"
            if reservation_name not in names or result_name not in names:
                raise DeliveryError("STOP_GITHUB_REQUEST_UNRESOLVED")
            raw = _read(self.path / reservation_name)
            result_raw = _read(self.path / result_name)
            try:
                reservation, result = json.loads(raw), json.loads(result_raw)
                if (not isinstance(reservation, dict) or set(reservation) != {"sequence", "previousSha256", "startedAt"}
                        or type(reservation["sequence"]) is not int or reservation["sequence"] != index
                        or reservation["previousSha256"] != previous
                        or not _number(reservation["startedAt"]) or reservation["startedAt"] < until
                        or raw != _encode(reservation)
                        or not isinstance(result, dict) or set(result) != {"requestSha256", "finishedAt", "notBefore", "status"}
                        or result["requestSha256"] != _sha(raw)
                        or type(result["status"]) is not int or not 100 <= result["status"] <= 599
                        or not _number(result["finishedAt"]) or result["finishedAt"] < reservation["startedAt"]
                        or not _number(result["notBefore"]) or result["notBefore"] < result["finishedAt"] + SPACING_SECONDS
                        or result_raw != _encode(result)):
                    raise ValueError
            except (TypeError, ValueError, KeyError, RecursionError):
                raise DeliveryError("STOP_GITHUB_BUDGET_CORRUPT") from None
            previous, finished, until = _sha(result_raw), result["finishedAt"], result["notBefore"]
            names.difference_update((reservation_name, result_name))
            index += 1
        return index, previous, finished, until

    def request(self, operation: Callable[[], dict]) -> dict:
        if self.stopped:
            raise DeliveryError("STOP_GITHUB_RUN_STOPPED")
        try:
            index, previous, finished, until = self._history()
            now = self.clock()
            if not _number(now) or now < finished:
                raise DeliveryError("STOP_GITHUB_CLOCK")
            delay = until - now
            if delay > SPACING_SECONDS:
                raise DeliveryError("STOP_GITHUB_COOLDOWN")
            if self.last_finished_monotonic is not None:
                since = self.monotonic() - self.last_finished_monotonic
                if since < 0:
                    raise DeliveryError("STOP_GITHUB_CLOCK")
                delay = max(delay, SPACING_SECONDS - since)
            if delay > 0:
                self.sleep(delay)
                now = self.clock()
            elapsed = self.monotonic() - self.started
            # Leave room for the worker's entire ten-second request deadline.
            if (self.count >= MAX_REQUESTS or index > MAX_HISTORY
                    or not 0 <= elapsed <= RUN_SECONDS - 10):
                raise DeliveryError("STOP_GITHUB_RUN_BUDGET")
            if not _number(now) or now < max(until, finished):
                raise DeliveryError("STOP_GITHUB_CLOCK")
            reservation = _encode({"sequence": index, "previousSha256": previous, "startedAt": now})
            request_path = self.path / f"{index:06d}.request.json"
            if not _publish(request_path, reservation):
                raise DeliveryError("STOP_GITHUB_REQUEST_ALREADY_CLAIMED")
            self.count += 1
            self.check_dispatch()
            value = operation()
            end = self.clock()
            if not _number(end) or end < now:
                raise DeliveryError("STOP_GITHUB_CLOCK")
            if not isinstance(value, dict) or "rate" not in value:
                raise DeliveryError("STOP_GITHUB_RATE_HEADERS")
            not_before, blocked = _cooldown(value["rate"], end)
            if _read(request_path) != reservation:
                raise DeliveryError("STOP_GITHUB_REQUEST_CHANGED")
            _safe_root(self.path)
            result = _encode({"requestSha256": _sha(reservation), "finishedAt": end,
                              "notBefore": not_before, "status": value["rate"]["status"]})
            _publish(self.path / f"{index:06d}.result.json", result)
            self.last_finished_monotonic = self.monotonic()
            if blocked:
                self.stopped = True
            # Preserve successful POST ids even when it consumed the last API slot.
            return value
        except BaseException:
            self.stopped = True
            raise

    def check_dispatch(self) -> None:
        """Recheck after local durable IO, immediately before starting the worker."""
        if self.stopped or not 0 <= self.monotonic() - self.started <= RUN_SECONDS - 10:
            self.stopped = True
            raise DeliveryError("STOP_GITHUB_RUN_BUDGET")
