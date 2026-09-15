"""One approved core-map preview submission; no production alias or report activation."""
import json
import os
from pathlib import Path
import sys
import time

ROOT = Path(r"C:\sgSHIOK2026")
assert Path.cwd() == ROOT
assert sys.argv[1:] == ["--submit-preview"]
sys.path.insert(0, str(ROOT))
from scripts.release_source_deploy import SubmissionError, submit_source_deployment

started = time.monotonic()
try:
    result = submit_source_deployment(
        ROOT, ROOT / "tmp/full-6bs50g8b/source-archive.json",
        "9f5c14acb3ca204cd2f5682366b7442710cc3eb22e9e0dc4968889bcb48861be",
        target="preview",
        request_sha256="1ec8d656b14316fdb9ca00d3e9f289271654135811ed89c6a09b1eee2fde984c",
        token=os.environ["SHIOK_VERCEL_TOKEN"],
        output_dir=ROOT / "tmp/preview-submit-20260915-01", timeout_seconds=900,
    )
except SubmissionError as error:
    result = error.result
except Exception as error:
    result = {"ok": False, "state": "stopped", "errorType": type(error).__name__,
              "next": "Inspect existing receipts and remote state; never retry automatically"}
print(json.dumps({**result, "elapsedSeconds": round(time.monotonic() - started, 3)}), flush=True)
raise SystemExit(0 if result["ok"] else 1)
