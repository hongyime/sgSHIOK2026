"""Capture terminal release receipts and frozen-anchor checks without changing inputs."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(r"C:\sgSHIOK2026")
assert Path.cwd() == ROOT
BASE = ROOT / "qa/revamp-r1/release-finalize-20260915"
os.environ["TEMP"] = os.environ["TMP"] = str(ROOT / "tmp")


def read(path):
    return json.loads(path.read_text(encoding="utf8"))


def identity(path):
    content = path.read_bytes()
    return {"bytes": len(content), "sha256": hashlib.sha256(content).hexdigest()}


assert len(sys.argv) == 2
output = BASE / sys.argv[1]
assert output.parent == BASE and output.suffix == ".json" and not output.exists()
execution = read(BASE / "actual-d0jk_tz3/execution.json")
anchors = read(ROOT / "qa/revamp-r1/report-operations-20260915/database-checkpoint.json")
protected = []
for anchor in anchors["protectedAnchors"]:
    actual = identity(ROOT / anchor["path"])
    assert actual == {"bytes": anchor["bytes"], "sha256": anchor["sha256"]}, f"INPUT_HASH_MISMATCH {anchor['path']} {actual}"
    protected.append({"path": anchor["path"], **actual})
weights = identity(ROOT / "pipeline/config/weights.yaml")["sha256"]
assert weights == anchors["weights"], f"INPUT_HASH_MISMATCH weights {weights}"
evidence = ROOT / "qa/verification/REVAMP-R1-core-walk.md"
old_prefix = evidence.read_bytes()[:552447]
assert len(old_prefix) == 552447 and hashlib.sha256(old_prefix).hexdigest() == "bf1b24ac0392f2d11a5d753bf587be967f834dc25a025dd9373aa1d2e4ddfb02"
result = {"root": str(ROOT), "host": os.environ.get("COMPUTERNAME"),
    "head": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True, timeout=20).strip(),
    "retentionDays": 30, "stageExecution": execution,
    "stage": read(BASE / "actual-d0jk_tz3/stage.json") if (BASE / "actual-d0jk_tz3/stage.json").exists() else None,
    "fullFixtureRun": {"path": "checks-2r5nzwut/summary.json", "tests": 102,
        "passed": read(BASE / "checks-2r5nzwut/summary.json")["passed"],
        "qualification": "Before regular-verifier late HEAD check; not a final full-suite invocation."},
    "finalBoundaryRun": {"path": "checks-j5kusl0y/summary.json", "tests": 5,
        "passed": read(BASE / "checks-j5kusl0y/summary.json")["passed"], "collected": 106,
        "arithmetic": "102 prior cases + 4 reviewer boundary cases = 106; final targeted run includes 1 repeated case."},
    "protectedAnchors": protected, "weights": weights,
    "evidencePrefix": {"bytes": 552447, "sha256": hashlib.sha256(old_prefix).hexdigest(), "preserved": True},
    "pipelineRuns": 0, "installs": 0, "deployments": 0,
    "FINDINGS": [
        "Implemented independent verify-only finalization rather than recopying the existing scratch payload. Missing, changed, linked or extra files fail without repair.",
        "Independent review caught a pre-existing late-HEAD gap in the regular verifier; it is fixed and regression-tested. Timeout stdout/stderr now survives confirmed owned-process cleanup.",
        "One added retained-asset test originally wrote to the wrong fixture path. That failed run is preserved and the corrected path passes. The full count was 102, not the 103 stated briefly in chat.",
        "No private-report activation or Supabase call occurred in this continuation. The owner-approved policy remains 30 days."
    ],
    "DISAGREEMENTS": [
        "No disagreement with 30-day retention. A completed local stage or fixture test is not browser acceptance or a deployment; those outcomes remain separate."
    ]}
with output.open("x", encoding="utf8", newline="\n") as file:
    json.dump(result, file, indent=2)
    file.write("\n")
print(json.dumps(result, indent=2))
