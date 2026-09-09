from datetime import UTC, datetime
import json

import pytest

from scripts.source_metadata_http import MetadataClient, observe_source
from scripts import source_metadata_http as transport


URL = "https://api-production.data.gov.sg/v2/public/api/datasets/d_abc/metadata"
NOW = datetime(2026, 9, 9, tzinfo=UTC)


class Response:
    def __init__(self, status=200, body=None, headers=None):
        self.status = status
        self.body = body if body is not None else b'{"data":{"datasetId":"d_abc","lastUpdatedAt":"2026-08-01T00:00:00Z"}}'
        self.headers = {"content-type": "application/json", **(headers or {})}
        self.offset = 0
        self.reads = 0

    def getheader(self, name, default=None):
        return self.headers.get(name.lower(), default)

    def read(self, count):
        self.reads += 1
        result = self.body[self.offset:self.offset + count]
        self.offset += len(result)
        return result


def client_for(responses, **options):
    requests, connections, clock = [], [], [0.0]

    class Connection:
        def __init__(self, host, timeout):
            self.host, self.timeout, self.closed = host, timeout, False
            connections.append(self)

        def request(self, method, path, headers):
            requests.append((method, self.host, path, headers))

        def getresponse(self):
            value = responses.pop(0)
            if isinstance(value, Exception):
                raise value
            clock[0] += getattr(value, "delay", 0)
            return value

        def close(self):
            self.closed = True

    client = MetadataClient(connection_factory=Connection, monotonic=lambda: clock[0],
                            sleep=lambda seconds: clock.__setitem__(0, clock[0] + seconds),
                            wall_clock=lambda: NOW, **options)
    return client, requests, connections, clock


def test_success_only_gets_metadata_and_closes_connection():
    client, requests, connections, _ = client_for([Response()])
    result = client.get_json(URL)
    assert result["outcome"] == "response"
    assert result["statusCode"] == 200
    assert result["bodyBytes"] > 0
    assert requests[0][:3] == ("GET", "api-production.data.gov.sg", "/v2/public/api/datasets/d_abc/metadata")
    assert connections[0].closed


@pytest.mark.parametrize("url", [
    "http://api-production.data.gov.sg/v2/public/api/datasets/d_abc/metadata",
    "https://example.com/v2/public/api/datasets/d_abc/metadata",
    "https://api-production.data.gov.sg/v2/public/api/datasets/d_abc/list-rows",
    "https://api-open.data.gov.sg/v1/public/api/datasets/d_abc/initiate-download",
    "https://api-production.data.gov.sg/v2/public/api/datasets/d_abc/metadata?url=x",
    "https://user:secret@api-production.data.gov.sg/v2/public/api/datasets/d_abc/metadata",
    "https://api-production.data.gov.sg:444/v2/public/api/datasets/d_abc/metadata",
    "https://api-production.data.gov.sg/v2/public/api/datasets/d_abc/metadata#fragment",
    "https://datamall2.mytransport.sg/ltaodataservice/BusStops",
    "https://datamall2.mytransport.sg/ltaodataservice/GeospatialWholeIsland?ID=CoveredLinkWay&other=x",
])
def test_non_allowlisted_endpoints_never_connect(url):
    client, requests, connections, _ = client_for([])
    with pytest.raises(ValueError):
        client.get_json(url)
    assert requests == connections == []


def test_credentials_are_never_sent_to_data_gov():
    client, requests, _, _ = client_for([])
    with pytest.raises(ValueError):
        client.get_json(URL, {"AccountKey": "secret"})
    assert not requests


@pytest.mark.parametrize("headers", [{"If-None-Match": "bad\r\nheader"}, {"Authorization": "secret"}])
def test_unapproved_headers_never_connect(headers):
    client, requests, _, _ = client_for([])
    with pytest.raises(ValueError):
        client.get_json(URL, headers)
    assert not requests


def test_redirect_is_not_followed_or_read():
    response = Response(302, headers={"location": "https://example.com/secret.zip"})
    client, requests, connections, _ = client_for([response])
    result = client.get_json(URL)
    assert result["outcome"] == "redirect_blocked"
    assert "secret" not in json.dumps(result)
    assert len(requests) == 1 and response.reads == 0 and connections[0].closed


def test_rate_limit_defers_host_without_retry_and_honors_bounded_retry_after():
    client, requests, _, _ = client_for([Response(429, headers={"retry-after": "120"})])
    first, second = client.get_json(URL), client.get_json(URL)
    assert first["outcome"] == "rate_limited"
    assert first["retryAt"] == "2026-09-09T00:02:00+00:00"
    assert second["outcome"] == "deferred" and not second["attempted"]
    assert len(requests) == 1


@pytest.mark.parametrize("retry_after", ["garbage", "-8", "0"])
def test_bad_or_short_retry_after_uses_minimum_cooldown(retry_after):
    client, _, _, _ = client_for([Response(429, headers={"retry-after": retry_after})])
    assert client.get_json(URL)["retryAt"] == "2026-09-09T00:01:00+00:00"


def test_304_does_not_read_response_body():
    response = Response(304)
    client, _, _, _ = client_for([response])
    assert client.get_json(URL)["outcome"] == "not_modified"
    assert response.reads == 0


@pytest.mark.parametrize("status", [401, 403, 404, 500, 503])
def test_http_errors_are_bounded_and_do_not_print_body(status):
    response = Response(status, body=b'private server detail')
    client, _, connections, _ = client_for([response])
    result = client.get_json(URL)
    assert result["outcome"] == "http_error" and result["statusCode"] == status
    assert "private" not in json.dumps(result) and response.reads == 0
    assert connections[0].closed


def test_timeout_is_not_retried_or_echoed():
    client, requests, connections, _ = client_for([TimeoutError("secret diagnostic")])
    result = client.get_json(URL)
    assert result["outcome"] == "timeout"
    assert "secret" not in json.dumps(result) and len(requests) == 1
    assert connections[0].closed


def test_total_request_budget_prevents_more_connections():
    client, requests, _, _ = client_for([Response()], max_requests=1)
    client.get_json(URL)
    result = client.get_json(URL)
    assert result["outcome"] == "deferred" and result["reason"] == "request_budget"
    assert len(requests) == 1


def test_spacing_that_cannot_fit_deadline_defers_instead_of_sleeping():
    client, requests, _, clock = client_for([Response()], max_seconds=5)
    client.get_json(URL)
    result = client.get_json(URL)
    assert result["outcome"] == "deferred" and result["reason"] == "time_budget"
    assert len(requests) == 1 and clock[0] == 0


def test_per_host_spacing_is_enforced():
    client, requests, _, clock = client_for([Response(), Response()])
    client.get_json(URL)
    client.get_json(URL)
    assert clock[0] == 13 and len(requests) == 2


@pytest.mark.parametrize("body,headers", [
    (b'{', {}), (b'\xff', {}), (b'{"x":NaN}', {}),
    (b'{}', {"content-type": "application/zip"}),
    (b'{}', {"content-encoding": "gzip"}),
])
def test_malformed_or_wrong_payload_never_becomes_observation(body, headers):
    client, _, _, _ = client_for([Response(body=body, headers=headers)])
    assert client.get_json(URL)["outcome"] == "malformed"


def test_oversized_header_is_rejected_without_reading_body():
    response = Response(headers={"content-length": "999999"})
    client, _, _, _ = client_for([response])
    assert client.get_json(URL)["outcome"] == "oversized" and response.reads == 0


def test_stream_without_size_header_reads_only_limit_plus_one():
    response = Response(body=b' ' * 300000)
    client, _, _, _ = client_for([response], max_bytes=1024)
    assert client.get_json(URL)["outcome"] == "oversized"
    assert response.offset == 1025


def test_observer_validates_dataset_identity_and_excludes_unrelated_metadata():
    body = json.dumps({"data": {"datasetId": "d_abc", "lastUpdatedAt": "2026-08-01T08:00:00+08:00", "description": "private", "downloadUrl": "secret"}}).encode()
    client, _, _, _ = client_for([Response(body=body)])
    result = observe_source({"adapter": "datagov_metadata", "datasetId": "d_abc"}, None, client, {})
    assert result["outcome"] == "observed"
    assert result["metadata"]["publisherUpdatedAt"] == "2026-08-01T00:00:00+00:00"
    assert "private" not in json.dumps(result) and "secret" not in json.dumps(result)


def test_wrong_dataset_is_not_observed():
    client, _, _, _ = client_for([Response()])
    assert observe_source({"adapter": "datagov_metadata", "datasetId": "d_wrong"}, None, client, {})["outcome"] == "malformed"


@pytest.mark.parametrize("adapter,outcome", [("manual", "manual"), ("unsupported", "unsupported"), ("datamall_listing", "credentials_required")])
def test_no_request_for_manual_unsupported_or_missing_credentials(adapter, outcome):
    client, requests, _, _ = client_for([])
    result = observe_source({"adapter": adapter, "keyword": "CoveredLinkWay"}, None, client, {})
    assert result["outcome"] == outcome and not result["attempted"]
    assert not requests


def test_listing_reference_discards_rotating_signatures_and_never_follows_link():
    base = "https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/CoveredLinkWay.zip"
    responses = [Response(body=json.dumps({"value": [{"Link": base + "?X-Amz-Signature=" + token}]}).encode()) for token in ["one", "two"]]
    client, requests, _, _ = client_for(responses)
    source, creds = {"adapter": "datamall_listing", "keyword": "CoveredLinkWay"}, {"LTA_DATAMALL_ACCOUNT_KEY": "owner-secret"}
    first, second = observe_source(source, None, client, creds), observe_source(source, None, client, creds)
    assert first["metadata"]["identity"] == second["metadata"]["identity"]
    assert first["metadata"]["kind"] == "listing_reference"
    assert first["metadata"]["publisherUpdatedAt"] is None
    assert len(requests) == 2 and all(r[1] == "datamall2.mytransport.sg" for r in requests)
    assert "Signature" not in json.dumps(first) and "owner-secret" not in json.dumps(first)


def test_missing_publisher_timestamp_stays_unknown():
    client, _, _, _ = client_for([Response(body=b'{"data":{"datasetId":"d_abc"}}')])
    result = observe_source({"adapter": "datagov_metadata", "datasetId": "d_abc"}, None, client, {})
    assert result["outcome"] == "observed" and result["metadata"]["publisherUpdatedAt"] is None
    assert result["metadata"]["identity"] is None


@pytest.mark.parametrize("value", ["259200", "Sat, 12 Sep 2026 00:00:00 GMT"])
def test_long_retry_after_is_not_shortened_to_one_day(value):
    client, _, _, _ = client_for([Response(429, headers={"retry-after": value})])
    assert client.get_json(URL)["retryAt"] == "2026-09-12T00:00:00+00:00"


def test_unrepresentable_retry_after_requires_indefinite_manual_wait():
    client, _, _, _ = client_for([Response(429, headers={"retry-after": "9" * 1000})])
    assert client.get_json(URL)["retryAt"].startswith("9999-")


def test_late_304_is_timeout_not_success():
    response = Response(304)
    response.delay = 6
    client, _, connections, _ = client_for([response], max_seconds=5)
    assert client.get_json(URL)["outcome"] == "timeout"
    assert response.reads == 0 and connections[0].closed


def test_late_eof_is_timeout_not_success():
    response = Response()
    client, _, connections, clock = client_for([response], max_seconds=5)
    read = response.read

    def delayed_read(count):
        value = read(count)
        if not value:
            clock[0] = 6
        return value

    response.read = delayed_read
    assert client.get_json(URL)["outcome"] == "timeout"
    assert connections[0].closed


def test_real_stalled_worker_is_killed_and_waited_without_network(monkeypatch):
    import sys
    import time
    processes = []
    original = transport.subprocess.Popen

    def capture(*args, **kwargs):
        process = original(*args, **kwargs)
        processes.append(process)
        return process

    monkeypatch.setattr(transport, "_WORKER_COMMAND", (sys.executable, "-B", "-c", "import time; time.sleep(20)"))
    monkeypatch.setattr(transport.subprocess, "Popen", capture)
    start = time.monotonic()
    result = transport._isolated_request(URL, {}, 1024, 0.2)
    assert result["outcome"] == "timeout" and result["reason"] == "absolute_request_deadline"
    assert processes and all(p.poll() is not None for p in processes)
    assert time.monotonic() - start < 10


@pytest.mark.parametrize("link", ["https://[broken", "https://dmgeospatial.s3.ap-southeast-1.amazonaws.com:bad/CoveredLinkWay.zip"])
def test_malformed_listing_urls_are_source_errors_not_uncaught_exceptions(link):
    client, _, _, _ = client_for([Response(body=json.dumps({"value": [{"Link": link}]}).encode())])
    result = observe_source({"adapter": "datamall_listing", "keyword": "CoveredLinkWay"}, None, client, {"LTA_DATAMALL_ACCOUNT_KEY": "key"})
    assert result["outcome"] == "malformed"


def test_cleanup_failure_is_recorded_without_exception_details():
    client, _, connections, _ = client_for([Response()])
    connect = client.connect

    def broken_close_factory(*args, **kwargs):
        connection = connect(*args, **kwargs)
        connection.close = lambda: (_ for _ in ()).throw(OSError("private cleanup detail"))
        return connection

    client.connect = broken_close_factory
    result = client.get_json(URL)
    assert result["outcome"] == "http_error" and result["reason"] == "connection_cleanup_failed"
    assert "private" not in json.dumps(result)


@pytest.mark.parametrize("date", ["0001-01-01T00:00:00+14:00", "9999-12-31T23:59:59-14:00"])
def test_publisher_instant_overflow_is_unknown_not_a_crash(date):
    assert transport.publisher_instant(date) is None
