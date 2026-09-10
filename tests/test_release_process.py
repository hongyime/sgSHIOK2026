"""Harmless command-tree fixtures; no CLI, build, payload or pipeline execution."""

import ctypes
from ctypes import wintypes
import json
import os
from pathlib import Path
import sys
import time
import subprocess

import pytest

from scripts import release_process


def exited(pid: int) -> bool:
    if os.name == "nt":
        kernel = ctypes.WinDLL("kernel32", use_last_error=True)
        kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
        kernel.OpenProcess.restype = wintypes.HANDLE
        kernel.WaitForSingleObject.argtypes = [wintypes.HANDLE, wintypes.DWORD]
        kernel.WaitForSingleObject.restype = wintypes.DWORD
        kernel.CloseHandle.argtypes = [wintypes.HANDLE]
        handle = kernel.OpenProcess(0x100000, False, pid)
        if not handle:
            return True
        try:
            return kernel.WaitForSingleObject(handle, 0) == 0
        finally:
            kernel.CloseHandle(handle)
    try:
        os.kill(pid, 0)
        return False
    except ProcessLookupError:
        return True


def test_owned_command_retains_exit_and_output(tmp_path):
    result = release_process.run_owned_command(
        [sys.executable, "-B", "-c", "import sys; print('fixture stdout'); print('fixture stderr', file=sys.stderr); sys.exit(3)"],
        tmp_path, timeout=20, env=dict(os.environ),
    )
    assert not result["ok"] and result["returncode"] == 3
    assert result["stdout"] == "fixture stdout" and result["stderr"] == "fixture stderr"


def timeout_tree(tmp_path, monkeypatch):
    marker = tmp_path / "owned.json"
    child_code = "import time; time.sleep(60)"
    code = (
        "import json, os, pathlib, subprocess, sys, time; "
        f"child = subprocess.Popen([sys.executable, '-B', '-c', {child_code!r}]); "
        f"pathlib.Path({str(marker)!r}).write_text(json.dumps([os.getpid(), child.pid])); "
        "time.sleep(60)"
    )
    original = subprocess.Popen.communicate
    ready_at = None
    def after_started(process, input=None, timeout=None):
        nonlocal ready_at
        if input is not None:
            process.stdin.write(input)
            process.stdin.flush()
            deadline = time.monotonic() + 45
            while True:
                try:
                    pids = json.loads(marker.read_text())
                    if isinstance(pids, list) and len(pids) == 2:
                        break
                except (OSError, ValueError):
                    pass
                if process.poll() is not None or time.monotonic() >= deadline:
                    raise AssertionError("fixture command did not record its child before the startup deadline")
                time.sleep(0.05)
            # Exercise a real timeout with a confirmed live child, not a startup-speed assertion.
            ready_at = time.monotonic()
            return original(process, timeout=0.05)
        return original(process, input=input, timeout=timeout)
    monkeypatch.setattr(subprocess.Popen, "communicate", after_started)
    result = release_process.run_owned_command(
        [sys.executable, "-B", "-c", code], tmp_path, timeout=10, env=dict(os.environ),
    )
    pids = json.loads(marker.read_text())
    while not all(exited(pid) for pid in pids) and time.monotonic() - ready_at < 15:
        time.sleep(0.02)
    elapsed = time.monotonic() - ready_at
    print(f"owned_cleanup_seconds={elapsed:.6f} cleanup_complete={result.get('cleanup_complete')}")
    assert elapsed < 15, "cleanup waited for natural child exit instead of terminating the owned job"
    return result, pids


@pytest.mark.skipif(os.name != "nt", reason="Windows job-object lifecycle fixture")
def test_timeout_stops_owned_parent_and_child_with_inherited_pipes(tmp_path, monkeypatch):
    result, pids = timeout_tree(tmp_path, monkeypatch)
    assert result["error"] == "command_timeout" and result["cleanup_complete"] is True
    assert all(exited(pid) for pid in pids)


@pytest.mark.skipif(os.name != "nt", reason="Windows job-object lifecycle fixture")
def test_termination_failure_reports_uncertainty_without_blocking_pipe_close(tmp_path, monkeypatch):
    def reject(self):
        raise OSError("injected termination failure")
    monkeypatch.setattr(release_process._WindowsJob, "stop", reject)
    result, pids = timeout_tree(tmp_path, monkeypatch)
    assert result["error"] == "command_timeout" and result["cleanup_complete"] is False
    assert all(exited(pid) for pid in pids)


@pytest.mark.skipif(os.name != "nt", reason="Windows job-object lifecycle fixture")
def test_normal_exit_also_closes_owned_redirected_children(tmp_path):
    marker = tmp_path / "child.json"
    code = (
        "import json, pathlib, subprocess, sys; "
        "child = subprocess.Popen([sys.executable, '-B', '-c', 'import time; time.sleep(60)'], "
        "stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); "
        f"pathlib.Path({str(marker)!r}).write_text(json.dumps(child.pid))"
    )
    result = release_process.run_owned_command([sys.executable, "-B", "-c", code], tmp_path, timeout=45, env=dict(os.environ))
    assert result["ok"], result
    child = json.loads(marker.read_text())
    deadline = time.monotonic() + 2
    while not exited(child) and time.monotonic() < deadline:
        time.sleep(0.02)
    assert exited(child)


def test_ownership_failure_cannot_start_command(tmp_path, monkeypatch):
    if os.name != "nt":
        pytest.skip("Windows job assignment contract")
    marker = tmp_path / "must-not-exist.txt"
    def reject(self, process):
        raise OSError("injected assignment failure")
    monkeypatch.setattr(release_process._WindowsJob, "assign", reject)
    with pytest.raises(OSError, match="assignment failure"):
        release_process.run_owned_command(
            [sys.executable, "-B", "-c", f"from pathlib import Path; Path({str(marker)!r}).write_text('bad')"],
            tmp_path, timeout=10, env=dict(os.environ),
        )
    assert not marker.exists()
