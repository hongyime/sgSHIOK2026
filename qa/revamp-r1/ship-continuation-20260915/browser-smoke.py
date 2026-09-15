"""Bound an explicitly named browser attempt without replacing earlier evidence."""
import hashlib
import json
import os
from pathlib import Path
import re
import sys

ROOT = Path(r"C:\sgSHIOK2026")
assert Path.cwd() == ROOT and sys.argv[1:] == ["--run"]
sys.path.insert(0, str(ROOT))
from scripts.release_process import run_owned_command
from scripts.release_staging import _write_new

BASE = ROOT / "qa/revamp-r1/ship-continuation-20260915"
attempt = os.environ["SHIOK_SMOKE_ATTEMPT"]
assert re.fullmatch(r"[a-z][a-z0-9-]{1,70}", attempt)
output = BASE / (attempt+"-execution.json")
assert not output.exists() and not (BASE / attempt).exists()
result = run_owned_command(
    [r"C:\Program Files\nodejs\node.exe", str(BASE / "preview-smoke.mjs"), "--go", "--acceptance"],
    ROOT, timeout=330, env=dict(os.environ),
)
result["driverSha256"] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
_write_new(output, (json.dumps(result, indent=2)+"\n").encode())
print(json.dumps(result), flush=True)
raise SystemExit(0 if result["ok"] else 1)
