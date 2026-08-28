from pathlib import Path


CLAUDE = Path(__file__).resolve().parents[1] / "CLAUDE.md"
ROOT = Path(__file__).resolve().parents[1]


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
        "The P19 v2 28 Aug 2026 public-source sample found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) sampled 2021-2026"
        in normalized
    )
    assert "The 16 Aug 2026 P19 public-source sample found" not in normalized
    assert "The 16 Aug 2026 P19 sampled check found" not in normalized
    assert "P19 found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows" not in normalized
    assert (
        "confirmed HDB gaps are SUN PLAZA SPRING and YISHUN BEACON, three postals each"
        in normalized
    )
    assert "CANAAN and MYRA remain unvalidated MCST proxy warnings" in normalized
    assert "The same P19 v2 run's Overpass coverage cross-check found 25,919 valid distinct OSM `addr:postcode` values" in normalized
    assert "P125's 20 Aug 2026 Overpass coverage cross-check found" not in normalized
    assert "P125's 20 Aug 2026 Overpass check found" not in normalized
    assert "valid distinct live OSM `addr:postcode` values" not in normalized
    assert "25,899 overlap frozen v1 and 20 are valid OSM-only postcodes" in normalized
    assert "Treat OSM as geometry evidence, not the primary address registry" in normalized
    assert "candidate-source-first with bounded OneMap Search validation" in normalized
    assert "bounded OneMap Search validation under explicit token controls" in normalized
    assert "72-hour token refresh" in normalized
    assert "token-authenticated call-limit cap unless SLA approves a higher limit case-by-case" in normalized
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
    assert "p19-gap-status, p19-mcst-locations, p125-osm-status, network-qa, network-preflight, readiness, readiness --gate-summary, batch-plan, validate" in normalized
    assert "score-batch, export, export-transit" in normalized
    assert "export-transit, publish), and local test task" in normalized
    assert "export-transit, validate, publish), and local test task" not in normalized
    assert "and local test task" in normalized
    assert "check --freshness-only` is a zero-mutation source-age report" in normalized
    assert "reads `raw/manifest.json` and `pipeline/config/sources.yaml`, probes no upstream APIs" in normalized
    assert "grouped action summaries include source names" in normalized
    assert "traffic_signals (Traffic Signals)" in normalized
    assert "so operators do not need to cross-reference `sources.yaml`" in normalized
    assert "If stale sources appear, report them" in normalized
    assert "plan a versioned refresh; do not mutate frozen v1 in place" in normalized
    assert "check --geospatial-discovery-only` probes DataMall discovery metadata only" in normalized
    assert "changed discovery URLs require a new numbered input version, not an in-place repair" in normalized
    assert "network-qa --area island` validates existing conflation QA/debug artifacts" in normalized
    assert "network-preflight --area island --skip-geometry-inspection` reads and hashes existing manifest, raw, processed, and QA artifacts" in normalized
    assert "writes no repo files or network artifacts" in normalized
    assert "uv run python run.py <task>" in normalized
    assert "uv run python run.py test" in normalized
    assert "uv run python run.py publish --confirm-publish --deploy --confirm-production" in normalized
    assert "`python run.py <task>`" not in normalized
    assert "`python run.py test`" not in normalized
    assert "`python run.py publish`" not in normalized
    assert "check | ingest | network | score | export | validate | publish | test" not in normalized


def test_scoring_comments_point_to_root_decisions_file() -> None:
    for relative in [
        "pipeline/export.py",
        "pipeline/scoring_integration.py",
        "tests/test_scoring_integration.py",
    ]:
        text = (ROOT / relative).read_text(encoding="utf-8")
        assert "docs/decisions.md" not in text
        assert "decisions.md 2026-08-05" in text
