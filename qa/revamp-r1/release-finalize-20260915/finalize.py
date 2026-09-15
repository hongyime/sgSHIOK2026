"""Verify candidate 2 without recopying; preserve every earlier failed receipt."""
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
STAGE = ROOT / "tmp/core-release-20260915-candidate-2"
SOURCE = "4f0234b126c6af228339ea8df0c5c18e4cc06a49"
os.environ["TEMP"] = os.environ["TMP"] = str(ROOT / "tmp")


def write(out, name, value):
    with (out / name).open("x", encoding="utf8", newline="\n") as stream:
        if isinstance(value, str):
            stream.write(value)
        else:
            json.dump(value, stream, indent=2)
            stream.write("\n")


def head():
    return subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True, timeout=20).strip()


if len(sys.argv) == 1:
    assert STAGE.is_dir() and not (STAGE / "release-manifest.json").exists()
    out = Path(tempfile.mkdtemp(prefix="actual-", dir=BASE))
    command = [str(ROOT / ".venv/Scripts/python.exe"), "-B", str(Path(__file__)), "worker", str(out), head()]
    env = {k: v for k, v in os.environ.items() if k.upper() in
           {"PATH", "SYSTEMROOT", "WINDIR", "SYSTEMDRIVE", "COMSPEC", "PATHEXT", "TEMP", "TMP", "COMPUTERNAME"}}
    write(out, "invocation.json", {"sourceRevision": SOURCE, "command": command, "timeoutSeconds": 1200,
                                   "pipelineRuns": 0, "copies": 0, "deployments": 0, "installs": 0})
    started = time.monotonic()
    print(json.dumps({"out": str(out), "started": True}), flush=True)
    result = run_owned_command(command, ROOT, timeout=1200, env=env)
    result["elapsedSeconds"] = round(time.monotonic() - started, 3)
    write(out, "stdout.txt", result["stdout"])
    write(out, "stderr.txt", result["stderr"])
    write(out, "execution.json", result)
    print(json.dumps(result, indent=2))
    sys.exit(0 if result["ok"] else 1)

assert len(sys.argv) == 4 and sys.argv[1] == "worker"
OUT = Path(sys.argv[2])
assert OUT.parent == BASE and OUT.is_dir() and head() == sys.argv[3]
anchors = json.loads((ROOT / "qa/revamp-r1/report-operations-20260915/database-checkpoint.json").read_text())


def protect():
    results = []
    for anchor in anchors["protectedAnchors"]:
        content = (ROOT / anchor["path"]).read_bytes()
        digest = hashlib.sha256(content).hexdigest()
        assert len(content) == anchor["bytes"] and digest == anchor["sha256"], f"INPUT_HASH_MISMATCH {anchor['path']} {digest}"
        results.append(anchor)
    digest = hashlib.sha256((ROOT / "pipeline/config/weights.yaml").read_bytes()).hexdigest()
    assert digest == anchors["weights"], f"INPUT_HASH_MISMATCH weights {digest}"
    return {"anchors": results, "weights": digest}


phases = []


def timed(name, function):
    def run(*args, **kwargs):
        start = time.monotonic()
        print(json.dumps({"phase": name, "started": True}), flush=True)
        value = function(*args, **kwargs)
        item = {"phase": name, "seconds": round(time.monotonic() - start, 3)}
        phases.append(item)
        print(json.dumps(item), flush=True)
        return value
    return run


for name in ("_artifact", "_verify_inputs", "_verify_stage_files"):
    setattr(staging, name, timed(name, getattr(staging, name)))

result = {"root": str(ROOT), "host": os.environ.get("COMPUTERNAME"), "sourceRevision": SOURCE,
          "headAtStart": head(), "stage": str(STAGE), "previousFrontends": [], "retainedClientAcceptance": False,
          "pipelineRuns": 0, "copies": 0, "builds": 0, "deployments": 0, "passed": False}
started = time.monotonic()
try:
    result["protectedBefore"] = protect()
    prepared = staging.finalize_release_stage(ROOT, ROOT / "web/public/data/generated_20260805_prefer_scored_routed",
        stage_dir=STAGE, overlay_dir=ROOT / "web/public/data/lamp_posts_v1", revision=SOURCE, previous_frontends=[])
    external_hash = hashlib.sha256((STAGE / "release-manifest.json").read_bytes()).hexdigest()
    assert external_hash == prepared["releaseManifestSha256"]
    result.update(releaseManifestSha256=external_hash, sourceFiles=len(prepared["sourceFiles"]),
        stagedFiles=len(prepared["files"]), artifacts=[{"directory": item["directory"], "role": item["role"],
        "inputFiles": len(item["inputs"]), "inputBytes": sum(row["bytes"] for row in item["inputs"]),
        "stagedFiles": sum(row["stagedPath"] is not None for row in item["inputs"]),
        "stagedBytes": sum(row["bytes"] for row in item["inputs"] if row["stagedPath"] is not None)} for item in prepared["artifacts"]])
    result["protectedAfter"] = protect()
    assert head() == result["headAtStart"]
    result["passed"] = True
except Exception as error:
    result.update(error=str(error), errorType=type(error).__name__)
finally:
    result["elapsedSeconds"] = round(time.monotonic() - started, 3)
    result["phases"] = phases
    write(OUT, "stage.json", result)
    print(json.dumps(result, indent=2), flush=True)
sys.exit(0 if result["passed"] else 1)
