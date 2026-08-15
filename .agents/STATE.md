# Current State

Date: 2026-08-15

Task: P15 provenance readiness and free-tier cleanup.

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Remote main: `1728ae7` at task start.

Status:
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
