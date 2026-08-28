import json
import sys


def test_audit_postal_candidates_refuses_existing_output_before_scoring(
    monkeypatch, tmp_path, capsys
):
    from scripts import audit_postal_candidates

    output = tmp_path / "postal-audit.json"
    output.write_text("existing\n", encoding="utf-8")

    def fail_score_postals(**kwargs):
        raise AssertionError("score_postals should not run before output guard")

    monkeypatch.setattr(audit_postal_candidates, "score_postals", fail_score_postals)
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "audit_postal_candidates.py",
            "--postal",
            "123456",
            "--output",
            str(output),
        ],
    )

    assert audit_postal_candidates.main() == 2

    report = json.loads(capsys.readouterr().out)
    assert report == {
        "errors": [f"refusing to overwrite existing analysis output: {output}"],
        "ok": False,
    }
    assert output.read_text(encoding="utf-8") == "existing\n"


def test_audit_postal_candidates_requires_confirmation_before_scoring(
    monkeypatch, tmp_path, capsys
):
    from scripts import audit_postal_candidates

    output = tmp_path / "postal-audit.json"

    def fail_score_postals(**kwargs):
        raise AssertionError("score_postals should not run before confirmation guard")

    monkeypatch.setattr(audit_postal_candidates, "score_postals", fail_score_postals)
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "audit_postal_candidates.py",
            "--postal",
            "123456",
            "--output",
            str(output),
        ],
    )

    assert audit_postal_candidates.main() == 2

    report = json.loads(capsys.readouterr().out)
    assert report == {
        "errors": [
            "candidate audit requires --confirm-candidate-audit after owner approval"
        ],
        "ok": False,
    }
    assert not output.exists()


def test_audit_postal_candidates_confirmed_audit_reaches_scoring(
    monkeypatch, tmp_path, capsys
):
    from scripts import audit_postal_candidates

    output = tmp_path / "postal-audit.json"
    calls = []

    def fake_score_postals(**kwargs):
        calls.append(kwargs)
        return [
            {
                "postal": "123456",
                "state": "SCORED",
                "total": 99.0,
                "provenance": {},
            }
        ]

    monkeypatch.setattr(audit_postal_candidates, "score_postals", fake_score_postals)
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "audit_postal_candidates.py",
            "--postal",
            "123456",
            "--output",
            str(output),
            "--confirm-candidate-audit",
        ],
    )

    assert audit_postal_candidates.main() == 0

    report = json.loads(capsys.readouterr().out)
    assert report == {
        "ok": True,
        "output": str(output),
        "record_count": 1,
    }
    assert calls == [
        {
            "postal_codes": ["123456"],
            "include_geometry": False,
            "network_path": audit_postal_candidates.NETWORK_PATH,
            "postal_universe_path": audit_postal_candidates.DEFAULT_UNIVERSE,
            "include_candidate_debug": True,
        }
    ]


def test_audit_connector_candidates_refuses_existing_output_before_pipeline_import(
    monkeypatch, tmp_path, capsys
):
    from scripts import audit_connector_candidates

    candidates = tmp_path / "candidates.geojson"
    output = tmp_path / "connector-audit.json"
    candidates.write_text('{"type":"FeatureCollection","features":[]}', encoding="utf-8")
    output.write_text("existing\n", encoding="utf-8")
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "audit_connector_candidates.py",
            str(candidates),
            "--output",
            str(output),
        ],
    )

    assert audit_connector_candidates.main() == 2

    report = json.loads(capsys.readouterr().out)
    assert report == {
        "errors": [f"refusing to overwrite existing analysis output: {output}"],
        "ok": False,
    }
    assert output.read_text(encoding="utf-8") == "existing\n"


def test_audit_route_feedback_refuses_existing_geojson_before_pipeline_import(
    monkeypatch, tmp_path, capsys
):
    from scripts import audit_route_feedback

    feedback = tmp_path / "feedback.geojson"
    geojson = tmp_path / "route-audit.geojson"
    feedback.write_text('{"type":"FeatureCollection","features":[]}', encoding="utf-8")
    geojson.write_text("existing\n", encoding="utf-8")
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "audit_route_feedback.py",
            str(feedback),
            "--geojson",
            str(geojson),
        ],
    )

    assert audit_route_feedback.main() == 2

    report = json.loads(capsys.readouterr().out)
    assert report == {
        "errors": [f"refusing to overwrite existing analysis output: {geojson}"],
        "ok": False,
    }
    assert geojson.read_text(encoding="utf-8") == "existing\n"
