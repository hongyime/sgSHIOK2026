"""Compile committed frontend alone; never copy, change, or relabel the data stage."""
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
import release_staging as staging
from release_process import run_owned_command

BASE = ROOT / "qa/revamp-r1/release-finalize-20260915"
DATA_STAGE = ROOT / "tmp/core-release-20260915-candidate-2"
PIN = "5ae6803bc224e2f1e408481001c7088ed896fd05f28aa73145b2fa0c9408e471"
os.environ["TEMP"] = os.environ["TMP"] = str(ROOT / "tmp")


def write(out, name, value):
    with (out / name).open("x", encoding="utf8", newline="\n") as file:
        if isinstance(value, str):
            file.write(value)
        else:
            json.dump(value, file, indent=2)
            file.write("\n")


if len(sys.argv) == 1:
    out = Path(tempfile.mkdtemp(prefix="frontend-", dir=BASE))
    command = [str(ROOT / ".venv/Scripts/python.exe"), "-B", str(Path(__file__)), "worker", str(out)]
    env = {k: v for k, v in os.environ.items() if k.upper() in
           {"PATH", "SYSTEMROOT", "WINDIR", "SYSTEMDRIVE", "COMSPEC", "PATHEXT", "TEMP", "TMP", "COMPUTERNAME"}}
    write(out, "invocation.json", {"command": command, "timeoutSeconds": 900,
        "driverSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), "pipelineRuns": 0, "dataCopies": 0})
    print(json.dumps({"out": str(out), "started": True}), flush=True)
    started = time.monotonic()
    result = run_owned_command(command, ROOT, timeout=900, env=env)
    result["elapsedSeconds"] = round(time.monotonic() - started, 3)
    for stream in ("stdout", "stderr"):
        write(out, stream + ".txt", result[stream])
    write(out, "execution.json", result)
    print(json.dumps(result, indent=2))
    sys.exit(0 if result["ok"] else 1)

assert len(sys.argv) == 3 and sys.argv[1] == "worker"
OUT = Path(sys.argv[2])
assert OUT.parent == BASE
old_bytes = (DATA_STAGE / "release-manifest.json").read_bytes()
assert hashlib.sha256(old_bytes).hexdigest() == PIN
old = json.loads(old_bytes)
revision = staging._revision(ROOT, "HEAD")
sources = staging._source_inventory(ROOT, revision)
blobs = staging._blobs(ROOT, sources)
stage = Path(tempfile.mkdtemp(prefix="frontend-release-20260915-", dir=ROOT / "tmp"))
web = stage / "web"
derived = {item["path"]: item for item in old["files"] if item["origin"] == "derived"}
files = []
for source in sources:
    path, content = source["path"], blobs[source["path"]]
    if path in derived:
        assert hashlib.sha256(content).hexdigest() == derived[path]["sourceSha256"], f"DERIVED_CONTROL_SOURCE_CHANGED {path}"
        continue
    files.append({"path": path, "origin": "git", **staging._write_new(stage / path, content)})
for path, entry in derived.items():
    content = (DATA_STAGE / path).read_bytes()
    staging._same(path, entry, {"bytes": len(content), "sha256": hashlib.sha256(content).hexdigest()})
    files.append({"path": path, "origin": "previous-verified-derived-control", **staging._write_new(stage / path, content)})
assert not (web / "public/data").exists()
env = {k: os.environ[k] for k in ("PATH", "SYSTEMROOT", "WINDIR", "SYSTEMDRIVE", "COMSPEC", "PATHEXT") if k in os.environ}
temp = OUT / "compiler-tmp"
temp.mkdir()
env.update(TEMP=str(temp), TMP=str(temp), NEXT_TELEMETRY_DISABLED="1", NODE_OPTIONS="--max-old-space-size=2048",
    SHIOK_REPORTS_ENABLED="false", SHIOK_MODERATION_ENABLED="false", SHIOK_DATA_BUNDLE="generated_20260805_prefer_scored_routed",
    NEXT_PUBLIC_DATA_BASE="/data/generated_20260805_prefer_scored_routed/", NEXT_PUBLIC_LAMP_OVERLAY_BASE="/data/lamp_posts_v1/")
subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command",
    "New-Item -ItemType Junction -Path '" + str(web / "node_modules") +
    "' -Target 'C:\\sgSHIOK2026\\web\\node_modules' | Out-Null"],
    cwd=ROOT, env=env, check=True, timeout=15, creationflags=subprocess.CREATE_NO_WINDOW)


def verify():
    assert staging._revision(ROOT, "HEAD") == revision
    staging._verify_stage_files(ROOT, stage, {item["path"]: item for item in files}, allow_generated=True)
    assert staging._revision(ROOT, "HEAD") == revision
    assert not (web / "public/data").exists()


command = [r"C:\Program Files\nodejs\node.exe", str(web / "scripts/build-next-release.mjs"), "build"]
result = {"scope": "frontend-only-not-deployable", "sourceRevision": revision, "root": str(ROOT),
    "stage": str(stage), "webRoot": str(web), "files": files, "sourceFiles": sources,
    "dataStage": str(DATA_STAGE), "dataStageManifestSha256": PIN, "dataCopied": False,
    "priorDataVerification": "qa/revamp-r1/release-finalize-20260915/build-imu26n88/build.json:after",
    "command": command, "compilerTimeoutSeconds": 600, "outerTimeoutSeconds": 900,
    "reporting": False, "moderation": False, "pipelineRuns": 0, "installs": 0, "deployments": 0, "passed": False}
started = time.monotonic()
try:
    verify()
    result["beforeVerified"] = True
    result["compiler"] = run_owned_command(command, web, timeout=600, env=env)
    for stream in ("stdout", "stderr"):
        write(OUT, "compiler." + stream + ".txt", result["compiler"][stream])
    verify()
    result["afterVerified"] = True
    if result["compiler"]["ok"]:
        result["buildId"] = (web / ".next/BUILD_ID").read_text().strip()
        inventory = []
        for path in sorted((web / ".next").rglob("*")):
            if path.is_file():
                identity = staging._hash_file(path)
                inventory.append({"path": path.relative_to(web).as_posix(), **identity})
        write(OUT, "build-files.json", inventory)
        result["buildOutput"] = {"files": len(inventory), "bytes": sum(item["bytes"] for item in inventory),
            "manifestSha256": hashlib.sha256((OUT / "build-files.json").read_bytes()).hexdigest()}
        result["passed"] = True
except Exception as error:
    result.update(error=str(error), errorType=type(error).__name__)
finally:
    result["elapsedSeconds"] = round(time.monotonic() - started, 3)
    write(OUT, "build.json", result)
    print(json.dumps({key: value for key, value in result.items() if key not in {"files", "sourceFiles"}}, indent=2), flush=True)
sys.exit(0 if result["passed"] else 1)
