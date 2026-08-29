# P860 Locked Scoring Rule Copy

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

- Clarify user-facing partial-score caveat from "locked formula" to "locked scoring rule".
- Clarify locked-score row metadata from "Release sorting index" to "Sorting-only score".
- No scoring, export, rescore, subset run, ingest, network build, deployment, protected payload write, or `pipeline/config/weights.yaml` edit.

## Evidence

### Startup Guard

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
b3e92b6f25760b3f2a082f81ad12d20fbba8bf37
b3e92b6f25760b3f2a082f81ad12d20fbba8bf37	refs/heads/main
```

### Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  12:08:59
   Duration  3.64s (transform 1.18s, setup 0ms, import 1.53s, tests 935ms, environment 1ms)
```

### Copy Grep

```text
C:\sgSHIOK2026\web\app\page.tsx:599:    return "Partial locked score: shelter-map evidence may still be present, but missing score factors count as zero in the locked scoring rule.";
C:\sgSHIOK2026\web\app\page.tsx:1468:          meta: scoredMeta(displayScore, "Sorting-only score", "Locked score unavailable"),
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:316:    expect(html).toContain("<strong>72/100</strong><small>Sorting-only score</small>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:317:    expect(html).not.toContain("<strong>72/100</strong><small>Release sorting index</small>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1192:      "Partial locked score: shelter-map evidence may still be present, but missing score factors count as zero in the locked scoring rule."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1195:    expect(html).not.toContain("the locked formula counts unavailable terms as zero");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1196:    expect(html).not.toContain("missing score factors count as zero in the locked formula");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1214:    expect(html).not.toContain("<strong>No full locked score</strong><small>Release sorting index unavailable</small>");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:685:      "Partial locked score: shelter-map evidence may still be present, but missing score factors count as zero in the locked scoring rule."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:688:    expect(source).not.toContain("the locked formula counts unavailable terms as zero");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:689:    expect(source).not.toContain("missing score factors count as zero in the locked formula");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:745:    expect(source).toContain('"Sorting-only score"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:746:    expect(source).not.toContain('"Release sorting index"');
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

1. The partial-score caveat still exposed implementation-shaped "locked formula" language in the browser; "locked scoring rule" is clearer while preserving the missing-factor-zero behavior.
2. The locked score row used "Release sorting index" as visible metadata; "Sorting-only score" better matches the current product framing that shelter evidence leads and the locked score is secondary.

## DISAGREEMENTS

1. None.
