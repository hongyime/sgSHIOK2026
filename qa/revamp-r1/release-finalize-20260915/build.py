"""Build a finalized candidate once, with bounded ownership and output identities."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time

ROOT = Path(r"C:\sgSHIOK2026")
assert Path.cwd() == ROOT
sys.path.insert(0, str(ROOT / "scripts"))
from release_process import run_owned_command
from release_staging import verify_release_stage

BASE = ROOT / "qa/revamp-r1/release-finalize-20260915"
STAGE = ROOT / "tmp/core-release-20260915-candidate-2"
os.environ["TEMP"] = os.environ["TMP"] = str(ROOT / "tmp")


def write(out, name, value):
    with (out / name).open("x", encoding="utf8", newline="\n") as file:
        if isinstance(value, str):
            file.write(value)
        else:
            json.dump(value, file, indent=2)
            file.write("\n")


if len(sys.argv) == 2:
    stage_receipt = Path(sys.argv[1])
    assert stage_receipt.is_absolute() and stage_receipt.parent.parent == BASE
    receipt = json.loads(stage_receipt.read_text())
    assert receipt["passed"] is True and receipt["stage"] == str(STAGE)
    assert not (STAGE / "web/.next").exists() and not (STAGE / "web/node_modules").exists()
    out = Path(tempfile.mkdtemp(prefix="build-", dir=BASE))
    command = [str(ROOT / ".venv/Scripts/python.exe"), "-B", str(Path(__file__)), "worker", str(out), str(stage_receipt)]
    env = {k: v for k, v in os.environ.items() if k.upper() in
           {"PATH", "SYSTEMROOT", "WINDIR", "SYSTEMDRIVE", "COMSPEC", "PATHEXT", "TEMP", "TMP", "COMPUTERNAME"}}
    write(out, "invocation.json", {"command": command, "timeoutSeconds": 2100,
        "stageReceiptSha256": hashlib.sha256(stage_receipt.read_bytes()).hexdigest(), "pipelineRuns": 0, "deployments": 0})
    print(json.dumps({"out": str(out), "started": True}), flush=True)
    started = time.monotonic()
    result = run_owned_command(command, ROOT, timeout=2100, env=env)
    result["elapsedSeconds"] = round(time.monotonic() - started, 3)
    write(out, "stdout.txt", result["stdout"])
    write(out, "stderr.txt", result["stderr"])
    write(out, "execution.json", result)
    print(json.dumps(result, indent=2))
    sys.exit(0 if result["ok"] else 1)

assert len(sys.argv) == 4 and sys.argv[1] == "worker"
OUT, stage_receipt = Path(sys.argv[2]), Path(sys.argv[3])
assert OUT.parent == BASE and stage_receipt.parent.parent == BASE
receipt = json.loads(stage_receipt.read_text())
assert receipt["passed"] is True and receipt["stage"] == str(STAGE)
web = STAGE / "web"
env = {k: os.environ[k] for k in ("PATH", "SYSTEMROOT", "WINDIR", "SYSTEMDRIVE", "COMSPEC", "PATHEXT") if k in os.environ}
temp = OUT / "compiler-tmp"
temp.mkdir(exist_ok=False)
env.update(TEMP=str(temp), TMP=str(temp), NEXT_TELEMETRY_DISABLED="1", NODE_OPTIONS="--max-old-space-size=2048",
    SHIOK_DATA_BUNDLE="generated_20260805_prefer_scored_routed",
    NEXT_PUBLIC_DATA_BASE="/data/generated_20260805_prefer_scored_routed/",
    NEXT_PUBLIC_LAMP_OVERLAY_BASE="/data/lamp_posts_v1/",
    SHIOK_REPORTS_ENABLED="false", SHIOK_MODERATION_ENABLED="false")
command = [r"C:\Program Files\nodejs\node.exe", str(web / "scripts/build-next-release.mjs"), "build"]
result = {"root": str(ROOT), "stage": str(STAGE), "sourceRevision": receipt["sourceRevision"],
    "stageReceipt": str(stage_receipt), "stageReceiptSha256": hashlib.sha256(stage_receipt.read_bytes()).hexdigest(),
    "releaseManifestSha256": receipt["releaseManifestSha256"], "command": command,
    "environment": {k: v for k, v in env.items() if k not in {"PATH", "SYSTEMROOT", "WINDIR", "SYSTEMDRIVE", "COMSPEC", "PATHEXT"}},
    "compilerTimeoutSeconds": 600, "outerTimeoutSeconds": 2100, "pipelineRuns": 0,
    "deployments": 0, "installs": 0, "phases": [], "passed": False}
started = time.monotonic()


def phase(name, function):
    begin = time.monotonic()
    print(json.dumps({"phase": name, "started": True}), flush=True)
    value = function()
    result["phases"].append({"name": name, "seconds": round(time.monotonic() - begin, 3)})
    print(json.dumps(result["phases"][-1]), flush=True)
    return value


def verify():
    return verify_release_stage(ROOT, STAGE, expected_manifest_sha256=receipt["releaseManifestSha256"])


try:
    assert not (web / "node_modules").exists() and not (web / ".next").exists()
    subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command",
        "New-Item -ItemType Junction -Path '" + str(web / "node_modules") +
        "' -Target 'C:\\sgSHIOK2026\\web\\node_modules' | Out-Null"],
        cwd=ROOT, env=env, check=True, timeout=15, creationflags=subprocess.CREATE_NO_WINDOW)
    result["before"] = phase("verify-before-build", verify)
    result["build"] = phase("webpack", lambda: run_owned_command(command, web, timeout=600, env=env))
    write(OUT, "compiler.stdout.txt", result["build"]["stdout"])
    write(OUT, "compiler.stderr.txt", result["build"]["stderr"])
    result["after"] = phase("verify-after-build", verify)
    if result["build"]["ok"]:
        result["buildId"] = (web / ".next/BUILD_ID").read_text().strip()
        inventory = []
        for path in sorted((web / ".next").rglob("*")):
            if path.is_file():
                digest = hashlib.sha256()
                with path.open("rb") as file:
                    while chunk := file.read(1048576):
                        digest.update(chunk)
                inventory.append({"path": path.relative_to(web).as_posix(), "bytes": path.stat().st_size,
                                  "sha256": digest.hexdigest()})
        write(OUT, "build-files.json", inventory)
        result["buildOutput"] = {"files": len(inventory), "bytes": sum(row["bytes"] for row in inventory),
            "manifestSha256": hashlib.sha256((OUT / "build-files.json").read_bytes()).hexdigest()}
        result["passed"] = True
except Exception as error:
    result.update(error=str(error), errorType=type(error).__name__)
finally:
    result["elapsedSeconds"] = round(time.monotonic() - started, 3)
    write(OUT, "build.json", result)
    print(json.dumps(result, indent=2), flush=True)
sys.exit(0 if result["passed"] else 1)
