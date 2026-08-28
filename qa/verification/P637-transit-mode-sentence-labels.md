# P637 Transit Mode Sentence Labels

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
   Start at  10:27:16
   Duration  4.28s (transform 1.38s, setup 0ms, import 1.79s, tests 1.02s, environment 1ms)
```

### Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  162 passed (162)
   Start at  10:27:41
   Duration  68.10s (transform 3.66s, setup 0ms, import 6.83s, tests 22.29s, environment 26ms)
```

### Python Collection

```text
457 tests collected in 18.20s
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

`git check-ignore -v qa/verification/P637-transit-mode-sentence-labels.md` produced no matching ignore rule and exited 1, so the evidence file is trackable.

### Protected Path Diff

```text
exit=0
```

No protected-path names were printed by `git diff --name-only -- pipeline/config/weights.yaml checksums.json web/public/data qa/releases 'qa/p6_*' 'qa/p7_*' 'qa/p8_*' 'qa/p9_*' 'qa/p10_*' 'qa/p11/d_*'`.

## FINDINGS

1. Transit-mode sentence copy still produced phrases such as `Sheltered walk distance to bus.` when the user selected bus mode.
2. The sentence helper now names target nouns for mode-specific text: `bus stop` and `MRT/LRT exit`.

## DISAGREEMENTS

1. None.
