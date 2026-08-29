# P962 Sorting Score Copy

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Intent

Keep the locked composite visible but secondary by replacing the awkward `Sorting-only score` badge and announcement copy with `Locked score for sorting`.

## Commands

```text
PS C:\sgSHIOK2026> npm --prefix C:\sgSHIOK2026\web test -- score-card-copy accessibility-render
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy accessibility-render

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  20:22:31
   Duration  38.97s (transform 18.33s, setup 0ms, import 21.77s, tests 5.79s, environment 2ms)
```

```text
PS C:\sgSHIOK2026> python C:\sgSHIOK2026\scripts\check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

```text
PS C:\sgSHIOK2026> rg -n "Sorting-only score|Locked score for sorting" C:\sgSHIOK2026\web\app\page.tsx C:\sgSHIOK2026\web\lib\__tests__
C:\sgSHIOK2026\web\app\page.tsx:354:    : "Locked score for sorting";
C:\sgSHIOK2026\web\app\page.tsx:511:    ? { label: "Locked score for sorting", value: formatScoreWithMax(value) }
C:\sgSHIOK2026\web\app\page.tsx:1543:          meta: scoredMeta(displayScore, "Locked score for sorting", "Locked score unavailable"),
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:317:    expect(html).toContain("Locked score for sorting 72 out of 100.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:319:      html.indexOf("Locked score for sorting 72 out of 100.")
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:322:    expect(html).toContain("<span>Locked score for sorting</span><strong>72/100</strong>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:324:    expect(html).toContain("<strong>72/100</strong><small>Locked score for sorting</small>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:325:    expect(html).not.toContain("Sorting-only score");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:686:    expect(source).toContain('label: "Locked score for sorting"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:687:    expect(source).not.toContain('label: "Sorting-only score"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:810:    expect(source).toContain('"Locked score for sorting"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:811:    expect(source).not.toContain('"Sorting-only score"');
```

```text
PS C:\sgSHIOK2026> git -C C:\sgSHIOK2026 diff -- pipeline/config/weights.yaml
```

## FINDINGS

1. `Sorting-only score` was visible in the score badge and accessibility announcement, but it read like implementation jargon rather than user-facing product copy.
2. The copy now says `Locked score for sorting`, preserving the product rule that the composite is visible but secondary to shelter-map evidence.
3. The old phrase remains only in negative test assertions.

## DISAGREEMENTS

1. None.
