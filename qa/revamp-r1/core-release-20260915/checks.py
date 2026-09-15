"""Capture bounded source-bound checks; never invokes a data preparation command."""
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

BASE = ROOT / "qa/revamp-r1/core-release-20260915"
mode = sys.argv[1]
out = Path(tempfile.mkdtemp(prefix=mode + "-", dir=BASE))
node = r"C:\Program Files\nodejs\node.exe"
commands = {
    "full": [node, "web/scripts/test-without-production-data.mjs", "--reporter=dot", "--testTimeout=15000"],
    "staging": [str(ROOT / ".venv/Scripts/python.exe"), "-B", "-m", "pytest", "tests/test_release_staging.py",
                "--noconftest", "-p", "no:cacheprovider", "-o", "addopts=", "-vv", "--durations=5",
                "--basetemp", str(out / "fixtures")],
    "focused": [node, "web/scripts/test-web.mjs", "lib/__tests__/frontend-retention.test.ts",
                "lib/__tests__/data-cache-recovery.test.ts", "lib/__tests__/data-failure-diagnostics.test.ts",
                "--reporter=json", "--outputFile=" + str(out / "vitest.json")],
    "types": [node, "web/node_modules/typescript/bin/tsc", "--project", "web/tsconfig.json", "--noEmit", "--incremental", "false"],
    "docs": [str(ROOT / ".venv/Scripts/python.exe"), "-B", "-m", "pytest", "tests/test_readme.py",
             "tests/test_agent_docs.py", "tests/test_repo_integrity.py", "-q", "-p", "no:cacheprovider"],
}
command = commands[mode]
if len(sys.argv) == 3:
    assert mode == "staging"
    command += ["-k", sys.argv[2]]
paths = ["scripts/release_staging.py", "tests/test_release_staging.py", "web/scripts/build-next-release.mjs",
         "web/lib/__tests__/frontend-retention.test.ts", "web/lib/data.ts"]
def identities():
    return {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in paths}
before = identities()
env = dict(os.environ, TEMP=str(ROOT / "tmp"), TMP=str(ROOT / "tmp"), PYTHONDONTWRITEBYTECODE="1")
if mode == "staging":
    env.update(PYTEST_DISABLE_PLUGIN_AUTOLOAD="1", PYTEST_ADDOPTS="")
started = time.monotonic()
result = run_owned_command(command, ROOT, timeout=900 if mode == "full" else 360 if mode == "staging" else 240, env=env)
for stream in ("stdout", "stderr"):
    (out / (stream + ".txt")).write_text(result[stream], encoding="utf8", newline="\n")
receipt = {"mode": mode, "command": command, "before": before, "after": identities(),
           "elapsedSeconds": round(time.monotonic() - started, 3), "execution": result,
           "pipelineRuns": 0, "deployments": 0}
receipt["passed"] = result["ok"] and before == receipt["after"]
with (out / "summary.json").open("x", encoding="utf8", newline="\n") as stream:
    json.dump(receipt, stream, indent=2); stream.write("\n")
print(json.dumps({"out": str(out), **receipt}, indent=2))
sys.exit(0 if receipt["passed"] else 1)
