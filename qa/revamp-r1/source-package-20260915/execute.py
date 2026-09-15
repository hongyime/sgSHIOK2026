"""Bound source-archive preparation; never build, upload, deploy or run a pipeline."""
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
import time

ROOT = Path(r"C:\sgSHIOK2026")
assert Path.cwd() == ROOT
sys.path.insert(0, str(ROOT))
from scripts.release_process import run_owned_command

BASE = ROOT / "qa/revamp-r1/source-package-20260915"
mode = sys.argv[1]
assert (len(sys.argv) == 2 and mode in {"tests", "plan", "pilot", "verify"}) or sys.argv[1:] == ["full", "--go"]
out = Path(tempfile.mkdtemp(prefix=mode + "-", dir=BASE))
sources = ["scripts/release_source_archive.py", "tests/test_release_source_archive.py"]
before = {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in sources}
command = [str(ROOT / ".venv/Scripts/python.exe"), "-B", "-m"]
if mode == "tests":
    command += ["pytest", sources[1], "--noconftest", "-p", "no:cacheprovider", "-o", "addopts=", "-vv",
                "--basetemp", str(out / "fixtures")]
    timeout = 180
elif mode == "verify":
    command += ["scripts.release_source_archive", "verify", "--receipt", str(ROOT / "tmp/full-6bs50g8b/source-archive.json"),
                "--receipt-sha256", "9f5c14acb3ca204cd2f5682366b7442710cc3eb22e9e0dc4968889bcb48861be",
                "--max-input-bytes", "5637400092", "--max-output-bytes", "6000000000", "--timeout-seconds", "240"]
    timeout = 270
else:
    command += ["scripts.release_source_archive", "plan" if mode == "plan" else "pack",
                "--frontend-build", str(ROOT / "qa/revamp-r1/release-finalize-20260915/frontend-brzm8xg4/build.json"),
                "--frontend-sha256", "d4b98d8d7400a82671e79bcb4802f4cf231170d29d74fd36a36a9b39da842f14",
                "--data-ledger", str(ROOT / "tmp/core-release-20260915-candidate-2/release-manifest.json"),
                "--data-sha256", "5ae6803bc224e2f1e408481001c7088ed896fd05f28aa73145b2fa0c9408e471",
                "--timeout-seconds", "1800" if mode == "full" else "300" if mode == "pilot" else "60"]
    timeout = 1830 if mode == "full" else 330 if mode == "pilot" else 90
    if mode == "pilot":
        command += ["--pilot-bytes", "134217728", "--max-input-bytes", "134217728",
                    "--max-output-bytes", "201326592", "--output", str(ROOT / "tmp" / out.name)]
    if mode == "full":
        pilot = json.loads((BASE / "pilot-or54tjpo/execution.json").read_bytes())
        assert pilot["passed"] and pilot["before"][sources[0]] == before[sources[0]]
        assert pilot["result"]["receiptSha256"] == "0ee201af074ecf1a77e7a02aa0548e9e52006b1ca179293621f555e85892e25c"
        command += ["--max-input-bytes", "5637400092", "--max-output-bytes", "6000000000",
                    "--output", str(ROOT / "tmp" / out.name)]
env = {key: value for key, value in os.environ.items() if key.upper() in
       {"PATH", "SYSTEMROOT", "WINDIR", "SYSTEMDRIVE", "COMSPEC", "PATHEXT"}}
env.update(TEMP=str(ROOT / "tmp"), TMP=str(ROOT / "tmp"), PYTHONDONTWRITEBYTECODE="1",
           PYTEST_DISABLE_PLUGIN_AUTOLOAD="1", PYTEST_ADDOPTS="")
started = time.monotonic()
result = run_owned_command(command, ROOT, timeout=timeout, env=env)
after = {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in sources}
record = {"mode": mode, "command": command, "before": before, "after": after, "execution": result,
          "elapsedSeconds": time.monotonic() - started, "pipelineRuns": 0, "deployments": 0,
          "passed": result["ok"] and before == after}
if record["passed"] and mode != "tests":
    record["result"] = json.loads(result["stdout"])
    if mode in {"pilot", "full"}:
        receipt = Path(record["result"]["receipt"]).read_bytes()
        assert hashlib.sha256(receipt).hexdigest() == record["result"]["receiptSha256"]
        with (out / "source-archive.json").open("xb") as file:
            file.write(receipt)
with (out / "execution.json").open("x", encoding="utf8", newline="\n") as file:
    json.dump(record, file, indent=2)
    file.write("\n")
print(json.dumps({"out": str(out), **record}, indent=2))
raise SystemExit(0 if record["passed"] else 1)
