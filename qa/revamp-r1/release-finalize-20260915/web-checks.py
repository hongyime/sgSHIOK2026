"""Source-bound, fixture-only checks for the compiler-discovered map CSS defect."""
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
import time

ROOT = Path(r"C:\sgSHIOK2026")
assert Path.cwd() == ROOT
sys.path.insert(0, str(ROOT / "scripts"))
from release_process import run_owned_command

BASE = ROOT / "qa/revamp-r1/release-finalize-20260915"
mode = sys.argv[1]
out = Path(tempfile.mkdtemp(prefix=mode + "-", dir=BASE))
node = r"C:\Program Files\nodejs\node.exe"
commands = {
    "route-red": [node, "web/scripts/test-web.mjs", "lib/__tests__/page-entry.test.ts"],
    "route-focused": [node, "web/scripts/test-web.mjs", "lib/__tests__/page-entry.test.ts", "lib/__tests__/accessibility-render.test.tsx",
        "lib/__tests__/published-walk-page.test.tsx", "lib/__tests__/map-first-shell.test.ts", "lib/__tests__/map-recovery-actions.test.tsx",
        "lib/__tests__/walk-recovery-focus.test.tsx", "lib/__tests__/walk-real-records.test.ts", "lib/__tests__/rank-payload.test.ts"],
    "red": [node, "web/scripts/test-web.mjs", "lib/__tests__/deployment.test.ts", "-t", "MapLibre module"],
    "focused": [node, "web/scripts/test-web.mjs", "lib/__tests__/deployment.test.ts", "lib/__tests__/route-evidence-map-popup.test.ts",
                "lib/__tests__/route-evidence-map-interaction.test.ts"],
    "full": [node, "web/scripts/test-without-production-data.mjs", "--reporter=dot", "--testTimeout=15000"],
    "types": [node, "web/node_modules/typescript/bin/tsc", "--project", "web/tsconfig.json", "--noEmit", "--incremental", "false"],
    "docs": [str(ROOT / ".venv/Scripts/python.exe"), "-B", "-m", "pytest", "tests/test_readme.py",
             "tests/test_agent_docs.py", "tests/test_repo_integrity.py", "-q", "-p", "no:cacheprovider"],
}
paths = ["web/components/route-evidence-map.module.css", "web/lib/__tests__/deployment.test.ts",
         "web/app/page.tsx", "web/app/home.tsx", "web/lib/__tests__/page-entry.test.ts"]
paths += ["web/lib/__tests__/" + name for name in ["accessibility-render.test.tsx", "map-first-shell.test.ts",
    "map-recovery-actions.test.tsx", "published-walk-page.test.tsx", "rank-payload.test.ts", "route-evidence-map-interaction.test.ts",
    "score-card-copy.test.ts", "walk-real-records.test.ts", "walk-recovery-focus.test.tsx"]]
def identities():
    return {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in paths}
before = identities()
env = dict(os.environ, TEMP=str(ROOT / "tmp"), TMP=str(ROOT / "tmp"), PYTHONDONTWRITEBYTECODE="1")
started = time.monotonic()
result = run_owned_command(commands[mode], ROOT, timeout=900 if mode == "full" else 240, env=env)
for stream in ("stdout", "stderr"):
    with (out / (stream + ".txt")).open("x", encoding="utf8", newline="\n") as file:
        file.write(result[stream])
receipt = {"out": str(out), "command": commands[mode], "before": before, "after": identities(),
           "elapsedSeconds": round(time.monotonic() - started, 3), "execution": result, "pipelineRuns": 0}
receipt["passed"] = result["ok"] and receipt["before"] == receipt["after"]
with (out / "summary.json").open("x", encoding="utf8", newline="\n") as file:
    json.dump(receipt, file, indent=2)
    file.write("\n")
print(json.dumps(receipt, indent=2))
sys.exit(0 if receipt["passed"] else 1)
