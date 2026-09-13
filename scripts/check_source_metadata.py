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
from scripts.source_metadata_state import acknowledge, transition, trusted_previous


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
        completion_time = datetime.fromisoformat(publisher_instant(value["finishedAt"]))
        if any(datetime.fromisoformat(state[field].replace("Z", "+00:00")) > completion_time
               for field in ("evaluatedAt", "lastAcknowledgedAt") if state[field] is not None):
            raise MonitorError("STOP_PRIOR_STATE_INVALID: source state postdates completion; no requests executed")
        restored[source["key"]] = state
    if "operation" in completion:
        _validate_ack_completion(root, previous, value, completion, catalog, now)
    else:
        validate_pair_content(value, completion)
    return restored, _sha(content)


def validate_pair_content(envelope: dict, completion: dict) -> None:
    """A checkpoint may consume only a report whose source/notice content agrees."""
    try:
        _pair_content(envelope, completion)
    except (KeyError, TypeError, ValueError, AttributeError):
        raise MonitorError("STOP_PAIR_CONTENT: report operation or state content is inconsistent") from None


def _pair_content(envelope: dict, completion: dict) -> None:
    pending = [notice for state in envelope["sources"].values() for notice in state["pendingNotices"]]
    if completion.get("pendingNotices") != pending:
        # Source checks store processing order, which may differ from envelope order.
        if (not isinstance(completion.get("pendingNotices"), list)
                or sorted(completion["pendingNotices"], key=lambda item: item["id"]) != sorted(pending, key=lambda item: item["id"])):
            raise MonitorError("STOP_PAIR_CONTENT: report and state pending notices disagree")
    if "operation" not in completion:
        if (completion.get("noticeDelivery") != "not_configured"
                or any(key in completion for key in ("acknowledgements", "metadataRequests", "commentReads", "sourceHealth"))):
            raise MonitorError("STOP_PAIR_CONTENT: report operation is missing or inconsistent")
        entries = completion.get("sources")
        if (not isinstance(entries, list) or len(entries) != len(envelope["sources"])
                or any(not isinstance(entry, dict) or entry.get("key") not in envelope["sources"]
                       or entry.get("state") != envelope["sources"][entry["key"]] for entry in entries)
                or len({entry["key"] for entry in entries}) != len(entries)):
            raise MonitorError("STOP_PAIR_CONTENT: report and state source entries disagree")


def _validate_ack_completion(root: Path, previous: Path, envelope: dict, completion: dict,
                             catalog: dict, now: datetime) -> None:
    """Replay acknowledgement only, without recursively traversing or checking sources."""
    try:
        fields = {"schemaVersion", "operation", "startedAt", "finishedAt", "catalogSha256",
                  "previousState", "previousStateSha256", "previousReportSha256", "sourceHealth",
                  "checkCompleted", "metadataRequests", "commentReads", "destination", "authorId",
                  "journalIdentitySha256", "acknowledgements", "pendingNotices", "exitCode", "runStatus",
                  "noticeDelivery", "persistence"}
        records = completion["acknowledgements"]
        if (set(completion) != fields or completion["operation"] != "notice_acknowledgement"
                or completion["sourceHealth"] != "not_rechecked" or completion["checkCompleted"] is not False
                or type(completion["metadataRequests"]) is not int or completion["metadataRequests"] != 0
                or completion["noticeDelivery"] != "verified_existing_receipts"
                or completion["exitCode"] != 0 or completion["runStatus"] != "ok"
                or not isinstance(records, list) or not 1 <= len(records) <= 8
                or type(completion["commentReads"]) is not int or completion["commentReads"] != len(records)
                or not isinstance(completion["previousState"], str)
                or not isinstance(completion["destination"], str)
                or not re.fullmatch(r"[a-z0-9][a-z0-9_-]{0,99}/[a-z0-9][a-z0-9_.-]{0,99}#[1-9][0-9]{0,14}", completion["destination"])
                or type(completion["authorId"]) is not int or not 1 <= completion["authorId"] < 2**53
                or not all(_hash(completion[key]) for key in ("previousStateSha256", "previousReportSha256", "journalIdentitySha256"))):
            raise ValueError("checkpoint schema")
        started = publisher_instant(completion["startedAt"])
        finished = publisher_instant(completion["finishedAt"])
        if not started or not finished or not datetime.fromisoformat(started) <= datetime.fromisoformat(finished) <= now:
            raise ValueError("checkpoint clock")
        before_path = _safe_path(root, root / completion["previousState"])
        if before_path == previous or before_path.name != "state.json" or before_path.parent.parent != root / "qa/source-monitor":
            raise ValueError("checkpoint predecessor")
        before_bytes = _read(before_path)
        before_report_bytes = _read(_safe_path(root, before_path.with_name("report.json")))
        if _sha(before_bytes) != completion["previousStateSha256"] or _sha(before_report_bytes) != completion["previousReportSha256"]:
            raise ValueError("checkpoint predecessor hash")
        before = _json(before_bytes)
        before_report = _json(before_report_bytes)
        if (type(before["schemaVersion"]) is not int or before["schemaVersion"] != 1
                or before["catalogSha256"] != envelope["catalogSha256"]
                or set(before["sources"]) != set(envelope["sources"])
                or datetime.fromisoformat(before["finishedAt"]) > datetime.fromisoformat(started)
                or before_report.get("persistence") != {"status": "verified", "stateSha256": _sha(before_bytes)}
                or before_report.get("catalogSha256") != envelope["catalogSha256"]
                or before_report.get("finishedAt") != before["finishedAt"]
                or type(before_report.get("exitCode")) is not int or before_report["exitCode"] not in (0, 1)
                or before_report.get("runStatus") != {0: "ok", 1: "attention_required"}[before_report["exitCode"]]):
            raise ValueError("checkpoint predecessor content")
        validate_pair_content(before, before_report)
        pending = {notice["id"]: notice for state in before["sources"].values() for notice in state["pendingNotices"]}
        identifiers = []
        for record in records:
            if (not isinstance(record, dict) or set(record) != {"noticeId", "commentId", "receiptSha256", "originState", "originStateSha256", "originReportSha256"}
                    or record["noticeId"] not in pending or record["noticeId"] in identifiers
                    or type(record["commentId"]) is not int or not 1 <= record["commentId"] < 2**53
                    or not all(_hash(record[key]) for key in ("receiptSha256", "originStateSha256", "originReportSha256"))
                    or not isinstance(record["originState"], str)):
                raise ValueError("checkpoint receipt reference")
            identifiers.append(record["noticeId"])
            origin_path = _safe_path(root, root / record["originState"])
            if origin_path.name != "state.json" or origin_path.parent.parent != root / "qa/source-monitor":
                raise ValueError("checkpoint origin path")
            origin_bytes = _read(origin_path)
            origin_report_bytes = _read(_safe_path(root, origin_path.with_name("report.json")))
            if (_sha(origin_bytes) != record["originStateSha256"]
                    or _sha(origin_report_bytes) != record["originReportSha256"]):
                raise ValueError("checkpoint origin hash")
            origin, origin_report = _json(origin_bytes), _json(origin_report_bytes)
            if (origin["catalogSha256"] != envelope["catalogSha256"]
                    or datetime.fromisoformat(origin["finishedAt"]) > datetime.fromisoformat(before["finishedAt"])
                    or origin_report.get("catalogSha256") != envelope["catalogSha256"]
                    or origin_report.get("finishedAt") != origin["finishedAt"]
                    or origin_report.get("persistence") != {"status": "verified", "stateSha256": _sha(origin_bytes)}):
                raise ValueError("checkpoint origin content")
            validate_pair_content(origin, origin_report)
            origin_notices = {item["id"]: item for state in origin["sources"].values() for item in state["pendingNotices"]}
            if origin_notices.get(record["noticeId"]) != pending[record["noticeId"]]:
                raise ValueError("checkpoint origin notice")
        for source in catalog["sources"]:
            state = trusted_previous(source, before["sources"][source["key"]], now)
            if state is not None and any(datetime.fromisoformat(state[field].replace("Z", "+00:00")) > datetime.fromisoformat(before["finishedAt"])
                                         for field in ("evaluatedAt", "lastAcknowledgedAt") if state[field] is not None):
                raise ValueError("checkpoint predecessor state postdates its completion")
            if state is None or acknowledge(state, identifiers, finished) != envelope["sources"][source["key"]]:
                raise ValueError("checkpoint changed non-acknowledgement state")
        validate_pair_content(envelope, completion)
    except (ValueError, TypeError, KeyError, OverflowError, AttributeError):
        raise MonitorError("STOP_PRIOR_STATE_INVALID: invalid acknowledgement checkpoint; no requests executed") from None


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


def run_check(root: Path, output: Path, *, bootstrap: bool = False, previous: Path | None = None,
              client: MetadataClient | None = None, credentials: dict[str, str] | None = None,
              clock: Callable[[], datetime] = lambda: datetime.now(UTC)) -> tuple[dict, int]:
    """One pass into a fresh directory; explicitly bootstrap or restore complete prior state."""
    if (type(bootstrap) is not bool or bootstrap == (previous is not None)
            or (previous is not None and not isinstance(previous, Path))):
        raise MonitorError("STOP_INITIALIZATION: choose exactly one of bootstrap=True or previous=Path; no IO executed")
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
    initialization = parser.add_mutually_exclusive_group(required=True)
    initialization.add_argument("--bootstrap", action="store_true", help="Explicit first run without prior state; not a recovery fallback")
    initialization.add_argument("--previous", type=Path, help="Prior state.json with matching verified exit-0 or exit-1 report.json")
    parser.add_argument("--max-requests", type=int, default=24)
    parser.add_argument("--max-seconds", type=float, default=300)
    args = parser.parse_args()
    try:
        client = MetadataClient(max_requests=args.max_requests, max_seconds=args.max_seconds)
        report, code = run_check(ROOT, args.output, bootstrap=args.bootstrap, previous=args.previous, client=client,
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
