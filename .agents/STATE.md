# Current State

Date: 2026-08-16

Task: P20 source freshness policy and lamp overlay gate.

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Remote main: `46a1f61` at task start.

Status:
- Mandatory startup guard for every future session: first assert the working directory is exactly `C:\sgSHIOK2026`; abort if it is not. Never use a relative path for a write. This belongs here, not only in `AGENTS.md`, because the sourcerepo sync bot has overwritten `AGENTS.md` seven times.
- P20 is evaluating the lamp-post orphan and source freshness policy. The raw lamp source exists as `raw/2b552c1429aaf93c544209df3da68838d708a78ec5ae86dcd2852c10b0589f29/lamp_posts.geojson`: 41,907,845 bytes, 126,144 point features.
- Current browser bundle `web/public/data/generated_20260805_prefer_scored_routed/` has no lamp layer; creating one requires a new derived public data artifact, not a React-only change.
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
- `X:\01 REPOSITORIES\sgSHIOK2026` is a read-only second physical copy, not a working root.
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
