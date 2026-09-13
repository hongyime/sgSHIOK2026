"""Inactive maintenance integration: one check or one pinned delivery-resume batch.

No CLI, scheduler, credential lookup or implicit journal initialization. Callers
must supply an approved journal, bounded GitHub client and metadata client. All
runtime verification here uses synthetic responses, not activated providers.
Return the pinned current/origin references to the operator; never replace a
latest-state pointer. A failed delivery preserves its intent and original pair.
This is not hosted storage, backup, rollback defense or multi-host scheduling.
"""

from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
import re
from typing import Callable

from scripts import check_source_metadata as monitor
from scripts.acknowledge_source_notices import publish_checkpoint, MAX_ACKNOWLEDGEMENTS
from scripts.source_metadata_comments import LocalCommentJournal, deliver_comment, plan_comment
from scripts.source_metadata_github import GitHubCommentClient
from scripts.source_metadata_http import MetadataClient


@dataclass(frozen=True)
class StateRef:
    path: Path
    state_sha256: str
    report_sha256: str


def _pin(path: Path) -> StateRef:
    return StateRef(path, monitor._sha(monitor._read(path)),
                    monitor._sha(monitor._read(path.with_name("report.json"))))


def _load(root: Path, ref: StateRef, now: datetime) -> tuple[dict, dict, dict]:
    if (not isinstance(ref, StateRef) or not isinstance(ref.path, Path)
            or ref.path.name != "state.json" or ref.path.parent.parent != root / "qa/source-monitor"
            or not monitor._hash(ref.state_sha256) or not monitor._hash(ref.report_sha256)):
        raise monitor.MonitorError("STOP_RUNNER_STATE_REFERENCE")
    path = monitor._safe_path(root, ref.path)
    companion = monitor._safe_path(root, path.with_name("report.json"))
    raw, report_raw = monitor._read(path), monitor._read(companion)
    for name, content, expected in (("state", raw, ref.state_sha256), ("report", report_raw, ref.report_sha256)):
        actual = monitor._sha(content)
        if actual != expected:
            raise monitor.MonitorError(f"STOP_RUNNER_PIN_MISMATCH {name} expected={expected} actual={actual}")
    catalog_path = monitor._safe_path(root, root / "source-metadata-catalog.json")
    catalog_raw = monitor._read(catalog_path)
    catalog = monitor.validate_catalog(monitor._json(catalog_raw))
    monitor._verify_anchors(root, catalog)
    catalog_sha = monitor._sha(catalog_raw)
    states, state_sha = monitor._restore(root, path, catalog, catalog_sha, now)
    report = monitor._json(report_raw)
    monitor.validate_pair_content(monitor._json(raw), report)
    if (state_sha != ref.state_sha256 or monitor._read(path) != raw
            or monitor._read(companion) != report_raw or monitor._read(catalog_path) != catalog_raw):
        raise monitor.MonitorError("STOP_RUNNER_PAIR_CHANGED")
    return states, report, {"catalogSha256": catalog_sha, "stateSha256": ref.state_sha256,
                            "reportSha256": ref.report_sha256}


def _fresh(root: Path, output: Path) -> None:
    monitor._safe_path(root, output)
    if (output.parent != root / "qa/source-monitor" or output.exists()
            or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,79}", output.name)):
        raise monitor.MonitorError("STOP_RUNNER_OUTPUT: fresh source-monitor directory required")


def _client(journal: LocalCommentJournal, transport: GitHubCommentClient) -> None:
    if (not isinstance(journal, LocalCommentJournal) or not isinstance(transport, GitHubCommentClient)
            or transport._budget is None
            or transport._budget.journal.path != journal.path
            or transport._budget.journal.identity != journal.identity):
        raise monitor.MonitorError("STOP_RUNNER_BOUNDED_CLIENT_REQUIRED")
    transport._budget.check_dispatch()


def _pending(states: dict) -> dict:
    return {notice["id"]: notice for state in states.values() for notice in state["pendingNotices"]}


def _reference(ref: StateRef) -> dict:
    return {"path": str(ref.path), "stateSha256": ref.state_sha256, "reportSha256": ref.report_sha256}


def _stopped(result: dict, transport: GitHubCommentClient, reason: str, error: Exception) -> dict:
    return {**result, "status": "stopped", "reason": reason,
            "detail": str(error) if isinstance(error, monitor.MonitorError) else "STOP_LOCAL_PUBLICATION",
            "osError": getattr(error, "errno", None), "winError": getattr(error, "winerror", None),
            "githubRequests": transport._budget.count}


def resume_pending(root: Path, output: Path, *, origin: StateRef, current: StateRef,
                   journal: LocalCommentJournal, transport: GitHubCommentClient,
                   clock: Callable[[], datetime] = lambda: datetime.now(UTC)) -> dict:
    """At most eight notices, one shared 24-request/300-second GitHub budget.

    Preserve original plans on every resume. Stop on the first failure; verified
    earlier receipts remain in the journal, but no partial acknowledgement is
    invented. A later explicit resume may GET-verify them, never re-POST them.
    """
    _fresh(root, output)
    _client(journal, transport)
    now = clock()
    origins, original_report, identity = _load(root, origin, now)
    states, current_report, _ = _load(root, current, now)
    if "operation" in original_report:
        raise monitor.MonitorError("STOP_RUNNER_ORIGIN: original metadata check required")
    pending, original = _pending(states), _pending(origins)
    if (datetime.fromisoformat(original_report["finishedAt"]) > datetime.fromisoformat(current_report["finishedAt"])
            or any(original.get(key) != notice for key, notice in pending.items())):
        raise monitor.MonitorError("STOP_RUNNER_ORIGIN: pending notices differ from original check")
    result = {"operation": "maintenance_delivery_batch", "status": "no_pending_notices",
              "originState": _reference(origin), "currentState": _reference(current),
              "sourceHealth": "not_rechecked", "metadataRequests": 0,
              "pendingCount": len(pending), "acknowledgedIds": [], "deliveries": []}
    proofs = []
    for key in sorted(pending)[:MAX_ACKNOWLEDGEMENTS]:
        # Revalidate pins and anchors before each potentially external request.
        try:
            _load(root, origin, clock())
            _load(root, current, clock())
        except (monitor.MonitorError, OSError) as error:
            return _stopped(result, transport, "input_revalidation_failed", error)
        plan = plan_comment(transport.destination, identity, pending[key], author_id=transport.author_id)
        delivery = deliver_comment(plan, journal=journal, transport=transport)
        result["deliveries"].append({"noticeId": key, **delivery})
        if delivery["status"] != "verified":
            return {**result, "status": "stopped", "reason": delivery["reason"],
                    "githubRequests": transport._budget.count}
        proofs.append({"originState": str(origin.path), "noticeId": key,
                       "receiptSha256": delivery["receiptSha256"]})
    if proofs:
        try:
            _load(root, origin, clock())
            _load(root, current, clock())
            report = publish_checkpoint(root, output, previous=current.path, proofs=proofs,
                destination=transport.destination, author_id=transport.author_id,
                journal=journal, transport=transport, clock=clock)
            ref = _pin(output / "state.json")
            _, saved_report, _ = _load(root, ref, clock())
            if (saved_report != report or report["previousStateSha256"] != current.state_sha256
                    or report["previousReportSha256"] != current.report_sha256
                    or {entry["noticeId"] for entry in report["acknowledgements"]} != {p["noticeId"] for p in proofs}
                    or any(entry["originStateSha256"] != origin.state_sha256
                           or entry["originReportSha256"] != origin.report_sha256
                           for entry in report["acknowledgements"])):
                raise monitor.MonitorError("STOP_RUNNER_ACK_PIN_MISMATCH")
            _load(root, origin, clock())
            _load(root, current, clock())
        except (monitor.MonitorError, OSError) as error:
            return _stopped(result, transport, "acknowledgement_failed", error)
        result.update(status="acknowledged", currentState=_reference(ref),
                      pendingCount=len(report["pendingNotices"]),
                      acknowledgedIds=[entry["noticeId"] for entry in report["acknowledgements"]])
    return {**result, "githubRequests": transport._budget.count}


def run_cycle(root: Path, check_output: Path, acknowledgement_output: Path, *,
              bootstrap: bool = False, previous: StateRef | None = None,
              metadata_client: MetadataClient, journal: LocalCommentJournal,
              transport_factory: Callable[[], GitHubCommentClient], credentials: dict[str, str] | None = None,
              clock: Callable[[], datetime] = lambda: datetime.now(UTC)) -> dict:
    """Check once, then deliver. Pending prior notices require explicit resume first.

    Passing clients is not service approval. No default real transport is created.
    Metadata and GitHub have separate bounded budgets; no overall300s claim.
    """
    if type(bootstrap) is not bool or bootstrap == (previous is not None):
        raise monitor.MonitorError("STOP_INITIALIZATION: choose bootstrap or pinned previous state")
    if metadata_client is None:
        raise monitor.MonitorError("STOP_RUNNER_METADATA_CLIENT_REQUIRED")
    _fresh(root, check_output)
    _fresh(root, acknowledgement_output)
    if check_output == acknowledgement_output:
        raise monitor.MonitorError("STOP_RUNNER_OUTPUT: check and acknowledgement must differ")
    if not isinstance(journal, LocalCommentJournal) or not callable(transport_factory):
        raise monitor.MonitorError("STOP_RUNNER_CLIENT_FACTORY")
    if previous is not None:
        states, _, _ = _load(root, previous, clock())
        if _pending(states):
            raise monitor.MonitorError("STOP_RUNNER_PENDING: resume original notice batch before another check")
    report, code = monitor.run_check(root, check_output, bootstrap=bootstrap,
        previous=previous.path if previous else None, client=metadata_client,
        credentials=credentials, clock=clock)
    if code == 2:
        return {"status": "stopped", "reason": "metadata_check_stopped", "checkExitCode": code,
                "checkOutput": str(check_output), "integrity": report["integrity"], "githubRequests": 0}
    if previous is not None:
        if report["previousStateSha256"] != previous.state_sha256:
            raise monitor.MonitorError("STOP_RUNNER_CONSUMED_STATE_PIN_MISMATCH")
        _load(root, previous, clock())
    ref = _pin(check_output / "state.json")
    # Start the GitHub phase's one budget after metadata work, never per notice.
    transport = transport_factory()
    result = resume_pending(root, acknowledgement_output, origin=ref, current=ref,
                            journal=journal, transport=transport, clock=clock)
    return {**result, "operation": "maintenance_cycle", "checkExitCode": code,
            "metadataRequests": report["transport"]["requests"],
            "sourceHealth": report["runStatus"], "checkCompleted": report["checkCompleted"]}


if __name__ == "__main__":
    raise SystemExit("No activation CLI: service and scheduler approval remain required.")
