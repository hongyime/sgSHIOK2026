# P272 P10 Provenance Coverage LAI Policy

## Root Guard

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

## Evidence Path

```text
EXIT_CODE=1
```

## Focused Test

```text
.                                                                        [100%]
1 passed in 0.57s
```

## Repository Integrity

```text
repo_integrity=ok
EXIT_CODE=0
```

## Locked Weights Diff

```text
EXIT_CODE=0
```

## Diff Reviewed

```text
diff --git a/decisions.md b/decisions.md
index 0fdf516..537f277 100644
--- a/decisions.md
+++ b/decisions.md
@@ -739,3 +739,6 @@ Dry-run batch planning and production readiness should expose the source-freshne
 
 2026-08-21 - P271 bus-connector diagnostic shelter-map wording:
 Bus-connector diagnostics should tell operators to refresh a targeted shelter-map bundle, not a targeted score bundle, before promoting recovered rows into active validation failures. The diagnostic still concerns score-bearing rows, but the current artifact is the shelter-map bundle with locked scores inside it; using score-bundle language weakens the settled shelter-first operator frame. This is diagnostic copy and test coverage only; it does not run diagnostics, score, export, deploy, mutate public data, mutate inputs, or touch locked weights.
+
+2026-08-21 - P272 P10 provenance coverage Leaf Area Index wording:
+The P10 provenance coverage helper should no longer describe shade/greenery source hashes as possibly `hash-shipped but unconsumed`, because Leaf Area Index now has an explicit settled policy: it is a freshness-only non-score reference, while scored shade/greenery inputs remain identified through source hashes when present. This is analysis-helper wording and static test coverage only; it does not run the helper, probe sources, mutate manifests or inputs, score, export, deploy, mutate public data, or touch locked weights.
diff --git a/scripts/analysis/p10_provenance_coverage.py b/scripts/analysis/p10_provenance_coverage.py
index b7d0383..b16c4ff 100644
--- a/scripts/analysis/p10_provenance_coverage.py
+++ b/scripts/analysis/p10_provenance_coverage.py
@@ -41,7 +41,7 @@ def main() -> None:
         (
             "shade and greenery proxy layers",
             "sources.yaml nparks and greenery/shade sources",
-            "identified through raw/manifest.json source hashes when present; some sources may be hash-shipped but unconsumed per P1/P5 findings",
+            "scored shade/greenery inputs are identified through raw/manifest.json source hashes when present; leaf_area_index is a freshness-only non-score reference",
         ),
         (
             "crossing data",
```

## Static Guard

```python
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def test_p10_provenance_coverage_names_leaf_area_index_policy() -> None:
    source = (PROJECT_ROOT / "scripts" / "analysis" / "p10_provenance_coverage.py").read_text(
        encoding="utf-8"
    )

    assert "leaf_area_index is a freshness-only non-score reference" in source
    assert "hash-shipped but unconsumed" not in source
```

## FINDINGS

1. The P10 provenance coverage helper still described shade/greenery source provenance with the old vague phrase `hash-shipped but unconsumed`. That no longer reflects the settled Leaf Area Index policy.
2. Leaf Area Index is now named in this helper as a freshness-only non-score reference, while scored shade/greenery inputs remain tied to source hashes when present.
3. No pipeline work was run. No export, rescore, subset run, ingest, network build, public-data mutation, input mutation, or locked-weight change was needed.

## DISAGREEMENTS

1. None.
