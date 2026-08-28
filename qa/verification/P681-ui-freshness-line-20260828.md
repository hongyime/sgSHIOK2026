# P681 UI Freshness Line 2026-08-28

Date: 2026-08-28
Machine: PRAWN-E14
Working root: C:\sgSHIOK2026

Scope:
- Update the visible data-freshness line to match the P680 manifest-only report from 28 Aug 2026.
- Keep the refresh action explicit: stale sources require a new numbered input version, not frozen-v1 mutation.
- No scoring, export, rescore, subset run, ingest, network build, input rebuild, upstream URL probe, public-data write, deployment, or weights change.

Measurement source:
- `qa/verification/P680-freshness-report-20260828.md`
- `uv run python run.py check --freshness-only` exited 0 and reported no upstream URL probes.

Commands to run:
- npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
- npm --prefix web test
- uv run pytest -q --collect-only
- python scripts/check_repo_integrity.py
- git diff --check
- git diff --exit-code -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases
- git check-ignore -v qa/verification/P681-ui-freshness-line-20260828.md

FINDINGS
1. The UI still displayed the 27 Aug 2026 manifest-only freshness check and `0.3 days` until NParks Leaf Area Index became stale. P680 measured the current 28 Aug 2026 state as `0.1 days` from the 120-day threshold.

DISAGREEMENTS
1. None.
