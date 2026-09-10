"""Bound a release command and its children; never terminate unrelated processes."""

from __future__ import annotations

import ctypes
from ctypes import wintypes
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
from typing import Any


class _WindowsJob:
    def __init__(self) -> None:
        class BasicLimits(ctypes.Structure):
            _fields_ = [
                ("process_time", ctypes.c_int64), ("job_time", ctypes.c_int64),
                ("flags", wintypes.DWORD), ("min_working_set", ctypes.c_size_t),
                ("max_working_set", ctypes.c_size_t), ("active_processes", wintypes.DWORD),
                ("affinity", ctypes.c_size_t), ("priority", wintypes.DWORD), ("scheduling", wintypes.DWORD),
            ]
        class ExtendedLimits(ctypes.Structure):
            _fields_ = [
                ("basic", BasicLimits), ("io_counters", ctypes.c_uint64 * 6),
                ("process_memory", ctypes.c_size_t), ("job_memory", ctypes.c_size_t),
                ("peak_process_memory", ctypes.c_size_t), ("peak_job_memory", ctypes.c_size_t),
            ]
        self.api = ctypes.WinDLL("kernel32", use_last_error=True)
        self.api.CreateJobObjectW.argtypes = [ctypes.c_void_p, wintypes.LPCWSTR]
        self.api.CreateJobObjectW.restype = wintypes.HANDLE
        self.api.SetInformationJobObject.argtypes = [wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p, wintypes.DWORD]
        self.api.SetInformationJobObject.restype = wintypes.BOOL
        self.api.AssignProcessToJobObject.argtypes = [wintypes.HANDLE, wintypes.HANDLE]
        self.api.AssignProcessToJobObject.restype = wintypes.BOOL
        self.api.TerminateJobObject.argtypes = [wintypes.HANDLE, wintypes.UINT]
        self.api.TerminateJobObject.restype = wintypes.BOOL
        self.api.CloseHandle.argtypes = [wintypes.HANDLE]
        self.api.CloseHandle.restype = wintypes.BOOL
        self.handle = self.api.CreateJobObjectW(None, None)
        if not self.handle:
            raise ctypes.WinError(ctypes.get_last_error())
        limits = ExtendedLimits()
        limits.basic.flags = 0x2000  # JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
        if not self.api.SetInformationJobObject(self.handle, 9, ctypes.byref(limits), ctypes.sizeof(limits)):
            error = ctypes.WinError(ctypes.get_last_error())
            self.close()
            raise error

    def assign(self, process: subprocess.Popen) -> None:
        if not self.api.AssignProcessToJobObject(self.handle, int(process._handle)):
            raise ctypes.WinError(ctypes.get_last_error())

    def stop(self) -> None:
        if not self.api.TerminateJobObject(self.handle, 1):
            raise ctypes.WinError(ctypes.get_last_error())

    def close(self) -> None:
        if self.handle:
            self.api.CloseHandle(self.handle)
            self.handle = None


# Wait for the parent to assign ownership before launching any command or child.
_BOOTSTRAP = """import json, os, subprocess, sys
command = json.loads(sys.stdin.readline())
result = subprocess.run(command, stdin=subprocess.DEVNULL,
    creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)
raise SystemExit(result.returncode)
"""


def run_owned_command(command: list[str], cwd: Path, *, timeout: float, env: dict[str, str]) -> dict[str, Any]:
    if not command or not all(isinstance(arg, str) for arg in command) or timeout <= 0 or not cwd.is_absolute():
        raise ValueError("absolute working directory, command and positive timeout required")
    job = _WindowsJob() if os.name == "nt" else None
    process = None
    drain_failed = False
    try:
        process = subprocess.Popen(
            [sys.executable, "-I", "-S", "-B", "-c", _BOOTSTRAP], cwd=cwd, env=env,
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, encoding="utf-8", errors="replace",
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
            start_new_session=os.name != "nt",
        )
        if job is not None:
            job.assign(process)
        try:
            stdout, stderr = process.communicate(json.dumps(command) + "\n", timeout=timeout)
            return {"ok": process.returncode == 0, "returncode": process.returncode,
                    "stdout": stdout.strip(), "stderr": stderr.strip()}
        except subprocess.TimeoutExpired:
            drain_failed = True
            try:
                if job is not None:
                    job.stop()
                else:
                    os.killpg(process.pid, signal.SIGKILL)
            except OSError:
                return {"ok": False, "returncode": None, "stdout": "", "stderr": "",
                        "error": "command_timeout", "cleanup_complete": False}
            try:
                process.communicate(timeout=5)
            except subprocess.TimeoutExpired:
                return {"ok": False, "returncode": None, "stdout": "", "stderr": "",
                        "error": "command_timeout", "cleanup_complete": False}
            drain_failed = False
            return {"ok": False, "returncode": process.returncode, "stdout": "", "stderr": "",
                    "error": "command_timeout", "cleanup_complete": True}
    finally:
        if job is not None:
            job.close()
        if process is not None:
            # If assignment failed, this is still the blocked, owned bootstrap only.
            if process.poll() is None:
                process.kill()
                process.wait(timeout=5)
            for pipe in (process.stdin, process.stdout, process.stderr):
                # A Windows reader still draining must not turn close() into an unbounded join.
                if pipe is not None and not drain_failed:
                    pipe.close()
