"""Reuse a pinned data archive; keep all earlier attempts and live aliases unchanged."""
import hashlib
import json
import os
from pathlib import Path
import sys
import time

ROOT = Path(r"C:\sgSHIOK2026")
assert Path.cwd() == ROOT
assert sys.argv[1:] in (["pack"], ["submit"])
sys.path.insert(0, str(ROOT))
from scripts import release_source_archive as archive
from scripts import release_source_deploy as deploy

BASE = ROOT / "qa/revamp-r1/ship-continuation-20260915"
FRONT = ROOT / "qa/revamp-r1/release-finalize-20260915/frontend-nsp394uq/build.json"
OLD = ROOT / "tmp/full-6bs50g8b/source-archive.json"
OLD_PIN = "9f5c14acb3ca204cd2f5682366b7442710cc3eb22e9e0dc4968889bcb48861be"
DATA = ROOT / "tmp/core-release-20260915-candidate-2/release-manifest.json"
DATA_PIN = "5ae6803bc224e2f1e408481001c7088ed896fd05f28aa73145b2fa0c9408e471"
PLAN = BASE / "stream-production-plan.json"
phase = sys.argv[1]
started = time.monotonic()
try:
    if phase == "pack":
        assert json.loads(FRONT.read_bytes())["sourceRevision"] == "9516894c8e66295b41f18b5b2ccef53eaaa6628a"
        packed = archive.repack_source_archive(
            ROOT, OLD, OLD_PIN, FRONT, hashlib.sha256(FRONT.read_bytes()).hexdigest(), DATA, DATA_PIN,
            output_dir=ROOT / "tmp/production-source-stream-20260915-01",
            max_input_bytes=6_000_000_000, max_output_bytes=500*1024*1024, timeout_seconds=900,
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
            output_dir=ROOT / "tmp/production-stream-submit-20260915-01", timeout_seconds=900,
        )
except deploy.SubmissionError as error:
    result = error.result
except Exception as error:
    result = {"ok": False, "phase": phase, "errorType": type(error).__name__, "error": str(error)}
result["elapsedSeconds"] = round(time.monotonic()-started, 3)
archive.staging._write_new(BASE / ("stream-production-"+phase+".json"), archive._json_bytes(result))
print(json.dumps(result), flush=True)
raise SystemExit(0 if result["ok"] else 1)
