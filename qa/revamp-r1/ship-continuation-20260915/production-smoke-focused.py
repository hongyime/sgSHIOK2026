"""One fresh native-focus acceptance attempt; preserve the original failed run."""
import hashlib
import json
import os
from pathlib import Path
import sys

ROOT = Path(r"C:\sgSHIOK2026")
assert Path.cwd() == ROOT
assert sys.argv[1:] == ["--run"]
assert os.environ["SHIOK_SMOKE_ATTEMPT"] == "production-acceptance-02"
sys.path.insert(0, str(ROOT))
from scripts.release_process import run_owned_command
from scripts.release_staging import _write_new

BASE = ROOT / "qa/revamp-r1/ship-continuation-20260915"
result = run_owned_command(
    [r"C:\Program Files\nodejs\node.exe", str(BASE / "preview-smoke.mjs"), "--go", "--acceptance"],
    ROOT, timeout=330, env=dict(os.environ),
)
result["driverSha256"] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
_write_new(BASE / "production-acceptance-02-execution.json", (json.dumps(result, indent=2)+"\n").encode())
print(json.dumps(result), flush=True)
raise SystemExit(0 if result["ok"] else 1)
