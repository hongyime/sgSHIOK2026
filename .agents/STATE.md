# Current State

Date: 2026-08-15

Task: P14 mixed provenance and local object-store assessment.

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Remote main: `8581919` at task start.

Status:
- P13 is complete and landed on `origin/main` at `8581919`.
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
