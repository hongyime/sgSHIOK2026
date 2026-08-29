# P864 Heat Estimate Copy

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

- Replace user-facing "Heat proxy" wording with "Heat estimate".
- Keep the limitation explicit: this uses shelter plus sparse nearby greenery, not measured temperature.
- No scoring, export, rescore, subset run, ingest, network build, deployment, protected payload write, or `pipeline/config/weights.yaml` edit.

## Evidence

### Startup Guard

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
7caf4e2ecb99b45abd164f81b7d21231da633340
7caf4e2ecb99b45abd164f81b7d21231da633340	refs/heads/main
```

### Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  12:27:09
   Duration  6.04s (transform 1.90s, setup 0ms, import 2.44s, tests 1.69s, environment 1ms)
```

### Copy Grep

```text
C:\sgSHIOK2026\web\app\page.tsx:96:  heat: { low: "Low heat-estimate evidence", high: "Stronger heat-estimate evidence" },
C:\sgSHIOK2026\web\app\page.tsx:118:  "NParks Leaf Area Index is a freshness-only reference table here; walk heat evidence uses shelter plus sparse walk-adjacent greenery geometry, not LAI or measured temperature.";
C:\sgSHIOK2026\web\app\page.tsx:1325:      ? `Heat estimate evidence: covered ${formatDistance(score.paths.covered_m)}; nearby greenery ${formatDistance(score.paths.shade_m)}.`
C:\sgSHIOK2026\web\app\page.tsx:1346:      "Nearby greenery uses sparse NParks walk-adjacent geometry for heat only; it is not measured temperature or Leaf Area Index."
C:\sgSHIOK2026\web\app\page.tsx:2493:          <p>Heat estimate: shelter plus sparse nearby greenery, not measured temperature</p>
C:\sgSHIOK2026\web\lib\subscore-ranking.ts:10:  { id: "heat", label: "Heat estimate score factor" },
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:639:    expect(breakdownHtml).not.toContain(">Heat proxy<");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:651:    expect(html).toContain("Heat estimate evidence: covered 149 m; nearby greenery 23 m.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:652:    expect(html).not.toContain("Heat proxy evidence: covered 149 m; nearby greenery 23 m.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:653:    expect(html).not.toContain("Better heat-proxy score");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:655:      "Nearby greenery uses sparse NParks walk-adjacent geometry for heat only; it is not measured temperature or Leaf Area Index."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:398:      "NParks Leaf Area Index is a freshness-only reference table here; walk heat evidence uses shelter plus sparse walk-adjacent greenery geometry, not LAI or measured temperature."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:448:    expect(source).toContain("Heat estimate: shelter plus sparse nearby greenery, not measured temperature");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:481:    expect(source).not.toContain("Heat proxy: shelter + sparse NParks greenery");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:482:    expect(source).not.toContain("Heat proxy: shelter plus sparse nearby greenery, not measured temperature");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:592:      "Nearby greenery uses sparse NParks walk-adjacent geometry for heat only; it is not measured temperature or Leaf Area Index."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:722:      '{ id: "heat", label: "Heat estimate score factor" }'
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:743:      '{ id: "heat", label: "Heat proxy evidence" }'
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:832:    expect(source).toContain("Heat estimate evidence: covered ${formatDistance(score.paths.covered_m)}");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:834:    expect(source).toContain('heat: { low: "Low heat-estimate evidence", high: "Stronger heat-estimate evidence" }');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:835:    expect(source).not.toContain('heat: { low: "Low heat-proxy evidence", high: "Stronger heat-proxy evidence" }');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:836:    expect(source).not.toContain("Better heat-proxy score");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:842:    expect(source).not.toContain('label: "Heat proxy"');
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

1. Browser-visible heat copy still used "proxy" in the footer, walk detail, ranking label, and reason phrases.
2. "Heat estimate" is clearer for users while preserving the caveat that the app is not measuring temperature.

## DISAGREEMENTS

1. None.
