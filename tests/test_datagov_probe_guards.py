import json

import pytest

from pipeline import (
    inspect_datagov,
    resolve_datagov,
    resolve_datagov_ids,
    verify_datagov_ids,
)


@pytest.mark.parametrize(
    ("module", "helper_name"),
    [
        (verify_datagov_ids, "verify_datagov_ids"),
        (inspect_datagov, "search_api_routes"),
        (resolve_datagov, "resolve_dataset_by_keyword"),
        (resolve_datagov_ids, "resolve_datagov_ids"),
    ],
)
def test_datagov_probe_scripts_require_confirmation_before_http(
    monkeypatch, capsys, module, helper_name
):
    def fail_helper(*_args, **_kwargs):
        raise AssertionError("data.gov.sg probe should not run before confirmation")

    monkeypatch.setattr(module, helper_name, fail_helper)

    assert module.main([]) == 1

    report = json.loads(capsys.readouterr().out)
    assert report == {
        "errors": ["data.gov.sg probe requires --confirm-datagov-probe after owner approval"],
        "ok": False,
    }


@pytest.mark.parametrize(
    "module",
    [verify_datagov_ids, inspect_datagov, resolve_datagov, resolve_datagov_ids],
)
def test_datagov_probe_help_names_confirmation(capsys, module):
    with pytest.raises(SystemExit) as excinfo:
        module.main(["--help"])

    assert excinfo.value.code == 0
    assert "--confirm-datagov-probe" in capsys.readouterr().out


def test_verify_datagov_ids_runs_after_confirmation(monkeypatch):
    calls = []
    monkeypatch.setattr(verify_datagov_ids, "verify_datagov_ids", lambda: calls.append("called"))

    assert verify_datagov_ids.main(["--confirm-datagov-probe"]) == 0
    assert calls == ["called"]


def test_inspect_datagov_runs_after_confirmation(monkeypatch):
    calls = []
    monkeypatch.setattr(inspect_datagov, "search_api_routes", lambda: calls.append("called"))

    assert inspect_datagov.main(["--confirm-datagov-probe"]) == 0
    assert calls == ["called"]


def test_resolve_datagov_runs_after_confirmation(monkeypatch):
    calls = []
    monkeypatch.setattr(
        resolve_datagov,
        "resolve_dataset_by_keyword",
        lambda query: calls.append(query),
    )

    assert resolve_datagov.main(["--confirm-datagov-probe"]) == 0
    assert calls == ["MRT", "Traffic Signal", "Lamp Post", "HDB"]


def test_resolve_datagov_ids_runs_after_confirmation(monkeypatch):
    calls = []
    monkeypatch.setattr(resolve_datagov_ids, "resolve_datagov_ids", lambda: calls.append("called"))

    assert resolve_datagov_ids.main(["--confirm-datagov-probe"]) == 0
    assert calls == ["called"]
