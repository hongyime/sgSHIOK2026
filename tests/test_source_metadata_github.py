"""Synthetic adapter checks; mocked subprocess tests do not prove worker deadlines."""

from copy import deepcopy
from dataclasses import replace
import json
from pathlib import Path
import socket
import subprocess
import traceback

import pytest

from scripts import source_metadata_github as github
from scripts.source_metadata_comments import plan_comment
from scripts.source_metadata_delivery import DeliveryError


DESTINATION = "synthetic-owner/synthetic-repo#17"
AUTHOR_ID = 12345
TOKEN = "synthetic-test-token-DO-NOT-USE"
TARGET = "/repos/synthetic-owner/synthetic-repo/issues/17/comments"
LIST_TARGET = TARGET + "?per_page=100&page=1"
ISSUE_URL = "https://api.github.com" + TARGET.removesuffix("/comments")
MONITOR = {"catalogSha256": "a" * 64, "stateSha256": "b" * 64,
           "reportSha256": "c" * 64}
NOTICE = {"id": "synthetic_source:1:" + "d" * 64, "sourceKey": "synthetic_source",
          "episode": 1, "kind": "action", "reasons": ["timeout"],
          "createdAt": "2026-09-13T00:00:00Z"}


@pytest.fixture(autouse=True)
def deny_real_network_and_subprocess(monkeypatch):
    def forbidden(*args, **kwargs):
        pytest.fail("Real network/subprocess access is forbidden in adapter tests")

    monkeypatch.setattr(socket, "create_connection", forbidden)
    monkeypatch.setattr(socket.socket, "connect", forbidden)
    monkeypatch.setattr(socket.socket, "connect_ex", forbidden)
    monkeypatch.setattr(socket, "getaddrinfo", forbidden)
    monkeypatch.setattr(subprocess, "run", forbidden)
    monkeypatch.setattr(subprocess, "Popen", forbidden)


@pytest.fixture
def plan():
    return plan_comment(DESTINATION, MONITOR, NOTICE, author_id=AUTHOR_ID)


def request_input(**changes):
    return {"method": "GET", "target": LIST_TARGET, "payload": {}, "token": TOKEN, **changes}


def comment(plan, identifier=101, **changes):
    return {"id": identifier, "issue_url": ISSUE_URL, "user": {"id": AUTHOR_ID},
            "body": plan.body, **changes}


def envelope(data, next_page=None):
    return {"data": data, "nextPage": next_page}


def link(page, relation="next", *, path=TARGET):
    return f'<https://api.github.com{path}?per_page=100&page={page}>; rel="{relation}"'


class FakeRequests:
    def __init__(self, *responses):
        self.responses = list(responses)
        self.calls = []

    def __call__(self, value):
        self.calls.append(deepcopy(value))
        assert self.responses, "Unexpected request or automatic retry"
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


def client(request, **changes):
    options = {"author_id": AUTHOR_ID, "token": TOKEN, "request": request, **changes}
    return github.GitHubCommentClient(DESTINATION, **options)


class FakeResponse:
    def __init__(self, content=b"{}", status=200, headers=None):
        self.content, self.status = content, status
        self.headers = {key.lower(): value for key, value in (headers or {}).items()}
        self.read_sizes = []

    def getheader(self, name, default=None):
        return self.headers.get(name.lower(), default)

    def read(self, size):
        self.read_sizes.append(size)
        if isinstance(self.content, Exception):
            raise self.content
        return self.content[:size]


class FakeConnection:
    def __init__(self, response, *, failure=None):
        self.response, self.failure = response, failure
        self.calls, self.factory_calls = [], []
        self.closed = 0

    def factory(self, host, **kwargs):
        self.factory_calls.append((host, kwargs))
        return self

    def request(self, method, target, **kwargs):
        self.calls.append((method, target, kwargs))
        if self.failure is not None:
            raise self.failure

    def getresponse(self):
        return self.response

    def close(self):
        self.closed += 1


@pytest.mark.parametrize("method", ["PATCH", "PUT", "DELETE", "HEAD", "OPTIONS", "post", "get", "", None, []])
def test_method_allowlist_rejects_before_http(method):
    connection = FakeConnection(FakeResponse())
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_REQUEST$"):
        github._http(request_input(method=method), connection.factory)
    assert connection.factory_calls == []


@pytest.mark.parametrize("target", [
    "https://api.github.com" + LIST_TARGET, "https://example.invalid" + LIST_TARGET,
    "//api.github.com" + LIST_TARGET, LIST_TARGET + "#fragment", LIST_TARGET + "&token=bad",
    TARGET, TARGET + "?page=1&per_page=100", TARGET + "?per_page=30&page=1",
    TARGET + "?per_page=100&page=0", TARGET + "?per_page=100&page=4",
    TARGET + "?per_page=100&page=2", TARGET + "?per_page=100&page=3",
    TARGET + "?per_page=100&page=01", LIST_TARGET + "&page=1", LIST_TARGET + "\r\nX-Test: bad",
    LIST_TARGET.replace("/17/", "/0/"), LIST_TARGET.replace("/17/", "/01/"),
    LIST_TARGET.replace("synthetic-owner", ".."), LIST_TARGET.replace("synthetic-repo", "%2e%2e"),
    "/repos/synthetic-owner/synthetic-repo/issues/comments/0",
    "/repos/synthetic-owner/synthetic-repo/issues/comments/01",
    "/repos/synthetic-owner/synthetic-repo/issues/comments/" + "9" * 17,
    "/user", None, 17,
])
def test_get_url_allowlist_rejects_before_http(target):
    connection = FakeConnection(FakeResponse())
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_REQUEST$"):
        github._http(request_input(target=target), connection.factory)
    assert connection.factory_calls == []


@pytest.mark.parametrize("target", [
    LIST_TARGET, TARGET + "/", TARGET + "?page=1", TARGET.removesuffix("/comments"),
    "/repos/synthetic-owner/synthetic-repo/issues/comments/101", "https://api.github.com" + TARGET,
])
def test_post_only_targets_issue_comment_creation(target):
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_REQUEST$"):
        github._request_input(request_input(method="POST", target=target, payload={"body": "notice"}))


@pytest.mark.parametrize("payload", [{}, {"body": ""}, {"body": None}, {"body": 1},
                                      {"body": "notice", "title": "unexpected"}, [],
                                      {"body": "x" * (64 * 1024 + 1)},
                                      {"body": "\u00e9" * (32 * 1024 + 1)}])
def test_post_payload_schema_and_utf8_bound(payload):
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_REQUEST$"):
        github._request_input(request_input(method="POST", target=TARGET, payload=payload))


@pytest.mark.parametrize("body", ["x", "x" * (64 * 1024), "\u00e9" * (32 * 1024)],
                         ids=["one-byte", "ascii-boundary", "utf8-boundary"])
def test_post_accepts_exact_byte_boundary(body):
    value = request_input(method="POST", target=TARGET, payload={"body": body})
    assert github._request_input(value) == ("POST", TARGET, {"body": body}, TOKEN)


@pytest.mark.parametrize("value", [None, [], {}, {"method": "GET"},
                                   request_input(unexpected=True), request_input(payload={"body": "bad"})])
def test_request_requires_exact_schema(value):
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_REQUEST$"):
        github._request_input(value)


@pytest.mark.parametrize("token", [None, 1, b"token", "", " " + TOKEN, TOKEN + " ", TOKEN + "\n",
                                   TOKEN + "\r\nX-Injected: yes", TOKEN + "\t", TOKEN + "\0",
                                   TOKEN + "\x7f", TOKEN + "\u00e9", "x" * 4097],
                         ids=["none", "integer", "bytes", "empty", "leading-space", "trailing-space", "newline",
                              "header-injection", "tab", "nul", "del", "unicode", "over-bound"])
def test_invalid_token_rejected_without_io_or_leak(token, capsys):
    requests = FakeRequests()
    with pytest.raises(DeliveryError) as caught:
        client(requests, token=token)
    assert str(caught.value) == "STOP_GITHUB_REQUEST"
    assert TOKEN not in str(caught.value)
    assert requests.calls == []
    assert capsys.readouterr() == ("", "")


def test_token_boundary_and_client_repr_do_not_emit_credentials(capsys):
    adapter = client(FakeRequests(), token="x" * 4096)
    assert "x" * 4096 not in repr(adapter)
    assert capsys.readouterr() == ("", "")


@pytest.mark.parametrize("author", [True, False, 0, -1, 2**53, "12345", None])
def test_constructor_requires_numeric_author_identity(author):
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_DESTINATION$"):
        client(FakeRequests(), author_id=author)


@pytest.mark.parametrize("destination", [None, "", "owner/repo", "owner/repo#0", "owner/repo#01",
                                         "owner/repo#1/../../", "https://github.com/owner/repo#1"])
def test_constructor_rejects_invalid_destination(destination):
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_DESTINATION$"):
        github.GitHubCommentClient(destination, author_id=AUTHOR_ID, token=TOKEN, request=FakeRequests())


@pytest.mark.parametrize("operation", ["create", "read", "find"])
@pytest.mark.parametrize("binding", ["author", "destination"])
def test_plan_binding_mismatch_stops_before_request(operation, binding):
    other = plan_comment("other-owner/other-repo#19" if binding == "destination" else DESTINATION,
                         MONITOR, NOTICE, author_id=AUTHOR_ID + (binding == "author"))
    requests = FakeRequests()
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_PLAN_BINDING$"):
        getattr(client(requests), operation)(other, *([101] if operation == "read" else []))
    assert requests.calls == []


@pytest.mark.parametrize("operation", ["create", "read", "find"])
def test_tampered_plan_stops_before_request(plan, operation):
    requests = FakeRequests()
    with pytest.raises(DeliveryError, match="^STOP_COMMENT_PLAN$"):
        getattr(client(requests), operation)(replace(plan, body=plan.body + "tampered"),
                                            *([101] if operation == "read" else []))
    assert requests.calls == []


def test_create_read_find_use_only_expected_methods_and_exact_body(plan):
    requests = FakeRequests(envelope(comment(plan)), envelope(comment(plan)), envelope([comment(plan)]))
    adapter = github.GitHubCommentClient(DESTINATION.upper(), author_id=AUTHOR_ID, token=TOKEN, request=requests)
    expected = {"id": 101, "authorId": AUTHOR_ID, "destination": DESTINATION, "body": plan.body}
    assert adapter.create(plan) == expected
    assert adapter.read(plan, 101) == expected
    assert adapter.find(plan) == [expected]
    assert [(call["method"], call["target"], call["payload"]) for call in requests.calls] == [
        ("POST", TARGET, {"body": plan.body}),
        ("GET", "/repos/synthetic-owner/synthetic-repo/issues/comments/101", {}),
        ("GET", LIST_TARGET, {}),
    ]
    assert all(call["token"] == TOKEN for call in requests.calls)
    assert not hasattr(adapter, "update")
    assert not hasattr(adapter, "delete")


@pytest.mark.parametrize("identifier", [True, False, 0, -1, 2**53, 1.0, "101", None])
def test_read_rejects_invalid_comment_id_before_request(plan, identifier):
    requests = FakeRequests()
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_COMMENT_ID$"):
        client(requests).read(plan, identifier)
    assert requests.calls == []


@pytest.mark.parametrize("url", [None, 1, "", ISSUE_URL + "/", ISSUE_URL + "?x=1", ISSUE_URL + "#x",
                                 ISSUE_URL.replace("/17", "/18"), ISSUE_URL.replace("https:", "http:"),
                                 ISSUE_URL.replace("api.github.com", "api.github.com.evil.invalid"),
                                 ISSUE_URL.replace("api.github.com", "user@api.github.com"),
                                 ISSUE_URL.replace("synthetic-repo", "other-repo"), ISSUE_URL + "\n"])
def test_read_rejects_wrong_or_malformed_issue_url(plan, url):
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_COMMENT$"):
        client(FakeRequests(envelope(comment(plan, issue_url=url)))).read(plan, 101)


@pytest.mark.parametrize("changes", [
    {"id": True}, {"id": 0}, {"id": -1}, {"id": 2**53}, {"id": "101"}, {"id": None},
    {"user": None}, {"user": []}, {"user": {}}, {"user": {"id": True}},
    {"user": {"id": 0}}, {"user": {"id": 2**53}}, {"user": {"id": "12345"}},
    {"body": None}, {"body": []}, {"body": "x" * (64 * 1024 + 1)},
    {"body": "\u00e9" * (32 * 1024 + 1)},
])
def test_comment_readback_schema_and_utf8_size(plan, changes):
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_COMMENT$"):
        client(FakeRequests(envelope(comment(plan, **changes)))).read(plan, 101)


@pytest.mark.parametrize("field", ["id", "user", "issue_url", "body"])
def test_required_readback_fields_cannot_be_replaced_with_rendered_fields(plan, field):
    value = comment(plan, body_html=plan.body, body_text=plan.body)
    del value[field]
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_COMMENT$"):
        client(FakeRequests(envelope(value))).read(plan, 101)


@pytest.mark.parametrize("body", ["", "**raw**\r\n\n`code`\n", "\u00e9\n", "e\u0301\n",
                                  "x" * (64 * 1024), "\u00e9" * (32 * 1024)],
                         ids=["empty", "markdown-crlf", "composed", "decomposed", "ascii-boundary", "utf8-boundary"])
def test_adapter_preserves_exact_raw_markdown_for_core_comparison(plan, body):
    value = comment(plan, body=body, body_text="rendered", body_html="<p>rendered</p>")
    actual = client(FakeRequests(envelope(value))).read(plan, 101)
    assert actual["body"].encode("utf8") == body.encode("utf8")


def test_adapter_does_not_mask_author_or_content_conflicts_from_core(plan):
    value = comment(plan, user={"id": AUTHOR_ID + 1, "login": "trusted-looking", "type": "Bot"},
                    author_association="OWNER", body=plan.body + "edited")
    actual = client(FakeRequests(envelope(value))).create(plan)
    assert actual["authorId"] == AUTHOR_ID + 1
    assert actual["body"] == plan.body + "edited"


def test_read_must_reject_a_different_comment_id(plan):
    """The transport promises a GET of the exact comment, not only its issue."""
    requests = FakeRequests(envelope(comment(plan, identifier=102)))
    with pytest.raises(DeliveryError):
        client(requests).read(plan, 101)
    assert len(requests.calls) == 1


@pytest.mark.parametrize("result", [None, [], {}, {"data": []}, {"data": [], "nextPage": None, "extra": 1},
                                    envelope([], True), envelope([], 0), envelope([], 3),
                                    envelope([], 4), envelope([], 5),
                                    envelope([], "2"), envelope([], 2.0)])
def test_response_envelope_is_strict(plan, result):
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_ENVELOPE$"):
        client(FakeRequests(result)).find(plan)


@pytest.mark.parametrize("operation", ["create", "read"])
def test_single_comment_response_cannot_advertise_next_page(plan, operation):
    requests = FakeRequests(envelope(comment(plan), 2))
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_PAGINATION$"):
        getattr(client(requests), operation)(plan, *([101] if operation == "read" else []))
    assert len(requests.calls) == 1


@pytest.mark.parametrize("header", [None, ""])
def test_absent_link_has_no_next_page(header):
    assert github._next_page(header, LIST_TARGET) is None


def test_next_link_parsing_does_not_authorize_another_get():
    assert github._next_page(link(2) + ", " + link(9, "last"), LIST_TARGET) == 2
    assert github._next_page(link(999999999, "last") + ", " + link(2), LIST_TARGET) == 2
    reordered = f'<https://api.github.com{TARGET}?page=2&per_page=100>; rel="next"'
    assert github._next_page(reordered, LIST_TARGET) == 2
    final = link(1, "first") + ", " + link(1, "last")
    assert github._next_page(final, LIST_TARGET) is None
    assert github.MAX_PAGES == 1


@pytest.mark.parametrize("header", [
    "garbage", link(2) + ", " + link(2), link(2).replace('"next"', '"unknown"'),
    link(2).replace('"next"', 'next'), link(2).replace('"next"', '"next last"'),
    link(2).replace("https:", "http:"), link(2).replace("api.github.com", "example.invalid"),
    link(2).replace("api.github.com", "api.github.com:443"),
    link(2).replace("api.github.com", "user@api.github.com"),
    link(2).replace("page=2>", "page=2#fragment>"), link(2, path=TARGET.replace("/17/", "/18/")),
    link(2).replace("per_page=100", "per_page=30"), link(2).replace("page=2>", "page=2&page=3>"),
    link(2).replace("page=2>", "page=2&since=2026-01-01>"),
    link(2).replace("page=2>", "page=>"), link(2).replace("page=2>", "page=02>"),
    link(2).replace("per_page=100&", ""), link(0), link(1), link(3), link(10**9),
    link(2) + " " * 4097, link(2) + "; title=unexpected",
], ids=lambda value: "header-over-bound" if len(value) > 4096 else None)
def test_malformed_or_untrusted_pagination_links_stop(header):
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_PAGINATION$"):
        github._next_page(header, LIST_TARGET)


def test_non_list_endpoint_rejects_link_header():
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_PAGINATION$"):
        github._next_page(link(2), TARGET)


def test_last_link_to_later_page_without_next_must_not_prove_completion():
    """A contradictory Link header cannot turn an incomplete scan into absence."""
    with pytest.raises(DeliveryError):
        github._next_page(link(3, "last"), LIST_TARGET)


@pytest.mark.parametrize("current_page,header", [
    (2, link(1, "last")),
    (3, link(2, "last") + ", " + link(2, "prev")),
    (1, link(2, "first")),
    (1, link(2) + ", " + link(2, "first")),
    (1, link(1, "prev")),
    (2, link(2, "prev")),
    (3, link(1, "prev")),
    (2, link(3, "prev")),
    (1, link(2) + ", " + link(1, "last")),
    (1, link(1, "last") + ", " + link(2)),
    (2, link(3) + ", " + link(2, "last")),
    (1, link(1, "first") + ", " + link(2, "last")),
], ids=["last-before-current", "last-before-current-with-prev", "wrong-first", "wrong-first-with-next",
        "prev-on-first", "prev-same-page", "prev-skips-page", "prev-forward", "last-before-next",
        "last-before-next-reversed", "last-before-next-later-page", "future-last-without-next"])
def test_contradictory_pagination_relations_stop(current_page, header):
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_PAGINATION$"):
        github._next_page(header, TARGET + f"?per_page=100&page={current_page}")


def test_find_preserves_all_matches_and_conflicts_from_one_complete_page(plan):
    foreign = comment(plan, identifier=103, user={"id": AUTHOR_ID + 1}, body=plan.body + "edited")
    requests = FakeRequests(envelope([comment(plan), comment(plan, 102, body="ordinary discussion"),
                                     foreign, comment(plan, 104)]))
    matches = client(requests).find(plan)
    assert [item["id"] for item in matches] == [101, 103, 104]
    assert matches[1]["authorId"] == AUTHOR_ID + 1
    assert matches[1]["body"] == foreign["body"]
    assert [(call["method"], call["target"]) for call in requests.calls] == [("GET", LIST_TARGET)]


@pytest.mark.parametrize("identifiers", [
    [101, 101], [102, 101], [101, 102, 101], [101, 103, 102], [101, 102, 102],
])
def test_repeated_or_nonascending_ids_stop_within_one_page(plan, identifiers):
    requests = FakeRequests(envelope([comment(plan, identifier) for identifier in identifiers]))
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_PAGINATION_CHANGED$"):
        client(requests).find(plan)
    assert len(requests.calls) == 1


@pytest.mark.parametrize("next_page,reason", [
    (1, "STOP_GITHUB_PAGINATION_REQUIRES_OPERATOR"),
    (3, "STOP_GITHUB_ENVELOPE"), (4, "STOP_GITHUB_ENVELOPE"),
])
def test_find_rejects_unusable_next_page_without_following_it(plan, next_page, reason):
    requests = FakeRequests(envelope([], next_page))
    with pytest.raises(DeliveryError, match=f"^{reason}$"):
        client(requests).find(plan)
    assert len(requests.calls) == 1


@pytest.mark.parametrize("count", [0, 1, 100])
@pytest.mark.parametrize("has_match", [False, True])
def test_paginated_find_stops_after_first_get_without_partial_result(plan, has_match, count):
    values = [comment(plan, identifier, body=plan.body if has_match else "ordinary discussion")
              for identifier in range(1, count + 1)]
    requests = FakeRequests(envelope(values, 2))
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_PAGINATION_REQUIRES_OPERATOR$"):
        client(requests).find(plan)
    assert [(call["method"], call["target"]) for call in requests.calls] == [("GET", LIST_TARGET)]


def test_shifted_duplicate_after_deletion_stops_after_first_get(plan):
    initial = [comment(plan, identifier, body=plan.body if identifier in {100, 101} else "unrelated")
               for identifier in range(1, 103)]
    first_page = initial[:100]
    after_deletion = initial[1:]
    shifted_second_page = after_deletion[100:]
    # Deleting ID 1 moves duplicate ID 101 behind the next offset of 100.
    assert [value["id"] for value in first_page if value["body"] == plan.body] == [100]
    assert after_deletion[99]["id"] == 101
    assert after_deletion[99]["body"] == plan.body
    assert [value["id"] for value in shifted_second_page] == [102]
    assert all(value["body"] != plan.body for value in shifted_second_page)

    connections = [
        FakeConnection(FakeResponse(json.dumps(first_page).encode("utf8"),
                                    headers={"Link": link(2) + ", " + link(2, "last")})),
        FakeConnection(FakeResponse(json.dumps(shifted_second_page).encode("utf8"))),
    ]
    calls = []

    def request(value):
        calls.append(deepcopy(value))
        assert len(calls) <= len(connections), "Unexpected request or retry"
        return github._http(value, connections[len(calls) - 1].factory)

    with pytest.raises(DeliveryError, match="^STOP_GITHUB_PAGINATION_REQUIRES_OPERATOR$"):
        client(request).find(plan)
    assert [(call["method"], call["target"]) for call in calls] == [("GET", LIST_TARGET)]
    assert len(connections[0].calls) == 1
    assert connections[0].closed == 1
    assert connections[1].factory_calls == []
    assert connections[1].calls == []


@pytest.mark.parametrize("data", [None, {}, "[]", [None], [{}]])
def test_invalid_list_page_or_comment_stops(plan, data):
    with pytest.raises(DeliveryError):
        client(FakeRequests(envelope(data))).find(plan)


def test_page_size_bound_and_empty_complete_scan(plan):
    requests = FakeRequests(envelope([comment(plan, index) for index in range(1, 102)]))
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_PAGE$"):
        client(requests).find(plan)
    assert client(FakeRequests(envelope([]))).find(plan) == []
    assert len(client(FakeRequests(envelope([comment(plan, i) for i in range(1, 101)]))).find(plan)) == 100


@pytest.mark.parametrize("operation", ["create", "read", "find"])
def test_transport_failure_is_not_retried(plan, operation):
    requests = FakeRequests(OSError("synthetic transport failure"))
    with pytest.raises(OSError):
        getattr(client(requests), operation)(plan, *([101] if operation == "read" else []))
    assert len(requests.calls) == 1


@pytest.mark.parametrize("method,status", [("GET", 200), ("POST", 201)])
def test_http_request_headers_payload_and_connection_cleanup(plan, method, status):
    response = FakeResponse(json.dumps(comment(plan)).encode("utf8"), status=status)
    connection = FakeConnection(response)
    value = request_input(method=method, target=TARGET if method == "POST" else LIST_TARGET,
                          payload={"body": plan.body} if method == "POST" else {})
    result = github._http(value, connection.factory)
    assert result == envelope(comment(plan))
    assert connection.factory_calls == [("api.github.com", {"timeout": 10})]
    assert len(connection.calls) == 1
    sent_method, target, options = connection.calls[0]
    assert (sent_method, target) == (method, value["target"])
    headers = options["headers"]
    assert headers["Authorization"] == "Bearer " + TOKEN
    assert headers["Accept"] == "application/vnd.github+json"
    assert headers["Accept-Encoding"] == "identity"
    assert headers["X-GitHub-Api-Version"] == github.API_VERSION
    assert headers["User-Agent"]
    assert not any(key.lower() in {"if-match", "if-none-match", "idempotency-key"} for key in headers)
    if method == "POST":
        assert json.loads(options["body"]) == {"body": plan.body}
        assert headers["Content-Type"] == "application/json"
    else:
        assert options["body"] is None
    assert response.read_sizes == [github.MAX_RESPONSE_BYTES + 1]
    assert connection.closed == 1


@pytest.mark.parametrize("status", [201, 204, 301, 302, 303, 307, 308, 400, 401, 403, 404, 410, 422, 429, 500, 502, 503, 504])
def test_http_errors_and_redirects_stop_without_read_or_retry(status, capsys):
    response = FakeResponse(TOKEN.encode(), status=status,
                            headers={"Location": "https://example.invalid/", "Retry-After": "0"})
    connection = FakeConnection(response)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_STATUS$") as caught:
        github._http(request_input(), connection.factory)
    assert TOKEN not in str(caught.value)
    assert len(connection.calls) == 1
    assert response.read_sizes == []
    assert connection.closed == 1
    assert capsys.readouterr() == ("", "")


def test_post_requires_201_not_200():
    connection = FakeConnection(FakeResponse(status=200))
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_STATUS$"):
        github._http(request_input(method="POST", target=TARGET, payload={"body": "notice"}), connection.factory)
    assert len(connection.calls) == 1
    assert connection.closed == 1


@pytest.mark.parametrize("encoding", ["gzip", "br", "deflate", "identity, gzip", "", "IDENTITY"])
def test_encoded_http_responses_are_rejected_before_body_read(encoding):
    response = FakeResponse(headers={"Content-Encoding": encoding})
    connection = FakeConnection(response)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_ENCODING$"):
        github._http(request_input(), connection.factory)
    assert response.read_sizes == []
    assert connection.closed == 1


@pytest.mark.parametrize("over_limit", [False, True])
def test_http_response_limit_counts_actual_bytes_not_content_length(over_limit):
    content = b"[]" + b" " * (github.MAX_RESPONSE_BYTES - 2 + over_limit)
    response = FakeResponse(content, headers={"Content-Length": "2"})
    connection = FakeConnection(response)
    if over_limit:
        with pytest.raises(DeliveryError, match="^STOP_GITHUB_RESPONSE_BOUND$"):
            github._http(request_input(), connection.factory)
    else:
        assert github._http(request_input(), connection.factory) == envelope([])
    assert response.read_sizes == [github.MAX_RESPONSE_BYTES + 1]
    assert connection.closed == 1


@pytest.mark.parametrize("content", [b"", b"{", b"\xff", b"null", b"true", b"42", b'"string"', b"{} trailing"])
def test_invalid_http_json_or_utf8_always_closes_connection(content):
    connection = FakeConnection(FakeResponse(content))
    with pytest.raises(ValueError):
        github._http(request_input(), connection.factory)
    assert len(connection.calls) == 1
    assert connection.closed == 1


@pytest.mark.parametrize("stage", ["request", "read"])
def test_http_transport_exceptions_close_connection_without_retry(stage):
    failure = OSError("synthetic failure")
    connection = FakeConnection(FakeResponse(failure if stage == "read" else b"{}"),
                                failure=failure if stage == "request" else None)
    with pytest.raises(OSError):
        github._http(request_input(), connection.factory)
    assert len(connection.calls) == 1
    assert connection.closed == 1


def test_http_next_link_is_parsed_before_return():
    connection = FakeConnection(FakeResponse(b"[]", headers={"Link": link(2)}))
    assert github._http(request_input(), connection.factory) == envelope([], 2)
    assert connection.closed == 1


def test_isolated_worker_kwargs_credentials_and_environment(monkeypatch, capsys):
    calls = []
    monkeypatch.setenv("GITHUB_TOKEN", "synthetic-environment-secret")
    monkeypatch.setenv("HTTPS_PROXY", "https://example.invalid/")
    monkeypatch.setenv("PYTHONPATH", "untrusted-synthetic-path")

    def run(argv, **kwargs):
        calls.append((argv, kwargs))
        return subprocess.CompletedProcess(argv, 0, stdout=json.dumps(envelope([])), stderr=TOKEN)

    monkeypatch.setattr(subprocess, "run", run)
    value = request_input()
    assert github._isolated_request(value) == envelope([])
    assert len(calls) == 1
    argv, kwargs = calls[0]
    assert argv == [github.sys.executable, "-B", "-m", "scripts.source_metadata_github", "--worker"]
    assert TOKEN not in repr(argv)
    assert kwargs["cwd"] == Path("C:/sgSHIOK2026") == github.ROOT
    assert kwargs["timeout"] == 10
    assert kwargs["capture_output"] is True
    assert kwargs["text"] is True
    assert kwargs["encoding"] == "utf8"
    assert json.loads(kwargs["input"]) == value
    assert set(kwargs) == {"cwd", "input", "text", "encoding", "capture_output", "timeout", "env", "creationflags"}
    assert kwargs["creationflags"] == getattr(subprocess, "CREATE_NO_WINDOW", 0)
    env = kwargs["env"]
    assert set(env) <= {"SYSTEMROOT", "WINDIR", "SYSTEMDRIVE", "PATH", "PYTHONUTF8", "PYTHONDONTWRITEBYTECODE", "TEMP", "TMP"}
    assert env["PYTHONUTF8"] == env["PYTHONDONTWRITEBYTECODE"] == "1"
    assert Path(env["TEMP"]) == Path(env["TMP"]) == github.ROOT / "tmp"
    assert TOKEN not in repr(env)
    assert capsys.readouterr() == ("", "")


@pytest.mark.parametrize("failure_kind", ["timeout", "oserror", "valueerror", "recursion"])
def test_injected_worker_failures_are_sanitized_without_retry(monkeypatch, capsys, failure_kind):
    calls = []

    def run(argv, **kwargs):
        calls.append((argv, kwargs))
        if failure_kind == "timeout":
            raise subprocess.TimeoutExpired(argv, 10, output=TOKEN, stderr=TOKEN)
        failures = {"oserror": OSError, "valueerror": ValueError, "recursion": RecursionError}
        raise failures[failure_kind](TOKEN)

    monkeypatch.setattr(subprocess, "run", run)
    with pytest.raises(DeliveryError) as caught:
        github._isolated_request(request_input())
    assert str(caught.value) == "STOP_GITHUB_REQUEST_FAILED"
    assert caught.value.__suppress_context__ is True
    assert TOKEN not in "".join(traceback.format_exception(caught.type, caught.value, caught.tb))
    assert len(calls) == 1
    assert capsys.readouterr() == ("", "")


@pytest.mark.parametrize("stdout,returncode", [
    ("", 1), (TOKEN, 1), (TOKEN, 0), ("[]", 0), ("{}", 0),
    ('{"data": []}', 0), ('{"data": [], "nextPage": null, "extra": true}', 0),
    ("x" * (6 * github.MAX_RESPONSE_BYTES + 1), 0),
], ids=["nonzero", "nonzero-secret", "invalid-json", "array", "empty-object", "missing-field", "extra-field", "over-bound"])
def test_worker_status_output_schema_and_size_are_sanitized(monkeypatch, capsys, stdout, returncode):
    calls = []

    def run(argv, **kwargs):
        calls.append(argv)
        return subprocess.CompletedProcess(argv, returncode, stdout=stdout, stderr=TOKEN)

    monkeypatch.setattr(subprocess, "run", run)
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_REQUEST_FAILED$") as caught:
        github._isolated_request(request_input())
    assert TOKEN not in str(caught.value)
    assert len(calls) == 1
    assert capsys.readouterr() == ("", "")


def test_invalid_worker_input_never_starts_subprocess():
    with pytest.raises(DeliveryError, match="^STOP_GITHUB_REQUEST$"):
        github._isolated_request(request_input(method="PATCH"))
