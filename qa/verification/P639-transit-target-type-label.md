# P639 Transit Target Type Label

Working root: C:\sgSHIOK2026
Host: PRAWN-E14

## Scope

- Free-tier web accessibility copy change only.
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
   Start at  10:37:32
   Duration  5.37s (transform 1.69s, setup 0ms, import 2.09s, tests 1.19s, environment 1ms)
```

### Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  163 passed (163)
   Start at  10:38:01
   Duration  59.34s (transform 2.55s, setup 0ms, import 5.21s, tests 27.13s, environment 14ms)
```

### Python Collection

```text
457 tests collected in 15.84s
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

`git check-ignore -v qa/verification/P639-transit-target-type-label.md` produced no matching ignore rule and exited 1, so the evidence file is trackable.

### Protected Path Diff

```text
exit=0
```

No protected-path names were printed by `git diff --name-only -- pipeline/config/weights.yaml checksums.json web/public/data qa/releases 'qa/p6_*' 'qa/p7_*' 'qa/p8_*' 'qa/p9_*' 'qa/p10_*' 'qa/p11/d_*'`.

## FINDINGS

1. The segmented control for `Auto-picked`, `MRT/LRT exits`, and `Bus stops` still had the accessible group name `Transit target`, which sounds like a selected target rather than a target-type selector.
2. The group now announces as `Transit target type`, matching what the control changes.

## DISAGREEMENTS

1. None.
