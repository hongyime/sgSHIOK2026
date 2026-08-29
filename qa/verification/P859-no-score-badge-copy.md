# P859 No-Score Badge Copy

## Scope

Free-tier browser copy cleanup. No scoring, export, rescore, subset run, ingest, network build, deployment, source fetch, or protected payload mutation.

## Root And Host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

The no-full-locked-score badge now displays Walk evidence instead of Published data.

## Command Output

### npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  11:59:42
   Duration  4.82s (transform 1.42s, setup 0ms, import 1.83s, tests 1.43s, environment 1ms)
```

### rg -n 'Published data|Walk evidence|value: "Published data"|value: "Walk evidence"|No full locked score' web\app web\lib\__tests__

```text
C:\sgSHIOK2026\web\app\page.tsx:437:function formatScoreWithMax(value: number | null | undefined, fallback = "No full locked score"): string {
C:\sgSHIOK2026\web\app\page.tsx:444:    : { label: "No full locked score", value: "Walk evidence" };
C:\sgSHIOK2026\web\app\page.tsx:457:  return typeof value === "number" ? `${Math.round(value)}/100` : "No full locked score";
C:\sgSHIOK2026\web\app\page.tsx:867:    return ["No full locked score in published shelter-map data", "Partial shelter-map evidence may be available"];
C:\sgSHIOK2026\web\app\page.tsx:1269:        ? "No full locked score in published shelter-map data"
C:\sgSHIOK2026\web\app\page.tsx:1506:            notes: ["No full locked score is published for this postal, but the shelter-map walk evidence remains inspectable."],
C:\sgSHIOK2026\web\app\page.tsx:2522:        <footer className={styles.pageFooter}>Walk evidence: covered-walkway ratio and exposed gaps, plus the night-lighting map layer.</footer>
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1074:    expect(html).toContain("No full locked score is published for this postal, but the shelter-map walk evidence remains inspectable.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1075:    expect(html).not.toContain("No full locked score is published for this postal, but the route evidence remains inspectable.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1076:    expect(html).toContain("<span>No full locked score</span><strong>Walk evidence</strong>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1077:    expect(html).not.toContain("<span>No full locked score</span><strong>Published data</strong>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1078:    expect(html).not.toContain("<span>No full score</span><strong>Published data</strong>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1109:    expect(html).toContain("<span>No full locked score</span><strong>Walk evidence</strong>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1139:    expect(html).toContain("<span>No full locked score</span><strong>Walk evidence</strong>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1207:    expect(html).toContain("<span>No full locked score</span><strong>Walk evidence</strong>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1210:    expect(html).toContain("<strong>No full locked score</strong><small>Locked score unavailable</small>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1211:    expect(html).not.toContain("<strong>No full locked score</strong><small>Release sorting index unavailable</small>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1215:    expect(html).not.toContain("Walk evidence unavailable");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1221:    expect(html).not.toContain("<strong>No full locked score</strong><small>No full locked score</small>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1222:    expect(html).not.toContain("<strong>No full locked score</strong><small>No locked score</small>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1248:    expect(html).toContain("No full locked score in published shelter-map data");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1250:    expect(html).toContain("<span>No full locked score</span><strong>Walk evidence</strong>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1254:    expect(html).not.toContain("No full locked score in this bundle");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:128:    expect(smokeSource).toContain('summary.cardText.includes("No full locked score in published shelter-map data")');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:130:    expect(smokeSource).not.toContain('summary.cardText.includes("No full locked score in this bundle")');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:138:    expect(source).toContain("No full locked score in published shelter-map data");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:142:    expect(source).not.toContain("No full locked score in this bundle");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:280:    expect(source).not.toContain('"Walk evidence unavailable"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:497:      "Walk evidence: covered-walkway ratio and exposed gaps, plus the night-lighting map layer.",
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:639:    expect(source).toContain('label: "No full locked score"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:641:    expect(source).toContain('value: "Walk evidence"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:642:    expect(source).not.toContain('value: "Published data"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:779:    expect(source).toContain('"No full locked score"');
exit_code=0
```

### python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"

```text
repo_integrity=ok
exit_code=0
```

### git diff --check; Write-Output "exit_code=$LASTEXITCODE"

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

### protected-path diff guard

```text
exit_code=1
```

### git check-ignore -v qa/verification/P859-no-score-badge-copy.md; Write-Output "exit_code=$LASTEXITCODE"

```text
exit_code=1
```

## FINDINGS

1. The no-score badge paired `No full locked score` with the value `Published data`, which did not tell the user what useful evidence remained available.

## DISAGREEMENTS

1. None.
