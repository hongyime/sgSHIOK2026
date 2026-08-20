# P176 selected-walk panel wording

## Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
objective_read=ok
git=ok
2783590652177095ff955dc0cd85aabb1d61b40d
2783590652177095ff955dc0cd85aabb1d61b40d	refs/heads/main
```

## Change

The selected shelter-map panel now uses selected-walk wording in the exposure hero, access-row note, no-gap fallback, and Best transit availability label.

## Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  28 passed (28)
   Start at  00:58:53
   Duration  4.13s (transform 2.16s, setup 0ms, import 2.74s, tests 716ms, environment 1ms)
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
git check-ignore -v qa/verification/P176-selected-walk-panel-wording.md; "exit=$LASTEXITCODE"
exit=1
```

## FINDINGS

1. The selected shelter-map panel still had several user-facing route-word fallbacks in contexts where the product object is the selected walk.
2. The P176 change is browser copy and accessibility test coverage only. It does not alter transit selection, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None for this slice.
