"""Bound the staging/finalization and owned-process fixture suites."""
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
import time

ROOT = Path(r"C:\sgSHIOK2026")
assert Path.cwd() == ROOT
sys.path.insert(0, str(ROOT / "scripts"))
from release_process import run_owned_command

BASE = ROOT / "qa/revamp-r1/release-finalize-20260915"
out = Path(tempfile.mkdtemp(prefix="checks-", dir=BASE))
paths = ["scripts/release_staging.py", "scripts/release_process.py", "tests/test_release_staging.py", "tests/test_release_process.py"]
def identities():
    return {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in paths}
before = identities()
command = [str(ROOT / ".venv/Scripts/python.exe"), "-B", "-m", "pytest", *paths[2:],
           "--noconftest", "-p", "no:cacheprovider", "-o", "addopts=", "-vv", "--durations=8", "--basetemp", str(out / "fixtures")]
if len(sys.argv) == 2:
    command += ["-k", sys.argv[1]]
env = dict(os.environ, TEMP=str(ROOT / "tmp"), TMP=str(ROOT / "tmp"), PYTEST_DISABLE_PLUGIN_AUTOLOAD="1",
           PYTHONDONTWRITEBYTECODE="1", PYTEST_ADDOPTS="")
started = time.monotonic()
result = run_owned_command(command, ROOT, timeout=900, env=env)
for stream in ("stdout", "stderr"):
    with (out / (stream + ".txt")).open("x", encoding="utf8", newline="\n") as file:
        file.write(result[stream])
receipt = {"out": str(out), "command": command, "before": before, "after": identities(),
           "elapsedSeconds": round(time.monotonic() - started, 3), "execution": result, "pipelineRuns": 0}
receipt["passed"] = result["ok"] and receipt["before"] == receipt["after"]
with (out / "summary.json").open("x", encoding="utf8", newline="\n") as file:
    json.dump(receipt, file, indent=2); file.write("\n")
print(json.dumps(receipt, indent=2))
sys.exit(0 if receipt["passed"] else 1)
