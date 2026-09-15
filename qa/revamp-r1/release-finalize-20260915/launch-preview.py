"""Bound a local-only preview and Next descendant with the existing Windows job owner."""
import json
import os
from pathlib import Path
import sys
import tempfile

ROOT = Path(r"C:\sgSHIOK2026")
assert Path.cwd() == ROOT
BASE = ROOT / "qa/revamp-r1/release-finalize-20260915"
assert sys.argv[1:] == ["--go"]
sys.path.insert(0, str(ROOT / "scripts"))
from release_process import run_owned_command

out = Path(tempfile.mkdtemp(prefix="owned-preview-", dir=BASE))
command = [r"C:\Program Files\nodejs\node.exe", str(BASE / "preview.mjs"), "--go",
           str(BASE / "frontend-brzm8xg4/build.json")]
env = {key: value for key, value in os.environ.items()
       if key.upper() in {"PATH", "SYSTEMROOT", "WINDIR", "SYSTEMDRIVE", "COMSPEC", "PATHEXT"}}
env.update(TEMP=str(ROOT / "tmp"), TMP=str(ROOT / "tmp"), PYTHONDONTWRITEBYTECODE="1")
with (out / "invocation.json").open("x", encoding="utf8") as file:
    json.dump({"command": command, "timeoutSeconds": 1800,
               "scope": "Local preview lifetime; Windows job closes all owned descendants at termination"}, file, indent=2)
result = run_owned_command(command, ROOT, timeout=1800, env=env)
with (out / "execution.json").open("x", encoding="utf8") as file:
    json.dump(result, file, indent=2)
print(json.dumps({"out": str(out), "execution": result}, indent=2))
