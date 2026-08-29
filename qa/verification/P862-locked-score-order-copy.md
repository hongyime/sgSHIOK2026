# P862 Locked Score Order Copy

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

- Rename the planning-area overall rank option from "Locked score sorting index" to "Locked score order".
- Make overall-rank announcements read as records in locked-score order instead of "sorting index ranks".
- Keep evidence/factor rank copy unchanged for non-overall planning-area comparisons.
- No scoring, export, rescore, subset run, ingest, network build, deployment, protected payload write, or `pipeline/config/weights.yaml` edit.

## Evidence

### Startup Guard

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
6cd4a0092526e3dfe70e3c3e049480520649a7bd
6cd4a0092526e3dfe70e3c3e049480520649a7bd	refs/heads/main
```

### Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  12:19:28
   Duration  3.85s (transform 1.21s, setup 0ms, import 1.57s, tests 964ms, environment 1ms)
```

### Copy Grep

```text
C:\sgSHIOK2026\web\lib\subscore-ranking.ts:6:  { id: "overall", label: "Locked score order" },
C:\sgSHIOK2026\web\app\page.tsx:333:    return "Planning-area list orders by locked score; shelter-map walk evidence remains the primary view.";
C:\sgSHIOK2026\web\app\page.tsx:1291:    RANK_METRIC_OPTIONS.find((option) => option.id === rankMetric)?.label ?? "Locked score order";
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:439:      "full locked sorting index"
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:709:      '{ id: "overall", label: "Locked score order" }'
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:744:    expect(source).toContain('?? "Locked score order"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:746:    expect(source).not.toContain('"Release sorting index"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:764:      "Planning-area list orders by locked score; shelter-map walk evidence remains the primary view."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:767:      "Planning-area list uses locked score only as a sorting index; shelter-map walk evidence remains the primary view."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:783:    expect(source).not.toContain("locked score sorting index ranks");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:317:    expect(html).not.toContain("<strong>72/100</strong><small>Release sorting index</small>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:324:    expect(html).toContain("Loading planning-area locked score order.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:325:    expect(html).not.toContain("Loading planning-area locked score sorting index ranks.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:327:    expect(html).not.toContain("Loading planning-area Locked score sorting index ranks.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:623:      "Planning-area list orders by locked score; shelter-map walk evidence remains the primary view."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:626:      "Planning-area list uses locked score only as a sorting index; shelter-map walk evidence remains the primary view."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:686:    expect(rankEmptyMessage("overall", "Locked score order")).toBe(
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:722:        rankMetricLabel: "Locked score order",
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:724:    ).toBe("5 planning-area records in locked score order.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:730:      "Planning-area list orders by locked score; shelter-map walk evidence remains the primary view."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:733:      "Planning-area list uses locked score only as a sorting index; shelter-map walk evidence remains the primary view."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1222:    expect(html).not.toContain("<strong>No full locked score</strong><small>Release sorting index unavailable</small>");
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

1. Planning-area overall ranking still exposed "Locked score sorting index" in the browser and screen-reader announcements, which was accurate internally but poor product language.
2. The non-overall rank labels remain evidence/factor views; only the locked-score overall ordering needed special announcement copy.

## DISAGREEMENTS

1. None.
