# P95 Offline Bundle State Notes

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
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  25 passed (25)
   Start at  19:40:13
   Duration  1.63s (transform 1.07s, setup 0ms, import 1.06s, tests 732ms, environment 1ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  19:40:34
   Duration  6.62s (transform 6.17s, setup 0ms, import 9.35s, tests 8.26s, environment 9ms)
```

## Retired Pipeline Phrase Search

```text
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:217:    expect(html).not.toContain("offline scoring pipeline includes it");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:387:    expect(html).not.toContain("Needs pipeline scoring evidence");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:388:    expect(html).not.toContain("pipeline scoring evidence");
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

1. Score-state notes still used pipeline wording after P94 fixed the reason chips: clicked-stop previews referred to an `offline scoring pipeline`, and `NOT_YET_SCORED` records said they needed `pipeline scoring evidence`.
2. The browser now consistently frames those states as offline bundle inclusion/scoring.
3. This is browser copy only. It does not alter score-state classification, preview routing, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
