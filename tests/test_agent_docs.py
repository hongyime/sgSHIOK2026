from pathlib import Path


CLAUDE = Path(__file__).resolve().parents[1] / "CLAUDE.md"


def compact(text: str) -> str:
    return " ".join(text.split())


def test_claude_doc_uses_shelter_map_product_frame() -> None:
    text = CLAUDE.read_text(encoding="utf-8")
    normalized = compact(text)

    assert text.startswith("# CLAUDE.md — S.H.I.O.K. Shelter Map")
    assert "S.H.I.O.K. Index" not in text
    assert "comfort score" not in text
    assert "covered-walkway ratio and exposed gaps on real routed walks" in normalized
    assert "locked SHIOK score visible but secondary" in normalized
    assert "clicked-stop walk-preview evidence" in normalized
    assert "preview-route evidence" not in normalized
    assert "walk display is shelter-map evidence only" in normalized
    assert "route display is score" not in normalized
    assert "preview route evidence" not in normalized
    assert "Night lighting is a map overlay only" in normalized
    assert "Night Safety is a map overlay only" not in normalized
    assert "task runner: safe reports" in normalized
    assert "check --freshness-only, check --geospatial-discovery-only" in normalized
    assert "p19-gap-status, readiness, batch-plan" in normalized
    assert "uv run python run.py <task>" in normalized
    assert "uv run python run.py test" in normalized
    assert "uv run python run.py publish" in normalized
    assert "`python run.py <task>`" not in normalized
    assert "`python run.py test`" not in normalized
    assert "`python run.py publish`" not in normalized
    assert "check | ingest | network | score | export | validate | publish | test" not in normalized
