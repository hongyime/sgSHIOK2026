import json

import pytest

from pipeline import parse_static_datamall


def test_parse_static_datamall_requires_confirmation_before_http(monkeypatch, capsys):
    def fail_parse():
        raise AssertionError("DataMall static parser should not run before confirmation")

    monkeypatch.setattr(parse_static_datamall, "parse_datamall_static_links", fail_parse)

    assert parse_static_datamall.main([]) == 1

    report = json.loads(capsys.readouterr().out)
    assert report == {
        "errors": [
            "DataMall static parser requires --confirm-datamall-static-parse after owner approval"
        ],
        "ok": False,
    }


def test_parse_static_datamall_help_names_confirmation(capsys):
    with pytest.raises(SystemExit) as excinfo:
        parse_static_datamall.main(["--help"])

    assert excinfo.value.code == 0
    assert "--confirm-datamall-static-parse" in capsys.readouterr().out


def test_parse_static_datamall_runs_after_confirmation(monkeypatch):
    calls = []
    monkeypatch.setattr(
        parse_static_datamall,
        "parse_datamall_static_links",
        lambda: calls.append("called"),
    )

    assert parse_static_datamall.main(["--confirm-datamall-static-parse"]) == 0
    assert calls == ["called"]
