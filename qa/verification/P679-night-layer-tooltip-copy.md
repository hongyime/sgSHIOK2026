# P679 Night Layer Tooltip Copy

Date: 2026-08-28
Machine: PRAWN-E14
Working root: C:\sgSHIOK2026

Scope:
- Rename the night-lighting toggle tooltip from "Night lighting" to "Night-lighting layer".
- Keep lamp-post locations outside the locked score and separate from shelter-map score evidence.
- No scoring, export, rescore, subset run, ingest, network build, input rebuild, public-data write, deployment, or weights change.

Commands to run:
- npm --prefix web test -- lib/__tests__/route-evidence-map-interaction.test.ts
- npm --prefix web test
- uv run pytest -q --collect-only
- python scripts/check_repo_integrity.py
- git diff --check
- git diff --exit-code -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases
- git check-ignore -v qa/verification/P679-night-layer-tooltip-copy.md

FINDINGS
1. The night-lighting toggle tooltip still began with generic "Night lighting" even though it controls a separate map layer. It now begins "Night-lighting layer".

DISAGREEMENTS
1. None.
