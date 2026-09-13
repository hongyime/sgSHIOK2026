"""Bounded GitHub comment adapter. No issue editing, automatic retries or activation.

Production requests run in a killed-and-waited child for a 10-second deadline
including DNS/TLS/body reads. Credentials travel over stdin, not argv or evidence.
Tests can inject a request function; that alone does not prove worker deadlines.
"""

import http.client
import json
import os
import re
import subprocess
import sys
from typing import Callable
from urllib.parse import parse_qs, urlsplit

from scripts.source_metadata_comments import CommentPlan, DESTINATION, ROOT, _validate_plan
from scripts.source_metadata_delivery import DeliveryError

MAX_RESPONSE_BYTES = 1024 * 1024
MAX_PAGES = 1
REQUEST_SECONDS = 10
API_VERSION = "2022-11-28"


def _request_input(value: dict) -> tuple[str, str, dict, str]:
    if not isinstance(value, dict) or set(value) != {"method", "target", "payload", "token"}:
        raise DeliveryError("STOP_GITHUB_REQUEST")
    method, target, payload, token = (value[key] for key in ("method", "target", "payload", "token"))
    if (not isinstance(token, str) or not 1 <= len(token) <= 4096
            or any(ord(char) < 33 or ord(char) > 126 for char in token)
            or not isinstance(target, str) or not isinstance(payload, dict)):
        raise DeliveryError("STOP_GITHUB_REQUEST")
    repo = r"/repos/[A-Za-z0-9][A-Za-z0-9_-]{0,99}/[A-Za-z0-9][A-Za-z0-9_.-]{0,99}"
    if method == "POST":
        if (not re.fullmatch(repo + r"/issues/[1-9][0-9]{0,14}/comments", target)
                or set(payload) != {"body"} or not isinstance(payload["body"], str)
                or not 1 <= len(payload["body"].encode("utf8")) <= 64 * 1024):
            raise DeliveryError("STOP_GITHUB_REQUEST")
    elif method == "GET":
        if (payload or not (re.fullmatch(repo + r"/issues/comments/[1-9][0-9]{0,15}", target)
                           or re.fullmatch(repo + r"/issues/[1-9][0-9]{0,14}/comments\?per_page=100&page=1", target))):
            raise DeliveryError("STOP_GITHUB_REQUEST")
    else:
        raise DeliveryError("STOP_GITHUB_REQUEST")
    return method, target, payload, token


def _next_page(header: str | None, target: str) -> int | None:
    if not header:
        return None
    current = urlsplit(target)
    current_page = int(parse_qs(current.query)["page"][0]) if current.query else None
    found = None
    last = None
    relations = set()
    if current_page is None or len(header) > 4096:
        raise DeliveryError("STOP_GITHUB_PAGINATION")
    for part in header.split(","):
        match = re.fullmatch(r'\s*<([^<>]+)>;\s*rel="(first|prev|next|last)"\s*', part)
        if not match or match[2] in relations:
            raise DeliveryError("STOP_GITHUB_PAGINATION")
        relations.add(match[2])
        parsed = urlsplit(match[1])
        query = parse_qs(parsed.query, keep_blank_values=True)
        if (parsed.scheme != "https" or parsed.netloc != "api.github.com" or parsed.fragment
                or parsed.path != current.path or set(query) != {"page", "per_page"}
                or query["per_page"] != ["100"] or len(query["page"]) != 1
                or not re.fullmatch(r"[1-9][0-9]{0,8}", query["page"][0])):
            raise DeliveryError("STOP_GITHUB_PAGINATION")
        if match[2] == "next":
            found = int(query["page"][0])
            if found != current_page + 1:
                raise DeliveryError("STOP_GITHUB_PAGINATION")
        elif match[2] == "last":
            last = int(query["page"][0])
            if last < current_page:
                raise DeliveryError("STOP_GITHUB_PAGINATION")
        elif match[2] == "first" and int(query["page"][0]) != 1:
            raise DeliveryError("STOP_GITHUB_PAGINATION")
        elif match[2] == "prev" and int(query["page"][0]) != current_page - 1:
            raise DeliveryError("STOP_GITHUB_PAGINATION")
    if last is not None and ((last > current_page and found is None)
                             or (found is not None and last < found)):
        raise DeliveryError("STOP_GITHUB_PAGINATION")
    return found


def _http(value: dict, connection_factory: Callable = http.client.HTTPSConnection) -> dict:
    method, target, payload, token = _request_input(value)
    connection = connection_factory("api.github.com", timeout=REQUEST_SECONDS)
    try:
        headers = {"Accept": "application/vnd.github+json", "Accept-Encoding": "identity",
                   "Authorization": "Bearer " + token, "X-GitHub-Api-Version": API_VERSION,
                   "User-Agent": "sgSHIOK-Source-Notices/1.0"}
        body = None
        if method == "POST":
            headers["Content-Type"] = "application/json"
            body = json.dumps(payload, ensure_ascii=True).encode("ascii")
        connection.request(method, target, body=body, headers=headers)
        response = connection.getresponse()
        if response.status != (201 if method == "POST" else 200):
            # 3xx is not followed. Auth/rate-limit/server failures do not trigger retries.
            raise DeliveryError("STOP_GITHUB_STATUS")
        if response.getheader("Content-Encoding", "identity") != "identity":
            raise DeliveryError("STOP_GITHUB_ENCODING")
        content = response.read(MAX_RESPONSE_BYTES + 1)
        if len(content) > MAX_RESPONSE_BYTES:
            raise DeliveryError("STOP_GITHUB_RESPONSE_BOUND")
        result = json.loads(content.decode("utf8"))
        if not isinstance(result, (dict, list)):
            raise DeliveryError("STOP_GITHUB_RESPONSE")
        return {"data": result, "nextPage": _next_page(response.getheader("Link"), target)}
    finally:
        connection.close()


def _isolated_request(value: dict) -> dict:
    _request_input(value)
    env = {key: os.environ[key] for key in ("SYSTEMROOT", "WINDIR", "SYSTEMDRIVE", "PATH") if key in os.environ}
    env.update(PYTHONUTF8="1", PYTHONDONTWRITEBYTECODE="1", TEMP=str(ROOT / "tmp"), TMP=str(ROOT / "tmp"))
    try:
        worker = subprocess.run([sys.executable, "-B", "-m", "scripts.source_metadata_github", "--worker"],
                                cwd=ROOT, input=json.dumps(value), text=True, encoding="utf8",
                                capture_output=True, timeout=REQUEST_SECONDS, env=env,
                                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        if worker.returncode != 0 or len(worker.stdout.encode("utf8")) > 6 * MAX_RESPONSE_BYTES:
            raise DeliveryError("STOP_GITHUB_WORKER")
        result = json.loads(worker.stdout)
        if not isinstance(result, dict) or set(result) != {"data", "nextPage"}:
            raise DeliveryError("STOP_GITHUB_WORKER")
        return result
    except (OSError, ValueError, subprocess.TimeoutExpired, RecursionError):
        raise DeliveryError("STOP_GITHUB_REQUEST_FAILED") from None


def _normalized(value: dict, plan: CommentPlan) -> dict:
    repository, issue = plan.destination.split("#")
    if (not isinstance(value, dict) or not isinstance(value.get("issue_url"), str)
            or value["issue_url"].lower() != f"https://api.github.com/repos/{repository}/issues/{issue}"
            or not isinstance(value.get("user"), dict)
            or type(value.get("id")) is not int or not 1 <= value["id"] < 2**53
            or type(value["user"].get("id")) is not int or not 1 <= value["user"]["id"] < 2**53
            or not isinstance(value.get("body"), str)
            or len(value["body"].encode("utf8")) > 64 * 1024):
        raise DeliveryError("STOP_GITHUB_COMMENT")
    return {"id": value["id"], "authorId": value["user"]["id"],
            "destination": plan.destination, "body": value["body"]}


class GitHubCommentClient:
    def __init__(self, destination: str, *, author_id: int, token: str,
                 request: Callable[[dict], dict] = _isolated_request):
        if (not isinstance(destination, str) or not DESTINATION.fullmatch(destination)
                or type(author_id) is not int or not 1 <= author_id < 2**53):
            raise DeliveryError("STOP_GITHUB_DESTINATION")
        repository, issue = destination.lower().split("#")
        self.target = f"/repos/{repository}/issues/{issue}/comments"
        self.repository = repository
        self.destination, self.author_id, self._token, self._request = destination.lower(), author_id, token, request
        _request_input({"method": "GET", "target": self.target + "?per_page=100&page=1", "payload": {}, "token": token})

    def _send(self, plan: CommentPlan, method: str, target: str, payload: dict) -> dict:
        _validate_plan(plan)
        if plan.destination != self.destination or plan.author_id != self.author_id:
            raise DeliveryError("STOP_GITHUB_PLAN_BINDING")
        result = self._request({"method": method, "target": target, "payload": payload, "token": self._token})
        if (not isinstance(result, dict) or set(result) != {"data", "nextPage"}
                or (result["nextPage"] is not None and (type(result["nextPage"]) is not int
                                                       or not 1 <= result["nextPage"] <= MAX_PAGES + 1))):
            raise DeliveryError("STOP_GITHUB_ENVELOPE")
        return result

    def create(self, plan: CommentPlan) -> dict:
        result = self._send(plan, "POST", self.target, {"body": plan.body})
        if result["nextPage"] is not None:
            raise DeliveryError("STOP_GITHUB_PAGINATION")
        return _normalized(result["data"], plan)

    def read(self, plan: CommentPlan, comment_id: int) -> dict:
        if type(comment_id) is not int or not 1 <= comment_id < 2**53:
            raise DeliveryError("STOP_GITHUB_COMMENT_ID")
        result = self._send(plan, "GET", f"/repos/{self.repository}/issues/comments/{comment_id}", {})
        if result["nextPage"] is not None:
            raise DeliveryError("STOP_GITHUB_PAGINATION")
        value = _normalized(result["data"], plan)
        if value["id"] != comment_id:
            raise DeliveryError("STOP_GITHUB_COMMENT_ID")
        return value

    def find(self, plan: CommentPlan) -> list[dict]:
        matches = []
        seen = set()
        last_id = 0
        marker = f"<!-- sgshiok-source-notice:{plan.attempt_key} -->"
        result = self._send(plan, "GET", self.target + "?per_page=100&page=1", {})
        # Offset pages can skip duplicates after deletions. Do not combine them
        # into an apparent snapshot or authorize recovery from an incomplete list.
        if result["nextPage"] is not None:
            raise DeliveryError("STOP_GITHUB_PAGINATION_REQUIRES_OPERATOR")
        values = result["data"]
        if not isinstance(values, list) or len(values) > 100:
            raise DeliveryError("STOP_GITHUB_PAGE")
        for value in values:
            normalized = _normalized(value, plan)
            if normalized["id"] in seen or normalized["id"] <= last_id:
                raise DeliveryError("STOP_GITHUB_PAGINATION_CHANGED")
            seen.add(normalized["id"])
            last_id = normalized["id"]
            if marker in normalized["body"]:
                matches.append(normalized)
        return matches


if __name__ == "__main__":
    if sys.argv[1:] != ["--worker"]:
        raise SystemExit("No activation CLI; worker is internal.")
    try:
        raw = sys.stdin.read(128 * 1024 + 1)
        if len(raw) > 128 * 1024:
            raise DeliveryError("STOP_GITHUB_REQUEST_BOUND")
        print(json.dumps(_http(json.loads(raw)), ensure_ascii=True))
    except Exception:
        # No response bodies, tokens or transport exceptions are printed.
        raise SystemExit(1) from None
