import json
from pathlib import Path

from scripts.audit_current_bundle import main, sample_postals, summarize_state_report


def _record(
    postal: str,
    area: str,
    *,
    state: str = "NO_TRANSIT_IN_RANGE",
    bus_candidates: int = 0,
) -> dict:
    return {
        "postal": postal,
        "_area": area,
        "state": state,
        "provenance": {
            "transit_node_set": {
                "bus_stop_candidates_direct": bus_candidates,
            }
        },
    }


def test_sample_postals_respects_replay_limit_during_top_area_selection():
    records = [
        _record("100001", "SERANGOON"),
        _record("100002", "BUKIT_TIMAH"),
        _record("100003", "ANG_MO_KIO"),
        _record("100004", "HOUGANG"),
        _record("100005", "CLEMENTI", bus_candidates=2),
        _record("100006", "BEDOK", bus_candidates=3),
    ]

    selected = sample_postals(records, replay_limit=4)

    assert selected == ["100001", "100002", "100003", "100004"]


def test_sample_postals_ignores_scored_records_and_zero_limit():
    records = [
        _record("100001", "SERANGOON", state="SCORED"),
        _record("100002", "BUKIT_TIMAH"),
    ]

    assert sample_postals(records, replay_limit=0) == []
    assert sample_postals(records, replay_limit=10) == ["100002"]


def test_sample_postals_tops_up_when_direct_bus_bucket_is_empty():
    records = [
        _record(f"{index:06d}", "SERANGOON" if index % 2 else "BUKIT_TIMAH")
        for index in range(100001, 100021)
    ]

    selected = sample_postals(records, replay_limit=12)

    assert len(selected) == 12
    assert len(set(selected)) == 12


def test_summarize_state_report_keeps_only_operator_counts():
    summary = summarize_state_report(
        {
            "bundle": "generated_example",
            "manifest_record_count": 124032,
            "state_counts": {"SCORED": 2, "NOT_YET_SCORED": 1},
            "not_yet_scored": {"count": 1, "samples": [{"postal": "999999"}]},
            "no_transit_in_range": {"count": 3, "samples": [{"postal": "888888"}]},
            "scored": {"count": 2},
        }
    )

    assert summary == {
        "bundle": "generated_example",
        "manifest_record_count": 124032,
        "state_counts": {"SCORED": 2, "NOT_YET_SCORED": 1},
        "no_transit_count": 3,
        "not_yet_count": 1,
    }


def test_audit_cli_description_names_deployed_shelter_map_bundle():
    source = Path("scripts/audit_current_bundle.py").read_text(encoding="utf-8")

    assert "Fast audit of the published shelter-map bundle." in source
    assert "Print published shelter-map bundle state counts without writing a QA report." in source
    assert "Fast audit of the current deployed shelter-map bundle." not in source
    assert "Print current bundle state counts without writing a QA report." not in source
    assert "Fast audit of the current deployed score bundle." not in source


def test_audit_cli_requires_confirmation_and_output_before_bundle_lookup(
    monkeypatch, capsys
):
    from scripts import audit_current_bundle

    def fail_active_bundle_dir():
        raise AssertionError("active bundle lookup should not run before CLI guard")

    monkeypatch.setattr(audit_current_bundle, "active_bundle_dir", fail_active_bundle_dir)

    assert main(["--replay-limit", "1"]) == 1

    out = capsys.readouterr().out
    report = json.loads(out)
    assert report == {
        "errors": [
            "published bundle audit requires explicit --output",
            "published bundle replay audit requires --confirm-replay-audit",
        ],
        "ok": False,
    }


def test_audit_cli_state_only_remains_read_only_without_output(monkeypatch, capsys, tmp_path):
    from scripts import audit_current_bundle

    calls = []

    def fake_active_bundle_dir():
        return tmp_path / "bundle"

    def fake_build_report(**kwargs):
        calls.append(kwargs)
        return {
            "bundle": "generated_example",
            "manifest_record_count": 2,
            "state_counts": {"SCORED": 2},
            "not_yet_scored": {"count": 0},
            "no_transit_in_range": {"count": 0},
        }

    monkeypatch.setattr(audit_current_bundle, "active_bundle_dir", fake_active_bundle_dir)
    monkeypatch.setattr(audit_current_bundle, "build_report", fake_build_report)

    assert main(["--state-only"]) == 0

    assert calls
    assert calls[0]["replay_limit"] == 0
    out = capsys.readouterr().out
    summary = json.loads(out)
    assert summary == {
        "bundle": "generated_example",
        "manifest_record_count": 2,
        "no_transit_count": 0,
        "not_yet_count": 0,
        "state_counts": {"SCORED": 2},
    }


def test_audit_cli_runs_confirmed_replay_audit_with_explicit_output(
    monkeypatch, capsys, tmp_path
):
    from scripts import audit_current_bundle

    output = tmp_path / "bundle_audit.json"
    calls = []

    def fake_build_report(**kwargs):
        calls.append(kwargs)
        return {
            "bundle": "generated_example",
            "manifest_record_count": 2,
            "state_counts": {"SCORED": 2},
            "not_yet_scored": {"count": 0},
            "no_transit_in_range": {"count": 0},
        }

    monkeypatch.setattr(audit_current_bundle, "build_report", fake_build_report)

    assert (
        main(
            [
                "--confirm-replay-audit",
                "--bundle-dir",
                str(tmp_path / "bundle"),
                "--output",
                str(output),
                "--replay-limit",
                "1",
            ]
        )
        == 0
    )

    assert calls
    assert calls[0]["replay_limit"] == 1
    assert json.loads(output.read_text(encoding="utf-8"))["bundle"] == "generated_example"
    out = capsys.readouterr().out
    summary = json.loads(out)
    assert summary == {
        "ok": True,
        "output": str(output),
        "bundle": "generated_example",
    }


def test_audit_cli_refuses_existing_explicit_output(monkeypatch, capsys, tmp_path):
    from scripts import audit_current_bundle

    output = tmp_path / "bundle_audit.json"
    output.write_text("{}\n", encoding="utf-8")

    def fake_build_report(**_kwargs):
        return {
            "bundle": "generated_example",
            "manifest_record_count": 2,
            "state_counts": {"SCORED": 2},
            "not_yet_scored": {"count": 0},
            "no_transit_in_range": {"count": 0},
        }

    monkeypatch.setattr(audit_current_bundle, "build_report", fake_build_report)

    assert (
        main(
            [
                "--confirm-replay-audit",
                "--bundle-dir",
                str(tmp_path / "bundle"),
                "--output",
                str(output),
                "--replay-limit",
                "0",
            ]
        )
        == 1
    )

    assert output.read_text(encoding="utf-8") == "{}\n"
    report = json.loads(capsys.readouterr().out)
    assert report == {
        "errors": [f"refusing to overwrite existing analysis output: {output}"],
        "ok": False,
    }
