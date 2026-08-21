from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def test_p10_provenance_coverage_names_leaf_area_index_policy() -> None:
    source = (PROJECT_ROOT / "scripts" / "analysis" / "p10_provenance_coverage.py").read_text(
        encoding="utf-8"
    )

    assert "leaf_area_index is a freshness-only non-score reference" in source
    assert "hash-shipped but unconsumed" not in source
