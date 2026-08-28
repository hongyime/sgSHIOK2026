import json
import sys
from pathlib import Path

import pytest

from scripts.promote_audited_shelter_corrections import main, promote_corrections


def feature(
    audit_id: str,
    *,
    status: str = "needs_owner_review",
    promotion_status: str = "review_ready_not_scoring",
):
    return {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": [[103.837, 1.368], [103.838, 1.369]],
        },
        "properties": {
            "audit_id": audit_id,
            "status": status,
            "promotion_status": promotion_status,
            "covered": "yes",
            "is_covered": True,
        },
    }


def write_collection(path: Path, features: list[dict]):
    path.write_text(
        json.dumps({"type": "FeatureCollection", "features": features}),
        encoding="utf-8",
    )


def test_promote_corrections_requires_explicit_review_metadata(tmp_path: Path):
    draft = tmp_path / "draft.geojson"
    target = tmp_path / "target.geojson"
    write_collection(draft, [feature("candidate-1")])
    write_collection(target, [])

    with pytest.raises(ValueError, match="reviewer"):
        promote_corrections(
            draft_path=draft,
            target_path=target,
            audit_ids=["candidate-1"],
            reviewer="",
            evidence_note="checked in QGIS",
            dry_run=True,
        )


def test_promote_corrections_writes_approved_feature_without_manual_geojson_edit(
    tmp_path: Path,
):
    draft = tmp_path / "draft.geojson"
    target = tmp_path / "target.geojson"
    write_collection(draft, [feature("candidate-1"), feature("candidate-2")])
    write_collection(target, [])

    report = promote_corrections(
        draft_path=draft,
        target_path=target,
        audit_ids=["candidate-2"],
        reviewer="owner",
        evidence_note="source-backed line reviewed on map",
        dry_run=False,
    )

    payload = json.loads(target.read_text(encoding="utf-8"))
    props = payload["features"][0]["properties"]
    assert report["approved_count"] == 1
    assert props["audit_id"] == "candidate-2"
    assert props["status"] == "approved"
    assert props["original_status"] == "needs_owner_review"
    assert props["reviewer"] == "owner"
    assert props["approval_note"] == "source-backed line reviewed on map"


def test_promote_corrections_rejects_blocked_candidates(tmp_path: Path):
    draft = tmp_path / "draft.geojson"
    target = tmp_path / "target.geojson"
    write_collection(
        draft,
        [
            feature(
                "blocked",
                promotion_status="blocked_insufficient_source_overlap_not_scoring",
            )
        ],
    )
    write_collection(target, [])

    with pytest.raises(ValueError, match="review_ready_not_scoring"):
        promote_corrections(
            draft_path=draft,
            target_path=target,
            audit_ids=["blocked"],
            reviewer="owner",
            evidence_note="checked",
            dry_run=False,
        )


def test_promote_corrections_refuses_protected_target_before_input_reads():
    from scripts import promote_audited_shelter_corrections

    draft = promote_audited_shelter_corrections.PROJECT_ROOT / "missing-draft.geojson"
    target = (
        promote_audited_shelter_corrections.PROJECT_ROOT
        / "qa"
        / "p9_new_guard_probe"
        / "corrections.geojson"
    )

    with pytest.raises(ValueError, match="refusing protected shelter correction target path"):
        promote_corrections(
            draft_path=draft,
            target_path=target,
            audit_ids=["candidate-1"],
            reviewer="owner",
            evidence_note="checked",
            dry_run=False,
        )

    assert not target.exists()
    assert not target.parent.exists()


def test_promote_cli_requires_confirmation_before_non_dry_run(monkeypatch, tmp_path, capsys):
    from scripts import promote_audited_shelter_corrections

    draft = tmp_path / "draft.geojson"
    target = tmp_path / "target.geojson"
    write_collection(draft, [feature("candidate-1")])

    def fail_promote_corrections(**kwargs):
        raise AssertionError("promotion should not run before confirmation guard")

    monkeypatch.setattr(
        promote_audited_shelter_corrections,
        "promote_corrections",
        fail_promote_corrections,
    )
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "promote_audited_shelter_corrections.py",
            "--draft",
            str(draft),
            "--target",
            str(target),
            "--approve",
            "candidate-1",
            "--reviewer",
            "owner",
            "--evidence-note",
            "checked",
        ],
    )

    assert main() == 2

    report = json.loads(capsys.readouterr().out)
    assert report == {
        "errors": [
            "audited shelter correction promotion requires --confirm-promotion unless --dry-run is used"
        ],
        "ok": False,
    }
    assert not target.exists()


def test_promote_cli_allows_dry_run_without_confirmation(monkeypatch, tmp_path):
    from scripts import promote_audited_shelter_corrections

    draft = tmp_path / "draft.geojson"
    target = tmp_path / "target.geojson"
    write_collection(draft, [feature("candidate-1")])
    calls = []

    def fake_promote_corrections(**kwargs):
        calls.append(kwargs)
        return {
            "ok": True,
            "dry_run": kwargs["dry_run"],
            "approved_count": 1,
            "target_feature_count": 0,
        }

    monkeypatch.setattr(
        promote_audited_shelter_corrections,
        "promote_corrections",
        fake_promote_corrections,
    )
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "promote_audited_shelter_corrections.py",
            "--dry-run",
            "--draft",
            str(draft),
            "--target",
            str(target),
            "--approve",
            "candidate-1",
            "--reviewer",
            "owner",
            "--evidence-note",
            "checked",
        ],
    )

    assert main() == 0
    assert calls[0]["dry_run"] is True
