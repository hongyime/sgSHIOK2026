# P678 Night Route Detail Layer Copy

Date: 2026-08-28
Machine: PRAWN-E14
Working root: C:\sgSHIOK2026

Scope:
- Change the selected-walk night-lighting route detail note from map evidence to map layer wording.
- Keep night lighting outside the locked score and separate from shelter-map score evidence.
- No scoring, export, rescore, subset run, ingest, network build, input rebuild, public-data write, deployment, or weights change.

Commands to run:
- npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts
- npm --prefix web test
- uv run pytest -q --collect-only
- python scripts/check_repo_integrity.py
- git diff --check
- git diff --exit-code -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases
- git check-ignore -v qa/verification/P678-night-route-detail-layer-copy.md

FINDINGS
1. The selected-walk night-lighting detail note still called lamp-post points "night-lighting map evidence"; it now says they are a night-lighting map layer outside the locked score.

DISAGREEMENTS
1. None.
