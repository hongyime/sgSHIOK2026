"""Content-free, offline evaluation of report cleanup diagnostics.

Version 1 input (all keys required; extra keys rejected at every level)::

    {
      "schema_version": 1,
      "observed_at": "2026-09-15T02:54:00Z",
      "database_now": "2026-09-15T02:53:59Z",
      "control": {
        "enabled": false,
        "cleanup_verified_at": "2026-09-15T02:53:29.975663Z",
        "cleanup_failed_at": null
      },
      "scheduler": {
        "cron_timezone": "GMT", "cron_background_workers": "off",
        "cron_database": "postgres", "cron_log_run": "on",
        "pg_cron_version": "1.6.4",
        "jobs": [<exact EXPECTED_JOB fields below>],
        "recent_runs": [<run projection below>]
      }
    }

Each run has exactly jobid, runid (positive JSON integers), database, username,
status, start_time, end_time. Times require explicit offsets; PostgreSQL's
"2026-09-15 02:39:36.874302+00" spelling is accepted. Only end_time on a pending
run and the two control timestamps may be null. Do NOT supply return_message,
command results, report rows, content, credentials, or arbitrary error strings.

The trusted collector must supply a coherent observation from the pinned report
project: all jobs matching the expected name OR id, and the newest production
job runs (at most 32, including the newest completed run). An empty run list
means no execution evidence, not a successful check. No time-window filter may
hide a stale newest run. Take database_now after reading the diagnostic state,
and observed_at after collection. Both clocks must be no more than five minutes
behind the evaluator's trusted clock; future timestamps are never tolerated.

Cleanup freshness uses an inclusive 26-hour boundary, as in migration
20260915010921, but also checks evaluation time so replay cannot extend it.
Every non-null failure latch blocks, even one older than a successful cleanup.
Cron success is insufficient: a fresh verified timestamp must fall inside the
latest completed successful run. A later manual cleanup therefore requires a
new natural run before this conservative monitor returns healthy.

Output contains only fixed keys, enums, booleans and null. cleanup_admission_ready
requires healthy monitoring AND enabled=true, but is ONLY a cleanup prerequisite,
never permission to enable intake: policy, quotas, source identity, ACLs and
other admission checks are outside this evaluator. natural_run_observed denotes
completed execution evidence in this snapshot, not an authenticated lifetime
claim. The initial manual cleanup with no natural run is explicitly unobserved.
Collection, project authentication, notifications and fail-closed delivery are
the caller's responsibility. No network access, file writes, or state changes.

CLI: python -B scripts/report_cleanup_health.py < diagnostic.json
Exit 0 means healthy cleanup monitoring (even if intake is disabled); all other
health states exit 1. Only bounded JSON is read from stdin, never a file argument.
"""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timedelta, timezone
from typing import Any, TextIO


MAX_INPUT_BYTES = 65536
MAX_RUNS = 32
MAX_SNAPSHOT_AGE = timedelta(minutes=5)
MAX_SUCCESS_AGE = timedelta(hours=26)
EXPECTED_JOB = {
    "jobid": 1,
    "jobname": "shiok-report-cleanup-v1",
    "schedule": "17 17 * * *",
    "command": "SET statement_timeout = '30s'; SELECT shiok_reports.cleanup_expired_v1();",
    "database": "postgres",
    "username": "postgres",
    "nodename": "localhost",
    "nodeport": 5432,
    "active": True,
}
EXPECTED_SETTINGS = {
    "cron_timezone": "GMT",
    "cron_background_workers": "off",
    "cron_database": "postgres",
    "cron_log_run": "on",
    "pg_cron_version": "1.6.4",
}
PENDING_STATUSES = {"starting", "connecting", "sending", "running"}
RUN_KEYS = {
    "jobid", "runid", "database", "username", "status", "start_time", "end_time"
}
TIMESTAMP = re.compile(
    r"[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}:[0-9]{2}"
    r"(?:\.[0-9]{1,6})?(?:Z|[+-](?:[01][0-9]|2[0-3])(?::[0-5][0-9])?)"
)


class _Invalid(ValueError):
    pass


def _object(value: Any, keys: set[str]) -> dict[str, Any]:
    if type(value) is not dict or set(value) != keys:
        raise _Invalid("malformed_snapshot")
    return value


def _timestamp(value: Any) -> datetime:
    if type(value) is not str or not TIMESTAMP.fullmatch(value):
        raise _Invalid("malformed_snapshot")
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def _not_future(value: datetime, ceiling: datetime) -> datetime:
    if value > ceiling:
        raise _Invalid("future_timestamp")
    return value


def _result(
    status: str, cleanup: str = "unknown", scheduler: str = "unknown",
    enabled: bool | None = None, observed: bool | None = None,
    reason: str | None = None,
) -> dict[str, Any]:
    return {
        "schema_version": 1,
        "status": status,
        "cleanup": cleanup,
        "scheduler": scheduler,
        "intake_enabled": enabled,
        "natural_run_observed": observed,
        "cleanup_admission_ready": status == "healthy" and enabled is True,
        "reason": reason,
    }


def _runs(value: Any, database_now: datetime) -> list[dict[str, Any]]:
    if type(value) is not list or len(value) > MAX_RUNS:
        raise _Invalid("malformed_snapshot")
    runs = []
    ids = set()
    for item in value:
        row = _object(item, RUN_KEYS)
        for key in ("jobid", "runid"):
            if type(row[key]) is not int or not 0 < row[key] < 2**63:
                raise _Invalid("malformed_snapshot")
        if row["runid"] in ids:
            raise _Invalid("malformed_snapshot")
        ids.add(row["runid"])
        if any(type(row[key]) is not str for key in ("database", "username", "status")):
            raise _Invalid("malformed_snapshot")
        if row["status"] not in PENDING_STATUSES | {"succeeded", "failed"}:
            raise _Invalid("malformed_snapshot")
        start = _not_future(_timestamp(row["start_time"]), database_now)
        end = None
        if row["end_time"] is not None:
            end = _not_future(_timestamp(row["end_time"]), database_now)
            if end < start:
                raise _Invalid("malformed_snapshot")
        if (row["status"] in PENDING_STATUSES) != (end is None):
            raise _Invalid("malformed_snapshot")
        runs.append({**row, "start_time": start, "end_time": end})
    runs.sort(key=lambda row: row["runid"])
    for before, after in zip(runs, runs[1:]):
        if before["end_time"] is None or before["end_time"] > after["start_time"]:
            raise _Invalid("malformed_snapshot")
    return runs


def _scheduler(
    scheduler: dict[str, Any], runs: list[dict[str, Any]],
    verified: datetime | None, now: datetime,
) -> str:
    jobs = scheduler["jobs"]
    if type(jobs) is not list or len(jobs) > MAX_RUNS:
        raise _Invalid("malformed_snapshot")
    for item in jobs:
        job = _object(item, set(EXPECTED_JOB))
        if any(type(job[key]) is not type(expected) for key, expected in EXPECTED_JOB.items()):
            raise _Invalid("malformed_snapshot")
    for key in EXPECTED_SETTINGS:
        if type(scheduler[key]) is not str:
            raise _Invalid("malformed_snapshot")
    if any(scheduler[key] != value for key, value in EXPECTED_SETTINGS.items()):
        return "mismatch"
    if not jobs:
        return "missing"
    if len(jobs) != 1 or any(
        jobs[0][key] != value for key, value in EXPECTED_JOB.items() if key != "active"
    ):
        return "mismatch"
    if not jobs[0]["active"]:
        return "inactive"
    if any(
        run[key] != EXPECTED_JOB[key]
        for run in runs for key in ("jobid", "database", "username")
    ):
        return "mismatch"
    if not runs:
        return "unobserved"
    latest = runs[-1]
    if latest["status"] == "failed":
        return "failed"
    if now - (latest["end_time"] or latest["start_time"]) > MAX_SUCCESS_AGE:
        return "stale"
    if latest["end_time"] is None:
        return "pending"
    if verified is None or not latest["start_time"] <= verified <= latest["end_time"]:
        return "cleanup_unconfirmed"
    return "healthy"


def evaluate(snapshot: Any, *, now: datetime | None = None) -> dict[str, Any]:
    """Evaluate without mutating input; now is a trusted caller clock, not JSON."""
    try:
        now = datetime.now(timezone.utc) if now is None else now
        if not isinstance(now, datetime) or now.tzinfo is None or now.utcoffset() is None:
            raise _Invalid("malformed_snapshot")
        now = now.astimezone(timezone.utc)
        data = _object(snapshot, {
            "schema_version", "observed_at", "database_now", "control", "scheduler"
        })
        if type(data["schema_version"]) is not int or data["schema_version"] != 1:
            raise _Invalid("malformed_snapshot")
        observed_at = _not_future(_timestamp(data["observed_at"]), now)
        database_now = _not_future(_timestamp(data["database_now"]), observed_at)
        if now - observed_at > MAX_SNAPSHOT_AGE or now - database_now > MAX_SNAPSHOT_AGE:
            raise _Invalid("stale_snapshot")
        control = _object(data["control"], {
            "enabled", "cleanup_verified_at", "cleanup_failed_at"
        })
        if type(control["enabled"]) is not bool:
            raise _Invalid("malformed_snapshot")
        verified, failed = (
            None if control[key] is None else _not_future(_timestamp(control[key]), database_now)
            for key in ("cleanup_verified_at", "cleanup_failed_at")
        )
        cleanup = "fresh"
        if failed is not None:
            cleanup = "failed"
        elif verified is None:
            cleanup = "unverified"
        elif now - verified > MAX_SUCCESS_AGE:
            cleanup = "stale"
        scheduler = _object(data["scheduler"], set(EXPECTED_SETTINGS) | {"jobs", "recent_runs"})
        runs = _runs(scheduler["recent_runs"], database_now)
        scheduler_health = _scheduler(scheduler, runs, verified, now)
        # A QA job or a mismatched scheduler cannot establish natural production execution.
        observed = None if scheduler_health in {"mismatch", "missing", "inactive"} else any(
            run["end_time"] is not None for run in runs
        )
        status = "blocked"
        if cleanup == "fresh" and scheduler_health == "healthy":
            status = "healthy"
        elif cleanup == "fresh" and scheduler_health == "unobserved":
            status = "unobserved"
        return _result(status, cleanup, scheduler_health, control["enabled"], observed)
    except _Invalid as error:
        reason = str(error)
        if reason not in {"malformed_snapshot", "future_timestamp", "stale_snapshot"}:
            reason = "malformed_snapshot"
        return _result("invalid", reason=reason)
    except (ValueError, TypeError, OverflowError, RecursionError):
        return _result("invalid", reason="malformed_snapshot")


def _unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result = {}
    for key, value in pairs:
        if key in result:
            raise _Invalid("malformed_snapshot")
        result[key] = value
    return result


def _reject_constant(value: str) -> None:
    raise _Invalid("malformed_snapshot")


def evaluate_json(payload: Any, *, now: datetime | None = None) -> dict[str, Any]:
    """Reject duplicate keys, non-finite numbers, oversized input, and raw errors."""
    try:
        if type(payload) is not str or len(payload.encode("utf-8")) > MAX_INPUT_BYTES:
            raise _Invalid("malformed_snapshot")
        snapshot = json.loads(payload, object_pairs_hook=_unique_object, parse_constant=_reject_constant)
    except (ValueError, TypeError, OverflowError, RecursionError):
        return _result("invalid", reason="malformed_snapshot")
    return evaluate(snapshot, now=now)


def main(*, stdin: TextIO | None = None, stdout: TextIO | None = None) -> int:
    """Read one bounded snapshot and print one allowlisted health object."""
    stdin = sys.stdin if stdin is None else stdin
    stdout = sys.stdout if stdout is None else stdout
    try:
        health = evaluate_json(stdin.read(MAX_INPUT_BYTES + 1))
    except (OSError, ValueError):
        health = _result("invalid", reason="input_unavailable")
    try:
        print(json.dumps(health, separators=(",", ":")), file=stdout, flush=True)
    except (OSError, ValueError):
        return 1
    return 0 if health["status"] == "healthy" else 1


if __name__ == "__main__":
    raise SystemExit(main())
