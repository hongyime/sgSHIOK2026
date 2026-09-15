"""Observe pinned server startup once, with existing Windows job ownership."""
import json
import os
from pathlib import Path
import sys
import tempfile

ROOT = Path(r"C:\sgSHIOK2026")
assert Path.cwd() == ROOT
assert sys.argv[1:] == ["--go"]
BASE = ROOT / "qa/revamp-r1/startup-diagnosis-20260915"
sys.path.insert(0, str(ROOT / "scripts"))
from release_process import run_owned_command

out = Path(tempfile.mkdtemp(prefix="observed-", dir=BASE))
command = [r"C:\Program Files\nodejs\node.exe", str(BASE / "probe.mjs"), "--go", str(out)]
env = {key: value for key, value in os.environ.items() if key.upper() in
       {"PATH", "SYSTEMROOT", "WINDIR", "SYSTEMDRIVE", "COMSPEC", "PATHEXT", "COMPUTERNAME"}}
env.update(TEMP=str(ROOT / "tmp"), TMP=str(ROOT / "tmp"), PYTHONDONTWRITEBYTECODE="1")
result = run_owned_command(command, ROOT, timeout=105, env=env)
with (out / "execution.json").open("x", encoding="utf8") as file:
    json.dump({"command": command, "timeoutSeconds": 105, "execution": result}, file, indent=2)
print(json.dumps({"out": str(out), "execution": result}, indent=2))
raise SystemExit(0 if result["ok"] else 1)
