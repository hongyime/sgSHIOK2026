# P1014 published-walk transit copy

Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Date: 2026-08-30

## Scope

Web copy and tests only. No scoring, export, rescore, subset run, ingest, network build, public-data write, dependency install, deployment, or locked weight change was run.

## Command Output

```text
Prawn-E14
C:\sgSHIOK2026
f6367a74dc3e874ef550202ec2be8029d10ece0c
f6367a74dc3e874ef550202ec2be8029d10ece0c	refs/heads/main
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx transit-stop-picker.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  3 passed (3)
      Tests  96 passed (96)
   Start at  00:33:07
   Duration  29.06s (transform 9.84s, setup 0ms, import 14.20s, tests 5.63s, environment 4ms)
```

## FINDINGS

1. The exposure-gap UI already satisfies the standing product requirement for per-gap length, map coordinate, and focus action; no change was needed there.
2. The remaining user-facing `Auto-picked` transit copy described implementation rather than the artifact boundary. `Published walk` and `published stop or exit` better distinguish the frozen published shelter-map walk from a selected stop/exit preview.
3. This change is presentation-only and does not alter candidate derivation, selected transit IDs, route geometry, scoring, exports, public data, inputs, deployment, or locked weights.

## DISAGREEMENTS

1. None.
