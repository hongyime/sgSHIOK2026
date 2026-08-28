import json

from pipeline import probe_onemap


def test_probe_onemap_requires_explicit_output_and_confirmation(monkeypatch, capsys):
    def fail_probe(*_args, **_kwargs):
        raise AssertionError("probe should not run before CLI guard")

    monkeypatch.setattr(probe_onemap, "run_ladder_probe", fail_probe)

    assert probe_onemap.main([]) == 1

    report = json.loads(capsys.readouterr().out)
    assert report == {
        "errors": [
            "OneMap probe requires explicit --output",
            "OneMap probe requires --confirm-onemap-probe",
        ],
        "ok": False,
    }


def test_probe_onemap_refuses_historical_default_output(monkeypatch, capsys):
    def fail_probe(*_args, **_kwargs):
        raise AssertionError("probe should not run with historical default output")

    monkeypatch.setattr(probe_onemap, "run_ladder_probe", fail_probe)

    assert (
        probe_onemap.main(
            [
                "--output",
                str(probe_onemap.CSV_PATH),
                "--confirm-onemap-probe",
            ]
        )
        == 1
    )

    report = json.loads(capsys.readouterr().out)
    assert report == {
        "errors": [f"OneMap probe refuses historical default output: {probe_onemap.CSV_PATH}"],
        "ok": False,
    }


def test_probe_onemap_refuses_existing_output_before_probe(monkeypatch, tmp_path, capsys):
    def fail_probe(*_args, **_kwargs):
        raise AssertionError("probe should not run when output exists")

    monkeypatch.setattr(probe_onemap, "run_ladder_probe", fail_probe)
    output = tmp_path / "onemap_probe_v2.csv"
    output.write_text("existing\n", encoding="utf-8")

    assert (
        probe_onemap.main(
            [
                "--output",
                str(output),
                "--confirm-onemap-probe",
            ]
        )
        == 1
    )

    report = json.loads(capsys.readouterr().out)
    assert report == {
        "errors": [f"OneMap probe output already exists: {output}"],
        "ok": False,
    }


def test_probe_onemap_confirmed_fresh_output_reaches_probe(monkeypatch, tmp_path):
    calls = []

    def fake_probe(output):
        calls.append(output)

    monkeypatch.setattr(probe_onemap, "run_ladder_probe", fake_probe)
    output = tmp_path / "onemap_probe_v2.csv"

    assert (
        probe_onemap.main(
            [
                "--output",
                str(output),
                "--confirm-onemap-probe",
            ]
        )
        == 0
    )

    assert calls == [output]
