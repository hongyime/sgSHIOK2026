"""Put the browser, native helpers and independent supervisor in one bounded job."""
import json
import os
from pathlib import Path
import sys
import tempfile

ROOT = Path(r"C:\sgSHIOK2026")
BASE = ROOT / "qa/revamp-r1/same-document-zoom-20260915"
assert Path.cwd() == ROOT and len(sys.argv) == 3 and sys.argv[1] == "--go"
config = Path(sys.argv[2])
assert config.is_absolute() and config.parent == BASE and config.name.startswith("exact-") and config.suffix == ".json"
sys.path.insert(0, str(ROOT / "scripts"))
from release_process import run_owned_command

out = Path(tempfile.mkdtemp(prefix="owned-", dir=BASE))
env = {key: value for key, value in os.environ.items() if key.upper() in {
    "SYSTEMROOT", "WINDIR", "SYSTEMDRIVE", "USERPROFILE", "APPDATA", "LOCALAPPDATA", "PROGRAMDATA",
    "PROGRAMFILES", "PROGRAMFILES(X86)", "PROGRAMW6432", "PATH", "COMSPEC", "PSMODULEPATH"}}
env.update(TEMP=str(out), TMP=str(out))
command = [r"C:\Program Files\nodejs\node.exe", str(BASE / "run.mjs"), "--go", str(config)]
with (out / "invocation.json").open("x", encoding="utf8", newline="\n") as file:
    json.dump({"command": command, "timeoutSeconds": 630,
               "arithmetic": "600 seconds inner aggregate + 30 seconds outer cleanup/receipt = 630 seconds"}, file, indent=2)
result = run_owned_command(command, ROOT, timeout=630, env=env)
with (out / "execution.json").open("x", encoding="utf8", newline="\n") as file:
    json.dump(result, file, indent=2)
    file.write("\n")
print(json.dumps({"out": str(out), "execution": result}, indent=2))
raise SystemExit(0 if result["ok"] else 1)
