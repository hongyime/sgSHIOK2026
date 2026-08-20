# P106 live announcement no-full-score copy

## Root guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

The score-card live region now announces null locked scores as `no full score in this bundle` instead of `not scored`, matching the visible bundle-score state copy.

Files intended for this phase:

```text
C:\sgSHIOK2026\web\app\page.tsx
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx
C:\sgSHIOK2026\decisions.md
C:\sgSHIOK2026\qa\verification\P106-live-announcement-no-full-score.md
```

## Validation

Validation output captured before commit:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  20:33:10
   Duration  3.77s (transform 1.61s, setup 0ms, import 2.11s, tests 529ms, environment 1ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  20:34:06
   Duration  11.32s (transform 6.97s, setup 0ms, import 9.15s, tests 15.42s, environment 14ms)
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
web/lib/__tests__/accessibility-render.test.tsx:394:    expect(html).not.toContain("Locked score not scored.");
```

## FINDINGS

1. The non-visual score-card status still announced null locked scores as `not scored` after visible copy had moved to `No full score in this bundle`.
2. This change aligns screen-reader status text with the current published-bundle state language.
3. This is accessibility/browser copy only. It does not alter state classification, score values, ranking, scoring, inputs, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.

