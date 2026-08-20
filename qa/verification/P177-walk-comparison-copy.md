# P177 walk comparison copy

## Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
objective_read=ok
git=ok
766add3f834bbd92929a5979acb05d121e9544e2
766add3f834bbd92929a5979acb05d121e9544e2	refs/heads/main
```

## Change

The selected shelter-map panel's alternate-path comparison now uses walk wording in rendered copy and accessibility labels.

## Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  28 passed (28)
   Start at  01:04:58
   Duration  7.40s (transform 3.60s, setup 0ms, import 4.63s, tests 1.51s, environment 2ms)
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
git check-ignore -v qa/verification/P177-walk-comparison-copy.md; "exit=$LASTEXITCODE"
exit=1
```

## FINDINGS

1. The alternate-path comparison still exposed `Route comparison` and route-labelled comparison copy inside the selected-walk panel.
2. The P177 change is browser copy and accessibility test coverage only. It does not alter route-mode logic, geometry, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None for this slice.
