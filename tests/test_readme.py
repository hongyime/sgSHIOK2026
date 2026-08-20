from pathlib import Path


README = Path(__file__).resolve().parents[1] / "README.md"


def compact(text: str) -> str:
    return " ".join(text.split())


def test_readme_documents_universe_source_policy() -> None:
    text = README.read_text(encoding="utf-8")
    normalized = compact(text)

    assert text.startswith("# S.H.I.O.K. Shelter Map")
    assert "# S.H.I.O.K. Index" not in text
    assert "live static shelter-map pilot over a 124,443-record source-derived universe" in normalized
    assert "live static-first pilot" not in normalized
    assert "## Universe status" in text
    assert "124,443-record source-derived set" in normalized
    assert "8 missing rows out of 976 HDB completion and MCST proxy rows" in normalized
    assert "OSM remains geometry evidence rather than an address registry" in normalized
    assert "OneMap Search validates and geocodes known candidates" in normalized
    assert "candidate-source-first" in normalized
    assert "72-hour token refresh" in normalized
    assert "token-authenticated call-limit cap" in normalized
    assert "higher limit case-by-case" in normalized


def test_readme_documents_local_lamp_overlay_artifact() -> None:
    text = README.read_text(encoding="utf-8")
    normalized = compact(text)

    assert "## Local data artifacts" in text
    assert "`web/public/data/generated_20260805_prefer_scored_routed/`" in normalized
    assert "`web/public/data/lamp_posts_v1/`" in normalized
    assert "700 H3-r8 tile files plus `manifest.json`" in normalized
    assert "126,144 LTA lamp-post points" in normalized
    assert "source last modified 7 Jul 2026" in normalized
    assert "Map evidence only" not in normalized
    assert "map evidence only and is not part of the locked score" in normalized
    assert "python scripts/production_readiness.py" in normalized
    assert "Do not rebuild, overwrite, or mutate existing public data directories" in normalized
    assert "uv run python run.py check --freshness-only" in normalized
    assert "zero-mutation source-age check" in normalized
    assert "does not probe upstream APIs" in normalized
    assert "reports current, stale, manual, and unknown-age sources" in normalized
    assert "`pipeline/config/weights.yaml` — locked score weights." in normalized
    assert "locked composite-score weights" not in normalized


def test_readme_documents_full_batch_approval_boundary() -> None:
    text = README.read_text(encoding="utf-8")
    normalized = compact(text)

    assert "python scripts/production_readiness.py" in normalized
    assert "python run.py batch-plan" in normalized
    assert "next full-batch release is approved in principle but is not approved to run" in normalized
    assert "one attempt only" in normalized
    assert "requires explicit owner approval before execution" in normalized
    assert "bus remodel" in normalized
    assert "`NO_TRANSIT_IN_RANGE` partial-score fix" in normalized
    assert "network conflation repair" in normalized
    assert "approved postal-universe v2 promotion" in normalized
    assert "passes on the 1,200-record subset" in normalized
    assert "Do not run piecemeal full-bundle reruns" in normalized
