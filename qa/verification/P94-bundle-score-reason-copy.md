# P94 Bundle Score Reason Copy

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
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  19:37:00
   Duration  5.97s (transform 2.43s, setup 0ms, import 3.11s, tests 1.03s, environment 1ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  19:37:33
   Duration  11.00s (transform 8.14s, setup 0ms, import 11.02s, tests 15.12s, environment 19ms)
```

## Retired Jargon Search

```text
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:358:    expect(html).not.toContain("Score not available");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:381:    expect(html).not.toContain("Needs pipeline scoring evidence");
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

1. The route-evidence reason chips still exposed implementation wording: `Needs pipeline scoring evidence`, `Score not available`, and `Score breakdown pending`.
2. The browser now explains these states as bundle availability: awaiting offline bundle scoring, bundle score unavailable, and bundle score incomplete.
3. This is browser copy only. It does not alter score-state classification, scores, route evidence, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
