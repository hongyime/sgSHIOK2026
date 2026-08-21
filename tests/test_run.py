import sys

import run


def test_run_docstring_uses_uv_managed_invocation():
    assert "Usage: uv run python run.py <task> [options]" in run.__doc__
    assert "Usage: python run.py <task> [options]" not in run.__doc__


def test_run_docstring_separates_safe_reports_from_gated_pipeline_tasks():
    assert "Safe reports:" in run.__doc__
    assert (
        "check --freshness-only | check --geospatial-discovery-only | p19-gap-status | readiness | batch-plan"
        in run.__doc__
    )
    assert "p19-gap-status reads cached P19 measurement status only; it calls no APIs and writes no files." in run.__doc__
    assert "Gated pipeline tasks:" in run.__doc__
    assert "ingest | network | score | score-batch | export | export-transit | validate | publish" in run.__doc__


def test_run_help_headline_does_not_flatten_all_tasks():
    help_text = run.build_parser().format_help()

    assert "usage: run.py [-h] task" in help_text
    assert "{batch-plan,bus-arrivals" not in help_text
    assert "Safe reports:" in help_text
    assert "p19-gap-status reads cached P19 measurement status only; it calls no APIs and writes no files." in help_text
    assert "Gated pipeline tasks:" in help_text


def test_run_task_sets_pythonhashseed_for_module_subprocess(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setenv("PYTHONHASHSEED", "random")
    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("test", ["tests/test_run.py"]) == 0

    assert calls == [
        {
            "cmd": [sys.executable, "-m", "pytest", "tests/test_run.py"],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_exposes_p19_gap_status_as_read_only_module(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("p19-gap-status", []) == 0

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "scripts.analysis.p19_universe_gap_measurement",
                "--cache-status-only",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_exposes_readiness_report_module(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("readiness", []) == 0

    assert calls == [
        {
            "cmd": [sys.executable, "-m", "scripts.production_readiness"],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]
