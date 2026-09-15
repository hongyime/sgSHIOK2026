"""Bound one exact staged build without inherited credentials or data preparation."""
import hashlib
import json
import os
from pathlib import Path
import sys
import time

ROOT=Path(r"C:\sgSHIOK2026")
assert Path.cwd()==ROOT
sys.path.insert(0,str(ROOT/"scripts"))
from release_process import run_owned_command
from release_staging import verify_release_stage

OUT=ROOT/"qa/revamp-r1/core-release-20260915/attempt-2"
receipt=json.loads((OUT/"stage.json").read_text())
assert receipt["passed"] is True
stage=Path(receipt["stage"]);web=stage/"web"
assert stage==ROOT/"tmp/core-release-20260915-candidate-2"
assert not (OUT/"build.json").exists()
env={k:os.environ[k] for k in ("PATH","SYSTEMROOT","WINDIR","SYSTEMDRIVE","COMSPEC","PATHEXT") if k in os.environ}
temp=OUT/"compiler-tmp";temp.mkdir(exist_ok=False)
env.update(TEMP=str(temp),TMP=str(temp),NEXT_TELEMETRY_DISABLED="1",NODE_OPTIONS="--max-old-space-size=2048",
    SHIOK_DATA_BUNDLE="generated_20260805_prefer_scored_routed",NEXT_PUBLIC_DATA_BASE="/data/generated_20260805_prefer_scored_routed/",
    NEXT_PUBLIC_LAMP_OVERLAY_BASE="/data/lamp_posts_v1/",SHIOK_REPORTS_ENABLED="false",SHIOK_MODERATION_ENABLED="false")
assert not (web/"node_modules").exists()
# The verified staging contract permits only this existing dependency junction.
import subprocess
subprocess.run(["powershell.exe","-NoProfile","-Command",
    "New-Item -ItemType Junction -Path '"+str(web/"node_modules")+"' -Target 'C:\\sgSHIOK2026\\web\\node_modules' | Out-Null"],
    cwd=ROOT,env=env,check=True,timeout=15,creationflags=subprocess.CREATE_NO_WINDOW)
command=[r"C:\Program Files\nodejs\node.exe",str(web/"scripts/build-next-release.mjs"),"build"]
result={"root":str(ROOT),"stage":str(stage),"sourceRevision":receipt["sourceRevision"],"command":command,
    "environment":{k:v for k,v in env.items() if k not in {"PATH","SYSTEMROOT","WINDIR","SYSTEMDRIVE","COMSPEC","PATHEXT"}},
    "timeoutSeconds":600,"pipelineRuns":0,"deployments":0,"installs":0,"passed":False}
started=time.monotonic()
try:
    result["before"]=verify_release_stage(ROOT,stage,expected_manifest_sha256=receipt["releaseManifestSha256"])
    result["build"]=run_owned_command(command,web,timeout=600,env=env)
    with (OUT/"build.stdout.txt").open("x",encoding="utf8",newline="\n") as file:file.write(result["build"]["stdout"])
    with (OUT/"build.stderr.txt").open("x",encoding="utf8",newline="\n") as file:file.write(result["build"]["stderr"])
    result["after"]=verify_release_stage(ROOT,stage,expected_manifest_sha256=receipt["releaseManifestSha256"])
    if result["build"]["ok"]:
        result["buildId"]=(web/".next/BUILD_ID").read_text().strip()
        inventory=[]
        for path in sorted((web/".next").rglob("*")):
            if path.is_file():
                digest=hashlib.sha256()
                with path.open("rb") as file:
                    while chunk:=file.read(1048576):digest.update(chunk)
                inventory.append({"path":path.relative_to(web).as_posix(),"bytes":path.stat().st_size,"sha256":digest.hexdigest()})
        with (OUT/"build-files.json").open("x",encoding="utf8",newline="\n") as file:json.dump(inventory,file,indent=2);file.write("\n")
        result["buildOutput"]={"files":len(inventory),"bytes":sum(row["bytes"] for row in inventory),"manifestSha256":hashlib.sha256((OUT/"build-files.json").read_bytes()).hexdigest()}
        result["passed"]=True
except Exception as error:
    result["error"]=str(error)
    raise
finally:
    result["elapsedSeconds"]=round(time.monotonic()-started,3)
    with (OUT/"build.json").open("x",encoding="utf8",newline="\n") as file:json.dump(result,file,indent=2);file.write("\n")
    print(json.dumps(result,indent=2))
    if not result["passed"]:sys.exit(1)
