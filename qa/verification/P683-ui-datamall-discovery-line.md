# P683 UI DataMall Discovery Line

Date: 2026-08-28
Machine: PRAWN-E14
Working root: C:\sgSHIOK2026

Scope:
- Update the visible Covered Linkway/DataMall freshness note to match the P682 discovery-only check.
- Preserve the rule that stale payload ages require a new numbered input version before refresh.
- No scoring, export, rescore, subset run, ingest, network build, input rebuild, upstream payload download, public-data write, deployment, or weights change.

Measurement source:
- `qa/verification/P682-datamall-geospatial-discovery.md`
- `uv run python run.py check --geospatial-discovery-only` exited 0 and reported matched 3, changed 0, errors 0.

Commands to run:
- npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
- npm --prefix web test
- uv run pytest -q --collect-only
- python scripts/check_repo_integrity.py
- git diff --check
- git diff --exit-code -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases raw processed
- git check-ignore -v qa/verification/P683-ui-datamall-discovery-line.md

FINDINGS
1. The UI still displayed the older 21 Aug 2026 DataMall discovery note saying Covered Linkway and bridge/underpass URLs differed from frozen v1. P682 superseded that with a 28 Aug 2026 discovery-only check showing Covered Linkway, bridge/underpass, and Traffic Signals URLs still match frozen v1.

DISAGREEMENTS
1. None.
