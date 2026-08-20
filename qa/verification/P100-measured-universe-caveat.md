# P100 measured universe caveat

## Root guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

The browser title-card address universe caveat now says measured recent-source misses exist instead of leaving the frozen-universe limitation as a speculative `newer completions may be missing` caveat.

Files intended for this phase:

```text
C:\sgSHIOK2026\web\app\page.tsx
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts
C:\sgSHIOK2026\decisions.md
C:\sgSHIOK2026\qa\verification\P100-measured-universe-caveat.md
```

## Validation

Validation output captured before commit:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  20:01:35
   Duration  1.91s (transform 227ms, setup 0ms, import 277ms, tests 78ms, environment 1ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  20:02:00
   Duration  11.04s (transform 6.00s, setup 0ms, import 6.94s, tests 14.37s, environment 11ms)
```

```text
repo_integrity=ok
exit=0
```

```text
git diff --check: exit 0
pipeline/config/weights.yaml diff: empty
```

```text
web/lib/__tests__/score-card-copy.test.ts:37:    expect(source).not.toContain("newer completions may be missing.");
```

## FINDINGS

1. The title card already carried the P19 count on the following line, but the preceding address-universe sentence still framed recent completions as speculative. That weakened the disclosure despite the measured 8-of-976 public-source miss signal.
2. This is browser honesty copy only. It does not alter search behavior, scoring, inputs, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.

