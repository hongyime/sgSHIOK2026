# P634 Transit Target Kind Label

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

### Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/transit-stop-picker.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  33 passed (33)
   Start at  10:17:12
   Duration  542ms (transform 152ms, setup 0ms, import 218ms, tests 36ms, environment 0ms)
```

### Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  162 passed (162)
   Start at  10:17:28
   Duration  15.55s (transform 1.14s, setup 0ms, import 2.28s, tests 4.70s, environment 6ms)
```

### Python Collection

```text
457 tests collected in 7.15s
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

`git check-ignore -v qa/verification/P634-transit-target-kind-label.md` produced no matching ignore rule and exited 1, so the evidence file is trackable.

### Protected Path Diff

```text
exit=0
```

No protected-path names were printed by `git diff --name-only -- pipeline/config/weights.yaml checksums.json web/public/data qa/releases 'qa/p6_*' 'qa/p7_*' 'qa/p8_*' 'qa/p9_*' 'qa/p10_*' 'qa/p11/d_*'`.

## FINDINGS

1. The transit target picker still rendered MRT/LRT exit candidates with the terse kind label `MRT`, even though the picker selects bus stops and MRT/LRT exits rather than stations.
2. The surrounding target-picker copy had already moved to `transit target`, so the remaining terse MRT label was a user-facing precision gap rather than a data-model issue.

## DISAGREEMENTS

1. None.
