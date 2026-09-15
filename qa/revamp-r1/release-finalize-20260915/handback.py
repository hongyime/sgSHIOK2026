"""Summarize recorded terminal observations, keeping failures distinct from acceptance."""
import hashlib
import json
from pathlib import Path

ROOT = Path(r"C:\sgSHIOK2026")
assert Path.cwd() == ROOT
BASE = ROOT / "qa/revamp-r1/release-finalize-20260915"
ZOOM = ROOT / "qa/revamp-r1/same-document-zoom-20260915"

def read(path):
    return json.loads(path.read_text(encoding="utf8"))

anchors = read(BASE / "final-checkpoint.json")
build = read(BASE / "frontend-brzm8xg4/build.json")
audit = read(BASE / "preview-OcJOJb/served-audit.json")
zoom = read(ZOOM / "observed-KpEl8F/supervisor.json")
web = read(BASE / "full-v3cit5ci/summary.json")
assert build["passed"] and audit["passed"] and web["passed"]
assert zoom["passed"] is False and zoom["cleanup"]["verified"] is True
result = {
    "root": str(ROOT), "host": anchors["host"], "retentionDays": 30,
    "sourceRevision": build["sourceRevision"], "buildId": build["buildId"],
    "buildPassed": build["passed"], "buildSeconds": build["elapsedSeconds"],
    "buildOutput": build["buildOutput"], "scope": build["scope"],
    "servedAuditPassed": audit["passed"], "servedResponses": len(audit["served"]),
    "disabledHandlers": audit["disabled"], "preview": audit["preview"]["url"],
    "previewLifetimeSeconds": 1800,
    "webTests": {"passed": 3331, "files": 86, "dependencyGuards": 42,
                 "arithmetic": "3326 + 3 CSS contracts + 2 route-entry contracts = 3331; 85 + 1 new file = 86"},
    "typesPassed": read(BASE / "types-4kq2fe2a/summary.json")["passed"],
    "browser": {"passed": False, "screenshots": 0, "appNavigation": False,
                "firstAttempt": "observed-V6uwcu: Windows PowerShell memory-query timeout before Chrome",
                "secondAttempt": "observed-KpEl8F: native PowerShell7 helper timeout before navigation",
                "secondElapsedMs": zoom["elapsedMs"], "ownedCleanupVerified": zoom["cleanup"]["verified"],
                "offlineContracts": 61, "timestampCases": 5},
    "protectedAnchorsMatched": len(anchors["protectedAnchors"]), "weights": anchors["weights"],
    "originalEvidencePrefixPreserved": anchors["evidencePrefix"]["preserved"],
    "pipelineRuns": 0, "dataCopiesThisContinuation": 0, "deployments": 0, "reportingEnabled": False,
    "FINDINGS": [
        "The actual production compiler exposed two inherited defects missed by the ordinary suite: global-only map CSS selectors and invalid helper exports on the reserved Next page entry. Both are fixed, tested and pushed.",
        "The unchanged Home implementation is now colocated in app/home.tsx; the page entry exports only its default. Fresh Next route validation and prerendering pass.",
        "Frontend compilation and served-byte identity now pass without another immutable-data copy. The resulting local preview is not a complete deployable package or browser acceptance.",
        "Native browser attempts failed before app navigation. PowerShell7 JSON timestamp conversion also broke cleanup identity comparison; canonical UTC comparison preserves microseconds and passes five cases. Final independent cleanup confirmed no owned browser remained.",
        "The first preview lacked job-supervised lifetime; it was closed by exact process identity. Its replacement runs under the existing owned-job supervisor for 1800 seconds. Both served audits passed; shared services were not stopped.",
        "The 30-day private-report policy remains applied, but intake and moderation are still disabled. Actual owner login, report acceptance and delivery remain separate from the core-map release.",
        "The failed basemap capture assumed image/png. Public tiles returned image/undefined; a new bounded capture verified actual PNG signatures and recorded 91 images totaling 471815 bytes. These are September15 responses to historical URLs, not recovered historical response bytes."
    ],
    "DISAGREEMENTS": [
        "No disagreement with 30-day retention. Build/test success is not proof that shipping or visual acceptance is complete.",
        "The existing native harness cannot yet be treated as a reliable automated acceptance gate on this session. Do not relabel either failed attempt as an app failure or rerun blindly."
    ]
}
paths = [BASE / "frontend-brzm8xg4/build.json", BASE / "frontend-brzm8xg4/build-files.json",
         BASE / "preview-OcJOJb/served-audit.json", BASE / "full-v3cit5ci/summary.json",
         ZOOM / "observed-KpEl8F/supervisor.json", BASE / "timestamp-tests.json"]
result["receipts"] = [{"path": path.relative_to(ROOT).as_posix(),
                       "sha256": hashlib.sha256(path.read_bytes()).hexdigest()} for path in paths]
with (BASE / "handback.json").open("x", encoding="utf8", newline="\n") as file:
    json.dump(result, file, indent=2)
    file.write("\n")
print(json.dumps(result, indent=2))
