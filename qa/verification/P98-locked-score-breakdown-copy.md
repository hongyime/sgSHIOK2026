# P98 Locked Score Breakdown Copy

## Root Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Evidence Path Ignore Check

```text
exit=1
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  25 passed (25)
   Start at  19:51:30
   Duration  4.72s (transform 2.28s, setup 0ms, import 2.94s, tests 992ms, environment 1ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  19:52:52
   Duration  5.48s (transform 3.92s, setup 0ms, import 5.57s, tests 7.10s, environment 10ms)
```

## Retired Copy Search

```text
web/lib/__tests__/accessibility-render.test.tsx:262:    expect(html).not.toContain('aria-label="Score breakdown"');
web/lib/__tests__/accessibility-render.test.tsx:364:    expect(html).not.toContain("Partial score:");
web/lib/__tests__/accessibility-render.test.tsx:365:    expect(html).not.toContain("No composite score");
exit=0
```

## Diff Whitespace Check

```text
```

## Weights Diff Check

```text
```

## Repository Integrity

```text
repo_integrity=ok
exit=0
```

## FINDINGS

1. The score-card breakdown still had score/composite-first copy: `Score breakdown`, `Partial score`, `No composite score`, and `Composite caveat`.
2. The browser and proposal now use route-evidence plus locked-score wording for those states.
3. This is browser/proposal copy only. It does not alter score-state classification, displayed values, ranking, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
