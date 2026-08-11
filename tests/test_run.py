import sys

import run


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
