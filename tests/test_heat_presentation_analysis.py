from __future__ import annotations

import json
from pathlib import Path

from scripts.analysis import analyze_heat_presentation


def test_heat_presentation_default_output_does_not_target_historical_evidence() -> None:
    historical = (
        analyze_heat_presentation.PROJECT_ROOT
        / "qa"
        / "verification"
        / "heat_presentation_investigation_20260812.json"
    )

    assert analyze_heat_presentation.DEFAULT_OUTPUT != historical
    assert "qa\\analysis" in str(analyze_heat_presentation.DEFAULT_OUTPUT)


def test_heat_presentation_report_refuses_existing_output(tmp_path: Path) -> None:
    output = tmp_path / "report.json"
    output.write_text("{}\n", encoding="utf-8")

    try:
        analyze_heat_presentation.write_report(output, {"ok": True})
    except FileExistsError as exc:
        assert "refusing to overwrite existing analysis output" in str(exc)
    else:
        raise AssertionError("existing heat-presentation report was overwritten")

    assert output.read_text(encoding="utf-8") == "{}\n"


def test_heat_presentation_report_can_overwrite_when_explicit(tmp_path: Path) -> None:
    output = tmp_path / "report.json"
    output.write_text("{}\n", encoding="utf-8")

    analyze_heat_presentation.write_report(output, {"ok": True}, overwrite=True)

    assert json.loads(output.read_text(encoding="utf-8")) == {"ok": True}


def test_heat_presentation_ui_audit_entries_still_resolve() -> None:
    entries = analyze_heat_presentation.validate_ui_entries(
        analyze_heat_presentation.PROJECT_ROOT
    )

    assert entries
    assert [entry for entry in entries if not entry["line_match"]] == []
    strings = {entry["string"] for entry in entries}
    assert (
        "Explore covered-walkway ratio, exposed gaps, night lighting evidence, and the secondary locked SHIOK score for Singapore walks to transit."
        in strings
    )
    assert all("night-lighting" not in string for string in strings)
    assert all("covered-walkway exposure gaps" not in string for string in strings)
    assert 'heat: { low: "Low heat-proxy evidence", high: "Stronger heat-proxy evidence" },' in strings
    assert "In this locked release, rain shelter and heat comfort share mostly the same covered-walkway evidence." in strings
    assert all("Better heat-proxy score" not in string for string in strings)
    assert all("currently share mostly" not in string for string in strings)
