"""Read metadata only; write fresh local QA receipts, never pipeline inputs or notices."""

import argparse
from datetime import UTC, datetime
import hashlib
import json
import os
from pathlib import Path
import re
import time
from typing import Any, Callable

from scripts.source_metadata_http import MetadataClient, observe_source, publisher_instant
from scripts.source_metadata_state import transition, trusted_previous


ROOT = Path(__file__).resolve().parents[1]
ANCHORS = {"pipeline/config/sources.yaml", "raw/manifest.json"}
MAX_FILE_BYTES = 1024 * 1024
HOSTS = {"datagov_metadata": "api-production.data.gov.sg", "datamall_listing": "datamall2.mytransport.sg"}


class MonitorError(ValueError):
    """Safe, actionable failure text; never includes remote content or credentials."""


def _sha(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _hash(value: Any) -> bool:
    return isinstance(value, str) and re.fullmatch(r"[0-9a-f]{64}", value) is not None


def _safe_path(root: Path, path: Path) -> Path:
    if not path.is_absolute() or not path.is_relative_to(root) or ".." in path.parts:
        raise MonitorError("STOP_PATH_SCOPE: absolute repository path required")
    if path.resolve() != path or any(part.is_symlink() for part in (path, *path.parents) if part.is_relative_to(root)):
        raise MonitorError("STOP_PATH_SCOPE: linked paths are not permitted")
    return path


def _read(path: Path) -> bytes:
    try:
        with path.open("rb") as stream:
            content = stream.read(MAX_FILE_BYTES + 1)
    except OSError as error:
        raise MonitorError("STOP_LOCAL_READ: missing or unreadable monitor file; no retry") from error
    if len(content) > MAX_FILE_BYTES:
        raise MonitorError("STOP_LOCAL_READ: monitor file exceeds 1 MiB")
    return content


def _json(content: bytes) -> Any:
    def pairs(values):
        result = {}
        for key, value in values:
            if key in result:
                raise ValueError("duplicate key")
            result[key] = value
        return result

    try:
        return json.loads(content.decode("utf8"), object_pairs_hook=pairs,
                          parse_constant=lambda _: (_ for _ in ()).throw(ValueError("nonfinite")))
    except (ValueError, UnicodeError, RecursionError) as error:
        raise MonitorError("STOP_INVALID_JSON: malformed, duplicate-key or non-finite metadata/state") from error


def validate_catalog(catalog: Any) -> dict:
    try:
        if (not isinstance(catalog, dict) or set(catalog) != {"schemaVersion", "generatedAt", "anchors", "gitAnchors", "baselineMeaning", "sources"}
                or type(catalog["schemaVersion"]) is not int or catalog["schemaVersion"] != 1
                or publisher_instant(catalog["generatedAt"]) is None
                or not isinstance(catalog["baselineMeaning"], str) or not 1 <= len(catalog["baselineMeaning"]) <= 1000
                or not isinstance(catalog["anchors"], dict) or set(catalog["anchors"]) != ANCHORS
                or not all(_hash(value) for value in catalog["anchors"].values())
                or not isinstance(catalog["gitAnchors"], dict) or set(catalog["gitAnchors"]) != ANCHORS
                or not all(_hash(value) for value in catalog["gitAnchors"].values())
                or not isinstance(catalog["sources"], list) or not 1 <= len(catalog["sources"]) <= 64):
            raise ValueError("catalog header")
        seen = set()
        for source in catalog["sources"]:
            if not isinstance(source, dict):
                raise ValueError("source type")
            adapter = source.get("adapter")
            fields = {"key", "name", "mode", "adapter", "staleAfterDays", "expectedCadence", "baseline"}
            fields |= {"datasetId"} if adapter == "datagov_metadata" else {"keyword"} if adapter == "datamall_listing" else set()
            if (set(source) != fields or adapter not in {*HOSTS, "manual", "unsupported"}
                    or source["mode"] != ("manual" if adapter == "manual" else "automatic")
                    or not isinstance(source["key"], str) or not re.fullmatch(r"[a-z][a-z0-9_]{0,99}", source["key"])
                    or source["key"] in seen
                    or not isinstance(source["name"], str) or not 1 <= len(source["name"]) <= 200
                    or any(ord(char) < 32 for char in source["name"])):
                raise ValueError("source identity")
            seen.add(source["key"])
            threshold, cadence, baseline = source["staleAfterDays"], source["expectedCadence"], source["baseline"]
            if threshold is not None and (type(threshold) is not int or not 1 <= threshold <= 36500):
                raise ValueError("threshold")
            if cadence is not None and (not isinstance(cadence, str) or not re.fullmatch(r"[a-z_-]{1,64}", cadence)):
                raise ValueError("cadence")
            if not isinstance(baseline, dict) or set(baseline) != {"publisherUpdatedAt", "sha256", "present"} or type(baseline["present"]) is not bool:
                raise ValueError("baseline")
            if baseline["sha256"] is not None and not _hash(baseline["sha256"]):
                raise ValueError("baseline hash")
            if baseline["publisherUpdatedAt"] is not None and publisher_instant(baseline["publisherUpdatedAt"]) is None:
                raise ValueError("baseline instant")
            if not baseline["present"] and (baseline["sha256"] is not None or baseline["publisherUpdatedAt"] is not None):
                raise ValueError("absent baseline")
            if adapter == "datagov_metadata" and not re.fullmatch(r"d_[a-z0-9]{1,128}", source["datasetId"]):
                raise ValueError("dataset id")
            if adapter == "datamall_listing" and not re.fullmatch(r"[A-Za-z_]{1,100}", source["keyword"]):
                raise ValueError("listing keyword")
    except (ValueError, TypeError, KeyError, OverflowError) as error:
        raise MonitorError("STOP_INVALID_CATALOG: review the tracked catalog; do not rebuild an input") from error
    return catalog


def _verify_anchors(root: Path, catalog: dict) -> dict[str, str]:
    actual = {}
    for relative, expected in sorted(catalog["anchors"].items()):
        actual[relative] = _sha(_read(_safe_path(root, root / relative)))
        if actual[relative] != expected:
            raise MonitorError(f"STOP_INPUT_MISMATCH {relative} expected={expected} actual={actual[relative]}")
    return actual


def _restore(root: Path, previous: Path | None, catalog: dict, catalog_sha: str, now: datetime) -> tuple[dict, str | None]:
    if previous is None:
        return {}, None
    content = _read(_safe_path(root, previous))
    value = _json(content)
    if (not isinstance(value, dict) or set(value) != {"schemaVersion", "catalogSha256", "finishedAt", "sources"}
            or type(value["schemaVersion"]) is not int or value["schemaVersion"] != 1
            or value["catalogSha256"] != catalog_sha or publisher_instant(value["finishedAt"]) is None
            or datetime.fromisoformat(publisher_instant(value["finishedAt"])) > now
            or not isinstance(value["sources"], dict)
            or set(value["sources"]) != {source["key"] for source in catalog["sources"]}):
        raise MonitorError("STOP_PRIOR_STATE_INVALID: catalog identity/schema/clock/source set differs; no requests executed")
    completion = _json(_read(_safe_path(root, previous.with_name("report.json"))))
    if (not isinstance(completion, dict) or type(completion.get("schemaVersion")) is not int or completion["schemaVersion"] != 1
            or type(completion.get("exitCode")) is not int or completion["exitCode"] not in (0, 1)
            or completion.get("runStatus") != {0: "ok", 1: "attention_required"}[completion["exitCode"]]
            or completion.get("catalogSha256") != catalog_sha or completion.get("finishedAt") != value["finishedAt"]
            or completion.get("persistence") != {"status": "verified", "stateSha256": _sha(content)}):
        raise MonitorError("STOP_PRIOR_STATE_INVALID: no matching verified completion receipt; no requests executed")
    restored = {}
    for source in catalog["sources"]:
        try:
            state = trusted_previous(source, value["sources"][source["key"]], now)
        except ValueError as error:
            raise MonitorError("STOP_PRIOR_STATE_INVALID: persisted clock is in the future; no requests executed") from error
        if state is None:
            raise MonitorError("STOP_PRIOR_STATE_INVALID: source=" + source["key"] + "; no requests executed")
        restored[source["key"]] = state
    return restored, _sha(content)


def _write(path: Path, value: Any) -> None:
    with path.open("x", encoding="utf8", newline="\n") as stream:
        json.dump(value, stream, indent=2, ensure_ascii=True, allow_nan=False)
        stream.write("\n")
        stream.flush()
        os.fsync(stream.fileno())


def _publish_report(output: Path, report: dict) -> None:
    """Expose only a closed, synced report; the staged file is retained, never replaced."""
    pending = output / "report.pending.json"
    try:
        _write(pending, report)
        expected = (json.dumps(report, indent=2, ensure_ascii=True, allow_nan=False) + "\n").encode("utf8")
        if _read(pending) != expected:
            raise MonitorError("STOP_REPORT_READBACK_MISMATCH")
        # Same-directory hard-link publication is atomic and fails if the target exists.
        os.link(pending, output / "report.json")
    except OSError as error:
        raise MonitorError("STOP_REPORT_PUBLICATION: no completion committed; preserve staged files and inspect local IO") from error


def run_check(root: Path, output: Path, *, previous: Path | None = None,
              client: MetadataClient | None = None, credentials: dict[str, str] | None = None,
              clock: Callable[[], datetime] = lambda: datetime.now(UTC)) -> tuple[dict, int]:
    """One sequential pass. A fresh directory and complete prior state are mandatory."""
    started = clock()
    monotonic_start = time.monotonic()
    _safe_path(root, output)
    if output.parent != root / "qa/source-monitor" or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,79}", output.name) or output.exists():
        raise MonitorError("STOP_OUTPUT_SCOPE: choose a fresh direct child of qa/source-monitor; preserve prior runs")
    catalog_path = _safe_path(root, root / "source-metadata-catalog.json")
    catalog_bytes = _read(catalog_path)
    catalog = validate_catalog(_json(catalog_bytes))
    catalog_sha = _sha(catalog_bytes)
    before = _verify_anchors(root, catalog)
    states, previous_sha = _restore(root, previous, catalog, catalog_sha, started)
    client = client if client is not None else MetadataClient()
    credentials = credentials or {}
    for value in credentials.values():
        if not isinstance(value, str) or len(value) > 4096 or any(ord(char) < 32 or ord(char) > 126 for char in value):
            raise MonitorError("STOP_CREDENTIAL_FORMAT: invalid credential format; value withheld")
    # Persist host-wide cooldowns too: another dataset must not bypass yesterday's 429.
    for source in catalog["sources"]:
        prior = states.get(source["key"])
        host = HOSTS.get(source["adapter"])
        retry = prior.get("retryAt") if prior else None
        if host and retry and datetime.fromisoformat(retry.replace("Z", "+00:00")) > started:
            existing = client.blocked_hosts.get(host)
            if not existing or datetime.fromisoformat(retry.replace("Z", "+00:00")) > datetime.fromisoformat(existing.replace("Z", "+00:00")):
                client.blocked_hosts[host] = retry
    output.mkdir(parents=True, exist_ok=False)
    report = {"schemaVersion": 1, "startedAt": started.isoformat(), "catalogSha256": catalog_sha,
              "baselineMeaning": catalog["baselineMeaning"], "stateRestored": previous is not None,
              "previousStateSha256": previous_sha, "noticeDelivery": "not_configured", "sources": [],
              "bounds": {"maxRequests": getattr(client, "max_requests", 24), "maxSeconds": getattr(client, "budget_seconds", 300),
                         "maxBytesPerResponse": client.max_bytes if isinstance(client, MetadataClient) else 262144,
                         "requestSeconds": getattr(client, "request_seconds", 10), "perHostIntervalSeconds": getattr(client, "interval", 13)}}
    _write(output / "started.json", report)
    sources = sorted(catalog["sources"], key=lambda source: (states.get(source["key"], {}).get("lastAttemptAt") or "", source["key"]))
    with (output / "observations.jsonl").open("x", encoding="utf8", newline="\n") as journal:
        for source in sources:
            prior = states.get(source["key"])
            host = HOSTS.get(source["adapter"])
            if host in client.blocked_hosts:
                result = {"outcome": "deferred", "attempted": False, "reason": "persisted_or_current_host_cooldown", "retryAt": client.blocked_hosts[host]}
            else:
                result = observe_source(source, prior, client, credentials)
            state = transition(source, prior, result, clock())
            entry = {"key": source["key"], "name": source["name"], "adapter": source["adapter"], "result": result, "state": state}
            report["sources"].append(entry)
            journal.write(json.dumps(entry, ensure_ascii=True, allow_nan=False) + "\n")
            journal.flush()
            states[source["key"]] = state
    report["finishedAt"] = clock().isoformat()
    report["elapsedSeconds"] = time.monotonic() - monotonic_start
    report["transport"] = client.stats
    report["pendingNotices"] = [notice for entry in report["sources"] for notice in entry["state"]["pendingNotices"]]
    report["counts"] = {"sources": len(sources), "attempted": sum(e["result"]["attempted"] for e in report["sources"]),
                        "outcomes": {outcome: sum(e["result"]["outcome"] == outcome for e in report["sources"])
                                     for outcome in sorted({e["result"]["outcome"] for e in report["sources"]})}}
    report["checkCompleted"] = not any(entry["result"]["outcome"] == "deferred" for entry in report["sources"])
    attention = any(entry["state"]["availability"] != "manual" and (
        entry["state"]["availability"] != "available" or entry["state"]["freshness"]["status"] != "current"
        or entry["state"]["observedFreshness"]["status"] != "current" or entry["state"]["pendingNotices"])
        for entry in report["sources"])
    code = int(attention or not report["checkCompleted"])
    try:
        after = _verify_anchors(root, catalog)
        if _sha(_read(catalog_path)) != catalog_sha:
            raise MonitorError("STOP_CATALOG_CHANGED: catalog modified during the check")
        report["integrity"] = {"status": "ok", "before": before, "after": after}
    except MonitorError as error:
        code = 2
        report["integrity"] = {"status": "failed", "before": before, "error": str(error)}
    report["persistence"] = {"status": "skipped", "reason": "integrity_failed"}
    if code != 2:
        envelope = {"schemaVersion": 1, "catalogSha256": catalog_sha, "finishedAt": report["finishedAt"], "sources": states}
        try:
            _write(output / "state.json", envelope)
            saved = _read(output / "state.json")
            expected = (json.dumps(envelope, indent=2, ensure_ascii=True, allow_nan=False) + "\n").encode("utf8")
            if saved != expected:
                raise MonitorError("STOP_STATE_READBACK_MISMATCH")
            report["persistence"] = {"status": "verified", "stateSha256": _sha(saved)}
        except (OSError, ValueError):
            code = 2
            report["persistence"] = {"status": "failed", "reason": "state_persistence_failed"}
    report["exitCode"] = code
    report["runStatus"] = {0: "ok", 1: "attention_required", 2: "stopped"}[code]
    _publish_report(output, report)
    return report, code


def main() -> int:
    if Path.cwd() != ROOT or str(ROOT) != r"C:\sgSHIOK2026":
        raise SystemExit("Wrong working root: this local command requires C:\\sgSHIOK2026")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True, help="Fresh absolute qa/source-monitor/<label> directory")
    parser.add_argument("--previous", type=Path, help="Complete state.json from the previous successful local check")
    parser.add_argument("--max-requests", type=int, default=24)
    parser.add_argument("--max-seconds", type=float, default=300)
    args = parser.parse_args()
    try:
        client = MetadataClient(max_requests=args.max_requests, max_seconds=args.max_seconds)
        report, code = run_check(ROOT, args.output, previous=args.previous, client=client,
                                 credentials={"LTA_DATAMALL_ACCOUNT_KEY": os.environ.get("LTA_DATAMALL_ACCOUNT_KEY", "")})
    except (MonitorError, OSError, ValueError) as error:
        message = str(error) if isinstance(error, MonitorError) else "STOP_LOCAL_CHECK: invalid bounds or local IO failure; no retry"
        print(json.dumps({"exitCode": 2, "error": message}))
        return 2
    print(json.dumps({"output": str(args.output), "exitCode": code, "elapsedSeconds": report["elapsedSeconds"],
                      "counts": report["counts"], "pendingNotices": len(report["pendingNotices"]),
                      "noticeDelivery": report["noticeDelivery"], "integrity": report["integrity"]}, ensure_ascii=True))
    return code


if __name__ == "__main__":
    raise SystemExit(main())
