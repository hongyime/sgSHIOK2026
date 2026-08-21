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
    assert "night lighting evidence as a map layer" in normalized
    assert "night-lighting evidence as a map layer" not in normalized
    assert "locked SHIOK score visible but secondary" in normalized
    assert "postal universe is frozen v1: 124,443 records" in normalized
    assert (
        "The 16 Aug 2026 P19 public-source sample found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) sampled 2021-2026"
        in normalized
    )
    assert "The 16 Aug 2026 P19 sampled check found" not in normalized
    assert "P19 found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows" not in normalized
    assert (
        "confirmed HDB gaps are SUN PLAZA SPRING and YISHUN BEACON, three postals each"
        in normalized
    )
    assert "CANAAN and MYRA remain unvalidated MCST proxy warnings" in normalized
    assert "P19 found 8 missing rows out of 976 HDB completion and MCST proxy rows" not in normalized
    assert "P125's 20 Aug 2026 Overpass check found 25,879 valid distinct OSM `addr:postcode` values" in normalized
    assert "valid distinct live OSM `addr:postcode` values" not in normalized
    assert "25,873 overlap frozen v1 and 6 are valid OSM-only postcodes" in normalized
    assert "Treat OSM as geometry evidence, not the primary address registry" in normalized
    assert "candidate-source-first with bounded OneMap Search validation" in normalized
    assert "clicked-stop walk-preview evidence" in normalized
    assert "preview-route evidence" not in normalized
    assert "Clicked-stop OneMap walk previews are evidence only" in normalized
    assert "must not become live navigation or mutate locked scores" in normalized
    assert "no live routing UI" not in normalized
    assert "walk display is shelter-map evidence only" not in normalized
    assert "route display is score" not in normalized
    assert "preview route evidence" not in normalized
    assert "Night lighting is a map overlay only" in normalized
    assert "Night Safety is a map overlay only" not in normalized
    assert "task runner: safe reports" in normalized
    assert "check --freshness-only, check --geospatial-discovery-only" in normalized
    assert "p19-gap-status, p19-mcst-locations, p125-osm-status, readiness, readiness --gate-summary, batch-plan" in normalized
    assert "score-batch, export, export-transit" in normalized
    assert "and local test task" in normalized
    assert "uv run python run.py <task>" in normalized
    assert "uv run python run.py test" in normalized
    assert "uv run python run.py publish" in normalized
    assert "`python run.py <task>`" not in normalized
    assert "`python run.py test`" not in normalized
    assert "`python run.py publish`" not in normalized
    assert "check | ingest | network | score | export | validate | publish | test" not in normalized
