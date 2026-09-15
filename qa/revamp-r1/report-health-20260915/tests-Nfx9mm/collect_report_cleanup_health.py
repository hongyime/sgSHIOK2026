"""Read-only report cleanup collector; never enables intake or runs cleanup.

Run locally with an explicit SHIOK_SUPABASE_ACCESS_TOKEN environment PAT and
``python -B scripts/collect_report_cleanup_health.py``. No arguments, token
files, redirects, retries, proxy environment, credential storage, or file writes.
The CLI makes at most three requests, in order: the pinned project GET, its
organization GET (matching id and plan=free), then ONE database/query POST with
read_only=true. GET requires HTTP 200; the query POST requires HTTP 201, as in
the stored scheduler-activate-DGKfpe and scheduler-acceptance-3Uos6d receipts.
The existing web/lib/report-project.json must match EXPECTED_PIN
exactly before any request. No SQL or endpoint is accepted from input/provider.

Only control's three health flags, scheduler settings, explicit job fields and
explicit run fields are queried. No report rows/counts or return_message. Jobs
matching name OR id are checked, with a 33rd overflow row failing validation;
the newest 32 production runs have no age filter that could hide stale evidence.
One materialized SELECT provides a coherent MVCC snapshot; clock_timestamp is
sampled afterwards. observed_at is taken locally after the response is read.
ONLY database_now may be ahead of local observation/evaluation, by at most five
seconds inclusive. observed_at retains strict local ordering, and cleanup/run
timestamps retain strict ordering against the DB sample. The evaluator measures
26-hour freshness against max(local now, database_now), never granting extra
age for skew. Worker output enforces the same DB-only allowance and preserves
the DB instant (UTC formatting only); it never substitutes a local timestamp.

Each HTTPS request has an 8-second socket timeout and a 64-KiB response-body
ceiling; JSON nesting is limited to 16 levels. The CLI runs the entire collection
in a child with a HARD 30-second deadline, including DNS, TLS, headers and slow
bodies. A timed-out child is
killed and waited for, never retried. collect() is the injectable test/worker
core, NOT the standalone hard-deadline boundary. Normal and worker stdout both
contain ONLY allowlisted health plus a constant target and normalized timestamps.
target always labels the intended pin, not a claim of successful verification.
Provider errors, extra fields, SQL, job commands and the PAT are never emitted.

Exit 0 means healthy monitoring, not reporting activation (intake may be false).
Any unavailable identity/Free check, malformed response or unhealthy evaluation
exits 1. Auth, permissions and SQL compatibility still need the parent's single
live acceptance run; this module's tests use fake transports only.
"""

from __future__ import annotations

import http.client
import json
import os
from pathlib import Path
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Callable, Mapping, TextIO

if __package__:
    from . import report_cleanup_health as evaluator
else:
    import report_cleanup_health as evaluator


ROOT = Path(__file__).resolve().parents[1]
PIN_PATH = ROOT / "web" / "lib" / "report-project.json"
TOKEN_ENV = "SHIOK_SUPABASE_ACCESS_TOKEN"
HOST = "api.supabase.com"
MAX_PIN_BYTES = 4096
MAX_RESPONSE_BYTES = 65536
MAX_JSON_DEPTH = 16
MAX_OUTPUT_BYTES = 4096
SOCKET_TIMEOUT = 8
COLLECTION_TIMEOUT = 30
EXPECTED_PIN = {
    "projectRef": "ztjilsfgoephcdcsgcks",
    "projectName": "sgshiok",
    "projectUrl": "https://ztjilsfgoephcdcsgcks.supabase.co",
    "organizationId": "ixonsqiqglwriirutigr",
    "region": "ap-southeast-1",
    "plan": "free",
}
PROJECT_PATH = "/v1/projects/ztjilsfgoephcdcsgcks"
ORGANIZATION_PATH = "/v1/organizations/ixonsqiqglwriirutigr"
QUERY_PATH = PROJECT_PATH + "/database/query"
EXPECTED_HTTP_STATUS = {
    ("GET", PROJECT_PATH): 200,
    ("GET", ORGANIZATION_PATH): 200,
    ("POST", QUERY_PATH): 201,
}

DIAGNOSTIC_SQL = """WITH diagnostic AS MATERIALIZED (
  SELECT jsonb_build_object(
    'schema_version', 1,
    'control', (
      SELECT jsonb_build_object(
        'enabled', c.enabled,
        'cleanup_verified_at', c.cleanup_verified_at,
        'cleanup_failed_at', c.cleanup_failed_at
      ) FROM shiok_reports.control c WHERE c.singleton IS TRUE
    ),
    'scheduler', jsonb_build_object(
      'cron_timezone', current_setting('cron.timezone', true),
      'cron_background_workers', current_setting('cron.use_background_workers', true),
      'cron_database', current_setting('cron.database_name', true),
      'cron_log_run', current_setting('cron.log_run', true),
      'pg_cron_version', (SELECT extversion FROM pg_extension WHERE extname = 'pg_cron'),
      'jobs', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'jobid', j.jobid, 'jobname', j.jobname, 'schedule', j.schedule,
          'command', j.command, 'database', j.database, 'username', j.username,
          'nodename', j.nodename, 'nodeport', j.nodeport, 'active', j.active
        ) ORDER BY j.jobid)
        FROM (
          SELECT jobid, jobname, schedule, command, database, username, nodename, nodeport, active
          FROM cron.job
          WHERE jobid = 1 OR jobname = 'shiok-report-cleanup-v1'
          ORDER BY jobid LIMIT 33
        ) j
      ), '[]'::jsonb),
      'recent_runs', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'jobid', r.jobid, 'runid', r.runid, 'database', r.database,
          'username', r.username, 'status', r.status,
          'start_time', r.start_time, 'end_time', r.end_time
        ) ORDER BY r.runid DESC)
        FROM (
          SELECT jobid, runid, database, username, status, start_time, end_time
          FROM cron.job_run_details WHERE jobid = 1
          ORDER BY runid DESC LIMIT 32
        ) r
      ), '[]'::jsonb)
    )
  ) AS snapshot
)
SELECT snapshot || jsonb_build_object('database_now', clock_timestamp()) AS snapshot
FROM diagnostic;"""
QUERY_BODY = json.dumps({"query": DIAGNOSTIC_SQL, "read_only": True}).encode("utf-8")
COLLECTION_REASONS = {
    "pin_mismatch", "token_unavailable", "identity_mismatch", "plan_not_free",
    "http_error", "redirect_refused", "response_too_large", "invalid_response",
    "request_timeout", "transport_error", "collection_timeout", "worker_failure",
    "invalid_arguments",
}
OUTPUT_ENUMS = {
    "status": {"healthy", "blocked", "unobserved", "invalid"},
    "cleanup": {"unknown", "fresh", "failed", "unverified", "stale"},
    "scheduler": {
        "unknown", "healthy", "mismatch", "missing", "inactive", "unobserved",
        "failed", "stale", "pending", "cleanup_unconfirmed",
    },
    "reason": {None, "malformed_snapshot", "future_timestamp", "stale_snapshot"} | COLLECTION_REASONS,
}
OUTPUT_KEYS = set(OUTPUT_ENUMS) | {
    "schema_version", "intake_enabled", "natural_run_observed", "cleanup_admission_ready",
    "target", "observed_at", "database_now",
}


class _CollectionError(Exception):
    pass


@dataclass(frozen=True, repr=False)
class Response:
    status: int
    body: bytes


Transport = Callable[[str, str, str, bytes | None], Response]
Clock = Callable[[], datetime]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _utc(value: datetime) -> str:
    if not isinstance(value, datetime) or value.tzinfo is None or value.utcoffset() is None:
        raise ValueError()
    return value.astimezone(timezone.utc).isoformat()


def _unique(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError()
        result[key] = value
    return result


def _nonfinite(value: str) -> None:
    raise ValueError()


def _json(raw: bytes, limit: int) -> Any:
    if type(raw) is not bytes or len(raw) > limit:
        raise ValueError()
    value = json.loads(raw.decode("utf-8"), object_pairs_hook=_unique, parse_constant=_nonfinite)
    pending = [(value, 0)]
    while pending:
        item, depth = pending.pop()
        if depth > MAX_JSON_DEPTH:
            raise ValueError()
        if type(item) in (dict, list):
            pending.extend((child, depth + 1) for child in (item.values() if type(item) is dict else item))
    return value


def _load_pin() -> None:
    try:
        with PIN_PATH.open("rb") as source:
            pin = _json(source.read(MAX_PIN_BYTES + 1), MAX_PIN_BYTES)
        if pin != EXPECTED_PIN:
            raise ValueError()
    except (OSError, ValueError, RecursionError):
        raise _CollectionError("pin_mismatch") from None


def _https_request(method: str, path: str, token: str, body: bytes | None) -> Response:
    # http.client neither follows redirects nor uses proxy/netrc environment.
    if (method, path) not in EXPECTED_HTTP_STATUS:
        raise _CollectionError("identity_mismatch")
    connection = http.client.HTTPSConnection(HOST, timeout=SOCKET_TIMEOUT)
    try:
        connection.request(method, path, body=body, headers={
            "Authorization": "Bearer " + token, "Accept": "application/json",
            "Content-Type": "application/json", "Accept-Encoding": "identity",
        })
        response = connection.getresponse()
        if 300 <= response.status < 400:
            raise _CollectionError("redirect_refused")
        if response.status != EXPECTED_HTTP_STATUS[method, path]:
            raise _CollectionError("http_error")
        length = response.getheader("Content-Length")
        if length is not None:
            if not length.isascii() or not length.isdigit() or len(length) > 10:
                raise _CollectionError("invalid_response")
            if int(length) > MAX_RESPONSE_BYTES:
                raise _CollectionError("response_too_large")
        if response.getheader("Content-Encoding", "identity").lower() != "identity":
            raise _CollectionError("invalid_response")
        raw = response.read(MAX_RESPONSE_BYTES + 1)
        if len(raw) > MAX_RESPONSE_BYTES:
            raise _CollectionError("response_too_large")
        if length is not None and len(raw) != int(length):
            raise _CollectionError("invalid_response")
        return Response(response.status, raw)
    finally:
        connection.close()


def _request(transport: Transport, method: str, path: str, token: str) -> Any:
    if (method, path) not in EXPECTED_HTTP_STATUS:
        raise _CollectionError("identity_mismatch")
    try:
        response = transport(method, path, token, QUERY_BODY if method == "POST" else None)
        if type(response) is not Response or type(response.status) is not int:
            raise _CollectionError("invalid_response")
        if 300 <= response.status < 400:
            raise _CollectionError("redirect_refused")
        if response.status != EXPECTED_HTTP_STATUS[method, path]:
            raise _CollectionError("http_error")
        if type(response.body) is bytes and len(response.body) > MAX_RESPONSE_BYTES:
            raise _CollectionError("response_too_large")
        return _json(response.body, MAX_RESPONSE_BYTES)
    except (TimeoutError, subprocess.TimeoutExpired):
        raise _CollectionError("request_timeout") from None
    except (ValueError, RecursionError):
        raise _CollectionError("invalid_response") from None


def _envelope(health: dict[str, Any], observed_at: str | None, database_now: str | None) -> dict[str, Any]:
    return {**health, "target": dict(EXPECTED_PIN), "observed_at": observed_at, "database_now": database_now}


def _failure(reason: str, clock: Clock) -> dict[str, Any]:
    health = evaluator.evaluate(None)
    health["reason"] = reason if reason in COLLECTION_REASONS else "transport_error"
    try:
        observed = _utc(clock())
    except Exception:
        observed = None
    return _envelope(health, observed, None)


def collect(*, transport: Transport, environ: Mapping[str, str] | None = None, clock: Clock = _now) -> dict[str, Any]:
    """Injectable collection core; production callers must use the bounded CLI."""
    try:
        _load_pin()
        environ = os.environ if environ is None else environ
        token = environ.get(TOKEN_ENV)
        if type(token) is not str or not 1 <= len(token) <= 4096 or any(not 33 <= ord(c) <= 126 for c in token):
            raise _CollectionError("token_unavailable")
        project = _request(transport, "GET", PROJECT_PATH, token)
        expected = {
            "id": EXPECTED_PIN["projectRef"], "name": EXPECTED_PIN["projectName"],
            "organization_id": EXPECTED_PIN["organizationId"],
            "region": EXPECTED_PIN["region"], "status": "ACTIVE_HEALTHY",
        }
        if type(project) is not dict or any(project.get(k) != v for k, v in expected.items()):
            raise _CollectionError("identity_mismatch")
        organization = _request(transport, "GET", ORGANIZATION_PATH, token)
        if type(organization) is not dict or organization.get("id") != EXPECTED_PIN["organizationId"]:
            raise _CollectionError("identity_mismatch")
        if organization.get("plan") != "free":
            raise _CollectionError("plan_not_free")
        rows = _request(transport, "POST", QUERY_PATH, token)
        if type(rows) is not list or len(rows) != 1 or type(rows[0]) is not dict or set(rows[0]) != {"snapshot"}:
            raise _CollectionError("invalid_response")
        data = rows[0]["snapshot"]
        if type(data) is not dict or set(data) != {"schema_version", "database_now", "control", "scheduler"}:
            raise _CollectionError("invalid_response")
        observed_at = _utc(clock())
        health = evaluator.evaluate({**data, "observed_at": observed_at}, now=clock())
        database_now = None
        if health["status"] != "invalid":
            database_now = _utc(datetime.fromisoformat(data["database_now"].replace("Z", "+00:00")))
        return _envelope(health, observed_at, database_now)
    except _CollectionError as error:
        return _failure(str(error), clock)
    except Exception:
        # Provider/library errors can contain headers, bodies or credentials.
        return _failure("transport_error", clock)


def _checked_output(raw: bytes, clock: Clock) -> dict[str, Any]:
    result = _json(raw, MAX_OUTPUT_BYTES)
    if type(result) is not dict or set(result) != OUTPUT_KEYS or result["target"] != EXPECTED_PIN:
        raise ValueError()
    if type(result["schema_version"]) is not int or result["schema_version"] != 1:
        raise ValueError()
    for key, allowed in OUTPUT_ENUMS.items():
        if type(result[key]) not in (str, type(None)) or result[key] not in allowed:
            raise ValueError()
    for key in ("intake_enabled", "natural_run_observed"):
        if type(result[key]) not in (bool, type(None)):
            raise ValueError()
    if type(result["cleanup_admission_ready"]) is not bool:
        raise ValueError()
    if result["cleanup_admission_ready"] != (result["status"] == "healthy" and result["intake_enabled"] is True):
        raise ValueError()
    now = clock()
    timestamps = {}
    for key in ("observed_at", "database_now"):
        if result[key] is not None:
            stamp = result[key]
            if type(stamp) is not str or not evaluator.TIMESTAMP.fullmatch(stamp):
                raise ValueError()
            parsed = datetime.fromisoformat(stamp.replace("Z", "+00:00"))
            if now - parsed > evaluator.MAX_SNAPSHOT_AGE:
                raise ValueError()
            if key == "observed_at" and parsed > now:
                raise ValueError()
            if key == "database_now" and parsed - now > evaluator.MAX_DATABASE_AHEAD:
                raise ValueError()
            timestamps[key] = parsed
            result[key] = _utc(parsed)
        elif result["status"] != "invalid":
            raise ValueError()
    if "database_now" in timestamps and (
        "observed_at" not in timestamps
        or timestamps["database_now"] - timestamps["observed_at"] > evaluator.MAX_DATABASE_AHEAD
    ):
        raise ValueError()
    return result


def _isolated_collect(*, clock: Clock = _now) -> dict[str, Any]:
    environment = {key: os.environ[key] for key in ("SYSTEMROOT", "WINDIR", "SYSTEMDRIVE", "PATH") if key in os.environ}
    environment.update(PYTHONUTF8="1", PYTHONDONTWRITEBYTECODE="1", TEMP=str(ROOT / "tmp"), TMP=str(ROOT / "tmp"))
    if TOKEN_ENV in os.environ:
        environment[TOKEN_ENV] = os.environ[TOKEN_ENV]
    try:
        worker = subprocess.run(
            [sys.executable, "-B", "-c", "from scripts.collect_report_cleanup_health import _worker_main; raise SystemExit(_worker_main())"],
            cwd=str(ROOT), env=environment, stdin=subprocess.DEVNULL,
            capture_output=True, timeout=COLLECTION_TIMEOUT, check=False,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        if worker.returncode not in (0, 1) or worker.stderr:
            raise ValueError()
        result = _checked_output(worker.stdout, clock)
        if worker.returncode != (0 if result["status"] == "healthy" else 1):
            raise ValueError()
        return result
    except subprocess.TimeoutExpired:
        return _failure("collection_timeout", clock)
    except Exception:
        return _failure("worker_failure", clock)


def _emit(result: dict[str, Any], stdout: TextIO) -> int:
    try:
        print(json.dumps(result, separators=(",", ":")), file=stdout, flush=True)
    except (OSError, ValueError):
        return 1
    return 0 if result["status"] == "healthy" else 1


def _worker_main() -> int:
    return _emit(collect(transport=_https_request), sys.stdout)


def main(argv: list[str] | None = None, *, stdout: TextIO | None = None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    result = _failure("invalid_arguments", _now) if argv else _isolated_collect()
    return _emit(result, sys.stdout if stdout is None else stdout)


if __name__ == "__main__":
    raise SystemExit(main())
