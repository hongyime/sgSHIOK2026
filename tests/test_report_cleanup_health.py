"""Offline tests; fixtures never include report content or cron return_message."""

import copy
import io
import json
import subprocess
import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

from scripts import report_cleanup_health as health


NOW = datetime(2026, 9, 15, 2, 54, tzinfo=timezone.utc)
OUTPUT_KEYS = {
    "schema_version", "status", "cleanup", "scheduler", "intake_enabled",
    "natural_run_observed", "cleanup_admission_ready", "reason",
}


def snapshot() -> dict:
    # Redacted production job from scheduler-inspect-vcoMJ5, with active=true
    # and control timestamps from scheduler-activate-DGKfpe/summary.json.
    return {
        "schema_version": 1,
        "observed_at": NOW.isoformat(),
        "database_now": NOW.isoformat(),
        "control": {
            "enabled": False,
            "cleanup_verified_at": "2026-09-15T10:53:29.975663+08:00",
            "cleanup_failed_at": None,
        },
        "scheduler": {
            "cron_timezone": "GMT",
            "cron_background_workers": "off",
            "cron_database": "postgres",
            "cron_log_run": "on",
            "pg_cron_version": "1.6.4",
            "jobs": [{
                "jobid": 1,
                "active": True,
                "command": "SET statement_timeout = '30s'; SELECT shiok_reports.cleanup_expired_v1();",
                "jobname": "shiok-report-cleanup-v1",
                "database": "postgres",
                "nodename": "localhost",
                "nodeport": 5432,
                "schedule": "17 17 * * *",
                "username": "postgres",
            }],
            "recent_runs": [],
        },
    }


def run() -> dict:
    # Exact allowlisted projection of the actual normal QA run from
    # scheduler-acceptance-3Uos6d/summary.json. This is NOT a production run.
    return {
        "jobid": 2, "runid": 1, "database": "postgres", "username": "postgres",
        "status": "succeeded", "start_time": "2026-09-15 02:39:36.874302+00",
        "end_time": "2026-09-15 02:39:36.880181+00",
    }


def healthy_snapshot() -> dict:
    data = snapshot()
    synthetic_run = run()
    synthetic_run["jobid"] = 1  # Synthetic adaptation, not a natural-run receipt.
    data["scheduler"]["recent_runs"] = [synthetic_run]
    data["control"]["cleanup_verified_at"] = "2026-09-15T10:39:36.876308+08:00"
    return data


class ReportCleanupHealthTests(unittest.TestCase):
    def evaluate(self, data: object) -> dict:
        result = health.evaluate(data, now=NOW)
        self.assertEqual(set(result), OUTPUT_KEYS)
        self.assertEqual(result["schema_version"], 1)
        for key, allowed in {
            "status": {"healthy", "blocked", "unobserved", "invalid"},
            "cleanup": {"unknown", "fresh", "failed", "unverified", "stale"},
            "scheduler": {
                "unknown", "healthy", "mismatch", "missing", "inactive", "unobserved",
                "failed", "stale", "pending", "cleanup_unconfirmed",
            },
            "reason": {None, "malformed_snapshot", "future_timestamp", "stale_snapshot"},
        }.items():
            self.assertIn(result[key], allowed)
        for key in ("intake_enabled", "natural_run_observed"):
            self.assertIn(type(result[key]), (bool, type(None)))
        self.assertIs(type(result["cleanup_admission_ready"]), bool)
        return result

    def assert_closed(self, data: object, *, reason: str | None = None) -> dict:
        result = self.evaluate(data)
        self.assertNotEqual(result["status"], "healthy")
        self.assertFalse(result["cleanup_admission_ready"])
        if reason is not None:
            self.assertEqual(result["reason"], reason)
        return result

    def test_actual_activation_is_fresh_but_first_natural_run_unobserved(self):
        self.assertEqual(self.evaluate(snapshot()), {
            "schema_version": 1, "status": "unobserved", "cleanup": "fresh",
            "scheduler": "unobserved", "intake_enabled": False,
            "natural_run_observed": False, "cleanup_admission_ready": False,
            "reason": None,
        })

    def test_healthy_monitoring_does_not_enable_intake(self):
        data = healthy_snapshot()
        original = copy.deepcopy(data)
        result = self.evaluate(data)
        self.assertEqual(result["status"], "healthy")
        self.assertTrue(result["natural_run_observed"])
        self.assertFalse(result["cleanup_admission_ready"])
        self.assertEqual(data, original)
        data["control"]["enabled"] = True
        self.assertTrue(self.evaluate(data)["cleanup_admission_ready"])

    def test_actual_qa_run_cannot_establish_production_health(self):
        data = healthy_snapshot()
        data["scheduler"]["recent_runs"] = [run()]
        result = self.assert_closed(data)
        self.assertEqual(result["scheduler"], "mismatch")
        self.assertIsNone(result["natural_run_observed"])

    def test_actual_ordinary_failure_shape_despite_cron_succeeded(self):
        data = snapshot()
        # Redacted actual ordinary_failure projection, adapted only to jobid=1.
        data["scheduler"]["recent_runs"] = [{
            "jobid": 1, "runid": 2, "database": "postgres", "username": "postgres",
            "status": "succeeded", "start_time": "2026-09-15 02:39:49.893559+00",
            "end_time": "2026-09-15 02:39:49.898345+00",
        }]
        data["control"]["cleanup_verified_at"] = None
        data["control"]["cleanup_failed_at"] = "2026-09-15T10:39:49.895353+08:00"
        self.assertEqual(self.assert_closed(data)["cleanup"], "failed")

    def test_latch_blocks_even_when_older_than_success(self):
        data = healthy_snapshot()
        for failed_at in ("2026-09-14T00:00:00Z", "2026-09-15T02:50:00Z"):
            with self.subTest(failed_at=failed_at):
                data["control"]["cleanup_failed_at"] = failed_at
                self.assertEqual(self.assert_closed(data)["cleanup"], "failed")

    def test_actual_timeout_shape_blocks_without_failure_latch(self):
        data = healthy_snapshot()
        data["scheduler"]["recent_runs"].append({
            "jobid": 1, "runid": 3, "database": "postgres", "username": "postgres",
            "status": "failed", "start_time": "2026-09-15 02:40:01.968428+00",
            "end_time": "2026-09-15 02:40:02.176233+00",
        })
        result = self.assert_closed(data)
        self.assertEqual(result["cleanup"], "fresh")
        self.assertEqual(result["scheduler"], "failed")

    def test_success_requires_cleanup_verification_inside_run(self):
        for verified in (None, "2026-09-15T02:30:00Z", "2026-09-15T02:50:00Z"):
            with self.subTest(verified=verified):
                data = healthy_snapshot()
                data["control"]["cleanup_verified_at"] = verified
                self.assertEqual(self.assert_closed(data)["scheduler"], "cleanup_unconfirmed")

    def test_inclusive_26_hour_success_gate(self):
        for delta, expected in ((timedelta(), "healthy"), (timedelta(microseconds=1), "blocked")):
            with self.subTest(delta=delta):
                data = healthy_snapshot()
                verified = NOW - timedelta(hours=26) - delta
                data["control"]["cleanup_verified_at"] = verified.isoformat()
                data["scheduler"]["recent_runs"][0].update({
                    "start_time": (verified - timedelta(seconds=1)).isoformat(),
                    "end_time": verified.isoformat(),
                })
                result = self.evaluate(data)
                self.assertEqual(result["status"], expected)
                self.assertEqual(result["cleanup"], "fresh" if expected == "healthy" else "stale")

    def test_stale_run_cannot_be_hidden_by_fresh_manual_cleanup(self):
        data = healthy_snapshot()
        old = NOW - timedelta(hours=27)
        data["scheduler"]["recent_runs"][0].update({
            "start_time": old.isoformat(), "end_time": old.isoformat(),
        })
        self.assertEqual(self.assert_closed(data)["scheduler"], "stale")

    def test_snapshot_age_and_database_age_boundaries(self):
        for field in ("observed_at", "database_now"):
            data = healthy_snapshot()
            data[field] = (NOW - timedelta(minutes=5, microseconds=1)).isoformat()
            if field == "observed_at":
                data["database_now"] = data[field]
            self.assert_closed(data, reason="stale_snapshot")
        data = healthy_snapshot()
        data["observed_at"] = data["database_now"] = (NOW - timedelta(minutes=5)).isoformat()
        self.assertEqual(self.evaluate(data)["status"], "healthy")

    def test_delayed_snapshot_does_not_extend_cleanup_gate(self):
        data = healthy_snapshot()
        db_now = NOW - timedelta(minutes=4)
        verified = db_now - timedelta(hours=26)
        data["observed_at"] = data["database_now"] = db_now.isoformat()
        data["control"]["cleanup_verified_at"] = verified.isoformat()
        data["scheduler"]["recent_runs"][0].update({
            "start_time": verified.isoformat(), "end_time": verified.isoformat(),
        })
        self.assertEqual(self.assert_closed(data)["cleanup"], "stale")

    def test_future_observation_and_database_events_fail_closed(self):
        paths = [
            ("observed_at",),
            ("control", "cleanup_verified_at"), ("control", "cleanup_failed_at"),
            ("scheduler", "recent_runs", 0, "start_time"),
            ("scheduler", "recent_runs", 0, "end_time"),
        ]
        for path in paths:
            with self.subTest(path=path):
                data = healthy_snapshot()
                target = data
                for key in path[:-1]:
                    target = target[key]
                target[path[-1]] = (NOW + timedelta(microseconds=1)).isoformat()
                self.assert_closed(data, reason="future_timestamp")

    def test_actual_9ms_database_clock_lead_is_not_a_future_event(self):
        # Exact clock-A4cKDh receipt: local millisecond clock trails DB by 9.873ms.
        local = datetime.fromisoformat("2026-09-15T04:28:33.978+00:00")
        data = snapshot()
        data["observed_at"] = local.isoformat()
        data["database_now"] = "2026-09-15 04:28:33.987873+00"
        result = health.evaluate(data, now=local)
        self.assertEqual(result["status"], "unobserved")
        self.assertEqual(result["cleanup"], "fresh")
        self.assertIsNone(result["reason"])

    def test_database_clock_lead_is_bounded_against_observation_and_now(self):
        for skew, expected in ((timedelta(seconds=5), "healthy"),
                               (timedelta(seconds=5, microseconds=1), "invalid")):
            data = healthy_snapshot()
            data["database_now"] = (NOW + skew).isoformat()
            result = self.evaluate(data)
            self.assertEqual(result["status"], expected)
            if expected == "invalid":
                self.assertEqual(result["reason"], "future_timestamp")
        data = healthy_snapshot()
        data["observed_at"] = (NOW - timedelta(seconds=4)).isoformat()
        data["database_now"] = (NOW + timedelta(seconds=2)).isoformat()
        self.assert_closed(data, reason="future_timestamp")
        data["observed_at"] = (NOW + timedelta(microseconds=1)).isoformat()
        self.assert_closed(data, reason="future_timestamp")

    def test_5_second_database_lead_never_extends_26_hour_gate(self):
        for overdue in (timedelta(), timedelta(milliseconds=1)):
            data = healthy_snapshot()
            database_now = NOW + timedelta(seconds=5)
            verified = database_now - timedelta(hours=26) - overdue
            data["database_now"] = database_now.isoformat()
            data["control"].update(enabled=True, cleanup_verified_at=verified.isoformat())
            data["scheduler"]["recent_runs"][0].update(
                start_time=(verified - timedelta(seconds=1)).isoformat(), end_time=verified.isoformat(),
            )
            result = self.evaluate(data)
            self.assertEqual(result["status"], "blocked" if overdue else "healthy")
            self.assertEqual(result["cleanup"], "stale" if overdue else "fresh")
            self.assertEqual(result["scheduler"], "stale" if overdue else "healthy")
            self.assertEqual(result["cleanup_admission_ready"], not bool(overdue))

    def test_database_events_stay_strict_even_when_database_leads_local_clock(self):
        data = healthy_snapshot()
        database_now = NOW + timedelta(seconds=5)
        data["database_now"] = database_now.isoformat()
        data["control"]["cleanup_verified_at"] = database_now.isoformat()
        data["scheduler"]["recent_runs"][0].update(
            start_time=database_now.isoformat(), end_time=database_now.isoformat(),
        )
        self.assertEqual(self.evaluate(data)["status"], "healthy")
        for path in (("control", "cleanup_verified_at"), ("control", "cleanup_failed_at"),
                     ("scheduler", "recent_runs", 0, "start_time"),
                     ("scheduler", "recent_runs", 0, "end_time")):
            changed = copy.deepcopy(data)
            target = changed
            for key in path[:-1]:
                target = target[key]
            target[path[-1]] = (database_now + timedelta(microseconds=1)).isoformat()
            self.assert_closed(changed, reason="future_timestamp")

    def test_control_future_relative_to_database_not_just_local_clock(self):
        data = healthy_snapshot()
        data["database_now"] = (NOW - timedelta(seconds=1)).isoformat()
        data["control"]["cleanup_failed_at"] = NOW.isoformat()
        self.assert_closed(data, reason="future_timestamp")

    def test_every_expected_job_field_is_checked(self):
        changes = {
            "jobid": 2, "jobname": "other", "schedule": "17 1 * * *",
            "command": "SELECT shiok_reports.cleanup_expired_v1();",
            "database": "other", "username": "service_role", "nodename": "other",
            "nodeport": 5433, "active": False,
        }
        for key, value in changes.items():
            with self.subTest(key=key):
                data = healthy_snapshot()
                data["scheduler"]["jobs"][0][key] = value
                result = self.assert_closed(data)
                self.assertEqual(result["scheduler"], "inactive" if key == "active" else "mismatch")

    def test_every_scheduler_setting_is_checked(self):
        for key in health.EXPECTED_SETTINGS:
            with self.subTest(key=key):
                data = healthy_snapshot()
                data["scheduler"][key] = "unexpected"
                self.assertEqual(self.assert_closed(data)["scheduler"], "mismatch")

    def test_missing_duplicate_jobs_and_wrong_run_identity(self):
        data = healthy_snapshot()
        data["scheduler"]["jobs"] = []
        self.assertEqual(self.assert_closed(data)["scheduler"], "missing")
        data = healthy_snapshot()
        data["scheduler"]["jobs"] *= 2
        self.assertEqual(self.assert_closed(data)["scheduler"], "mismatch")
        for key, value in (("jobid", 2), ("database", "other"), ("username", "other")):
            data = healthy_snapshot()
            data["scheduler"]["recent_runs"][0][key] = value
            self.assertEqual(self.assert_closed(data)["scheduler"], "mismatch")

    def test_pending_run_never_grants_health_or_claims_first_completion(self):
        for status in health.PENDING_STATUSES:
            data = healthy_snapshot()
            data["scheduler"]["recent_runs"][0].update(status=status, end_time=None)
            result = self.assert_closed(data)
            self.assertEqual(result["scheduler"], "pending")
            self.assertFalse(result["natural_run_observed"])

    def test_first_unobserved_does_not_hide_stale_or_failed_cleanup(self):
        data = snapshot()
        data["control"]["cleanup_verified_at"] = "2026-09-10T00:00:00Z"
        self.assertEqual(self.assert_closed(data)["status"], "blocked")
        data["control"]["cleanup_failed_at"] = NOW.isoformat()
        self.assertEqual(self.assert_closed(data)["cleanup"], "failed")

    def test_latest_run_controls_health_regardless_of_input_order(self):
        data = healthy_snapshot()
        old = copy.deepcopy(data["scheduler"]["recent_runs"][0])
        old.update(status="failed", start_time="2026-09-14T00:00:00Z", end_time="2026-09-14T00:00:01Z")
        data["scheduler"]["recent_runs"][0]["runid"] = 2
        data["scheduler"]["recent_runs"].append(old)
        self.assertEqual(self.evaluate(data)["status"], "healthy")
        data["control"]["cleanup_failed_at"] = old["start_time"]
        self.assertEqual(self.assert_closed(data)["cleanup"], "failed")

    def test_malformed_run_status_timing_ids_and_list(self):
        for changes in (
            {"status": "unknown"}, {"status": []}, {"end_time": None},
            {"status": "running"}, {"end_time": "2026-09-15T02:00:00Z"},
            {"runid": True}, {"jobid": 1.0}, {"runid": 0}, {"runid": 2**63},
            {"start_time": None},
        ):
            with self.subTest(changes=changes):
                data = healthy_snapshot()
                data["scheduler"]["recent_runs"][0].update(changes)
                self.assert_closed(data, reason="malformed_snapshot")
        for runs in (None, {}, [run()] * 33, [run(), run()]):
            data = healthy_snapshot()
            data["scheduler"]["recent_runs"] = runs
            self.assert_closed(data, reason="malformed_snapshot")

    def test_overlapping_runs_or_incomplete_predecessor_are_invalid(self):
        for pending in (False, True):
            data = healthy_snapshot()
            first = data["scheduler"]["recent_runs"][0]
            second = {**first, "runid": 2}
            if pending:
                first.update(status="running", end_time=None)
            data["scheduler"]["recent_runs"].append(second)
            self.assert_closed(data, reason="malformed_snapshot")

    def test_required_keys_and_unknown_fields_at_every_level(self):
        for path in ((), ("control",), ("scheduler",), ("scheduler", "jobs", 0), ("scheduler", "recent_runs", 0)):
            original = healthy_snapshot()
            target = original
            for key in path:
                target = target[key]
            for missing in target:
                data = copy.deepcopy(original)
                selected = data
                for key in path:
                    selected = selected[key]
                del selected[missing]
                self.assert_closed(data, reason="malformed_snapshot")
            target["return_message"] = "PRIVATE_SENTINEL"
            result = self.assert_closed(original, reason="malformed_snapshot")
            self.assertNotIn("PRIVATE_SENTINEL", json.dumps(result))

    def test_timestamp_grammar_and_invalid_dates(self):
        for value in (None, 123, True, "infinity", "2026-09-15", "2026-09-15T02:54:00",
                      "2026-09-15T02:54:00+00:99", "2026-09-31T02:54:00Z",
                      "2026-09-15X02:54:00Z", "2026-09-15T02:54:00.1234567Z",
                      "9999-12-31T23:59:59-23:00"):
            with self.subTest(value=value):
                data = healthy_snapshot()
                data["observed_at"] = value
                self.assert_closed(data, reason="malformed_snapshot")

    def test_strict_json_types(self):
        for value in (None, [], True, "PRIVATE_SENTINEL", 1):
            self.assert_closed(value, reason="malformed_snapshot")
        for path, value in (
            (("schema_version",), True), (("schema_version",), 1.0),
            (("schema_version",), 2), (("control", "enabled"), "false"),
            (("control", "enabled"), 0), (("scheduler", "jobs", 0, "jobid"), True),
            (("scheduler", "jobs", 0, "active"), 1),
            (("scheduler", "cron_log_run"), None), (("scheduler", "jobs"), None),
        ):
            data = healthy_snapshot()
            target = data
            for key in path[:-1]:
                target = target[key]
            target[path[-1]] = value
            self.assert_closed(data, reason="malformed_snapshot")

    def test_invalid_trusted_clock_is_closed(self):
        for now in (NOW.replace(tzinfo=None), "PRIVATE_SENTINEL", 0):
            self.assertEqual(health.evaluate(healthy_snapshot(), now=now)["status"], "invalid")

    def test_json_parser_rejects_ambiguous_and_oversized_input_without_echo(self):
        valid = json.dumps(healthy_snapshot())
        self.assertEqual(health.evaluate_json(valid, now=NOW)["status"], "healthy")
        for payload in (
            "", "PRIVATE_SENTINEL", "[]", "null", valid + valid,
            valid.replace('"enabled": false', '"enabled": true, "enabled": false'),
            valid.replace('"schema_version": 1', '"schema_version": 1, "schema_version": 1'),
            valid.replace('"schema_version": 1', '"schema_version": NaN'),
            valid.replace('"schema_version": 1', '"schema_version": Infinity'),
            "x" * (health.MAX_INPUT_BYTES + 1), "[" * 2000 + "]" * 2000,
            "\ud800", b"PRIVATE_SENTINEL",
        ):
            result = health.evaluate_json(payload, now=NOW)
            self.assertEqual(result["status"], "invalid")
            self.assertEqual(result["reason"], "malformed_snapshot")
            self.assertNotIn("PRIVATE_SENTINEL", json.dumps(result))
            self.assertEqual(set(result), OUTPUT_KEYS)

    def test_cli_is_machine_readable_and_has_fail_closed_exit_codes(self):
        for data, expected in ((healthy_snapshot(), 0), (snapshot(), 1), ({}, 1)):
            output = io.StringIO()
            real_evaluate = health.evaluate
            with patch.object(health, "evaluate", side_effect=lambda value, **_: real_evaluate(value, now=NOW)):
                code = health.main(stdin=io.StringIO(json.dumps(data)), stdout=output)
            self.assertEqual(code, expected)
            self.assertEqual(len(output.getvalue().splitlines()), 1)
            self.assertEqual(set(json.loads(output.getvalue())), OUTPUT_KEYS)

    def test_cli_read_failures_never_emit_raw_errors(self):
        for error in (OSError("PRIVATE_SENTINEL"), UnicodeError("PRIVATE_SENTINEL")):
            source = io.StringIO()
            output = io.StringIO()
            with patch.object(source, "read", side_effect=error) as read:
                self.assertEqual(health.main(stdin=source, stdout=output), 1)
                read.assert_called_once_with(health.MAX_INPUT_BYTES + 1)
            self.assertNotIn("PRIVATE_SENTINEL", output.getvalue())
            self.assertEqual(json.loads(output.getvalue())["reason"], "input_unavailable")

    def test_cli_output_failure_returns_nonzero_without_raw_errors(self):
        output = io.StringIO()
        for method in ("write", "flush"):
            with patch.object(output, method, side_effect=OSError("PRIVATE_SENTINEL")):
                self.assertEqual(health.main(stdin=io.StringIO("{}"), stdout=output), 1)

    def test_cli_subprocess_emits_only_json_and_does_not_echo_input(self):
        root = Path(__file__).resolve().parents[1]
        result = subprocess.run(
            [sys.executable, "-B", str(root / "scripts" / "report_cleanup_health.py")],
            cwd=str(root), input="PRIVATE_SENTINEL", text=True, capture_output=True,
            check=False, timeout=10,
        )
        self.assertEqual(result.returncode, 1)
        self.assertEqual(result.stderr, "")
        self.assertNotIn("PRIVATE_SENTINEL", result.stdout)
        self.assertEqual(json.loads(result.stdout), health.evaluate_json("{}"))


if __name__ == "__main__":
    unittest.main()
