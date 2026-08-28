# P675 Preview Live Route Provenance Copy

Date: 2026-08-28
Machine: PRAWN-E14
Working root: C:\sgSHIOK2026

Scope:
- Clarify clicked-transit live preview provenance copy so it says preview shelter-map evidence.
- No scoring, export, rescore, subset run, ingest, network build, input rebuild, public-data write, deployment, or weights change.

Commands to run:
- npm --prefix web test -- lib/__tests__/live-route-scoring.test.ts lib/__tests__/route-evidence-map-interaction.test.ts
- npm --prefix web test
- uv run pytest -q --collect-only
- python scripts/check_repo_integrity.py
- git diff --check
- git diff --exit-code -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases
- git check-ignore -v qa/verification/P675-preview-live-route-provenance-copy.md

FINDINGS
1. The clicked-transit live preview provenance reason still said "Clicked transit POI has shelter-map evidence only", which could read as published shelter-map evidence. It now says "preview shelter-map evidence only".

DISAGREEMENTS
1. None.
