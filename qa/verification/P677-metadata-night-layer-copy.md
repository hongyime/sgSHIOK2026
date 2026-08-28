# P677 Metadata Night Layer Copy

Date: 2026-08-28
Machine: PRAWN-E14
Working root: C:\sgSHIOK2026

Scope:
- Align page metadata with the visible UI by naming the night-lighting map layer instead of generic night lighting evidence.
- Keep covered-walkway ratio and exposed gaps first, and the locked SHIOK score secondary.
- No scoring, export, rescore, subset run, ingest, network build, input rebuild, public-data write, deployment, or weights change.

Commands to run:
- npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
- npm --prefix web test
- uv run pytest -q --collect-only
- python scripts/check_repo_integrity.py
- git diff --check
- git diff --exit-code -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases
- git check-ignore -v qa/verification/P677-metadata-night-layer-copy.md

FINDINGS
1. The page metadata description still called night lighting generic evidence while the application copy now treats it as the separate night-lighting map layer.

DISAGREEMENTS
1. None.
