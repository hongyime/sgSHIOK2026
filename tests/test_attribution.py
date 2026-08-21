from pathlib import Path


ATTRIBUTION = Path(__file__).resolve().parents[1] / "ATTRIBUTION.md"


def test_attribution_lists_lamp_posts_as_shipped_night_lighting_source() -> None:
    text = ATTRIBUTION.read_text(encoding="utf-8")
    normalized = " ".join(text.split())

    assert "S.H.I.O.K. Shelter Map is a civic shelter-map pilot" in text
    assert "| lamp_posts | Land Transport Authority | https://data.gov.sg/open-data-licence | Lamp-post locations used as the separate night lighting map layer. |" in text
    assert "Lamp posts were also not identified as reaching shipped artifacts" not in text
    assert "## Candidate And Non-Score Reference Sources" in text
    assert "## Candidate Or Unshipped Sources" not in text
    assert "Leaf area index hashes ship in legacy provenance as a non-score reference source" in normalized
