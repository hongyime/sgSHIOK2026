# P863 Rank Loading Copy

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

- Align the visible planning-area loading row with the locked-score order announcement.
- Keep evidence and factor views using rank language.
- No scoring, export, rescore, subset run, ingest, network build, deployment, protected payload write, or `pipeline/config/weights.yaml` edit.

## Evidence

### Startup Guard

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
adc0bd3ef0701e20fe93f97a3db65239f2ef7563
adc0bd3ef0701e20fe93f97a3db65239f2ef7563	refs/heads/main
```

### Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  12:23:11
   Duration  9.19s (transform 2.56s, setup 0ms, import 3.27s, tests 3.01s, environment 1ms)
```

### Copy Grep

```text
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:774:    expect(source).toContain("const rankLoadingText = rankMetricLabel.endsWith(\"order\")");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:775:    expect(source).toContain("{rankLoadingText}");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:776:    expect(source).not.toContain("Loading planning-area {rankSentenceLabel} ranks.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:777:    expect(source).not.toContain("Loading planning-area locked score order ranks.");
C:\sgSHIOK2026\web\app\page.tsx:1293:  const rankLoadingText = rankMetricLabel.endsWith("order")
C:\sgSHIOK2026\web\app\page.tsx:1703:                <span className={styles.rankEmpty}>{rankLoadingText}</span>
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:324:    expect(html).toContain("Loading planning-area locked score order.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:325:    expect(html).not.toContain("Loading planning-area locked score order ranks.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:711:    ).toBe("Loading planning-area covered-walkway evidence ranks.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:725:    ).toBe("5 planning-area records in locked score order.");
```

### Repo Integrity

```text
repo_integrity=ok
exit_code=0
```

### Diff Check

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

### Protected Diff Guard

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=1
```

### Evidence Ignore Check

```text
exit_code=1
```

## FINDINGS

1. After the locked-score order rename, the visible loading row still had a generic template that could produce "Loading planning-area locked score order ranks."
2. The rendered and source-level tests now guard the order view separately from evidence/factor rank views.

## DISAGREEMENTS

1. None.
