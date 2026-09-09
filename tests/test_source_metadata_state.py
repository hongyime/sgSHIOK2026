"""Portable state-machine cases; the optional capture entry point runs this file only."""

from copy import deepcopy
from datetime import UTC, datetime


if __name__ == "__main__":
    import hashlib
    import json
    import os
    from pathlib import Path
    import re
    import subprocess
    import sys
    import time

    root = Path("C:/sgSHIOK2026")
    if Path.cwd() != root:
        raise SystemExit("Wrong working root")
    if len(sys.argv) != 3 or sys.argv[1] != "--capture" or not re.fullmatch(r"state-tests-[a-z0-9-]+", sys.argv[2]):
        raise SystemExit("Use --capture state-tests-FRESH-LABEL")
    directory = root / "qa/revamp-r1/source-monitor-20260909" / sys.argv[2]
    directory.mkdir(parents=True, exist_ok=False)

    def identities():
        result = {}
        for name in ["scripts/source_metadata_state.py", "tests/test_source_metadata_state.py"]:
            path = root / name
            if not path.exists():
                result[name] = {"missing": True}
            else:
                content = path.read_bytes()
                result[name] = {"bytes": len(content), "sha256": hashlib.sha256(content).hexdigest()}
        return result

    before = identities()
    command = [str(root / ".venv/Scripts/python.exe"), "-B", "-m", "pytest", "-q",
               str(root / "tests/test_source_metadata_state.py"), "--noconftest", "-p", "no:cacheprovider",
               "-o", "addopts=", "--basetemp", str(directory / "pytest-temp")]
    environment = dict(os.environ, PYTEST_DISABLE_PLUGIN_AUTOLOAD="1", PYTHONDONTWRITEBYTECODE="1", PYTEST_ADDOPTS="")
    start = time.perf_counter()
    run = subprocess.run(command, cwd=root, env=environment, capture_output=True, text=True, timeout=120)
    after = identities()
    receipt = {"command": command, "cwd": str(root), "exitCode": run.returncode,
               "elapsedMs": (time.perf_counter() - start) * 1000, "stdout": run.stdout, "stderr": run.stderr,
               "before": before, "after": after, "sourcesUnchanged": before == after,
               "pluginsDisabled": True, "conftestDisabled": True, "bytecodeDisabled": True}
    with (directory / "checks.json").open("x", encoding="utf-8") as handle:
        json.dump(receipt, handle, indent=2)
        handle.write("\n")
    print(run.stdout, end="")
    print(run.stderr, end="", file=sys.stderr)
    print(f"RECEIPT={directory / 'checks.json'}")
    raise SystemExit(run.returncode if before == after else 1)


import pytest

from scripts import source_metadata_state
from scripts.source_metadata_state import acknowledge, transition


NOW = "2026-09-09T00:00:00Z"
LATER = "2026-09-10T00:00:00Z"
AFTER = "2026-09-11T00:00:00Z"
END = "2026-09-12T00:00:00Z"


def source(**changes):
    value = {"key": "covered_linkway", "name": "Covered Linkway", "mode": "metadata", "staleAfterDays": 120,
             "baseline": {"publisherUpdatedAt": "2026-09-01T00:00:00Z", "sha256": "a" * 64}}
    value.update(changes)
    return value


def observed(identity="revision-1", **changes):
    value = {"outcome": "observed", "attempted": True, "metadata": {
        "identity": identity, "publisherUpdatedAt": "2026-09-01T00:00:00Z",
        "kind": "catalogue_revision", "etag": '"etag-1"'}}
    value.update(changes)
    return value


def failure(outcome="timeout", **changes):
    return {"outcome": outcome, "attempted": True, **changes}


def notice(state):
    assert len(state["pendingNotices"]) == 1
    return state["pendingNotices"][0]


def test_old_source_stays_old_when_checked_today_and_new_upstream_is_seen():
    spec = source(baseline={"publisherUpdatedAt": "2026-03-06T08:24:22Z", "sha256": "a" * 64})
    state = transition(spec, None, observed(), NOW)
    assert state["freshness"]["status"] == "stale"
    assert state["freshness"]["publisherUpdatedAt"] == "2026-03-06T08:24:22Z"
    assert state["observedFreshness"]["status"] == "current"
    assert state["availability"] == "available"
    assert state["evaluatedAt"] == state["lastAttemptAt"] == state["lastSuccessfulCheckAt"] == NOW
    assert "baseline_stale" in notice(state)["reasons"]


@pytest.mark.parametrize("updated", [None, "2026-02-30T00:00:00Z", "2026-09-01", "2026-09-01T00:00:00", "2027-01-01T00:00:00Z"])
def test_unknown_invalid_naive_or_future_dates_never_become_fresh(updated):
    spec = source(baseline={"publisherUpdatedAt": updated, "sha256": "a" * 64, "fetchedAt": NOW})
    state = transition(spec, None, observed(), NOW)
    assert state["freshness"]["status"] == "unknown"
    assert state["freshness"]["ageDays"] is None
    assert "baseline_age_unknown" in notice(state)["reasons"]


def test_equivalent_timezone_instants_have_equal_state_and_no_private_clock():
    assert transition(source(), None, observed(), NOW) == transition(source(), None, observed(), "2026-09-09T08:00:00+08:00")
    assert transition(source(), None, observed(), NOW) == transition(source(), None, observed(), datetime(2026, 9, 9, tzinfo=UTC))


@pytest.mark.parametrize("now", [None, "bad", "2026-09-09", "2026-09-09T00:00:00", datetime(2026, 9, 9)])
def test_action_time_requires_an_explicit_valid_instant(now):
    with pytest.raises(ValueError):
        transition(source(), None, observed(), now)


def test_first_good_observation_establishes_baseline_without_claiming_a_change():
    state = transition(source(), None, observed(), NOW)
    assert state["comparison"] == "first_observation"
    assert state["pendingNotices"] == []
    assert state["latestObservation"] == state["lastKnownRevision"]
    assert state["episode"] == 1
    assert state["lastAcknowledgedAt"] is None


def test_unchanged_revision_does_not_notify_and_keeps_episode():
    first = transition(source(), None, observed(), NOW)
    second = transition(source(), first, observed(), LATER)
    assert second["comparison"] == "revision_unchanged"
    assert second["pendingNotices"] == []
    assert second["conditionId"] == first["conditionId"]
    assert second["episode"] == first["episode"]
    assert second["lastSuccessfulCheckAt"] == LATER


def test_revision_change_pending_intent_survives_unchanged_checks_until_acknowledged():
    first = transition(source(), None, observed(), NOW)
    changed = transition(source(), first, observed("revision-2"), LATER)
    repeated = transition(source(), changed, observed("revision-2"), AFTER)
    assert changed["comparison"] == "revision_changed"
    assert repeated["comparison"] == "revision_unchanged"
    assert notice(changed) == notice(repeated)
    assert notice(changed)["kind"] == "action"
    assert "metadata_changed" in notice(changed)["reasons"]
    acked = acknowledge(repeated, [notice(repeated)["id"]], AFTER)
    assert acked["pendingNotices"] == []
    assert acked["lastAcknowledgedAt"] == AFTER
    assert transition(source(), acked, observed("revision-2"), END)["pendingNotices"] == []


@pytest.mark.parametrize("outcome", ["unsupported", "credentials_required", "rate_limited", "timeout", "http_error", "malformed", "oversized", "redirect_blocked"])
def test_failure_preserves_last_good_and_reports_availability_separately(outcome):
    good = transition(source(), None, observed(), NOW)
    bad = transition(source(), good, failure(outcome), LATER)
    assert bad["availability"] == outcome
    assert bad["lastAttemptAt"] == LATER
    assert bad["lastSuccessfulCheckAt"] == NOW
    assert bad["latestObservation"] == good["latestObservation"]
    assert bad["lastKnownRevision"] == good["lastKnownRevision"]
    assert bad["freshness"]["status"] == "current"
    assert bad["comparison"] == "unknown"
    assert notice(bad)["kind"] == "action"


def test_rate_limit_deferred_evaluation_retains_cooldown_failure_and_notice():
    limited = transition(source(), None, failure("rate_limited", statusCode=429, retryAt=AFTER), NOW)
    deferred = transition(source(), limited, {"outcome": "deferred", "attempted": False}, LATER)
    assert deferred["evaluatedAt"] == LATER
    assert deferred["lastAttemptAt"] == NOW
    assert deferred["lastSuccessfulCheckAt"] is None
    assert deferred["availability"] == "rate_limited"
    assert deferred["retryAt"] == AFTER
    assert notice(deferred)["id"] == notice(limited)["id"]


def test_retry_time_and_check_time_do_not_create_new_episodes():
    first = transition(source(), None, failure("rate_limited", statusCode=429, retryAt=AFTER), NOW)
    again = transition(source(), first, failure("rate_limited", statusCode=429, retryAt=END), LATER)
    assert notice(again) == notice(first)
    assert again["retryAt"] == END


def test_failure_recovery_and_recurrence_have_monotonic_distinct_intents():
    first = transition(source(), None, failure(), NOW)
    acknowledged = acknowledge(first, [notice(first)["id"]], NOW)
    recovered = transition(source(), acknowledged, observed(), LATER)
    recurrent = transition(source(), recovered, failure(), AFTER)
    assert notice(recovered)["kind"] == "recovery"
    assert "recovered" in notice(recovered)["reasons"]
    assert first["episode"] < recovered["episode"] < recurrent["episode"]
    assert notice(first)["id"] != notice(recurrent)["id"]
    assert notice(recurrent)["kind"] == "action"
    assert acknowledge(recurrent, [notice(first)["id"]], END)["pendingNotices"] == recurrent["pendingNotices"]


def test_acknowledging_unknown_ids_is_a_copy_without_state_changes_or_delivery_claims():
    state = transition(source(), None, failure(), NOW)
    copied = acknowledge(state, ["unknown", "unknown"], LATER)
    assert copied == state and copied is not state
    assert copied["pendingNotices"] is not state["pendingNotices"]
    assert "deliveredAt" not in str(copied)


def test_not_modified_requires_previous_success_and_preserves_original_observation_time():
    first = transition(source(), None, observed(), NOW)
    second = transition(source(), first, {"outcome": "not_modified", "attempted": True, "statusCode": 304}, LATER)
    assert second["availability"] == "available"
    assert second["comparison"] == "revision_unchanged"
    assert second["lastSuccessfulCheckAt"] == LATER
    assert second["latestObservation"] == first["latestObservation"]


def test_not_modified_without_trusted_observation_is_unknown_not_success():
    state = transition(source(), None, {"outcome": "not_modified", "attempted": True}, NOW)
    assert state["availability"] == "unknown"
    assert state["comparison"] == "unknown"
    assert state["lastSuccessfulCheckAt"] is None
    assert "untrusted_not_modified" in notice(state)["reasons"]


def test_not_modified_can_recover_after_transport_failure_without_discarding_last_good():
    first = transition(source(), None, observed(), NOW)
    bad = transition(source(), first, failure(), LATER)
    recovered = transition(source(), bad, {"outcome": "not_modified", "attempted": True}, AFTER)
    assert recovered["lastSuccessfulCheckAt"] == AFTER
    assert recovered["latestObservation"] == first["latestObservation"]
    assert notice(recovered)["kind"] == "recovery"


def test_listing_references_never_claim_catalogue_or_payload_revision_identity():
    result = observed(metadata={"identity": "https://example.test/list.zip", "publisherUpdatedAt": None,
                                "kind": "listing_reference", "etag": None})
    first = transition(source(), None, result, NOW)
    second = transition(source(), first, result, LATER)
    assert second["comparison"] == "reference_unchanged"
    assert second["lastKnownRevision"] is None
    assert second["observedFreshness"]["status"] == "unknown"
    result["metadata"]["identity"] = "https://example.test/new-list.zip"
    assert transition(source(), second, result, AFTER)["comparison"] == "reference_changed"


def test_signature_rotation_does_not_change_reference_condition_or_notice():
    def result(signature):
        return observed(metadata={"identity": f"https://example.test/list.zip?ID=Covered&X-Amz-Signature={signature}&X-Amz-Expires=5",
                                  "publisherUpdatedAt": None, "kind": "listing_reference", "etag": None})
    first = transition(source(), None, result("private-a"), NOW)
    second = transition(source(), first, result("private-b"), LATER)
    assert second["conditionId"] == first["conditionId"]
    assert second["episode"] == first["episode"]
    assert second["comparison"] == "reference_unchanged"
    assert "private-" not in str(second)


def test_listing_observation_does_not_overwrite_last_known_catalogue_revision():
    first = transition(source(), None, observed(), NOW)
    result = observed(metadata={"identity": "listing-1", "publisherUpdatedAt": None, "kind": "listing_reference", "etag": None})
    second = transition(source(), first, result, LATER)
    assert second["lastKnownRevision"] == first["lastKnownRevision"]
    assert second["latestObservation"]["kind"] == "listing_reference"


def test_expected_manual_source_has_no_attempt_or_alarm():
    state = transition(source(mode="manual"), None, {"outcome": "manual", "attempted": False}, NOW)
    assert state["availability"] == "manual" and state["comparison"] == "manual"
    assert state["freshness"]["status"] == "manual"
    assert state["lastAttemptAt"] is None and state["lastSuccessfulCheckAt"] is None
    assert state["pendingNotices"] == []
    with pytest.raises(ValueError):
        transition(source(mode="manual"), state, observed(), LATER)


def test_missing_credentials_without_attempt_is_actionable_but_not_a_successful_check():
    state = transition(source(), None, {"outcome": "credentials_required", "attempted": False}, NOW)
    assert state["lastAttemptAt"] is None
    assert state["lastSuccessfulCheckAt"] is None
    assert "credentials_required" in notice(state)["reasons"]


def test_empty_metadata_is_unknown_and_cannot_authorize_a_later_304():
    result = observed(metadata={"identity": None, "publisherUpdatedAt": None, "kind": "catalogue_revision", "etag": None})
    state = transition(source(), None, result, NOW)
    assert state["comparison"] == "unknown"
    assert "metadata_identity_unknown" in notice(state)["reasons"]
    later = transition(source(), state, {"outcome": "not_modified", "attempted": True}, LATER)
    assert later["availability"] == "unknown"
    assert later["lastSuccessfulCheckAt"] == NOW


@pytest.mark.parametrize("change", [
    {"version": 99}, {"sourceKey": "other"}, {"episode": True}, {"episode": -1},
    {"lastSuccessfulCheckAt": "invalid"}, {"latestObservation": []}, {"conditionId": "fake"},
    {"pendingNotices": [{"id": "invented"}]}, {"extra": "unknown schema"},
])
def test_malformed_previous_state_cannot_authorize_unchanged_claim(change):
    prior = transition(source(), None, observed(), NOW)
    prior.update(change)
    state = transition(source(), prior, {"outcome": "not_modified", "attempted": True}, LATER)
    assert state["priorStateInvalid"] is True
    assert state["availability"] == "unknown"
    assert state["comparison"] == "unknown"
    assert state["latestObservation"] is None
    assert state["lastSuccessfulCheckAt"] is None
    assert "prior_state_invalid" in notice(state)["reasons"]
    with pytest.raises(ValueError):
        acknowledge(prior, ["invented"], LATER)


def test_changed_source_policy_invalidates_trusted_prior_context():
    prior = transition(source(), None, observed(), NOW)
    state = transition(source(staleAfterDays=30), prior, {"outcome": "not_modified", "attempted": True}, LATER)
    assert state["priorStateInvalid"] is True
    assert state["comparison"] == "unknown"


@pytest.mark.parametrize("result", [observed(attempted=False), observed(metadata={"kind": "future_kind"}), {"outcome": "future", "attempted": True}])
def test_malformed_results_do_not_replace_last_good(result):
    good = transition(source(), None, observed(), NOW)
    state = transition(source(), good, result, LATER)
    assert state["availability"] == "malformed"
    assert state["lastSuccessfulCheckAt"] == NOW
    assert state["latestObservation"] == good["latestObservation"]


def test_freshness_threshold_crossing_not_daily_age_counters_changes_notice_episode():
    spec = source(staleAfterDays=8)
    first = transition(spec, None, observed(), NOW)
    assert first["freshness"]["status"] == "current"
    stale = transition(spec, first, observed(), LATER)
    repeated = transition(spec, stale, observed(), AFTER)
    assert stale["freshness"]["status"] == "stale"
    assert notice(stale)["id"] == notice(repeated)["id"]
    assert stale["freshness"]["ageDays"] < repeated["freshness"]["ageDays"]


def test_transition_and_acknowledge_do_not_mutate_any_input():
    spec, result = source(), observed()
    first = transition(spec, None, failure(), NOW)
    before = deepcopy((spec, first, result))
    next_state = transition(spec, first, result, LATER)
    ids = [notice(next_state)["id"]]
    snapshot = deepcopy(next_state)
    acknowledge(next_state, ids, AFTER)
    assert (spec, first, result) == before
    assert next_state == snapshot


def test_time_moving_backwards_is_rejected_instead_of_rewriting_history():
    state = transition(source(), None, failure(), LATER)
    with pytest.raises(ValueError):
        transition(source(), state, observed(), NOW)
    with pytest.raises(ValueError):
        acknowledge(state, [notice(state)["id"]], NOW)


@pytest.mark.parametrize("result", [
    observed(statusCode=503), observed(statusCode=304),
    {"outcome": "not_modified", "attempted": True, "statusCode": 200},
    {"outcome": "deferred", "attempted": True},
    {"outcome": [], "attempted": True},
])
def test_contradictory_or_non_scalar_outcome_cannot_claim_success(result):
    good = transition(source(), None, observed(), NOW)
    state = transition(source(), good, result, LATER)
    assert state["availability"] == "malformed"
    assert state["lastSuccessfulCheckAt"] == NOW
    assert state["latestObservation"] == good["latestObservation"]


@pytest.mark.parametrize("field,value", [
    ("observedAt", "2027-01-01T00:00:00Z"),
    ("kind", "future-kind"),
    ("identity", {}),
])
def test_malformed_persisted_observation_does_not_authorize_304(field, value):
    prior = transition(source(), None, observed(), NOW)
    prior["latestObservation"][field] = value
    state = transition(source(), prior, {"outcome": "not_modified", "attempted": True}, LATER)
    assert state["priorStateInvalid"] is True
    assert state["lastSuccessfulCheckAt"] is None
    assert state["comparison"] == "unknown"


def test_last_known_revision_cannot_be_forged_from_a_listing():
    prior = transition(source(), None, observed(), NOW)
    prior["lastKnownRevision"]["kind"] = "listing_reference"
    state = transition(source(), prior, {"outcome": "not_modified", "attempted": True}, LATER)
    assert state["priorStateInvalid"] is True
    assert state["lastKnownRevision"] is None


def test_malformed_prior_with_valid_observation_reestablishes_trust_without_unchanged_claim():
    state = transition(source(), {"invalid": True}, observed(), NOW)
    assert state["availability"] == "available"
    assert state["comparison"] == "unknown"
    assert state["priorStateInvalid"] is True
    assert "prior_state_invalid" in notice(state)["reasons"]
    next_state = transition(source(), state, {"outcome": "not_modified", "attempted": True}, LATER)
    assert next_state["priorStateInvalid"] is False
    assert next_state["comparison"] == "revision_unchanged"
    assert notice(next_state)["kind"] == "recovery"


def test_stale_notice_is_superseded_by_current_recovery_not_delivered_late():
    first = transition(source(), None, failure(), NOW)
    recovered = transition(source(), first, observed(), LATER)
    assert len(recovered["pendingNotices"]) == 1
    assert notice(recovered)["id"] != notice(first)["id"]
    assert notice(recovered)["kind"] == "recovery"


def test_acknowledgment_time_does_not_rewrite_evaluation_or_check_time():
    first = transition(source(), None, failure(), NOW)
    acked = acknowledge(first, [notice(first)["id"], notice(first)["id"]], LATER)
    assert acked["evaluatedAt"] == first["evaluatedAt"]
    assert acked["lastAttemptAt"] == first["lastAttemptAt"]
    assert acked["lastSuccessfulCheckAt"] is None
    assert acked["lastAcknowledgedAt"] == LATER
    with pytest.raises(ValueError):
        transition(source(), acked, observed(), NOW)


def test_trusted_previous_is_a_deep_copy_without_evaluation_or_notice_changes():
    spec = source(mode="automatic")
    good = transition(spec, None, observed(), NOW)
    previous = transition(spec, good, failure("rate_limited", statusCode=429, retryAt=END), LATER)
    before = deepcopy((spec, previous))
    copied = source_metadata_state.trusted_previous(spec, previous, AFTER)
    assert copied == previous and copied is not previous
    assert copied["latestObservation"]["etag"] == '"etag-1"'
    assert copied["retryAt"] == END
    copied["latestObservation"]["etag"] = '"different"'
    copied["lastKnownRevision"]["identity"] = "different"
    copied["freshness"]["ageDays"] = 999
    copied["observedFreshness"]["ageDays"] = 999
    copied["pendingNotices"][0]["reasons"].append("recovered")
    assert (spec, previous) == before


@pytest.mark.parametrize("previous", [None, {}, [], "invalid"])
def test_trusted_previous_absent_or_malformed_state_is_none(previous):
    assert source_metadata_state.trusted_previous(source(), previous, NOW) is None


@pytest.mark.parametrize("change", [
    {"version": 99}, {"extra": "unrecognized"}, {"conditionId": "a" * 64},
    {"latestObservation": {"etag": '"unchecked"'}},
    {"pendingNotices": [{"id": "invented"}]}, {"retryAt": "invalid"},
])
def test_trusted_previous_rejects_invalid_complete_state(change):
    previous = transition(source(), None, observed(), NOW)
    previous.update(change)
    assert source_metadata_state.trusted_previous(source(), previous, LATER) is None


@pytest.mark.parametrize("changes", [
    {"key": "other_source"}, {"mode": "manual"}, {"staleAfterDays": 30},
    {"baseline": {"publisherUpdatedAt": "2026-08-01T00:00:00Z", "sha256": "a" * 64}},
    {"baseline": {"publisherUpdatedAt": "2026-09-01T00:00:00Z", "sha256": "b" * 64}},
])
def test_trusted_previous_rejects_valid_but_different_source_context(changes):
    previous = transition(source(), None, observed(), NOW)
    assert source_metadata_state.trusted_previous(source(**changes), previous, LATER) is None


@pytest.mark.parametrize("acknowledged", [False, True])
def test_trusted_previous_rejects_time_before_valid_evaluation_or_acknowledgment(acknowledged):
    previous = transition(source(), None, failure(), NOW if acknowledged else LATER)
    if acknowledged:
        previous = acknowledge(previous, [notice(previous)["id"]], LATER)
    with pytest.raises(ValueError, match="now precedes persisted state"):
        source_metadata_state.trusted_previous(source(), previous, NOW)
    assert source_metadata_state.trusted_previous(source(), previous, LATER) == previous


def test_trusted_previous_future_cooldown_and_unknown_publisher_age_are_not_clock_rollback():
    result = observed(metadata={"identity": "revision-1", "publisherUpdatedAt": "2027-01-01T00:00:00Z",
                                "kind": "catalogue_revision", "etag": '"etag-1"'})
    good = transition(source(), None, result, NOW)
    previous = transition(source(), good, failure("rate_limited", statusCode=429,
                                                retryAt="2026-09-20T00:00:00Z"), LATER)
    copied = source_metadata_state.trusted_previous(source(), previous, AFTER)
    assert copied == previous
    assert copied["retryAt"] == "2026-09-20T00:00:00Z"
    assert copied["observedFreshness"]["status"] == "unknown"


def test_trusted_previous_does_not_read_ordering_from_untrusted_or_mismatched_state():
    previous = transition(source(), None, observed(), LATER)
    assert source_metadata_state.trusted_previous(source(key="other_source"), previous, NOW) is None
    previous["extra"] = True
    assert source_metadata_state.trusted_previous(source(), previous, NOW) is None


def test_trusted_previous_validates_caller_time_and_source_even_without_prior_state():
    with pytest.raises(ValueError, match="timezone-aware"):
        source_metadata_state.trusted_previous(source(), None, "invalid")
    with pytest.raises(ValueError, match="stable key"):
        source_metadata_state.trusted_previous({}, None, NOW)
