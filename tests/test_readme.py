from pathlib import Path


README = Path(__file__).resolve().parents[1] / "README.md"


def compact(text: str) -> str:
    return " ".join(text.split())


def test_readme_documents_universe_source_policy() -> None:
    text = README.read_text(encoding="utf-8")
    normalized = compact(text)

    assert "## Universe status" in text
    assert "124,443-record source-derived set" in normalized
    assert "8 missing rows out of 976 HDB completion and MCST proxy rows" in normalized
    assert "OSM remains geometry evidence rather than an address registry" in normalized
    assert "OneMap Search validates and geocodes known candidates" in normalized
    assert "candidate-source-first" in normalized


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
