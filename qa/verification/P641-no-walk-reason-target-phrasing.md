# P641 No-Walk Reason Target Phrasing

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
host=PRAWN-E14
```

### Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  52 passed (52)
   Start at  10:48:47
   Duration  4.95s (transform 1.52s, setup 0ms, import 1.93s, tests 1.12s, environment 1ms)
```

### Full Web Tests

```text
 Test Files  24 passed (24)
      Tests  163 passed (163)
   Start at  10:49:18
   Duration  97.42s (transform 3.92s, setup 0ms, import 6.64s, tests 63.57s, environment 13ms)
```

### Python Collection

```text
457 tests collected in 15.07s
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

### Protected Files Check

```text
exit=0
```

## FINDINGS

1. No-walk reason chips still used target-as-adjective wording such as `No bus stop walk within locked transit range`.
2. Reason chips now use the same destination phrasing as the title and state note: `No shelter-map walk to bus stop within locked transit range`.

## DISAGREEMENTS

1. None.
