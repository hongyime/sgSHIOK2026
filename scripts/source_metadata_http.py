"""Bounded metadata-only requests. No pipeline imports, downloads, redirects or writes."""

from datetime import UTC, datetime, timedelta
from email.utils import parsedate_to_datetime
import hashlib
import http.client
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
from typing import Any, Callable
from urllib.parse import parse_qs, unquote, urlsplit

_ROOT = Path(__file__).resolve().parents[1]
_WORKER_COMMAND = (sys.executable, "-B", "-m", "scripts.source_metadata_http", "--worker")


def metadata_endpoint(url: str) -> tuple[str, str]:
    parsed = urlsplit(url)
    if (parsed.scheme != "https" or parsed.username or parsed.password or parsed.fragment
            or parsed.port not in (None, 443)):
        raise ValueError("Unapproved metadata endpoint")
    if parsed.hostname == "api-production.data.gov.sg":
        if parsed.query or not re.fullmatch(r"/v2/public/api/datasets/d_[a-z0-9]{1,128}/metadata", parsed.path):
            raise ValueError("Unapproved metadata endpoint")
    elif parsed.hostname == "datamall2.mytransport.sg":
        query = parse_qs(parsed.query, keep_blank_values=True)
        if (parsed.path != "/ltaodataservice/GeospatialWholeIsland" or set(query) != {"ID"}
                or len(query["ID"]) != 1 or not re.fullmatch(r"[A-Za-z_]{1,100}", query["ID"][0])):
            raise ValueError("Unapproved metadata endpoint")
    else:
        raise ValueError("Unapproved metadata endpoint")
    return parsed.hostname, parsed.path + ("?" + parsed.query if parsed.query else "")


def publisher_instant(value: Any) -> str | None:
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})", value):
        return None
    try:
        stamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if stamp.utcoffset() is None or abs(stamp.utcoffset().total_seconds()) > 14 * 3600:
            return None
        return stamp.astimezone(UTC).isoformat()
    except (ValueError, OverflowError):
        return None


def _retry_at(value: str | None, now: datetime) -> str:
    seconds = 60.0
    try:
        if value and value.isdigit():
            if len(value) > 12:
                return "9999-12-31T23:59:59+00:00"
            seconds = int(value)
        elif value:
            stamp = parsedate_to_datetime(value)
            if stamp.tzinfo:
                seconds = (stamp.astimezone(UTC) - now).total_seconds()
    except (ValueError, TypeError, OverflowError):
        pass
    try:
        return (now + timedelta(seconds=max(60, seconds))).isoformat()
    except OverflowError:
        return "9999-12-31T23:59:59+00:00"


def _cooldown(result: dict[str, Any]) -> dict[str, Any]:
    retry_at = publisher_instant(result.get("retryAt"))
    if type(result.get("statusCode")) is int and result["statusCode"] == 429 and retry_at:
        return {"statusCode": 429, "retryAt": retry_at}
    return {}


def _worker_output(output: str | bytes | None) -> tuple[dict[str, Any], str]:
    """Read at most one complete, bounded early receipt; never trust a partial line."""
    text = output.decode("utf-8", errors="replace") if isinstance(output, bytes) else output or ""
    line, newline, remaining = text.partition("\n")
    if newline and len(line) <= 256:
        try:
            receipt = json.loads(line)
            if (isinstance(receipt, dict) and set(receipt) == {"type", "statusCode", "retryAt"}
                    and receipt["type"] == "rate_limit"):
                cooldown = _cooldown(receipt)
                if cooldown:
                    return cooldown, remaining
        except (ValueError, RecursionError):
            pass
    return {}, text


def _emit_rate_limit(cooldown: dict[str, Any]) -> None:
    # The single early frame has no URL, credentials, raw headers or response body.
    print(json.dumps({"type": "rate_limit", **cooldown}, separators=(",", ":")), flush=True)


def _isolated_request(url: str, headers: dict[str, str], max_bytes: int, seconds: float) -> dict[str, Any]:
    """The parent timeout kills and waits for a stalled DNS/TLS/header/body worker."""
    env = {key: os.environ[key] for key in ("SYSTEMROOT", "WINDIR", "SYSTEMDRIVE", "PATH") if key in os.environ}
    env.update(PYTHONUTF8="1", PYTHONDONTWRITEBYTECODE="1", TEMP=str(_ROOT / "tmp"), TMP=str(_ROOT / "tmp"))
    cooldown: dict[str, Any] = {}
    try:
        worker = subprocess.run(_WORKER_COMMAND, cwd=_ROOT, input=json.dumps({"url": url, "headers": headers, "maxBytes": max_bytes, "seconds": seconds}),
                                capture_output=True, text=True, encoding="utf-8", timeout=seconds, env=env,
                                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        cooldown, final = _worker_output(worker.stdout)
        if worker.returncode != 0:
            return {"outcome": "http_error", "attempted": True, "reason": "worker_failure", **cooldown}
        result = json.loads(final)
        if not isinstance(result, dict) or not isinstance(result.get("outcome"), str):
            raise ValueError("Invalid worker result")
        if cooldown and (result.get("statusCode") != 429 or result["outcome"] not in {"rate_limited", "timeout", "http_error"}):
            raise ValueError("Conflicting worker result")
        result.update(cooldown)
        return result
    except subprocess.TimeoutExpired as error:
        cooldown, _ = _worker_output(error.stdout)
        return {"outcome": "timeout", "attempted": True, "reason": "absolute_request_deadline", **cooldown}
    except (ValueError, OSError, RecursionError):
        return {"outcome": "http_error", "attempted": True, "reason": "worker_failure", **cooldown}


class MetadataClient:
    def __init__(self, *, max_requests: int = 24, max_bytes: int = 256 * 1024,
                 max_seconds: float = 300, request_seconds: float = 10, interval_seconds: float = 13,
                 connection_factory: Callable[..., Any] | None = None,
                 monotonic: Callable[[], float] = time.monotonic,
                 sleep: Callable[[float], None] = time.sleep,
                 wall_clock: Callable[[], datetime] = lambda: datetime.now(UTC),
                 rate_limit_receipt: Callable[[dict[str, Any]], None] | None = None) -> None:
        if (type(max_requests) is not int or not 1 <= max_requests <= 24
                or type(max_bytes) is not int or not 1 <= max_bytes <= 256 * 1024
                or not 0 < max_seconds <= 300 or not 0 < request_seconds <= 10
                or not 13 <= interval_seconds <= 300):
            raise ValueError("Invalid metadata request bounds")
        self.max_requests, self.max_bytes = max_requests, max_bytes
        self.clock, self.sleep, self.wall_clock = monotonic, sleep, wall_clock
        self.deadline = monotonic() + max_seconds
        self.budget_seconds = max_seconds
        self.request_seconds, self.interval = request_seconds, interval_seconds
        self.connect = connection_factory
        self.rate_limit_receipt = rate_limit_receipt
        self.next_host: dict[str, float] = {}
        self.blocked_hosts: dict[str, str] = {}
        self.stats: dict[str, Any] = {"requests": 0, "bodyBytes": 0, "responses": []}

    def get_json(self, url: str, headers: dict[str, str] | None = None) -> dict[str, Any]:
        host, target = metadata_endpoint(url)
        extra = headers or {}
        for key, value in extra.items():
            if (key not in {"AccountKey", "If-None-Match"} or not isinstance(value, str)
                    or not 1 <= len(value) <= 4096 or any(ord(char) < 32 or ord(char) > 126 for char in value)
                    or (key == "AccountKey" and host != "datamall2.mytransport.sg")):
                raise ValueError("Unapproved metadata header")
        if host in self.blocked_hosts:
            return {"outcome": "deferred", "attempted": False, "reason": "host_rate_limited", "retryAt": self.blocked_hosts[host]}
        if self.stats["requests"] >= self.max_requests:
            return {"outcome": "deferred", "attempted": False, "reason": "request_budget"}
        wait = max(0, self.next_host.get(host, 0) - self.clock())
        if self.clock() + wait >= self.deadline:
            return {"outcome": "deferred", "attempted": False, "reason": "time_budget"}
        if wait:
            self.sleep(wait)
        if self.clock() >= self.deadline:
            return {"outcome": "deferred", "attempted": False, "reason": "time_budget"}
        self.next_host[host] = self.clock() + self.interval
        self.stats["requests"] += 1
        if self.connect is None:
            result = _isolated_request(url, extra, self.max_bytes, min(self.request_seconds, self.deadline - self.clock()))
            cooldown = _cooldown(result)
            if self.clock() >= self.deadline:
                result.pop("data", None)
                result.pop("etag", None)
                result.update(outcome="timeout", attempted=True, reason="total_budget")
            if cooldown:
                self.blocked_hosts[host] = cooldown["retryAt"]
            self.stats["bodyBytes"] += result.get("bodyBytes", 0)
            self.stats["responses"].append({"url": url, **{k: v for k, v in result.items() if k not in {"data", "etag"}}})
            return result
        connection = None
        result: dict[str, Any] = {"outcome": "http_error", "attempted": True}
        try:
            connection = self.connect(host, timeout=min(self.request_seconds, self.deadline - self.clock()))
            connection.request("GET", target, headers={"Accept": "application/json", "Accept-Encoding": "identity",
                               "User-Agent": "sgSHIOK-Metadata-Monitor/1.0", **extra})
            response = connection.getresponse()
            result["statusCode"] = response.status
            if response.status == 429:
                result.update(outcome="rate_limited", retryAt=_retry_at(response.getheader("Retry-After"), self.wall_clock()))
                self.blocked_hosts[host] = result["retryAt"]
                if self.rate_limit_receipt is not None:
                    self.rate_limit_receipt(_cooldown(result))
            if self.clock() >= self.deadline:
                result.update(outcome="timeout", reason="total_budget")
                return result
            if response.status == 429:
                return result
            if response.status == 304:
                result["outcome"] = "not_modified"
                return result
            if 300 <= response.status < 400:
                result["outcome"] = "redirect_blocked"
                return result
            if response.status != 200:
                return result
            content_type = response.getheader("Content-Type", "").split(";", 1)[0].strip().lower()
            encoding = response.getheader("Content-Encoding", "identity").lower()
            if content_type != "application/json" or encoding not in ("", "identity"):
                result["outcome"] = "malformed"
                return result
            length = response.getheader("Content-Length")
            if length is not None:
                try:
                    size = int(length)
                except ValueError:
                    result["outcome"] = "malformed"
                    return result
                if size < 0:
                    result["outcome"] = "malformed"
                    return result
                if size > self.max_bytes:
                    result["outcome"] = "oversized"
                    return result
            body = bytearray()
            while len(body) <= self.max_bytes:
                if self.clock() >= self.deadline:
                    result.update(outcome="timeout", reason="total_budget")
                    return result
                chunk = response.read(min(8192, self.max_bytes + 1 - len(body)))
                if self.clock() >= self.deadline:
                    result.update(outcome="timeout", reason="total_budget")
                    return result
                if not chunk:
                    break
                self.stats["bodyBytes"] += len(chunk)
                body.extend(chunk)
            result["bodyBytes"] = len(body)
            if len(body) > self.max_bytes:
                result["outcome"] = "oversized"
                return result
            result["bodySha256"] = hashlib.sha256(body).hexdigest()
            try:
                data = json.loads(body.decode("utf-8"), parse_constant=lambda _: (_ for _ in ()).throw(ValueError("Non-finite JSON")))
            except (ValueError, UnicodeError, RecursionError):
                result["outcome"] = "malformed"
                return result
            etag = response.getheader("ETag")
            if not isinstance(etag, str) or not 1 <= len(etag) <= 512 or any(ord(char) < 32 or ord(char) > 126 for char in etag):
                etag = None
            result.update(outcome="response", data=data, etag=etag)
            return result
        except TimeoutError:
            result.update(outcome="timeout")
            return result
        except (OSError, http.client.HTTPException):
            result.update(outcome="http_error", reason="network_error")
            return result
        finally:
            if connection is not None:
                try:
                    connection.close()
                except OSError:
                    result.pop("data", None)
                    result.update(outcome="http_error", reason="connection_cleanup_failed")
            self.stats["responses"].append({"url": url, **{k: v for k, v in result.items() if k not in {"data", "etag"}}})


def observe_source(source: dict[str, Any], previous: dict[str, Any] | None,
                   client: MetadataClient, credentials: dict[str, str]) -> dict[str, Any]:
    adapter = source["adapter"]
    if adapter in {"manual", "unsupported"}:
        return {"outcome": adapter, "attempted": False}
    headers: dict[str, str] = {}
    if adapter == "datamall_listing":
        key = credentials.get("LTA_DATAMALL_ACCOUNT_KEY", "")
        if not key:
            return {"outcome": "credentials_required", "attempted": False}
        headers["AccountKey"] = key
        url = "https://datamall2.mytransport.sg/ltaodataservice/GeospatialWholeIsland?ID=" + source["keyword"]
    elif adapter == "datagov_metadata":
        url = "https://api-production.data.gov.sg/v2/public/api/datasets/" + source["datasetId"] + "/metadata"
        from scripts.source_metadata_state import trusted_previous

        prior = trusted_previous(source, previous, client.wall_clock()) if previous is not None else None
        observation = (prior or {}).get("latestObservation") or {}
        etag = observation.get("etag")
        if isinstance(etag, str) and 1 <= len(etag) <= 512 and all(32 <= ord(char) <= 126 for char in etag):
            headers["If-None-Match"] = etag
    else:
        raise ValueError("Unknown metadata adapter")
    response = client.get_json(url, headers)
    payload = response.pop("data", None)
    etag = response.pop("etag", None)
    if response["outcome"] != "response":
        return response
    metadata: dict[str, Any]
    if adapter == "datagov_metadata":
        data = payload.get("data") if isinstance(payload, dict) else None
        if (not isinstance(data, dict) or data.get("datasetId") != source["datasetId"]
                or payload.get("errorMsg") not in (None, "") or payload.get("code") not in (None, 0, 1)):
            response["outcome"] = "malformed"
            return response
        updated = publisher_instant(data.get("lastUpdatedAt"))
        basis = {"datasetId": source["datasetId"], "publisherUpdatedAt": updated}
        metadata = {"kind": "catalogue_revision", "publisherUpdatedAt": updated, "etag": etag,
                    "identity": hashlib.sha256(json.dumps(basis, sort_keys=True).encode()).hexdigest() if updated else None}
    else:
        values = payload.get("value") if isinstance(payload, dict) else None
        link = values[0].get("Link") if isinstance(values, list) and len(values) == 1 and isinstance(values[0], dict) else None
        if not isinstance(link, str) or len(link) > 16000:
            response["outcome"] = "malformed"
            return response
        try:
            parsed = urlsplit(link)
            valid = (parsed.scheme == "https" and parsed.hostname == "dmgeospatial.s3.ap-southeast-1.amazonaws.com"
                     and not parsed.username and not parsed.password and parsed.port in (None, 443))
        except ValueError:
            valid = False
        if (not valid
                or not re.fullmatch(re.escape(source["keyword"]) + r"(?:_[A-Za-z0-9]+)?\.zip", unquote(parsed.path).rsplit("/", 1)[-1], re.IGNORECASE)):
            response["outcome"] = "malformed"
            return response
        stable = "https://" + parsed.hostname + parsed.path
        metadata = {"kind": "listing_reference", "publisherUpdatedAt": None, "etag": None,
                    "identity": hashlib.sha256(stable.encode()).hexdigest(), "reference": stable}
    response.update(outcome="observed", metadata=metadata)
    return response


if __name__ == "__main__":
    if sys.argv[1:] != ["--worker"] or Path.cwd() != _ROOT:
        raise SystemExit("Internal metadata worker requires the repository root")
    request = json.loads(sys.stdin.read(32769))
    worker_client = MetadataClient(max_requests=1, max_bytes=request["maxBytes"], max_seconds=request["seconds"],
                                   request_seconds=request["seconds"], connection_factory=http.client.HTTPSConnection,
                                   rate_limit_receipt=_emit_rate_limit)
    json.dump(worker_client.get_json(request["url"], request["headers"]), sys.stdout)
