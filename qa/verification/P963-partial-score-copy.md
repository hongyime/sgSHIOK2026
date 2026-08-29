# P963 Partial Score Copy

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Intent

Make partial locked-score copy clearer by replacing `unavailable locked-score rows` with input-focused wording that does not conflict with the four display rows.

## Commands

```text
PS C:\sgSHIOK2026> npm --prefix C:\sgSHIOK2026\web test -- score-card-copy accessibility-render
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy accessibility-render

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  20:26:55
   Duration  4.00s (transform 1.27s, setup 0ms, import 1.64s, tests 1.01s, environment 1ms)
```

```text
PS C:\sgSHIOK2026> python C:\sgSHIOK2026\scripts\check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

```text
PS C:\sgSHIOK2026> rg -n "Unavailable locked-score rows|incomplete locked-score inputs|Partial locked score" C:\sgSHIOK2026\web\app\page.tsx C:\sgSHIOK2026\web\lib\__tests__
C:\sgSHIOK2026\web\app\page.tsx:667:    return "Partial locked score: some shelter-map evidence may still be inspectable, but incomplete locked-score inputs are treated as zero in this release.";
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1247:      "Partial locked score: some shelter-map evidence may still be inspectable, but incomplete locked-score inputs are treated as zero in this release."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1250:      "Partial locked score: shelter-map evidence may still be present, but unavailable locked-score rows count as zero in the locked scoring rule."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1253:      "Partial locked score: some shelter-map evidence may still be inspectable, but unavailable locked-score rows count as zero in the locked scoring rule."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1260:      "Partial locked score: shelter-map evidence may still be present, but one or more locked terms are unavailable; locked weights count missing terms as zero."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1263:      "Partial locked score: shelter-map evidence may still be present, but one or more component scores are unavailable; locked weights count missing terms as zero."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1266:      "Partial locked score: one or more component scores are unavailable; locked weights count missing terms as zero."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:734:    expect(source).not.toContain("Unavailable locked-score rows");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:741:      "Partial locked score: some shelter-map evidence may still be inspectable, but incomplete locked-score inputs are treated as zero in this release."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:744:      "Partial locked score: shelter-map evidence may still be present, but unavailable locked-score rows count as zero in the locked scoring rule."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:747:      "Partial locked score: some shelter-map evidence may still be inspectable, but unavailable locked-score rows count as zero in the locked scoring rule."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:754:      "Partial locked score: shelter-map evidence may still be present, but one or more locked terms are unavailable; locked weights count missing terms as zero."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:757:      "Partial locked score: shelter-map evidence may still be present, but one or more component scores are unavailable; locked weights count missing terms as zero."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:760:      "Partial locked score: one or more component scores are unavailable; locked weights count missing terms as zero."
```

```text
PS C:\sgSHIOK2026> git -C C:\sgSHIOK2026 diff -- pipeline/config/weights.yaml
```

## FINDINGS

1. The previous partial-score copy used `unavailable locked-score rows`, which could be confused with the four display rows now shown in the browser.
2. The browser now says `incomplete locked-score inputs are treated as zero in this release`, keeping the warning explicit while naming inputs instead of rows.
3. The old visible phrase is now guarded only as negative test coverage.

## DISAGREEMENTS

1. None.
