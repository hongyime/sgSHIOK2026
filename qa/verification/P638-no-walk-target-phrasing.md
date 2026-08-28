# P638 No-Walk Target Phrasing

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
   Start at  10:33:16
   Duration  9.66s (transform 4.60s, setup 0ms, import 5.50s, tests 1.88s, environment 2ms)
```

### Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  163 passed (163)
   Start at  10:34:00
   Duration  46.18s (transform 3.68s, setup 0ms, import 5.74s, tests 22.78s, environment 11ms)
```

### Python Collection

```text
457 tests collected in 28.88s
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

`git check-ignore -v qa/verification/P638-no-walk-target-phrasing.md` produced no matching ignore rule and exited 1, so the evidence file is trackable.

### Protected Path Diff

```text
exit=0
```

No protected-path names were printed by `git diff --name-only -- pipeline/config/weights.yaml checksums.json web/public/data qa/releases 'qa/p6_*' 'qa/p7_*' 'qa/p8_*' 'qa/p9_*' 'qa/p10_*' 'qa/p11/d_*'`.

## FINDINGS

1. After transit-mode labels were made target-specific, no-walk copy could read as `No connected bus stop shelter-map walk within range` or `No bus stop walk was found...`.
2. The no-walk states now phrase the target as the destination: `No connected shelter-map walk to bus stop within range`.

## DISAGREEMENTS

1. None.
