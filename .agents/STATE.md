# Current State

Date: 2026-08-29
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `5a4f051` (`docs: name straight-line bus estimate in route details`)

Mandatory startup guard:
- First assert the working directory is exactly `C:\sgSHIOK2026`; abort otherwise.
- Never use a relative path for a write.
- `X:\01 REPOSITORIES\sgSHIOK2026` is a synced cold mirror, not a working root.
- Keep this rule here because the sourcerepo sync bot has overwritten `AGENTS.md` repeatedly.

Protected invariants:
- Do not modify `pipeline/config/weights.yaml`.
- Do not overwrite, move, rename, or delete existing protected data/evidence payloads under `web/public/data/`, `qa/p6_*` through `qa/p11/*`, `qa/releases/`, or `checksums.json`.
- Do not run scoring, export, rescore, subset runs, ingest, network builds, input rebuilds, public-data writes, dependency installs, or deployments without explicit owner approval.
- Evidence under `qa/verification/` is append-only unless creating a new tracked phase file.

Status:
- P940 is complete and pushed: route-detail ARIA labels and selection announcements now use straight-line bus estimate copy instead of exposing the direct-bus fallback implementation phrase; focused web tests passed 2 files / 63 tests.
- P939 is complete and pushed: `pipeline.fetch` freshness-only help and the report header now name both `raw/manifest.json` and `pipeline/config/sources.yaml`, matching the real read scope; focused `tests/test_fetch.py` passed 28 tests.
- P938 is complete and pushed: zero-mutation `run.py check --freshness-only` measured the 29 Aug 2026 09:38 UTC source-age snapshot; browser data-limit copy and tests now use that date with unchanged 11 current / 9 stale / 3 manual / 1 unknown-age counts.
- P937 is complete and pushed: `run.py` freshness-only help now names both `raw/manifest.json` and `pipeline/config/sources.yaml`, matching the implementation and `CLAUDE.md`; focused `tests/test_agent_docs.py` passed 3 tests.
- P936 is complete and pushed: route-detail night-lighting copy now uses `show the layer` consistently with the main map-layer control; an initial source assertion still expected the old `Switch on` sentence, then the corrected focused web run passed 2 files / 63 tests.
- P935 is complete and pushed: assistive nearby-address labels now use natural `Nearby address comparison` / `Choose nearby address comparison view` copy instead of hyphenated `Nearby-address` wording.
- P934 is complete and pushed: overall nearby-address comparison loading/status copy now says addresses are ordered by locked score instead of using the internal `locked score order` phrase.
- P933 is complete and pushed: nearby-address metric comparison announcements now use direct sentences such as `Loading nearby addresses for covered-walkway evidence` and `No comparable nearby addresses for bus service support`; an initial source-string assertion failed, then the corrected focused web run passed 2 files / 63 tests.
- P932 is complete and pushed: metric-specific nearby-address comparison helpers now use active `Compares nearby addresses...` sentences for evidence and locked-score rows.
- P931 is complete and pushed: closed nearby-address comparison helper now says `Nearby-address comparison loads only when opened` instead of leading with `Loads nearby-address comparison`.
- P930 is complete and pushed: nearby-address comparison helper now says `Nearby addresses are ordered by locked score` instead of the more internal `Nearby-address list orders by locked score`; the first Vitest filter used repo-root paths and failed before running tests, then the corrected focused web run passed 2 files / 63 tests.
- P929 is complete and pushed: comparison panel ARIA/select labels now use nearby-address naming to match the visible `Compare nearby addresses` title.
- P928 is complete and pushed: planning-area comparison status and empty states now use nearby-address framing while preserving the planning-area boundary where it explains no comparable full locked scores.
- P927 is complete and pushed: locked-row-unavailable reason chips now say `Shelter-map evidence inspectable` instead of `Shelter-map evidence available`; a stale P926 source assertion was also corrected.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, dependency install, or locked-weight change was performed.

Next useful free-tier work:
- Continue aligning visible comparison/status copy with the shelter-first and nearby-address framing.
- Prefer small browser copy/test/evidence commits, pushed to main immediately.
