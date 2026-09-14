"""Read and verify downloaded scheduler artifacts; never restore into the worktree."""
import hashlib
import json
from pathlib import Path
import sys
import zipfile

ROOT = Path("C:/sgSHIOK2026")
assert Path.cwd() == ROOT
directory = ROOT / "qa/revamp-r1/weekly-metadata-20260914"
run = sys.argv[1]
assert run.isdecimal()
target = directory / f"activation-{run}"
summary = json.loads((target / "summary.json").read_bytes())
archive_bytes = (target / "checkpoint.zip").read_bytes()
sha = lambda raw: hashlib.sha256(raw).hexdigest()
assert sha(archive_bytes) == summary["checkpoint"]["archiveSha256"]
with zipfile.ZipFile(target / "checkpoint.zip") as archive:
    raw = archive.read("manifest.json")
    assert sha(raw) == summary["checkpoint"]["manifestSha256"]
    manifest = json.loads(raw)
    assert manifest["status"] == "ready" and manifest["runId"] == int(run)
    assert manifest["anchorProfile"] == "git"
    assert set(archive.namelist()) == {"manifest.json", *(f["path"] for f in manifest["files"])}
    for item in manifest["files"]:
        data = archive.read(item["path"])
        assert sha(data) == item["sha256"] and len(data) == item["bytes"]
    pairs = {}
    for field in ("originState", "currentState"):
        ref = manifest[field]
        state, report = archive.read(ref["path"]), archive.read(ref["path"].replace("state.json", "report.json"))
        assert sha(state) == ref["stateSha256"] and sha(report) == ref["reportSha256"]
        pairs[field] = {"state": json.loads(state), "report": json.loads(report)}
    assert pairs["currentState"]["report"]["anchorProfile"] == "git"
    notices = [json.loads(archive.read(f["path"])) for f in manifest["files"] if f["path"].endswith(".receipt.json")]
    source_report = pairs["originState"]["report"]
    sources = [{"key": entry["key"], "outcome": entry["result"]["outcome"],
                "reason": entry["result"].get("reason"),
                "freshness": entry["state"]["freshness"]["status"],
                "observedFreshness": entry["state"]["observedFreshness"]["status"],
                "availability": entry["state"]["availability"]}
               for entry in source_report.get("sources", [])]
    requests = [f for f in manifest["files"] if f["path"].endswith(".request.json")]
result = {"runId": run, "summary": summary, "allArchiveHashesMatched": True,
          "allStatePairPinsMatched": True, "archiveFiles": len(manifest["files"]),
          "archiveBytesArithmetic": "+".join(str(f["bytes"]) for f in manifest["files"]) + "=" + str(sum(f["bytes"] for f in manifest["files"])),
          "originState": manifest["originState"], "currentState": manifest["currentState"],
          "sourceCounts": source_report.get("counts"), "sources": sources,
          "retainedVerifiedComments": [{"commentId": n["commentId"], "bodySha256": n["bodySha256"], "authorId": n["authorId"]} for n in notices],
          "retainedNoticeRequestCount": len(requests), "pipelineRuns": 0}
with (target / "inspection.json").open("x", encoding="utf8", newline="\n") as stream:
    json.dump(result, stream, indent=2)
    stream.write("\n")
print(json.dumps({"output": str(target / "inspection.json"), "counts": result["sourceCounts"], "sources": sources,
                  "verifiedComments": len(notices), "hashesMatch": True, "requestsRetained": len(requests)}))
