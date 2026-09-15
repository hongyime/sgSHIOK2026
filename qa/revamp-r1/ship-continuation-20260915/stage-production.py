"""Build-independent production submission with domain assignment explicitly off."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
import time

ROOT = Path(r"C:\sgSHIOK2026")
assert Path.cwd() == ROOT
sys.path.insert(0, str(ROOT))
from scripts import release_source_archive as archive
from scripts import release_source_deploy as deploy

BASE = ROOT / "qa/revamp-r1/ship-continuation-20260915"
DATA = ROOT / "tmp/core-release-20260915-candidate-2/release-manifest.json"
DATA_PIN = "5ae6803bc224e2f1e408481001c7088ed896fd05f28aa73145b2fa0c9408e471"
PARTS = ROOT / "tmp/production-source-20260915-01"
SUBMISSION = ROOT / "tmp/production-staged-submit-20260915-01"
PLAN = BASE / "staged-production-plan.json"

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("phase", choices=["pack", "submit"])
parser.add_argument("--frontend-build", type=Path)
args = parser.parse_args()
started = time.monotonic()
try:
    if args.phase == "pack":
        assert args.frontend_build is not None
        front = args.frontend_build
        assert front.is_absolute() and front.is_relative_to(ROOT / "qa/revamp-r1")
        packed = archive.create_source_archive(
            ROOT, front, hashlib.sha256(front.read_bytes()).hexdigest(), DATA, DATA_PIN,
            output_dir=PARTS, max_input_bytes=6_000_000_000, max_output_bytes=500*1024*1024,
            timeout_seconds=900,
        )
        plan = deploy.prepare_source_deployment(
            ROOT, Path(packed["receipt"]), packed["receiptSha256"], target="production", skip_domain=True,
        )
        archive.staging._write_new(PLAN, archive._json_bytes({"archive": packed, "plan": plan}))
        result = {"ok": True, "phase": "packed-not-deployed", "archive": packed,
                  "requestSha256": plan["requestSha256"], "sourceRevision": plan["request"]["meta"]["sourceRevision"],
                  "target": "production", "autoAssignCustomDomains": False}
    else:
        pinned = json.loads(PLAN.read_bytes())
        packed, plan = pinned["archive"], pinned["plan"]
        result = deploy.submit_source_deployment(
            ROOT, Path(packed["receipt"]), packed["receiptSha256"], target="production", skip_domain=True,
            request_sha256=plan["requestSha256"], token=os.environ["SHIOK_VERCEL_TOKEN"],
            output_dir=SUBMISSION, timeout_seconds=900,
        )
except deploy.SubmissionError as error:
    result = error.result
except Exception as error:
    result = {"ok": False, "phase": args.phase, "errorType": type(error).__name__,
              "error": "Stopped; inspect receipts and remote state before any retry"}
result["elapsedSeconds"] = round(time.monotonic()-started, 3)
archive.staging._write_new(BASE / ("staged-production-"+args.phase+".json"), archive._json_bytes(result))
print(json.dumps(result), flush=True)
raise SystemExit(0 if result["ok"] else 1)
