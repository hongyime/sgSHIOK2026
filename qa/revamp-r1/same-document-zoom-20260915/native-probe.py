"""Own the entire diagnostic process tree independently of Chrome/CIM cleanup."""
import json
import os
from pathlib import Path
import sys
import tempfile

ROOT = Path(r"C:\sgSHIOK2026")
assert Path.cwd() == ROOT
assert sys.argv[1:] == ["--go"]
sys.path.insert(0, str(ROOT / "scripts"))
from release_process import run_owned_command

BASE = ROOT / "qa/revamp-r1/same-document-zoom-20260915"
out = Path(tempfile.mkdtemp(prefix="native-owner-", dir=BASE))
result = run_owned_command([r"C:\Program Files\nodejs\node.exe", str(BASE / "native-probe.mjs"), "--go"],
                           ROOT, timeout=120, env=dict(os.environ, TEMP=str(out), TMP=str(out)))
with (out / "execution.json").open("x", encoding="utf8", newline="\n") as file:
    json.dump(result, file, indent=2)
    file.write("\n")
print(json.dumps({"out": str(out), "execution": result}, indent=2))
raise SystemExit(0 if result["ok"] else 1)
