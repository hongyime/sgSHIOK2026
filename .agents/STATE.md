# Current State

Date: 2026-08-29
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `23526e0` (`fix: guard shared analysis report outputs`)

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
- P773 is complete and pushed: gated `scripts/analysis/p19_mcst_missing_locations.py --probe` behind `--confirm-p379-probe` before OneMap calls or cache/report writes.
- P774 is complete and pushed: moved first-card audit/provenance caveats into a `Data limits` disclosure below search/results and changed exposed-gap actions to `Focus on map`.
- P775 is complete and pushed: added a compact `Try S560234` sample postal action using the existing direct postal selection path.
- P776 is complete and pushed: relabelled planning-area rank options so rain/access remain evidence views while bus/heat/crossing are explicit locked-score factors.
- P777 is complete and pushed: the score card keeps the three longest exposed gaps visible and adds a disclosure for shorter recorded gaps so all gap evidence remains inspectable.
- P778 is complete and pushed: the walk-details strip now lists Night lighting before Greenery proxy so the second product layer precedes supporting heat-proxy caveat material.
- P779 is complete and pushed: the correction workflow now appears as `Report missing shelter`, with shelter-correction copy and a new `user_reported_shelter_correction` payload issue plus a legacy issue field.
- P780 is complete and pushed: `scripts/audit_560234_shelter.py` now requires `--confirm-560234-shelter-audit` before any protected raw/processed/public-data audit can run.
- P781 is complete and pushed: `web/lib/__tests__/data.test.ts` now gives the generated-bundle geometry postal-prefix consistency test a 60s timeout; full web tests passed 166/166 after the change.
- P782 is complete and pushed: `scripts/mayflower_qa_summary.py` refuses explicit report outputs under protected public-data, release, historical QA, `qa/p11/`, and `checksums.json` paths before input reads.
- P783 is complete and pushed: the inactive correction action now uses `Report missing shelter` consistently with the exposed-gap CTA, while the active state remains `Done tracing shelter`.
- P784 is complete and pushed: `scripts/analysis/analyze_heat_presentation.py` refuses protected report output paths even with overwrite enabled, and its UI audit line references are current again.
- P785 is complete and pushed: the shared `scripts.analysis.report_io.write_new_text_report()` path now refuses protected output roots before creating parent directories or writing files.
- Evidence: `qa/verification/P767-rescope-retired.md`, `qa/verification/P768-freshness-copy-density.md`, `qa/verification/P769-import-time-diag-retirement.md`, `qa/verification/P770-remaining-diag-retirement.md`, `qa/verification/P771-script-diagnostic-retirement.md`, `qa/verification/P772-p19-measurement-gate.md`, `qa/verification/P773-p379-probe-gate.md`, `qa/verification/P774-first-card-density.md`, `qa/verification/P775-sample-postal-entry.md`, `qa/verification/P776-rank-label-alignment.md`, `qa/verification/P777-exposed-gap-disclosure.md`, `qa/verification/P778-night-lighting-detail-priority.md`, `qa/verification/P779-shelter-correction-workflow.md`, `qa/verification/P780-560234-audit-confirmation.md`, `qa/verification/P781-generated-data-test-timeout.md`, `qa/verification/P782-mayflower-output-root-guard.md`, `qa/verification/P783-shelter-action-copy-alignment.md`, `qa/verification/P784-heat-analysis-output-guard.md`, and `qa/verification/P785-shared-report-output-guard.md`.
- P736-P765 also remain complete: bounded geocode caches must be versioned, batch-plan blocks unversioned completed fills, lamp-overlay/postal-universe/report-writer tasks require confirmation, high-risk writer/network/deploy tasks fail closed at the runner, full OneMap wrappers require explicit approval, validate is documented as read-only, publish/activation/deploy wrappers pass required confirmations, full-rescore deploy and activation require distinct approvals, agent publish instructions match, postal-universe prep passes required confirmations/cache paths, legacy direct geocode and network entry points are guarded/retired, geocode cache paths use `--db`, README DataMall discovery copy matches latest recorded evidence, direct fetch ingest requires module-owned approval, direct bus-arrivals collection requires module-owned approval, direct bus API ingest requires module-owned approval, direct postal-universe build requires module-owned approval, direct lamp-overlay build requires module-owned approval, direct export writer subcommands require module-owned approval, direct Overture probes require module-owned approval, direct network-debug rebuild requires module-owned approval, production preflight requires wrapper-owned approval, direct DataMall probes require module-owned approval, and direct data.gov.sg probes require module-owned approval.
- Checks: `uv run pytest tests/test_legacy_geocode.py -q` passed 2/2; `uv run pytest tests/test_legacy_diag_scripts.py -q` passed 1/1; `uv run pytest tests/test_legacy_script_diagnostics.py -q` passed 1/1; `uv run pytest tests/test_analysis_scripts.py -q` passed 25/25 after P785; `uv run pytest tests/test_audit_560234_shelter.py -q` passed 3/3; `uv run pytest tests/test_mayflower_qa_summary.py -q` passed 8/8 after P782; `uv run pytest tests/test_heat_presentation_analysis.py -q` passed 6/6 after P784; `uv run pytest tests/test_mayflower_qa_summary.py tests/test_heat_presentation_analysis.py -q` passed 14/14 after P785; `npm --prefix web test -- subscore-ranking.test.ts accessibility-render.test.tsx score-card-copy.test.ts` passed 59/59; `npm --prefix web test -- accessibility-render.test.tsx score-card-copy.test.ts` passed 55/55; `npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx` passed 55/55 for P778, P779, and P783; `npm --prefix web test -- data.test.ts` passed 5/5 after the P781 timeout fix; `npm --prefix web test` passed 166/166 after P783; `uv run pytest -q --collect-only` collected 624 after P785's added tests; repo integrity passed; protected-diff guard passed.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
