"""Prepare an immutable current-source candidate; no build, install or pipeline."""
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
from release_staging import prepare_release_stage, ReleaseStagingError

OUT = ROOT / "qa/revamp-r1/core-release-20260915"
STAGE = ROOT / "tmp/core-release-20260915-candidate-1"
assert not STAGE.exists(), "Preserve every earlier candidate"
os.environ["TEMP"] = os.environ["TMP"] = str(ROOT / "tmp")
started = time.monotonic()
anchors = json.loads((ROOT / "qa/revamp-r1/report-operations-20260915/database-checkpoint.json").read_text())
def protect():
    for anchor in anchors["protectedAnchors"]:
        data = (ROOT / anchor["path"]).read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        assert len(data) == anchor["bytes"] and digest == anchor["sha256"], f"INPUT_HASH_MISMATCH {anchor['path']} {digest}"
    assert hashlib.sha256((ROOT / "pipeline/config/weights.yaml").read_bytes()).hexdigest() == anchors["weights"]

result = {"root": str(ROOT), "host": os.environ.get("COMPUTERNAME"), "sourceRevision": "f66d08676ba24f165a9f54d5ea7c4bbbf8ec3d9d",
          "stage": str(STAGE), "previousFrontends": [], "retainedClientAcceptance": False,
          "builds": 0, "installs": 0, "deployments": 0, "pipelineRuns": 0, "passed": False}
try:
    protect()
    actual = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    assert actual == result["sourceRevision"], "HEAD changed before staging"
    prepared = prepare_release_stage(ROOT, ROOT / "web/public/data/generated_20260805_prefer_scored_routed",
        stage_dir=STAGE, overlay_dir=ROOT / "web/public/data/lamp_posts_v1", revision=actual, previous_frontends=[])
    result.update(releaseManifestSha256=prepared["releaseManifestSha256"], sourceFiles=len(prepared["sourceFiles"]),
        stagedFiles=len(prepared["files"]), artifacts=[{"directory": item["directory"], "role": item["role"],
        "inputFiles": len(item["inputs"]), "inputBytes": sum(row["bytes"] for row in item["inputs"]),
        "stagedFiles": sum(row["stagedPath"] is not None for row in item["inputs"]),
        "stagedBytes": sum(row["bytes"] for row in item["inputs"] if row["stagedPath"] is not None)} for item in prepared["artifacts"]])
    protect()
    result["passed"] = True
except (ReleaseStagingError, AssertionError, OSError) as error:
    result["error"] = str(error)
    result["errorType"] = type(error).__name__
    raise
finally:
    result["elapsedSeconds"] = round(time.monotonic() - started, 3)
    with (OUT / "stage.json").open("x", encoding="utf8", newline="\n") as stream:
        json.dump(result, stream, indent=2); stream.write("\n")
    print(json.dumps(result, indent=2), flush=True)
