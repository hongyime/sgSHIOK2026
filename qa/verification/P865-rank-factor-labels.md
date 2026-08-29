# P865 Rank Factor Labels

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

- Simplify planning-area select labels for bus, heat, and crossing.
- Keep the helper copy identifying those views as locked-score factor views.
- No scoring, export, rescore, subset run, ingest, network build, deployment, protected payload write, or `pipeline/config/weights.yaml` edit.

## Evidence

### Startup Guard

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
bdeb41fe9a66941c72f6d97e680697b9d08efe2d
bdeb41fe9a66941c72f6d97e680697b9d08efe2d	refs/heads/main
```

### Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  12:31:07
   Duration  7.95s (transform 2.48s, setup 0ms, import 3.20s, tests 2.27s, environment 1ms)
```

### Copy Grep

```text
C:\sgSHIOK2026\web\lib\subscore-ranking.ts:9:  { id: "bus", label: "Bus service support" },
C:\sgSHIOK2026\web\lib\subscore-ranking.ts:10:  { id: "heat", label: "Heat estimate" },
C:\sgSHIOK2026\web\lib\subscore-ranking.ts:11:  { id: "crossing", label: "Crossing friction" },
C:\sgSHIOK2026\web\app\page.tsx:336:    return "Planning-area locked-score factor view; locked SHIOK score is unchanged.";
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:717:        rankMetricLabel: "Bus service support",
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:741:      "Planning-area locked-score factor view; locked SHIOK score is unchanged."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:744:      "Planning-area locked-score factor view; locked SHIOK score is unchanged."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:747:      "Planning-area locked-score factor view; locked SHIOK score is unchanged."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:719:      '{ id: "bus", label: "Bus service support" }'
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:722:      '{ id: "heat", label: "Heat estimate" }'
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:725:      '{ id: "crossing", label: "Crossing friction" }'
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:746:      "score factor"
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:775:    expect(source).toContain("Planning-area locked-score factor view; locked SHIOK score is unchanged.");
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

1. The planning-area select menu still exposed "score factor" in option labels where plain labels were enough.
2. The factor caveat remains in the helper text, so users still see that bus, heat, and crossing are secondary locked-score views rather than shelter evidence.

## DISAGREEMENTS

1. None.
