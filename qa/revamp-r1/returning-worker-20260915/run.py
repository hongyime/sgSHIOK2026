"""Cache-preserving local release transition under the existing process owner."""
import json
import os
from pathlib import Path
import sys
import tempfile

ROOT = Path(r"C:\sgSHIOK2026")
assert Path.cwd() == ROOT
assert sys.argv[1:] in (["--go"], ["--go", "--manual-recovery"])
BASE = ROOT / "qa/revamp-r1/returning-worker-20260915"
sys.path.insert(0, str(ROOT / "scripts"))
from release_process import run_owned_command

out = Path(tempfile.mkdtemp(prefix="observed-", dir=BASE))
env = {key: value for key, value in os.environ.items()
       if key.upper() in {"PATH", "SYSTEMROOT", "WINDIR", "SYSTEMDRIVE", "COMSPEC", "PATHEXT", "COMPUTERNAME"}}
env.update(TEMP=str(ROOT / "tmp"), TMP=str(ROOT / "tmp"), PYTHONDONTWRITEBYTECODE="1")
command = [r"C:\Program Files\nodejs\node.exe", str(BASE / "transition.mjs"), "--go", str(out)]
if "--manual-recovery" in sys.argv:
    command.append("--manual-recovery")
result = run_owned_command(command, ROOT, timeout=280, env=env)
with (out / "execution.json").open("x", encoding="utf8") as file:
    json.dump({"command": command, "timeoutSeconds": 280, "execution": result}, file, indent=2)
print(json.dumps({"out": str(out), "execution": result}, indent=2))
raise SystemExit(0 if result["ok"] else 1)
