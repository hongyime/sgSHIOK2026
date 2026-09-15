"""One supervised fresh stage from committed HEAD; preserve the failed first attempt."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(r"C:\sgSHIOK2026")
assert Path.cwd() == ROOT
sys.path.insert(0, str(ROOT / "scripts"))
from release_staging import prepare_release_stage
from release_process import run_owned_command

BASE = ROOT / "qa/revamp-r1/core-release-20260915"
OUT = BASE / "attempt-2"
STAGE = ROOT / "tmp/core-release-20260915-candidate-2"
os.environ["TEMP"] = os.environ["TMP"] = str(ROOT / "tmp")

def write(name, value):
    with (OUT / name).open("x", encoding="utf8", newline="\n") as stream:
        if isinstance(value, str):
            stream.write(value)
        else:
            json.dump(value, stream, indent=2); stream.write("\n")

if len(sys.argv) == 1:
    assert not OUT.exists() and not STAGE.exists()
    OUT.mkdir()
    head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    command = [str(ROOT / ".venv/Scripts/python.exe"), "-B", str(Path(__file__)), "worker", head]
    env = {k: v for k, v in os.environ.items() if k.upper() in
           {"PATH", "SYSTEMROOT", "WINDIR", "SYSTEMDRIVE", "COMSPEC", "PATHEXT", "TEMP", "TMP", "COMPUTERNAME"}}
    write("invocation.json", {"sourceRevision": head, "command": command, "timeoutSeconds": 1200,
                               "pipelineRuns": 0, "deployments": 0, "installs": 0})
    result = run_owned_command(command, ROOT, timeout=1200, env=env)
    write("stdout.txt", result["stdout"])
    write("stderr.txt", result["stderr"])
    write("execution.json", result)
    print(json.dumps(result, indent=2))
    sys.exit(0 if result["ok"] else 1)

assert len(sys.argv) == 3 and sys.argv[1] == "worker"
head = sys.argv[2]
assert subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip() == head
assert not STAGE.exists()
anchors = json.loads((ROOT / "qa/revamp-r1/report-operations-20260915/database-checkpoint.json").read_text())
def protect():
    for anchor in anchors["protectedAnchors"]:
        data = (ROOT / anchor["path"]).read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        assert len(data) == anchor["bytes"] and digest == anchor["sha256"], f"INPUT_HASH_MISMATCH {anchor['path']} {digest}"
    digest = hashlib.sha256((ROOT / "pipeline/config/weights.yaml").read_bytes()).hexdigest()
    assert digest == anchors["weights"], f"INPUT_HASH_MISMATCH weights {digest}"

result = {"root": str(ROOT), "host": os.environ.get("COMPUTERNAME"), "sourceRevision": head,
          "stage": str(STAGE), "previousFrontends": [], "retainedClientAcceptance": False,
          "pipelineRuns": 0, "builds": 0, "deployments": 0, "passed": False}
started = time.monotonic()
try:
    protect()
    prepared = prepare_release_stage(ROOT, ROOT / "web/public/data/generated_20260805_prefer_scored_routed",
        stage_dir=STAGE, overlay_dir=ROOT / "web/public/data/lamp_posts_v1", revision=head, previous_frontends=[])
    result.update(releaseManifestSha256=prepared["releaseManifestSha256"], sourceFiles=len(prepared["sourceFiles"]),
        stagedFiles=len(prepared["files"]), artifacts=[{"directory": item["directory"], "role": item["role"],
        "inputFiles": len(item["inputs"]), "inputBytes": sum(row["bytes"] for row in item["inputs"]),
        "stagedFiles": sum(row["stagedPath"] is not None for row in item["inputs"]),
        "stagedBytes": sum(row["bytes"] for row in item["inputs"] if row["stagedPath"] is not None)} for item in prepared["artifacts"]])
    protect()
    result["passed"] = True
except Exception as error:
    result.update(error=str(error), errorType=type(error).__name__)
finally:
    result["elapsedSeconds"] = round(time.monotonic() - started, 3)
    write("stage.json", result)
    print(json.dumps(result, indent=2), flush=True)
sys.exit(0 if result["passed"] else 1)
