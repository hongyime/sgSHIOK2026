"""Pure metadata-monitor state; no IO, private clock, processing or notice delivery.

`freshness` ages the immutable source baseline; `observedFreshness` ages the latest
successful upstream observation. Neither availability nor a download date changes
the baseline. `lastKnownRevision` is catalogue-only, never a listing reference.
Pending notices describe the current condition only; a new episode supersedes an
obsolete pending intent. Acknowledgment is not evidence of external delivery.
"""

from copy import deepcopy
from datetime import UTC, datetime
import hashlib
import json
import math
import re
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


OUTCOMES = {"observed", "not_modified", "manual", "unsupported", "credentials_required",
            "rate_limited", "timeout", "http_error", "malformed", "oversized", "redirect_blocked", "deferred"}
AVAILABILITY = (OUTCOMES - {"observed", "not_modified", "deferred"}) | {"available", "unknown"}
COMPARISONS = {"unknown", "manual", "first_observation", "revision_changed", "revision_unchanged",
               "reference_changed", "reference_unchanged"}
REASONS = AVAILABILITY | {"prior_state_invalid", "untrusted_not_modified", "unexpected_manual", "deferred",
                         "baseline_stale", "baseline_age_unknown", "metadata_identity_unknown",
                         "publisher_date_unknown", "upstream_stale", "metadata_changed", "recovered"}
STATE_KEYS = {"version", "sourceKey", "sourceContext", "evaluatedAt", "lastAttemptAt", "lastSuccessfulCheckAt",
              "availability", "availabilityReason", "statusCode", "retryAt", "freshness", "observedFreshness",
              "latestObservation", "lastKnownRevision", "comparison", "priorStateInvalid", "episode",
              "conditionId", "pendingNotices", "lastAcknowledgedAt"}
INSTANT = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})\Z")


def _instant(value: Any) -> datetime | None:
    try:
        if isinstance(value, datetime):
            parsed = value
        elif isinstance(value, str) and INSTANT.fullmatch(value):
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        else:
            return None
        if parsed.tzinfo is None or parsed.utcoffset() is None or abs(parsed.utcoffset().total_seconds()) > 14 * 3600:
            return None
        return parsed.astimezone(UTC)
    except (ValueError, OverflowError):
        return None


def _iso(value: Any) -> str | None:
    parsed = _instant(value)
    return parsed.isoformat().replace("+00:00", "Z") if parsed else None


def _now(value: Any) -> tuple[datetime, str]:
    parsed = _instant(value)
    if parsed is None:
        raise ValueError("now must be a valid timezone-aware instant")
    return parsed, parsed.isoformat().replace("+00:00", "Z")


def _digest(value: Any) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def _hash(value: Any) -> bool:
    return isinstance(value, str) and re.fullmatch(r"[a-f0-9]{64}", value) is not None


def _threshold(value: Any) -> bool:
    return value is None or (type(value) in (int, float) and math.isfinite(value) and value > 0)


def _source(source: Any) -> tuple[str, str]:
    if not isinstance(source, dict) or not isinstance(source.get("key"), str) or not re.fullmatch(r"[a-z][a-z0-9_]{0,99}", source["key"]):
        raise ValueError("source requires a stable key")
    if not isinstance(source.get("name"), str) or not source["name"].strip() or not isinstance(source.get("mode"), str) or not source["mode"]:
        raise ValueError("source requires name and mode")
    if not _threshold(source.get("staleAfterDays")) or not isinstance(source.get("baseline"), dict):
        raise ValueError("invalid source policy or baseline")
    baseline = source["baseline"]
    sha = baseline.get("sha256")
    if sha is not None and (not isinstance(sha, str) or not _hash(sha.lower())):
        raise ValueError("baseline sha256 must be a hash or null")
    return source["key"], _digest({"key": source["key"], "mode": source["mode"],
        "staleAfterDays": source.get("staleAfterDays"), "publisherUpdatedAt": _iso(baseline.get("publisherUpdatedAt")),
        "sha256": sha.lower() if sha else None})


def _freshness(updated: Any, days: int | float | None, now: datetime, manual: bool = False) -> dict:
    parsed = _instant(updated)
    age = (now - parsed).total_seconds() / 86400 if parsed and parsed <= now else None
    status = "manual" if manual else "unknown" if age is None or days is None else "stale" if age > days else "current"
    return {"status": status, "publisherUpdatedAt": _iso(updated), "ageDays": age if status in {"stale", "current"} else None,
            "staleAfterDays": days}


def _text(value: Any) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str) or len(value) > 4096:
        raise ValueError("invalid metadata token")
    return value.strip() or None


def _identity(value: Any) -> str | None:
    text = _text(value)
    if not text:
        return None
    parsed = urlsplit(text)
    if parsed.scheme in {"http", "https"} and parsed.netloc:
        if parsed.username or parsed.password:
            raise ValueError("credential-bearing identity")
        volatile = {"signature", "sig", "expires", "awsaccesskeyid", "token", "policy", "key-pair-id"}
        query = [(key, item) for key, item in parse_qsl(parsed.query, keep_blank_values=True)
                 if key.lower() not in volatile and not key.lower().startswith(("x-amz-", "x-goog-"))]
        return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, urlencode(query), ""))
    return text


def _observation(metadata: Any, at: str) -> dict:
    if not isinstance(metadata, dict) or not isinstance(metadata.get("kind"), str) or metadata["kind"] not in {"catalogue_revision", "listing_reference"}:
        raise ValueError("invalid metadata kind")
    if metadata.get("publisherUpdatedAt") is not None and not isinstance(metadata["publisherUpdatedAt"], str):
        raise ValueError("invalid publisher date type")
    return {"identity": _identity(metadata.get("identity")), "publisherUpdatedAt": _iso(metadata.get("publisherUpdatedAt")),
            "kind": metadata["kind"], "etag": _text(metadata.get("etag")), "observedAt": at}


def _trusted(observation: dict | None) -> bool:
    if not observation:
        return False
    updated = _instant(observation["publisherUpdatedAt"])
    return bool(observation["identity"] or observation["etag"] or (updated and updated <= _instant(observation["observedAt"])))


def _token(observation: dict | None) -> str | None:
    return _digest({key: value for key, value in observation.items() if key != "observedAt"}) if observation else None


def _condition(state: dict) -> str:
    # Comparison-event labels, ages, retries and observation/check times are not conditions.
    return _digest({"sourceKey": state["sourceKey"], "source": state["sourceContext"], "availability": state["availability"],
        "reason": state["availabilityReason"], "statusCode": state["statusCode"] if state["availability"] != "available" else None,
        "baselineAge": state["freshness"]["status"], "observedAge": state["observedFreshness"]["status"],
        "metadata": _token(state["latestObservation"]), "priorStateInvalid": state["priorStateInvalid"]})


def _notice_id(state: dict) -> str:
    return f'{state["sourceKey"]}:{state["episode"]}:{state["conditionId"]}'


def _valid_state(state: Any) -> bool:
    """Validate persisted state before it can authorize comparison, 304 or acknowledgment."""
    try:
        if not isinstance(state, dict) or set(state) != STATE_KEYS or type(state["version"]) is not int or state["version"] != 1:
            return False
        if not isinstance(state["sourceKey"], str) or not re.fullmatch(r"[a-z][a-z0-9_]{0,99}", state["sourceKey"]) or not _hash(state["sourceContext"]):
            return False
        if type(state["episode"]) is not int or not 1 <= state["episode"] < 2**53 or type(state["priorStateInvalid"]) is not bool:
            return False
        evaluated = _instant(state["evaluatedAt"])
        if evaluated is None or state["evaluatedAt"] != _iso(state["evaluatedAt"]):
            return False
        for field in ["lastAttemptAt", "lastSuccessfulCheckAt", "lastAcknowledgedAt", "retryAt"]:
            if state[field] is not None and (_instant(state[field]) is None or state[field] != _iso(state[field])):
                return False
        for field in ["lastAttemptAt", "lastSuccessfulCheckAt"]:
            if state[field] is not None and _instant(state[field]) > evaluated:
                return False
        if state["lastSuccessfulCheckAt"] is not None and (state["lastAttemptAt"] is None or _instant(state["lastSuccessfulCheckAt"]) > _instant(state["lastAttemptAt"])):
            return False
        if state["availability"] not in AVAILABILITY or state["comparison"] not in COMPARISONS:
            return False
        if state["availabilityReason"] is not None and state["availabilityReason"] not in REASONS:
            return False
        if state["statusCode"] is not None and (type(state["statusCode"]) is not int or not 100 <= state["statusCode"] <= 599):
            return False
        for field in ["latestObservation", "lastKnownRevision"]:
            obs = state[field]
            if obs is not None:
                if not isinstance(obs, dict) or _instant(obs.get("observedAt")) is None or obs != _observation(obs, obs["observedAt"]):
                    return False
                if state["lastSuccessfulCheckAt"] is None or _instant(obs["observedAt"]) > _instant(state["lastSuccessfulCheckAt"]):
                    return False
        if state["lastKnownRevision"] and (state["lastKnownRevision"]["kind"] != "catalogue_revision" or not _trusted(state["lastKnownRevision"])):
            return False
        if (state["latestObservation"] is None) != (state["lastSuccessfulCheckAt"] is None):
            return False
        if state["availability"] == "available" and state["latestObservation"] is None:
            return False
        fresh = state["freshness"]
        if not isinstance(fresh, dict) or not _threshold(fresh.get("staleAfterDays")):
            return False
        manual = state["availability"] == "manual"
        if fresh != _freshness(fresh["publisherUpdatedAt"], fresh["staleAfterDays"], evaluated, manual):
            return False
        obs = state["latestObservation"]
        if state["observedFreshness"] != _freshness(obs["publisherUpdatedAt"] if obs else None, fresh["staleAfterDays"], evaluated, manual):
            return False
        if state["conditionId"] != _condition(state) or not isinstance(state["pendingNotices"], list) or len(state["pendingNotices"]) > 1:
            return False
        for notice in state["pendingNotices"]:
            if not isinstance(notice, dict) or set(notice) != {"id", "sourceKey", "episode", "kind", "reasons", "createdAt"}:
                return False
            if notice["id"] != _notice_id(state) or notice["sourceKey"] != state["sourceKey"] or type(notice["episode"]) is not int or notice["episode"] != state["episode"]:
                return False
            if notice["kind"] not in {"action", "recovery"} or _instant(notice["createdAt"]) is None or _instant(notice["createdAt"]) > evaluated:
                return False
            reasons = notice["reasons"]
            if not isinstance(reasons, list) or not reasons or any(reason not in REASONS for reason in reasons) or len(set(reasons)) != len(reasons):
                return False
        return True
    except (KeyError, TypeError, ValueError, OverflowError, AttributeError):
        return False


def _check_order(previous: dict, now: datetime) -> None:
    for field in ["evaluatedAt", "lastAcknowledgedAt"]:
        if previous[field] is not None and _instant(previous[field]) > now:
            raise ValueError("now precedes persisted state")


def trusted_previous(source: dict, previous: Any, now: str | datetime) -> dict | None:
    """Copy valid matching state without evaluating it; reject clock rollback.

    The caller must separately bind the exact catalogue SHA before trusting HTTP
    validators or cooldowns: sourceContext does not include adapter/endpoint IDs.
    """
    instant, _ = _now(now)
    key, context = _source(source)
    if not _valid_state(previous) or previous["sourceKey"] != key or previous["sourceContext"] != context:
        return None
    copied = deepcopy(previous)
    _check_order(copied, instant)
    return copied


def transition(source: dict, previous: dict | None, result: dict, now: str | datetime) -> dict:
    """Evaluate caller-supplied results; invalid prior state is discarded, never trusted."""
    instant, at = _now(now)
    key, context = _source(source)
    prior = trusted_previous(source, previous, instant)
    invalid_prior = previous is not None and prior is None
    manual = source["mode"] == "manual"
    result = deepcopy(result) if isinstance(result, dict) else {}
    attempted = result.get("attempted") is True
    if manual and attempted:
        raise ValueError("manual source must not be probed")
    outcome = result.get("outcome")
    status = result.get("statusCode")
    malformed = not isinstance(outcome, str) or outcome not in OUTCOMES or type(result.get("attempted")) is not bool
    malformed |= status is not None and (type(status) is not int or not 100 <= status <= 599)
    if not malformed:
        malformed = (outcome in {"observed", "not_modified"} and not attempted) or (outcome == "deferred" and attempted)
        if status is not None:
            malformed |= (outcome == "observed" and not 200 <= status < 300) or (outcome == "not_modified" and status != 304)
    if malformed:
        outcome, status = "malformed", None
    state = {"version": 1, "sourceKey": key, "sourceContext": context, "evaluatedAt": at,
        "lastAttemptAt": at if attempted else prior["lastAttemptAt"] if prior else None,
        "lastSuccessfulCheckAt": prior["lastSuccessfulCheckAt"] if prior else None,
        "availability": outcome, "availabilityReason": None, "statusCode": status,
        "retryAt": _iso(result.get("retryAt")), "freshness": {}, "observedFreshness": {},
        "latestObservation": deepcopy(prior["latestObservation"]) if prior else None,
        "lastKnownRevision": deepcopy(prior["lastKnownRevision"]) if prior else None,
        "comparison": "unknown", "priorStateInvalid": invalid_prior, "episode": 1,
        "conditionId": "", "pendingNotices": [], "lastAcknowledgedAt": prior["lastAcknowledgedAt"] if prior else None}
    if manual:
        state.update(availability="manual", comparison="manual", statusCode=None, retryAt=None)
    elif outcome == "manual":
        state.update(availability="unknown", availabilityReason="unexpected_manual")
    elif outcome == "deferred":
        if prior:
            for field in ["availability", "availabilityReason", "statusCode", "retryAt"]:
                state[field] = prior[field]
        else:
            state.update(availability="unknown", availabilityReason="deferred")
    elif outcome == "observed":
        try:
            obs = _observation(result.get("metadata"), at)
        except ValueError:
            state["availability"] = "malformed"
        else:
            other = prior["lastKnownRevision"] if prior and obs["kind"] == "catalogue_revision" else prior["latestObservation"] if prior else None
            if _trusted(obs) and not invalid_prior:
                if not _trusted(other) or other["kind"] != obs["kind"]:
                    state["comparison"] = "first_observation"
                else:
                    prefix = "revision" if obs["kind"] == "catalogue_revision" else "reference"
                    state["comparison"] = prefix + ("_unchanged" if _token(obs) == _token(other) else "_changed")
            state.update(availability="available", latestObservation=obs, lastSuccessfulCheckAt=at)
            if obs["kind"] == "catalogue_revision" and _trusted(obs):
                state["lastKnownRevision"] = deepcopy(obs)
    elif outcome == "not_modified":
        if prior and _trusted(prior["latestObservation"]):
            prefix = "revision" if prior["latestObservation"]["kind"] == "catalogue_revision" else "reference"
            state.update(availability="available", comparison=prefix + "_unchanged", lastSuccessfulCheckAt=at)
        else:
            state.update(availability="unknown", availabilityReason="untrusted_not_modified")
    days = source.get("staleAfterDays")
    state["freshness"] = _freshness(source["baseline"].get("publisherUpdatedAt"), days, instant, manual)
    obs = state["latestObservation"]
    state["observedFreshness"] = _freshness(obs["publisherUpdatedAt"] if obs else None, days, instant, manual)
    state["conditionId"] = _condition(state)
    changed = prior is None or state["conditionId"] != prior["conditionId"]
    state["episode"] = prior["episode"] + int(changed) if prior else 1
    if state["episode"] >= 2**53:
        raise ValueError("episode counter exhausted")
    recovered = bool(prior and state["availability"] == "available" and
                     (prior["availability"] not in {"available", "manual"} or prior["priorStateInvalid"]))
    reasons = []
    if not manual:
        if invalid_prior:
            reasons.append("prior_state_invalid")
        if state["availability"] != "available":
            reasons.append(state["availabilityReason"] or state["availability"])
        if state["freshness"]["status"] == "stale":
            reasons.append("baseline_stale")
        elif state["freshness"]["status"] == "unknown":
            reasons.append("baseline_age_unknown")
        if state["availability"] == "available":
            if not _trusted(obs):
                reasons.append("metadata_identity_unknown")
            if state["observedFreshness"]["status"] == "unknown":
                reasons.append("publisher_date_unknown")
            elif state["observedFreshness"]["status"] == "stale":
                reasons.append("upstream_stale")
        if state["comparison"] in {"revision_changed", "reference_changed"}:
            reasons.append("metadata_changed")
        if recovered:
            reasons.append("recovered")
    if not changed:
        state["pendingNotices"] = deepcopy(prior["pendingNotices"])
    elif reasons:
        state["pendingNotices"] = [{"id": _notice_id(state), "sourceKey": key, "episode": state["episode"],
            "kind": "recovery" if reasons == ["recovered"] else "action", "reasons": reasons, "createdAt": at}]
    return state


def acknowledge(state: dict, notice_ids: list[str], now: str | datetime) -> dict:
    """Acknowledge known current intents only. This function cannot prove delivery."""
    instant, at = _now(now)
    if not _valid_state(state):
        raise ValueError("malformed monitor state")
    if not isinstance(notice_ids, list) or any(not isinstance(value, str) for value in notice_ids):
        raise ValueError("notice_ids must be a list of strings")
    _check_order(state, instant)
    copied = deepcopy(state)
    remaining = [notice for notice in copied["pendingNotices"] if notice["id"] not in notice_ids]
    if len(remaining) != len(copied["pendingNotices"]):
        copied["pendingNotices"] = remaining
        copied["lastAcknowledgedAt"] = at
    return copied
