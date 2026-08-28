import gzip
import json

from pipeline.scoring import NO_TRANSIT_IN_RANGE
from scripts.partial_resnap_rescore import main, read_json, select_no_transit_postals


def test_partial_resnap_rescore_reads_gzipped_bundle_artifact(tmp_path):
    path = tmp_path / "index.json"
    with gzip.open(path.with_name("index.json.gz"), "wt", encoding="utf-8") as f:
        json.dump({"ANG_MO_KIO": ["560234"]}, f)

    assert read_json(path) == {"ANG_MO_KIO": ["560234"]}


def test_select_no_transit_postals_can_filter_to_direct_bus_candidates():
    records = {
        "100001": {
            "postal": "100001",
            "state": NO_TRANSIT_IN_RANGE,
            "_area": "AREA_A",
            "provenance": {"transit_node_set": {"bus_stop_candidates_direct": 0}},
        },
        "100002": {
            "postal": "100002",
            "state": NO_TRANSIT_IN_RANGE,
            "_area": "AREA_A",
            "provenance": {"transit_node_set": {"bus_stop_candidates_direct": 2}},
        },
        "100003": {
            "postal": "100003",
            "state": "SCORED",
            "_area": "AREA_A",
            "provenance": {"transit_node_set": {"bus_stop_candidates_direct": 3}},
        },
    }

    assert select_no_transit_postals(
        records,
        areas=["AREA_A"],
        per_area=10,
        extra_postals=[],
        limit=10,
        only_with_direct_bus=True,
    ) == ["100002"]


def test_partial_resnap_cli_requires_confirmation_and_output_before_bundle_lookup(
    monkeypatch, capsys
):
    from scripts import partial_resnap_rescore

    def fail_active_bundle_dir():
        raise AssertionError("active bundle lookup should not run before CLI guard")

    monkeypatch.setattr(partial_resnap_rescore, "active_bundle_dir", fail_active_bundle_dir)

    assert main(["--postal", "560234"]) == 1

    out = capsys.readouterr().out
    report = json.loads(out)
    assert report == {
        "errors": [
            "partial resnap rescore requires --confirm-rescore",
            "partial resnap rescore requires explicit --output",
        ],
        "ok": False,
    }


def test_partial_resnap_cli_runs_confirmed_report_with_explicit_output(
    monkeypatch, tmp_path, capsys
):
    from scripts import partial_resnap_rescore

    output = tmp_path / "partial_resnap.json"
    calls = []

    def fake_build_report(**kwargs):
        calls.append(kwargs)
        return {
            "selected_count": 1,
            "converted_count": 0,
            "after_state_counts": {"SCORED": 1},
        }

    monkeypatch.setattr(partial_resnap_rescore, "build_report", fake_build_report)

    assert (
        main(
            [
                "--confirm-rescore",
                "--bundle-dir",
                str(tmp_path / "bundle"),
                "--postal",
                "560234",
                "--output",
                str(output),
            ]
        )
        == 0
    )

    assert calls
    assert calls[0]["extra_postals"] == ["560234"]
    report = json.loads(output.read_text(encoding="utf-8"))
    assert report["selected_count"] == 1
    out = capsys.readouterr().out
    summary = json.loads(out)
    assert summary["output"] == str(output)


def test_partial_resnap_cli_refuses_existing_output_before_rescore(
    monkeypatch, tmp_path, capsys
):
    from scripts import partial_resnap_rescore

    output = tmp_path / "partial_resnap.json"
    output.write_text("{}\n", encoding="utf-8")

    def fail_build_report(**_kwargs):
        raise AssertionError("partial resnap should not rescore before output validation")

    monkeypatch.setattr(partial_resnap_rescore, "build_report", fail_build_report)

    assert (
        main(
            [
                "--confirm-rescore",
                "--bundle-dir",
                str(tmp_path / "bundle"),
                "--postal",
                "560234",
                "--output",
                str(output),
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
