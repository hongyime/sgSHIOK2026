# P99 Locked Score Sort Copy

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
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  19:55:56
   Duration  870ms (transform 95ms, setup 0ms, import 122ms, tests 38ms, environment 0ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  19:56:20
   Duration  14.90s (transform 6.59s, setup 0ms, import 11.16s, tests 19.31s, environment 22ms)
```

## Retired Copy Search

```text
web/lib/__tests__/accessibility-render.test.tsx:365:    expect(html).not.toContain("No composite score");
web/lib/__tests__/score-card-copy.test.ts:145:    expect(source).not.toContain("Use this locked composite");
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

1. The locked-score row still said `Use this locked composite`, and the section 10 proposal still said `locked composite score` / `Locked composite`.
2. The browser and proposal now use `locked score` for the release sorting value while preserving the locked score's visibility.
3. This is browser/proposal copy only. It does not alter displayed values, ranking behavior, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
