import json

import pytest

from pipeline import probe_datamall


def test_probe_datamall_requires_confirmation_before_http(monkeypatch, capsys):
    def fail_probe():
        raise AssertionError("DataMall probe should not run before confirmation")

    monkeypatch.setattr(probe_datamall, "probe_datamall", fail_probe)

    assert probe_datamall.main([]) == 1

    report = json.loads(capsys.readouterr().out)
    assert report == {
        "errors": ["DataMall probe requires --confirm-datamall-probe after owner approval"],
        "ok": False,
    }


def test_probe_datamall_help_names_confirmation(capsys):
    with pytest.raises(SystemExit) as excinfo:
        probe_datamall.main(["--help"])

    assert excinfo.value.code == 0
    out = capsys.readouterr().out
    assert "--confirm-datamall-probe" in out


def test_probe_datamall_runs_after_confirmation(monkeypatch):
    calls = []

    def fake_probe():
        calls.append("called")

    monkeypatch.setattr(probe_datamall, "probe_datamall", fake_probe)

    assert probe_datamall.main(["--confirm-datamall-probe"]) == 0
    assert calls == ["called"]
