# Current State

Date: 2026-08-29
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `0c8d62d` (`fix: gate p19 measurement writes`)

Mandatory startup guard:
- First assert the working directory is exactly `C:\sgSHIOK2026`; abort otherwise.
- Never use a relative path for a write.
- `X:\01 REPOSITORIES\sgSHIOK2026` is a synced cold mirror, not a working root.
- Keep this rule here because the sourcerepo sync bot has overwritten `AGENTS.md` repeatedly.

Protected invariants:
- Do not modify `pipeline/config/weights.yaml`.
- Do not overwrite, move, rename, or delete existing protected data/evidence payloads under `web/public/data/`, `qa/p6_*` through `qa/p11/*`, `qa/releases/`, or `checksums.json`.
- Do not run scoring, export, rescore, subset runs, ingest, network builds, input rebuilds, public-data writes, or deployments without explicit owner approval.
- Evidence under `qa/verification/` is append-only unless creating a new tracked phase file.

Status:
- P767 is complete and pushed: retired `pipeline.rescope`, which previously performed OSM/HDB raw-data reads at import time from a relative `raw/` path.
- P768 is complete and pushed: shortened the first-view data-freshness disclosure and moved full stale-source detail into an expandable block.
- P769 is complete and pushed: retired `pipeline.diag_c2`, `pipeline.diag_d1`, and `pipeline.diag_linkway_length`, which previously read raw geospatial inputs at import time.
- P770 is complete and pushed: retired `pipeline.diag_c`, `pipeline.diag_c_fast`, `pipeline.diag_c_fix`, `pipeline.diag_d3`, `pipeline.diag_d6`, `pipeline.diag_f3`, and `pipeline.diag_traffic_signals`, which still read raw geospatial or HDB inputs directly.
- P771 is complete and pushed: retired `scripts.classify_residuals`, `scripts.diagnostic_battery`, `scripts.diagnostic_coord`, `scripts.diagnostic_gap`, `scripts.diagnostic_snapping`, and `scripts.diagnostic_sportshub`, which were historical raw geospatial probes outside the guarded runner surface.
- P772 is complete and pushed: gated `scripts/analysis/p19_universe_gap_measurement.py --measure` behind `--confirm-p19-measure` and explicit non-historical output/cache paths before any input/API reads.
- Evidence: `qa/verification/P767-rescope-retired.md`, `qa/verification/P768-freshness-copy-density.md`, `qa/verification/P769-import-time-diag-retirement.md`, `qa/verification/P770-remaining-diag-retirement.md`, `qa/verification/P771-script-diagnostic-retirement.md`, and `qa/verification/P772-p19-measurement-gate.md`.
- P736-P765 also remain complete: bounded geocode caches must be versioned, batch-plan blocks unversioned completed fills, lamp-overlay/postal-universe/report-writer tasks require confirmation, high-risk writer/network/deploy tasks fail closed at the runner, full OneMap wrappers require explicit approval, validate is documented as read-only, publish/activation/deploy wrappers pass required confirmations, full-rescore deploy and activation require distinct approvals, agent publish instructions match, postal-universe prep passes required confirmations/cache paths, legacy direct geocode and network entry points are guarded/retired, geocode cache paths use `--db`, README DataMall discovery copy matches latest recorded evidence, direct fetch ingest requires module-owned approval, direct bus-arrivals collection requires module-owned approval, direct bus API ingest requires module-owned approval, direct postal-universe build requires module-owned approval, direct lamp-overlay build requires module-owned approval, direct export writer subcommands require module-owned approval, direct Overture probes require module-owned approval, direct network-debug rebuild requires module-owned approval, production preflight requires wrapper-owned approval, direct DataMall probes require module-owned approval, and direct data.gov.sg probes require module-owned approval.
- Checks: `uv run pytest tests/test_legacy_geocode.py -q` passed 2/2; `npm --prefix web test -- score-card-copy.test.ts` passed 16/16; `uv run pytest tests/test_legacy_diag_scripts.py -q` passed 1/1; `uv run pytest tests/test_legacy_script_diagnostics.py -q` passed 1/1; `uv run pytest tests/test_analysis_scripts.py -q` passed 22/22; `uv run pytest -q --collect-only` collected 617; repo integrity passed; protected-diff guard passed.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
