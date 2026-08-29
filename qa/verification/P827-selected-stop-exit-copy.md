# P827 Selected Stop/Exit Copy

## Working Root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Command Output

```text
npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  08:36:47
   Duration  7.46s (transform 4.35s, setup 0ms, import 5.22s, tests 1.06s, environment 1ms)
```

```text
git diff --check
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

## FINDINGS

1. The selected custom transit badge and live-region status still said generic `selected stop or exit` after the picker had moved to concrete stop/exit vocabulary.
2. The clearer user-facing phrase is `MRT/LRT exit or bus stop`, because `selected transit stop` drops MRT/LRT exits and `transit target` exposes the internal model.

## DISAGREEMENTS

1. None.
