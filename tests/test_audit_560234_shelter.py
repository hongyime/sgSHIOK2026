import sys

from scripts import audit_560234_shelter


def test_560234_shelter_audit_requires_explicit_outputs_before_loading(
    monkeypatch, capsys
) -> None:
    def fail_if_loaded(**_kwargs):
        raise AssertionError("audit should not load data before explicit output validation")

    monkeypatch.setattr(audit_560234_shelter, "run_audit", fail_if_loaded)
    monkeypatch.setattr(sys, "argv", ["audit_560234_shelter.py"])

    assert audit_560234_shelter.main() == 2

    captured = capsys.readouterr()
    assert "560234 shelter audit requires explicit --geojson-output" in captured.err
    assert "560234 shelter audit requires explicit --notes-output" in captured.err


def test_560234_shelter_audit_refuses_existing_explicit_output(
    tmp_path, monkeypatch, capsys
) -> None:
    existing_geojson = tmp_path / "existing.geojson"
    notes_output = tmp_path / "notes.md"
    existing_geojson.write_text("{}\n", encoding="utf-8")
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "audit_560234_shelter.py",
            "--geojson-output",
            str(existing_geojson),
            "--notes-output",
            str(notes_output),
        ],
    )

    assert audit_560234_shelter.main() == 2

    captured = capsys.readouterr()
    assert "refusing to overwrite existing audit output" in captured.err
    assert existing_geojson.read_text(encoding="utf-8") == "{}\n"
    assert not notes_output.exists()
