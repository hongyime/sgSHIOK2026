# P676 Preview Badge Copy

Date: 2026-08-28
Machine: PRAWN-E14
Working root: C:\sgSHIOK2026

Scope:
- Shorten the clicked-transit preview badge from "Preview shelter-map evidence only" to "Preview shelter-map evidence".
- Keep the not-published-yet caveat in the longer preview explanation.
- No scoring, export, rescore, subset run, ingest, network build, input rebuild, public-data write, deployment, or weights change.

Commands to run:
- npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts lib/__tests__/route-evidence-map-interaction.test.ts
- npm --prefix web test
- uv run pytest -q --collect-only
- python scripts/check_repo_integrity.py
- git diff --check
- git diff --exit-code -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases
- git check-ignore -v qa/verification/P676-preview-badge-copy.md

FINDINGS
1. The clicked-transit preview badge still carried "only" even though the detailed caveat already says the target is not part of the published shelter-map bundle. The badge now names the state without repeating the caveat.

DISAGREEMENTS
1. None.
