from pathlib import Path


README = Path(__file__).resolve().parents[1] / "README.md"


def compact(text: str) -> str:
    return " ".join(text.split())


def test_readme_documents_universe_source_policy() -> None:
    text = README.read_text(encoding="utf-8")
    normalized = compact(text)

    assert text.startswith("# S.H.I.O.K. Shelter Map")
    assert "# S.H.I.O.K. Index" not in text
    assert "covered-walkway ratio and exposed gaps on real routed walks" in normalized
    assert "adds night lighting evidence as a map layer" in normalized
    assert "adds night-lighting evidence as a map layer" not in normalized
    assert "covered-walkway ratio and exposed gaps on real routed paths" not in normalized
    assert "live static shelter-map pilot over a 124,443-record source-derived universe" in normalized
    assert "live static-first pilot" not in normalized
    assert "## Universe status" in text
    assert "124,443-record source-derived set" in normalized
    assert "The 16 Aug 2026 public-source check found a small current-source gap" in normalized
    assert (
        "6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%)"
        in normalized
    )
    assert "Recent public-source checks found a small current-source gap" not in normalized
    assert (
        "confirmed HDB gaps are SUN PLAZA SPRING and YISHUN BEACON, three postals each"
        in normalized
    )
    assert "CANAAN and MYRA remain unvalidated MCST proxy warnings" in normalized
    assert "8 missing rows out of 976 HDB completion and MCST proxy rows" not in normalized
    assert "P125 live Overpass measurement found OSM `addr:postcode` covers only 25,873" in normalized
    assert "OSM remains geometry evidence rather than an address registry" in normalized
    assert "OneMap Search validates and geocodes known candidates" in normalized
    assert "candidate-source-first" in normalized
    assert "72-hour token refresh" in normalized
    assert "token-authenticated call-limit cap" in normalized
    assert "higher limit case-by-case" in normalized
    assert "uv run python run.py p19-gap-status" in normalized
    assert (
        "cached P19 measurement, evidence split, missing rows, MCST proxy probe and cache ages"
        in normalized
    )
    assert "without calling data.gov.sg, OneMap, or Overpass" in normalized
    assert "uv run python run.py p125-osm-status" in normalized
    assert "cached P125 OSM coverage measurement and cache ages" in normalized
    assert "without calling Overpass or writing files" in normalized


def test_readme_documents_local_lamp_overlay_artifact() -> None:
    text = README.read_text(encoding="utf-8")
    normalized = compact(text)

    assert "## Local data artifacts" in text
    assert "live shelter-map bundle remains configured" in normalized
    assert "live score bundle remains configured" not in normalized
    assert "`web/public/data/generated_20260805_prefer_scored_routed/`" in normalized
    assert "95,157 full locked scores out of 124,443 records" in normalized
    assert "95,157 full scores out of 124,443 records" not in normalized
    assert "29,286 records, 23.5% or roughly a quarter, do not show a full locked score" in normalized
    assert "29,286 records, roughly a quarter, do not show a full locked score" not in normalized
    assert "partial shelter-map evidence" in normalized
    assert "beyond locked transit range" in normalized
    assert "beyond current transit range" not in normalized
    assert "awaiting scoring" in normalized
    assert "night lighting map layer is a separate local artifact" in normalized
    assert "night-lighting map layer is a separate local artifact" not in normalized
    assert "`web/public/data/lamp_posts_v1/`" in normalized
    assert "700 H3-r8 tile files plus `manifest.json`" in normalized
    assert "126,144 LTA lamp-post points" in normalized
    assert "source last modified 7 Jul 2026" in normalized
    assert "Map evidence only" not in normalized
    assert "map evidence only and is not part of the locked score" in normalized
    assert "uv run python run.py readiness" in normalized
    assert "uv run python scripts/production_readiness.py" not in normalized
    assert "`python scripts/production_readiness.py`" not in normalized
    assert "validates the shelter-map bundle" in normalized
    assert "validates the score bundle" not in normalized
    assert "Do not rebuild, overwrite, or mutate existing public data directories" in normalized
    assert "uv run python run.py lamp-overlay -- --output web/public/data/lamp_posts_v2" in normalized
    assert "replacement night lighting overlay" in normalized
    assert "replacement night-lighting overlay" not in normalized
    assert "another new numeric version path" in normalized
    assert "builder refuses non-empty output directories" in normalized
    assert "lamp_posts_v1/` remains the published artifact" in normalized
    assert "uv run python run.py check --freshness-only" in normalized
    assert "zero-mutation source-age check" in normalized
    assert "does not probe upstream APIs" in normalized
    assert "reports current, stale, manual, and unknown-age sources" in normalized
    assert "NParks Leaf Area Index can appear in freshness as a tracked reference table" in normalized
    assert "not route geometry, shade-proxy geometry, or score provenance" in normalized
    assert "LTA geospatial listings such as Covered Linkway use a quarterly cadence" in normalized
    assert "120-day stale threshold" in normalized
    assert "does not prove no newer upstream release exists" in normalized
    assert "uv run python run.py check --geospatial-discovery-only" in normalized
    assert "without downloading payloads or writing the manifest" in normalized
    assert "new numbered input version, not an in-place repair" in normalized
    assert "`pipeline/config/weights.yaml` — locked score weights." in normalized
    assert "`run.py` — cross-platform task runner for safe reports" in normalized
    assert "`p19-gap-status`, `p125-osm-status`, `readiness`, `batch-plan`" in normalized
    assert (
        "and gated pipeline tasks (`ingest`, `lamp-overlay`, `network`, `score`, `export`, `validate`, `publish`, `test`)"
        in normalized
    )
    assert "locked composite-score weights" not in normalized


def test_readme_documents_full_batch_approval_boundary() -> None:
    text = README.read_text(encoding="utf-8")
    normalized = compact(text)

    assert "uv run python run.py readiness" in normalized
    assert "uv run python run.py batch-plan" in normalized
    assert "`python run.py batch-plan`" not in normalized
    assert "next full-batch release is approved in principle but is not approved to run" in normalized
    assert "one attempt only" in normalized
    assert "requires explicit owner approval before execution" in normalized
    assert "bus remodel" in normalized
    assert "`NO_TRANSIT_IN_RANGE` partial-score fix" in normalized
    assert "network conflation repair" in normalized
    assert "approved postal-universe v2 promotion" in normalized
    assert "passes on the 1,200-record subset" in normalized
    assert "Do not run piecemeal full-bundle reruns" in normalized


def test_readme_does_not_overclaim_legacy_bundle_reproducibility() -> None:
    text = README.read_text(encoding="utf-8")
    normalized = compact(text)

    assert (
        "published score values, coordinates and route origins have been independently verified"
        in normalized
    )
    assert "active legacy bundle predates record-level scoring-input and network provenance" in normalized
    assert "every published score is reproducible from hashed inputs + tagged code" not in normalized
