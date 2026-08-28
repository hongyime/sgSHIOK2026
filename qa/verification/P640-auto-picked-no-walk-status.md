# P640 Auto-Picked No-Walk Status

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
      Tests  52 passed (52)
   Start at  10:42:28
   Duration  7.35s (transform 2.53s, setup 0ms, import 3.10s, tests 1.45s, environment 1ms)
```

### Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  163 passed (163)
   Start at  10:43:06
   Duration  68.09s (transform 3.38s, setup 0ms, import 5.83s, tests 35.18s, environment 15ms)
```

### Python Collection

```text
457 tests collected in 20.79s
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

`git check-ignore -v qa/verification/P640-auto-picked-no-walk-status.md` produced no matching ignore rule and exited 1, so the evidence file is trackable.

### Protected Path Diff

```text
exit=0
```

No protected-path names were printed by `git diff --name-only -- pipeline/config/weights.yaml checksums.json web/public/data qa/releases 'qa/p6_*' 'qa/p7_*' 'qa/p8_*' 'qa/p9_*' 'qa/p10_*' 'qa/p11/d_*'`.

## FINDINGS

1. The auto-picked transit target type used `unavailable` when no path existed, while MRT/LRT and bus options used the clearer `no published walk`.
2. The auto-picked empty state now uses the same published-bundle wording as the mode-specific options.

## DISAGREEMENTS

1. None.
