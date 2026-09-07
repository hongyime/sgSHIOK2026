"""Derive bounded diagnosis from recorded captures only; no browser or payload writes."""
from __future__ import annotations

import csv
import hashlib
import json
import statistics
import struct
from pathlib import Path
from typing import Any

ROOT = Path(r"C:\sgSHIOK2026")
OUT = ROOT / "qa/revamp-r1/loading-diagnosis"


def rounded(value: float) -> float:
    return round(value, 2)


def analyze_sample(sample: dict[str, Any]) -> dict[str, Any]:
    page = sample["page"]
    events = page["events"]
    named = lambda name: [e for e in events if e["name"] == name]
    first = lambda name: named(name)[0]["at"]
    nav = page["navigation"][0]
    visible = first("current-selected-route-visible")
    fetches = named("fetch-start")
    first_data = min(e["at"] for e in fetches if "/data/" in e["url"])
    decoded = named("body-decode-parse-end")
    score = next(e for e in decoded if "DOWNTOWN_CORE" in e["url"])
    geometry = next(e for e in decoded if "/geom/h3/" in e["url"])
    submissions = [e for e in named("source-setData") if e["source"] == "shiokest-route"]
    classes: dict[str, dict[str, Any]] = {}
    for request in sample["requests"].values():
        start = request["wallTime"] * 1000 - page["timeOrigin"]
        if start > visible:
            continue
        url = request["url"]
        category = "data" if "/data/" in url else "basemap" if "/maps/tiles/" in url else "worker" if "/maplibre/" in url else "app"
        item = classes.setdefault(category, {"observedRequestsStarted": 0, "completedByRoute": 0, "observedCompletedEncodedBytes": 0, "http404": 0, "incompleteOrUnobservedCompletion": 0, "targetTypes": []})
        item["observedRequestsStarted"] += 1
        if request["target"] not in item["targetTypes"]:
            item["targetTypes"].append(request["target"])
        item["http404"] += request.get("status") == 404
        end = start + (request.get("end", request["start"]) - request["start"]) * 1000
        if "encodedBytes" in request and end <= visible:
            item["completedByRoute"] += 1
            item["observedCompletedEncodedBytes"] += request["encodedBytes"]
        else:
            item["incompleteOrUnobservedCompletion"] += 1
    png = (OUT / sample["screenshot"]).read_bytes()
    assert struct.unpack(">II", png[16:24]) == (390, 844)
    assert sample["sameCaptureState"] and sample["beforeScreenshot"]["count"] == sample["afterScreenshot"]["count"] == 4
    page_errors = [error for error in sample["errors"] if not error.startswith("Worker resource timing:")]
    assert not sample["timedOut"] and not page_errors
    resource_rows = []
    for event in decoded:
        resource = next((r for r in page["resources"] if r["name"].endswith(event["url"])), None)
        resource_rows.append({"url": event["url"], "bodyDecodeParseMs": rounded(event["duration"]), "readyAtMs": rounded(event["at"]), "responseEndMs": rounded(resource["responseEnd"]) if resource else None, "postResponseEndResidualMs": rounded(event["at"] - resource["responseEnd"]) if resource else None, "encodedBodyBytes": resource["encodedBodySize"] if resource else None, "decodedBodyBytes": resource["decodedBodySize"] if resource else None})
    milestones = {name: rounded(first(name)) for name in ["selected-text-visible", "worker-constructor-start", "worker-first-message", "map-published", "map-load", "basemap-source-loaded", "current-selected-route-visible"]}
    return {
        "cache": sample["cache"], "viewport": [390, 844], "timedOut": sample["timedOut"], "captureErrors": sample["errors"], "uncaughtPageErrors": page_errors,
        "navigationToObservationWallMs": sample["navigationToObservationWallMs"],
        "milestonesFromNavigationMs": milestones,
        "navigation": {"requestToFirstResponseByteMs": rounded(nav["responseStart"] - nav["requestStart"]), "firstResponseByteAtMs": rounded(nav["responseStart"]), "responseEndAtMs": rounded(nav["responseEnd"]), "loadEventEndAtMs": rounded(nav["loadEventEnd"])},
        "nonoverlappingObservedIntervalsMs": {
            "navigationToFirstDataFetch": rounded(first_data),
            "firstDataFetchToScoreReady": rounded(score["at"] - first_data),
            "scoreReadyToFirstRouteSubmission": rounded(submissions[0]["at"] - score["at"]),
            "firstRouteSubmissionToCurrentVisible": rounded(visible - submissions[0]["at"]),
        },
        "overlappingDiagnosticIntervalsMs": {
            "mapPublishedToLoad": rounded(first("map-load") - first("map-published")),
            "workerConstructedToFirstMessage": rounded(first("worker-first-message") - first("worker-constructor-start")),
            "geometryReadyToFirstRouteSubmission": rounded(submissions[0]["at"] - geometry["at"]),
            "basemapLoadedToCurrentRoute": rounded(visible - first("basemap-source-loaded")),
        },
        "routeSubmissions": submissions, "decodedResources": resource_rows,
        "requestClassesThroughCurrentRoute": classes,
        "pageLongTasks": {"count": len(page["longTasks"]), "sumMs": sum(e["duration"] for e in page["longTasks"]), "maximumMs": max(e["duration"] for e in page["longTasks"])},
        "pageHeapSamples": page["memory"],
        "screenshot": {"path": sample["screenshot"], "sha256": hashlib.sha256(png).hexdigest(), "dimensions": [390, 844], "currentFeaturesBeforeAndAfter": 4, "sameCaptureState": True, "visuallyInspected": True, "inspection": "Visible turquoise selected walk, labeled basemap, four metrics and attribution. Both captures have identical PNG bytes for the same settled viewport/selection; each has its own matching capture bracket."},
    }


def main() -> None:
    assert Path.cwd() == ROOT
    raw = json.loads((OUT / "capture.json").read_text())
    samples = [analyze_sample(s) for s in raw["samples"]]
    assert len(samples) == 2 and [s["cache"] for s in samples] == ["cold", "warm"]
    rows = list(csv.reader((OUT / "host-pressure.csv").read_text().splitlines()))
    pressure = {}
    for i, name in enumerate(["availableMiB", "pagesInputPerSecond", "pagesOutputPerSecond", "pageReadsPerSecond", "cpuPercent"], 1):
        values = [float(row[i]) for row in rows[1:] if len(row) > i and row[i].strip()]
        pressure[name] = {"samples": len(values), "min": rounded(min(values)), "median": rounded(statistics.median(values)), "max": rounded(max(values))}
    provenance = json.loads((ROOT / "web/lib/__tests__/fixtures/published-walks.provenance.json").read_text())
    for source in provenance["sources"].values():
        assert hashlib.sha256((ROOT / source["path"]).read_bytes()).hexdigest() == source["sha256"]
    result = {
        "status": "Bounded diagnosis complete; performance/release acceptance unresolved; independent review required",
        "baseCommit": "7851cde", "samples": samples,
        "perProfileMedians": {s["cache"]: {"n": 1, "textMs": s["milestonesFromNavigationMs"]["selected-text-visible"], "routeMs": s["milestonesFromNavigationMs"]["current-selected-route-visible"]} for s in samples},
        "medianLimit": "One observation per cache profile; median equals that observation. Do not pool cold and warm or claim p95/phone SLA.",
        "hostPressure": pressure,
        "gate": {"stopRepetitions": True, "reason": "Sustained paging and 100% CPU across all 15 valid CPU samples; available memory 707-1377 MiB. No additional pair or desktop run.", "ownerAction": "Owner arranges a quieter session or another suitable machine with installed toolchain; agent did not kill unrelated processes or change settings. Repeat one pair only after review, with complete trace/worker accounting."},
        "instrumentationLimits": [
            "Native Response.json timing combines pending body read, streaming decompression, native JSON parse and scheduling. Explicit JSON.parse wrapper does not observe native Response.json internals; pure parse/decompression CPU times are unresolved.",
            "Worker constructor-to-first-message includes module fetch, compilation, scheduling and early work; not pure worker startup CPU time.",
            "Auto-attachment did not yield completed worker Network requests; worker resource arrays are empty. Main module request was observed without completion. Warm telemetry also queried the terminated cold worker session and recorded Session with given id not found. Byte totals are observed page-target completions only, not whole-app transfer.",
            "V8 trace export contains zero events. The harness waited a fixed second after Tracing.end rather than awaiting tracingComplete, so successful trace flushing was not established. Native CPU attribution is unavailable; no repeat under the pressure gate.",
            "Loopback request-to-first-byte includes server work and host/network scheduling. No server-internal spans or Server-Timing were captured; pure server execution time is unresolved.",
            "100ms page polling and Node/CDP scheduling mean milestone observations are upper bounds on first visibility. Inspector instrumentation overhead is uncalibrated; source wrapper returns original native results.",
            "Warm navigation resets app module caches but can retain browser V8/HTTP caches, process heap and OS caches. Cold means browser-cold, not cold disk/server OS cache.",
            "Real OneMap raster HTTP traffic was used from the local app. No production application navigation or production load test was performed.",
        ],
        "protections": {"protectedSourceHashesMatched": 11, "protectedMutations": 0, "pipelineRuns": 0, "pipelineCost": 0, "installs": 0, "builds": 0, "deployments": 0, "productCodeChanges": 0},
        "validation": ["Both diagnostic JavaScript files passed node --check", "Both PNGs are 390x844 and visually inspected; four current-key features match across each screenshot bracket", "No captured uncaught page errors or timeouts; obsolete worker telemetry query failed and is retained", "Initial analysis assertion treated that telemetry error as an application error; corrected categorization preserves the raw failure", "11 protected source hashes match fixture provenance after capture", "No browser repetitions after pressure gate"],
    }
    (OUT / "analysis.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    for sample in samples:
        print(sample["cache"], sample["nonoverlappingObservedIntervalsMs"], sample["requestClassesThroughCurrentRoute"])
    print("hostPressure", pressure)


if __name__ == "__main__":
    main()
