from __future__ import annotations

from pipeline import network


def test_network_cli_requires_confirm_before_build(monkeypatch, capsys) -> None:
    calls = []

    def fake_run_build(area: str) -> None:
        calls.append(area)
        raise AssertionError("unconfirmed network build must not run")

    monkeypatch.setattr(network, "run_build", fake_run_build)

    try:
        network.main([])
    except SystemExit as exc:
        assert exc.code == 2
    else:
        raise AssertionError("expected SystemExit")

    assert calls == []
    err = capsys.readouterr().err
    assert "network build writes processed network artifacts and QA outputs" in err
    assert "--confirm-network-build" in err


def test_network_cli_runs_confirmed_build(monkeypatch) -> None:
    calls = []

    def fake_run_build(area: str) -> None:
        calls.append(area)

    monkeypatch.setattr(network, "run_build", fake_run_build)

    assert network.main(["--area", "island", "--confirm-network-build"]) == 0

    assert calls == ["island"]
