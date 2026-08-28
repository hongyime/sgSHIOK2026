# P633 Planning-Area Rank Status Copy

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
   Start at  10:13:44
   Duration  2.32s (transform 759ms, setup 0ms, import 1.02s, tests 485ms, environment 0ms)
```

### Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  162 passed (162)
   Start at  10:13:59
   Duration  15.43s (transform 1.12s, setup 0ms, import 2.17s, tests 4.94s, environment 5ms)
```

### Python Collection

```text
457 tests collected in 7.41s
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

`git check-ignore -v qa/verification/P633-planning-area-rank-status-copy.md` produced no matching ignore rule and exited 1, so the evidence file is trackable.

### Protected Path Diff

```text
exit=0
```

No protected-path names were printed by `git diff --name-only -- pipeline/config/weights.yaml checksums.json web/public/data qa/releases 'qa/p6_*' 'qa/p7_*' 'qa/p8_*' 'qa/p9_*' 'qa/p10_*' 'qa/p11/d_*'`.

## FINDINGS

1. Planning-area rank status sentences reused title-cased selector labels directly, producing copy such as `Loading planning-area Locked score sorting index ranks.` in assistive live-status text.
2. The selector labels themselves are still useful as option labels, so the fix derives sentence-case metric phrases only for status and empty-state sentences.

## DISAGREEMENTS

1. None.
