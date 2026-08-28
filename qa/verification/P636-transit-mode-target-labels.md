# P636 Transit Mode Target Labels

Working root: C:\sgSHIOK2026
Host: PRAWN-E14

## Scope

- Free-tier web copy change only.
- No scoring, export, rescore, subset run, ingest, or network build.
- No writes to protected data, QA evidence payloads, release bundles, `web/public/data/`, `checksums.json`, or `pipeline/config/weights.yaml`.

## Evidence

Commands and results are recorded after implementation.

### Root Guard

```text
root=C:\sgSHIOK2026
hostname=PRAWN-E14
```

### Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  51 passed (51)
   Start at  10:22:45
   Duration  5.08s (transform 1.62s, setup 0ms, import 2.11s, tests 1.33s, environment 2ms)
```

### Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  162 passed (162)
   Start at  10:23:14
   Duration  39.82s (transform 2.74s, setup 0ms, import 5.00s, tests 12.26s, environment 12ms)
```

### Python Collection

```text
457 tests collected in 18.91s
```

### Repository Integrity

```text
repo_integrity=ok
exit=0
```

### Evidence Tracking Check

```text
exit=1
```

`git check-ignore -v qa/verification/P636-transit-mode-target-labels.md` produced no matching ignore rule and exited 1, so the evidence file is trackable.

### Protected Path Diff

```text
exit=0
```

No protected-path names were printed by `git diff --name-only -- pipeline/config/weights.yaml checksums.json web/public/data qa/releases 'qa/p6_*' 'qa/p7_*' 'qa/p8_*' 'qa/p9_*' 'qa/p10_*' 'qa/p11/d_*'`.

## FINDINGS

1. The `Transit target` segmented control still used broad mode labels `Best transit`, `MRT/LRT`, and `Bus`, which were less precise than the settled target model.
2. The control now uses compact target labels: `Auto-picked`, `MRT/LRT exits`, and `Bus stops`.

## DISAGREEMENTS

1. None.
