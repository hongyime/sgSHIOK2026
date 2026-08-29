# P866 Missing Score Factor Copy

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

- Align the partial-score reason chip with the explanatory note by using "Missing score factors".
- Keep the locked scoring rule caveat in the longer note.
- No scoring, export, rescore, subset run, ingest, network build, deployment, protected payload write, or `pipeline/config/weights.yaml` edit.

## Evidence

### Startup Guard

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
42a25e065e003bbc3de8e424f1e569b8e032395d
42a25e065e003bbc3de8e424f1e569b8e032395d	refs/heads/main
```

### Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  12:35:30
   Duration  6.14s (transform 2.02s, setup 0ms, import 2.55s, tests 1.66s, environment 1ms)
```

### Copy Grep

```text
C:\sgSHIOK2026\web\app\page.tsx:604:    return "Partial locked score: shelter-map evidence may still be present, but missing score factors count as zero in the locked scoring rule.";
C:\sgSHIOK2026\web\app\page.tsx:878:  if (!score.subscores) return ["Missing score factors", "Shelter-map evidence available"];
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1202:      "Partial locked score: shelter-map evidence may still be present, but missing score factors count as zero in the locked scoring rule."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:681:    expect(source).toContain("Missing score factors");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:682:    expect(source).not.toContain("Missing locked-score factors");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:687:      "Partial locked score: shelter-map evidence may still be present, but missing score factors count as zero in the locked scoring rule."
```

### Repo Integrity

```text
repo_integrity=ok
exit_code=0
```

### Diff Check

```text
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

### Protected Diff Guard

```text
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=1
```

### Evidence Ignore Check

```text
exit_code=1
```

## FINDINGS

1. The partial-score reason chip still said "Missing locked-score factors" while the explanatory note already used the cleaner "missing score factors" phrasing.
2. The shorter chip can be plain language because the adjacent note still explains that missing factors count as zero in the locked scoring rule.

## DISAGREEMENTS

1. None.
