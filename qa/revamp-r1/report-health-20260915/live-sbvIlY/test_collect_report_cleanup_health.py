"""No live requests: collector, HTTPS and subprocess boundaries are all faked."""

import io
import json
import re
import subprocess
import unittest
from datetime import timedelta
from unittest.mock import MagicMock, patch

from scripts import collect_report_cleanup_health as collector
from tests.test_report_cleanup_health import NOW, healthy_snapshot, snapshot


TOKEN = "TEST_PAT_DO_NOT_EMIT"
SENTINEL = "PRIVATE_PROVIDER_SENTINEL"


def response(data: object, status: int = 200) -> collector.Response:
    return collector.Response(status, json.dumps(data).encode("utf-8"))


def responses(*, initial: bool = False) -> list[collector.Response]:
    data = snapshot() if initial else healthy_snapshot()
    del data["observed_at"]
    return [
        response({
            "id": "ztjilsfgoephcdcsgcks", "name": "sgshiok",
            "organization_id": "ixonsqiqglwriirutigr", "region": "ap-southeast-1",
            "status": "ACTIVE_HEALTHY", "arbitrary_provider_field": SENTINEL,
        }),
        response({"id": "ixonsqiqglwriirutigr", "plan": "free", "billing_email": SENTINEL}),
        response([{"snapshot": data}], 201),
    ]


class FakeTransport:
    def __init__(self, results: list):
        self.results = list(results)
        self.calls = []

    def __call__(self, method, path, token, body):
        self.calls.append((method, path, token, body))
        if not self.results:
            raise AssertionError("Request budget exceeded")
        result = self.results.pop(0)
        if isinstance(result, Exception):
            raise result
        return result


class CollectorTests(unittest.TestCase):
    def setUp(self):
        self.network = patch.object(collector.http.client, "HTTPSConnection", side_effect=AssertionError("No live network"))
        self.network.start()
        self.addCleanup(self.network.stop)

    def collect(self, results=None, *, environ=None):
        transport = FakeTransport(responses() if results is None else results)
        result = collector.collect(
            transport=transport, environ={collector.TOKEN_ENV: TOKEN} if environ is None else environ,
            clock=lambda: NOW,
        )
        self.assertEqual(set(result), collector.OUTPUT_KEYS)
        self.assertEqual(result["target"], collector.EXPECTED_PIN)
        serialized = json.dumps(result)
        for secret in (TOKEN, SENTINEL, "statement_timeout", "return_message", "billing_email"):
            self.assertNotIn(secret, serialized)
        self.assertLessEqual(len(transport.calls), 3)
        return result, transport

    def test_exact_pin_free_then_one_read_only_query_and_no_raw_output(self):
        result, transport = self.collect()
        self.assertEqual(result["status"], "healthy")
        self.assertFalse(result["cleanup_admission_ready"])
        self.assertEqual(result["observed_at"], NOW.isoformat())
        self.assertEqual(result["database_now"], NOW.isoformat())
        self.assertEqual([(m, p) for m, p, _, _ in transport.calls], [
            ("GET", "/v1/projects/ztjilsfgoephcdcsgcks"),
            ("GET", "/v1/organizations/ixonsqiqglwriirutigr"),
            ("POST", "/v1/projects/ztjilsfgoephcdcsgcks/database/query"),
        ])
        for _, _, token, body in transport.calls[:2]:
            self.assertEqual(token, TOKEN)
            self.assertIsNone(body)
        body = json.loads(transport.calls[2][3])
        self.assertEqual(body, {"query": collector.DIAGNOSTIC_SQL, "read_only": True})
        self.assertNotIn(TOKEN, json.dumps(body))

    def test_sql_contains_only_explicit_health_projection_and_bounded_scheduler_rows(self):
        sql = collector.DIAGNOSTIC_SQL
        self.assertEqual(set(re.findall(r"\b(?:FROM|JOIN)\s+([a-z_.]+)", sql, re.I)), {
            "shiok_reports.control", "pg_extension", "cron.job", "cron.job_run_details", "diagnostic",
        })
        self.assertIn("AS MATERIALIZED", sql)
        self.assertIn("WHERE jobid = 1 OR jobname = 'shiok-report-cleanup-v1'", sql)
        self.assertIn("FROM cron.job_run_details WHERE jobid = 1", sql)
        self.assertIn("ORDER BY runid DESC LIMIT 32", sql)
        self.assertIn("ORDER BY jobid LIMIT 33", sql)
        self.assertNotRegex(sql.lower(), r"\b(insert|update|delete|alter|create|drop|call|count)\b")
        for prohibited in ("return_message", "job_pid", "to_jsonb", "select *", "cleanup_expired_v1(",
                           "canonical_content", "reports_deleted", "interval", "policy_approved_at"):
            self.assertNotIn(prohibited, sql.lower())

    def test_redacted_activation_remains_unobserved_not_healthy(self):
        result, _ = self.collect(responses(initial=True))
        self.assertEqual(result["status"], "unobserved")
        self.assertFalse(result["natural_run_observed"])
        self.assertFalse(result["intake_enabled"])

    def test_missing_or_invalid_token_never_requests(self):
        for token in (None, "", "a\nb", "a b", "x" * 4097, 123, "\u2603"):
            with self.subTest(token_type=type(token)):
                result, transport = self.collect(environ={collector.TOKEN_ENV: token})
                self.assertEqual(result["reason"], "token_unavailable")
                self.assertEqual(transport.calls, [])
        result, transport = self.collect(environ={"SUPABASE_ACCESS_TOKEN": TOKEN})
        self.assertEqual(result["reason"], "token_unavailable")
        self.assertEqual(transport.calls, [])

    def test_pin_missing_malformed_oversized_or_changed_stops_before_network(self):
        bad_pins = [b"{}", b"PRIVATE_PROVIDER_SENTINEL", b"x" * (collector.MAX_PIN_BYTES + 1)]
        for key in collector.EXPECTED_PIN:
            changed = dict(collector.EXPECTED_PIN)
            changed[key] = SENTINEL
            bad_pins.append(json.dumps(changed).encode())
        changed = {**collector.EXPECTED_PIN, "arbitrary": SENTINEL}
        bad_pins.append(json.dumps(changed).encode())
        duplicate = json.dumps(collector.EXPECTED_PIN).replace('"plan": "free"', '"plan": "free", "plan": "free"')
        bad_pins.append(duplicate.encode())
        for raw in bad_pins:
            with patch.object(type(collector.PIN_PATH), "open", return_value=io.BytesIO(raw)) as opened:
                result, transport = self.collect()
                self.assertEqual(result["reason"], "pin_mismatch")
                self.assertEqual(transport.calls, [])
                opened.assert_called_once_with("rb")
        with patch.object(type(collector.PIN_PATH), "open", side_effect=OSError(SENTINEL)):
            result, transport = self.collect()
            self.assertEqual(result["reason"], "pin_mismatch")
            self.assertEqual(transport.calls, [])

    def test_each_project_identity_field_is_required_and_exact(self):
        for key in ("id", "name", "organization_id", "region", "status"):
            for missing in (False, True):
                items = responses()
                project = json.loads(items[0].body)
                if missing:
                    del project[key]
                else:
                    project[key] = SENTINEL
                items[0] = response(project)
                result, transport = self.collect(items)
                self.assertEqual(result["reason"], "identity_mismatch")
                self.assertEqual(len(transport.calls), 1)

    def test_organization_identity_and_free_plan_required_before_query(self):
        for organization, reason in (
            ({"id": "other", "plan": "free"}, "identity_mismatch"),
            ({"plan": "free"}, "identity_mismatch"),
            ([], "identity_mismatch"),
            ({"id": "ixonsqiqglwriirutigr"}, "plan_not_free"),
            ({"id": "ixonsqiqglwriirutigr", "plan": "pro"}, "plan_not_free"),
            ({"id": "ixonsqiqglwriirutigr", "plan": "Free"}, "plan_not_free"),
            ({"id": "ixonsqiqglwriirutigr", "plan": True}, "plan_not_free"),
        ):
            items = responses()
            items[1] = response(organization)
            result, transport = self.collect(items)
            self.assertEqual(result["reason"], reason)
            self.assertEqual(len(transport.calls), 2)

    def test_all_http_failures_and_redirects_stop_without_retry(self):
        for index in range(3):
            wrong_success = 200 if index == 2 else 201
            for status in (wrong_success, 204, 301, 302, 303, 307, 308, 400, 401, 403, 404, 429, 500, 503):
                with self.subTest(index=index, status=status):
                    items = responses()
                    items[index] = collector.Response(status, (TOKEN + SENTINEL).encode())
                    result, transport = self.collect(items)
                    self.assertEqual(result["status"], "invalid")
                    self.assertEqual(result["reason"], "redirect_refused" if 300 <= status < 400 else "http_error")
                    self.assertEqual(len(transport.calls), index + 1)

    def test_transport_and_timeout_errors_are_sanitized_at_every_stage(self):
        for index in range(3):
            for error, reason in (
                (TimeoutError(TOKEN + SENTINEL), "request_timeout"),
                (OSError(TOKEN + SENTINEL), "transport_error"),
                (RuntimeError(TOKEN + SENTINEL), "transport_error"),
            ):
                items = responses()
                items[index] = error
                result, transport = self.collect(items)
                self.assertEqual(result["reason"], reason)
                self.assertEqual(len(transport.calls), index + 1)

    def test_oversized_malformed_duplicate_and_nonfinite_provider_data(self):
        for index in range(3):
            for raw, reason in (
                (b"x" * (collector.MAX_RESPONSE_BYTES + 1), "response_too_large"),
                ((TOKEN + SENTINEL).encode(), "invalid_response"),
                (b'{"id":"a","id":"a"}', "invalid_response"),
                (b'{"value":NaN}', "invalid_response"),
                (b'{"value":Infinity}', "invalid_response"),
                (b"[" * 2000 + b"]" * 2000, "invalid_response"),
                (b"\xff", "invalid_response"),
            ):
                items = responses()
                items[index] = collector.Response(201 if index == 2 else 200, raw)
                result, transport = self.collect(items)
                self.assertEqual(result["reason"], reason)
                self.assertEqual(len(transport.calls), index + 1)

    def test_query_requires_exact_single_row_envelope(self):
        for rows in (None, [], {}, [{}, {}], [{}], [{"snapshot": None}], [{"snapshot": {}, "secret": SENTINEL}]):
            items = responses()
            items[2] = response(rows, 201)
            result, _ = self.collect(items)
            self.assertEqual(result["reason"], "invalid_response")

    def test_arbitrary_query_fields_cannot_reach_output(self):
        for path in ((), ("control",), ("scheduler",), ("scheduler", "jobs", 0), ("scheduler", "recent_runs", 0)):
            items = responses()
            rows = json.loads(items[2].body)
            target = rows[0]["snapshot"]
            for key in path:
                target = target[key]
            target["secret"] = SENTINEL + TOKEN
            items[2] = response(rows, 201)
            result, _ = self.collect(items)
            self.assertEqual(result["status"], "invalid")
            self.assertIsNone(result["database_now"])

    def test_future_stale_missing_or_arbitrary_database_timestamp_fails_closed(self):
        for stamp in (None, SENTINEL, (NOW + timedelta(seconds=1)).isoformat(),
                      (NOW - timedelta(minutes=6)).isoformat()):
            items = responses()
            rows = json.loads(items[2].body)
            rows[0]["snapshot"]["database_now"] = stamp
            items[2] = response(rows, 201)
            result, _ = self.collect(items)
            self.assertEqual(result["status"], "invalid")
            self.assertIsNone(result["database_now"])

    def test_failure_latch_inactive_scheduler_and_forged_commands_never_healthy(self):
        for path, value in (
            (("control", "cleanup_failed_at"), "2026-09-15T02:40:00Z"),
            (("scheduler", "jobs", 0, "active"), False),
            (("scheduler", "jobs", 0, "command"), SENTINEL + TOKEN),
            (("scheduler", "recent_runs", 0, "status"), "failed"),
        ):
            items = responses()
            rows = json.loads(items[2].body)
            target = rows[0]["snapshot"]
            for key in path[:-1]:
                target = target[key]
            target[path[-1]] = value
            items[2] = response(rows, 201)
            result, _ = self.collect(items)
            self.assertEqual(result["status"], "blocked")
            self.assertFalse(result["cleanup_admission_ready"])


class HttpsBoundaryTests(unittest.TestCase):
    def request(self, *, status=200, body=b"{}", headers=None):
        headers = {} if headers is None else headers
        remote = MagicMock()
        remote.status = status
        remote.getheader.side_effect = lambda name, default=None: headers.get(name, default)
        remote.read.return_value = body
        connection = MagicMock()
        connection.getresponse.return_value = remote
        return remote, connection

    def test_https_is_fixed_host_no_redirect_handler_and_bounded_read(self):
        remote, connection = self.request(headers={"Content-Length": "2"})
        with patch.object(collector.http.client, "HTTPSConnection", return_value=connection) as factory:
            result = collector._https_request("GET", collector.PROJECT_PATH, TOKEN, None)
        factory.assert_called_once_with("api.supabase.com", timeout=8)
        remote.read.assert_called_once_with(collector.MAX_RESPONSE_BYTES + 1)
        connection.close.assert_called_once()
        args, kwargs = connection.request.call_args
        self.assertEqual(args, ("GET", collector.PROJECT_PATH))
        self.assertEqual(kwargs["headers"]["Authorization"], "Bearer " + TOKEN)
        self.assertEqual(kwargs["headers"]["Accept-Encoding"], "identity")
        self.assertEqual(result.body, b"{}")
        self.assertNotIn(TOKEN, repr(result))

    def test_error_redirect_or_oversized_headers_do_not_read_body(self):
        for status, headers, reason in (
            (302, {"Location": "https://other.invalid/" + SENTINEL}, "redirect_refused"),
            (500, {}, "http_error"),
            (200, {"Content-Length": str(collector.MAX_RESPONSE_BYTES + 1)}, "response_too_large"),
            (200, {"Content-Length": "-1"}, "invalid_response"),
            (200, {"Content-Length": SENTINEL}, "invalid_response"),
            (200, {"Content-Encoding": "gzip"}, "invalid_response"),
        ):
            remote, connection = self.request(status=status, headers=headers)
            with patch.object(collector.http.client, "HTTPSConnection", return_value=connection):
                with self.assertRaises(collector._CollectionError) as caught:
                    collector._https_request("GET", collector.PROJECT_PATH, TOKEN, None)
            self.assertEqual(str(caught.exception), reason)
            remote.read.assert_not_called()
            connection.request.assert_called_once()
            connection.close.assert_called_once()

    def test_query_post_requires_201_and_identity_get_requires_200(self):
        for method, path, status, accepted in (
            ("GET", collector.PROJECT_PATH, 200, True),
            ("GET", collector.ORGANIZATION_PATH, 200, True),
            ("POST", collector.QUERY_PATH, 201, True),
            ("GET", collector.PROJECT_PATH, 201, False),
            ("GET", collector.ORGANIZATION_PATH, 201, False),
            ("POST", collector.QUERY_PATH, 200, False),
        ):
            with self.subTest(method=method, status=status):
                remote, connection = self.request(status=status)
                body = collector.QUERY_BODY if method == "POST" else None
                with patch.object(collector.http.client, "HTTPSConnection", return_value=connection):
                    if accepted:
                        self.assertEqual(collector._https_request(method, path, TOKEN, body).status, status)
                        remote.read.assert_called_once_with(collector.MAX_RESPONSE_BYTES + 1)
                    else:
                        with self.assertRaises(collector._CollectionError) as caught:
                            collector._https_request(method, path, TOKEN, body)
                        self.assertEqual(str(caught.exception), "http_error")
                        remote.read.assert_not_called()
                connection.close.assert_called_once()

    def test_unapproved_method_or_endpoint_never_connects(self):
        for method, path in (
            ("POST", collector.PROJECT_PATH), ("GET", collector.QUERY_PATH),
            ("GET", "/v1/projects/other"), ("POST", collector.PROJECT_PATH + "/database/migrations"),
        ):
            with patch.object(collector.http.client, "HTTPSConnection") as factory:
                with self.assertRaises(collector._CollectionError):
                    collector._https_request(method, path, TOKEN, None)
                factory.assert_not_called()

    def test_stream_oversize_length_mismatch_or_failure_always_closes(self):
        for body, headers, reason in (
            (b"x" * (collector.MAX_RESPONSE_BYTES + 1), {}, "response_too_large"),
            (b"{}", {"Content-Length": "3"}, "invalid_response"),
        ):
            remote, connection = self.request(body=body, headers=headers)
            with patch.object(collector.http.client, "HTTPSConnection", return_value=connection):
                with self.assertRaises(collector._CollectionError) as caught:
                    collector._https_request("GET", collector.PROJECT_PATH, TOKEN, None)
            self.assertEqual(str(caught.exception), reason)
            connection.close.assert_called_once()


class CliBoundaryTests(unittest.TestCase):
    def good_output(self):
        return collector.collect(transport=FakeTransport(responses()), environ={collector.TOKEN_ENV: TOKEN}, clock=lambda: NOW)

    def test_worker_gets_only_explicit_pat_and_minimal_env_not_cli_credentials(self):
        output = self.good_output()
        worker = subprocess.CompletedProcess([], 0, json.dumps(output).encode(), b"")
        environment = {collector.TOKEN_ENV: TOKEN, "OTHER_SECRET": SENTINEL, "HTTPS_PROXY": SENTINEL, "PYTHONPATH": SENTINEL}
        with patch.dict(collector.os.environ, environment, clear=True), patch.object(collector.subprocess, "run", return_value=worker) as run:
            self.assertEqual(collector._isolated_collect(clock=lambda: NOW), output)
        args, kwargs = run.call_args
        self.assertNotIn(TOKEN, " ".join(args[0]))
        self.assertIn("-B", args[0])
        self.assertEqual(kwargs["cwd"], str(collector.ROOT))
        self.assertEqual(kwargs["timeout"], 30)
        self.assertEqual(kwargs["stdin"], subprocess.DEVNULL)
        self.assertEqual(kwargs["env"][collector.TOKEN_ENV], TOKEN)
        self.assertEqual(kwargs["env"]["PYTHONDONTWRITEBYTECODE"], "1")
        for key in ("OTHER_SECRET", "HTTPS_PROXY", "PYTHONPATH"):
            self.assertNotIn(key, kwargs["env"])
        run.assert_called_once()

    def test_hard_timeout_and_worker_exceptions_never_leak_or_retry(self):
        for error, reason in (
            (subprocess.TimeoutExpired([TOKEN], 30, output=SENTINEL.encode(), stderr=TOKEN.encode()), "collection_timeout"),
            (OSError(TOKEN + SENTINEL), "worker_failure"),
        ):
            with patch.object(collector.subprocess, "run", side_effect=error) as run:
                result = collector._isolated_collect(clock=lambda: NOW)
            self.assertEqual(result["reason"], reason)
            self.assertNotIn(TOKEN, json.dumps(result))
            self.assertNotIn(SENTINEL, json.dumps(result))
            run.assert_called_once()

    def test_untrusted_worker_output_revalidated_before_cli_emit(self):
        good = self.good_output()
        bad_outputs = [
            b"x" * (collector.MAX_OUTPUT_BYTES + 1), (TOKEN + SENTINEL).encode(),
            json.dumps({**good, "raw_response": SENTINEL}).encode(),
            json.dumps({**good, "reason": SENTINEL}).encode(),
            json.dumps({**good, "observed_at": SENTINEL}).encode(),
            json.dumps({**good, "target": SENTINEL}).encode(),
            json.dumps({**good, "cleanup_admission_ready": True}).encode(),
        ]
        for raw in bad_outputs:
            worker = subprocess.CompletedProcess([], 0, raw, b"")
            with patch.object(collector.subprocess, "run", return_value=worker):
                result = collector._isolated_collect(clock=lambda: NOW)
            self.assertEqual(result["reason"], "worker_failure")
            self.assertNotIn(TOKEN, json.dumps(result))
            self.assertNotIn(SENTINEL, json.dumps(result))

    def test_worker_stderr_and_exit_mismatch_fail_closed(self):
        raw = json.dumps(self.good_output()).encode()
        for code, stderr in ((1, b""), (2, b""), (0, SENTINEL.encode())):
            with patch.object(collector.subprocess, "run", return_value=subprocess.CompletedProcess([], code, raw, stderr)):
                result = collector._isolated_collect(clock=lambda: NOW)
            self.assertEqual(result["reason"], "worker_failure")
            self.assertNotIn(SENTINEL, json.dumps(result))

    def test_cli_stdout_only_allowlisted_result_and_no_arbitrary_arguments(self):
        for args in ([TOKEN], ["--worker"], ["--project", SENTINEL]):
            output = io.StringIO()
            with patch.object(collector, "_isolated_collect") as isolated:
                self.assertEqual(collector.main(args, stdout=output), 1)
                isolated.assert_not_called()
            self.assertEqual(json.loads(output.getvalue())["reason"], "invalid_arguments")
            self.assertNotIn(TOKEN, output.getvalue())
            self.assertNotIn(SENTINEL, output.getvalue())
        output = io.StringIO()
        with patch.object(collector, "_isolated_collect", return_value=self.good_output()):
            self.assertEqual(collector.main([], stdout=output), 0)
        self.assertEqual(len(output.getvalue().splitlines()), 1)
        self.assertEqual(set(json.loads(output.getvalue())), collector.OUTPUT_KEYS)


if __name__ == "__main__":
    unittest.main()
