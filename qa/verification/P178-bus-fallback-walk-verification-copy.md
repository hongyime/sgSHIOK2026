# P178 bus fallback walk verification copy

## Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
objective_read=ok
git=ok
8900a1dcb91029b82f458a82c30dc8a7874f40c2
8900a1dcb91029b82f458a82c30dc8a7874f40c2	refs/heads/main
```

## Change

Direct-bus fallback and bus-caveat copy now describe the missing proof as shelter-map walk verification, not generic route verification.

## Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  28 passed (28)
   Start at  01:10:38
   Duration  3.83s (transform 1.83s, setup 0ms, import 2.36s, tests 701ms, environment 1ms)
```

## Diff check

```text
git diff --check
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
```

## Locked weights check

```text
git diff -- pipeline/config/weights.yaml
```

No output.

## Evidence path ignore check

```text
git check-ignore -v qa/verification/P178-bus-fallback-walk-verification-copy.md; "exit=$LASTEXITCODE"
exit=1
```

## FINDINGS

1. Direct-bus fallback copy still described the missing proof as generic route verification, even though the user-facing object is shelter-map walk access.
2. The P178 change is browser copy and test coverage only. It does not alter bus fallback detection, transit selection, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None for this slice.
