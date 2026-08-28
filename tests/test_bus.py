import json

from pipeline.bus import (
    build_stop_service_headways,
    combined_expected_wait_min,
    main,
    parse_peak_frequency_minutes,
)


def test_parse_peak_frequency_minutes():
    assert parse_peak_frequency_minutes("06-08") == 7.0
    assert parse_peak_frequency_minutes("10") == 10.0
    assert parse_peak_frequency_minutes("-") is None
    assert parse_peak_frequency_minutes("") is None
    assert parse_peak_frequency_minutes("bad") is None


def test_combined_expected_wait_min():
    assert combined_expected_wait_min([]) is None
    assert combined_expected_wait_min([10.0]) == 5.0
    assert combined_expected_wait_min([10.0, 10.0]) == 2.5


def test_build_stop_service_headways_joins_routes_to_parseable_am_peak_services():
    services = [
        {"ServiceNo": "10", "Direction": 1, "AM_Peak_Freq": "08-10"},
        {"ServiceNo": "20", "Direction": 1, "AM_Peak_Freq": "-"},
        {"ServiceNo": "30", "Direction": 2, "AM_Peak_Freq": "06-08"},
    ]
    routes = [
        {"BusStopCode": "01012", "ServiceNo": "10", "Direction": 1},
        {"BusStopCode": "01012", "ServiceNo": "20", "Direction": 1},
        {"BusStopCode": "01013", "ServiceNo": "30", "Direction": 2},
    ]

    stop_headways = build_stop_service_headways(services, routes)

    assert stop_headways == {
        "01012": {("10", 1): 9.0},
        "01013": {("30", 2): 7.0},
    }


def test_bus_cli_requires_confirm_before_loading_sources(monkeypatch, capsys):
    from pipeline import fetch

    def fail_load_sources():
        raise AssertionError("source config should not load before confirmation")

    monkeypatch.setattr(fetch, "load_sources", fail_load_sources)

    assert main(["ingest"]) == 1

    out = capsys.readouterr().out
    report = json.loads(out)
    assert report == {
        "errors": ["bus API ingest requires --confirm-input-refresh after owner approval"],
        "ok": False,
    }


def test_bus_cli_forwards_confirmed_ingest(monkeypatch, capsys):
    from pipeline import bus, fetch

    monkeypatch.setattr(fetch, "load_sources", lambda: {"bus_stops": {"endpoint": "unused"}})
    monkeypatch.setattr(bus, "ingest_bus_api_sources", lambda sources: {"bus_stops": 1})

    assert main(["ingest", "--confirm-input-refresh"]) == 0

    out = capsys.readouterr().out
    assert json.loads(out) == {"bus_stops": 1}
