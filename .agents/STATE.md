# Current State

Date: 2026-08-16

Task: P31 exposed-gap list can focus the map on a selected gap.

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Remote main: `8eadec4` at P31 task start.

Status:
- Mandatory startup guard for every future session: first assert the working directory is exactly `C:\sgSHIOK2026`; abort if it is not. Never use a relative path for a write. This belongs here, not only in `AGENTS.md`, because the sourcerepo sync bot has overwritten `AGENTS.md` seven times.
- P31 makes top exposed gaps with coordinates keyboard-accessible controls that center the route map on the selected gap. Evidence is tracked at `qa/verification/P31-exposed-gap-map-focus.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
- P30 adjusts score-card typography so the shelter-evidence headline is larger than the locked composite score badge, matching the shelter-first product rule that the 0-to-100 composite stays secondary. Evidence is tracked at `qa/verification/P30-score-secondary-typography.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
- P29 adds the night-lighting overlay state and loaded lamp-point count to the route map's screen-reader summary when the layer is enabled. Evidence is tracked at `qa/verification/P29-night-lighting-accessibility.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
- P28 changed the browser control for the lamp-post overlay from `Lamp posts` to `Night lighting`, keeping the underlying source/layer ids and `lamp_posts_v1` artifact contract unchanged. Evidence is tracked at `qa/verification/P28-night-lighting-label.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
- P27 adds a manifest-derived title-card disclosure: active bundle score coverage is 95,157 full scores out of 124,443, with 29,286 records (23.534%, roughly a quarter) not rendering a full score. Evidence is tracked at `qa/verification/P27-score-coverage-disclosure.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, or public data mutation was run.
- P26 prepared the credential-free input for the next OneMap bus/network-conflation measurement. Tracked sample: `qa/p26/onemap_targeted_bus_risk_sample_0050.json`, 50 rows, sha256 `5B8727E60728E3571DAC2D1028B24D864BB01750FF9AC4AE2A47C2CD916F374A`. It is all `SCORED_PARTIAL`/bus-stop/`partial_unrouted_bus_fallback` rows and projects to 50 OneMap requests / 100 seconds once credentials are present. Evidence is tracked at `qa/verification/P26-targeted-onemap-sample.md`. No API collection, scoring, export, rescore, subset run, ingest, network build, or input rebuild was run.
- P25 attempted to start the next empirical bus/network-conflation measurement, but stopped at the credential gate. `ONEMAP_EMAIL`, `ONEMAP_PASSWORD`, and `LTA_DATAMALL_ACCOUNT_KEY` are absent from the environment, contradicting the standing premise that API credentials are available. Evidence is tracked at `qa/verification/P25-onemap-credential-gate.md`. No API collection, scoring, export, rescore, subset run, ingest, network build, or input rebuild was run.
- P24 changes future scoring semantics only: `NO_TRANSIT_IN_RANGE` and `NOT_YET_SCORED` subscore terms contribute zero under locked weights instead of access short-circuiting the whole composite. Routed records with numeric route evidence and null access publish as `SCORED_PARTIAL`; no-candidate/disconnected/trust-rejected records remain `NO_TRANSIT_IN_RANGE`.
- P24 evidence is tracked at `qa/verification/P24-no-transit-partial-score.md`. No scoring, export, rescore, subset run, ingest, or network build was run.
- P22 added an optional browser map layer for lamp posts, backed by viewport-loaded H3-r8 JSON tiles.
- P22 local public artifact is under `web/public/data/lamp_posts_v1/`: 701 files, 3,146,697 bytes, 700 H3-r8 tiles, 126,144 lamp points, 0 skipped features, manifest sha256 `3e28d94c90cfdd03a72d26cc0cf9a3a4f37657e650b6ae94d8de2505124a9512`. The directory is gitignored public data and must be deployed from the local working copy if the owner chooses to publish it.
- P22 evidence is tracked at `qa/verification/P22-lamp-map-layer.md`.
- P22 web verification passed: 109 tests across 22 files, direct TypeScript check exit 0, and Next production build exit 0.
- P23 inspected the existing NParks Leaf Area Index XLSX and found it is a species/generic reference table with no route geometry. Future score provenance excludes `leaf_area_index` from per-record `source_hashes`; the file remains tracked in `raw/manifest.json`/freshness as a reference candidate. Evidence is tracked at `qa/verification/P23-lai-provenance.md`.
- P23 verification passed: 23 focused Python tests, `repo_integrity=ok`, diff check exit 0, and `weights.yaml` diff exit 0.
- P21 added a deterministic lamp overlay artifact builder at `pipeline/lamp_overlay.py`, exposed as `run.py lamp-overlay`.
- P21 local preview artifact is under `qa/p21/lamp_overlay_h3r8_preview/`: 701 files, 3,146,697 bytes, 700 H3-r8 tiles, 126,144 lamp points, 0 skipped features. This is measurement output only and is not a public bundle.
- Current browser bundle `web/public/data/generated_20260805_prefer_scored_routed/` still has no lamp layer; publishing the overlay needs an owner-approved new `web/public/data` artifact and web map toggle.
- P20 source freshness policy and frozen-universe UI caveat landed at `9de78ff`; evidence is tracked at `qa/verification/P20-source-freshness.md`.
- P19 measured the current-universe gap using public HDB Property Information, OneMap Search, BCA MCST, and Overpass; evidence is tracked at `qa/verification/P19-universe-gap-measurement.md`.
- P19 result: 8 missing recent-completion rows out of 976 rows with postals (0.8197%), plus 6 current Overpass `addr:postcode` values absent from v1; this does not support an emergency v2 universe rebuild.
- P19 measurement caches/details are local under `qa/p19/` and are not pipeline inputs.
- P18 implements the section 10 web presentation change: route exposure leads, exposed gaps show coordinates, the visible breakdown is four display rows, and the locked composite is secondary.
- P18 evidence is tracked at `qa/verification/P18-section10-presentation.md`.
- P18 web tests passed at 105 tests across 21 files; the count rose by two render tests.
- `X:\01 REPOSITORIES\sgSHIOK2026` was switched to a cold mirror of `origin/main` at `043dec0`; no future agent session should run from it.
- P17 evidence is tracked at `qa/verification/P17-legacy-provenance-policy.md`.
- P17 rescued the stray X: proposal to `qa/p17/section10-proposal-rescued-from-x.md`.
- P17 changes readiness provenance status to `passed`, `legacy`, or `failed`: live legacy provenance is release-acceptable, but P10 stale-resume provenance remains failed.
- P17 drafted the section 10 proposal at `web/section10-presentation-proposal.md`; it is a review document, not UI implementation.
- P16 evidence is tracked at `qa/verification/P16-bundle-shipping-gate.md`.
- P16 did not produce a corrected publishable bundle: the 200-record records-dir export pilot validated structurally and matched live score values, but readiness still failed because the preserved full-rescore chunks carry only legacy five-file scoring fingerprints and no scoring-input/network provenance.
- P16 full export gate stopped before the 124,443-record export: 96.081 s for 200 records projects to 59,783.039 s, or 16.606 h, above the 3 h gate.
- The complete score source on C: is `processed/score_batches/full_rescore_20260804_205430/combined/chunks` with 252 chunks and 124,443 inferred records; separate per-part directories are not complete (`part03_of04/chunks` is short and `part04_of04/chunks` is absent).
- P16 did not complete the section 10 proposal: a relative patch targeted the session root on `X:` and created `X:\01 REPOSITORIES\sgSHIOK2026\web\section10-presentation-proposal.md`. That X: file was left untouched after discovery.
- `git fetch --prune origin` and `git remote prune origin` removed stale remote-tracking refs; global fsck still fails on two missing blobs held by stale local Dependabot branch refs. Important refs remain clean.
- P15 evidence is tracked at `qa/verification/P15-provenance-readiness.md`.
- P15 blocks stale score-code provenance in readiness while treating complete partitioned scoring-input digests as warnings.
- P15 added explicit record/start/export scoring fingerprint digest fields for future manifests.
- P15 moved NParks shade proxy constants into `params.yaml` with unchanged defaults.
- P15 backfilled P5 through P10 decisions and corrected README universe count to 124,443.
- `git fetch --refetch origin --tags` repaired most local object-store damage; important refs are clean, but three stale Dependabot refs still make global fsck fail.
- P14 is complete and landed on `origin/main` at `1728ae7`.
- P14 evidence is tracked at `qa/verification/P14-mixed-provenance.md`.
- P10 exported records are uniform on digest `06a6d36c1c8cabf7a5f1052a`.
- P10 score-batch/export metadata is on digest `1e312a49f13cdc8a42902b1e`.
- P10 likely came from resumed/stale score chunks plus newer manifest/export metadata.
- The live public bundle has no per-record `scoring_fingerprint_digest`.
- C: git object store is locally damaged for historical blobs, but current HEAD tree is intact.
- P11 evidence is tracked at `qa/verification/P11-e14-relocation-and-determinism.md`.
- P13 evidence is tracked at `qa/verification/P13-fingerprint-provenance.md`.
- `X:\01 REPOSITORIES\sgSHIOK2026` is a synced cold mirror of `origin/main`, not a working root.
- Do not run commands with the working directory on `X:`.

Untracked local evidence/data directories currently present:
- `qa/p8_provenance_repair_20260813/`
- `qa/p10_network_provenance_20260813/`
- `qa/p11/d_calibration_w2_0050/`
- `qa/p11/d_full_w2_1200/`
- `qa/p11/d_pilot_w2_0200_final/`
- `qa/p11/d_pilot_w2_0200_retry3/`
- `qa/p11/d_pilot_w2_0200_retry4/`
- `qa/p11/diffs/`
- `qa/p13/`
- `qa/p21/`
