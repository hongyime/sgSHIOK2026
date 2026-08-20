# P179 same-walk display announcement

## Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
objective_read=ok
git=ok
f4f7eea3bb3fffdcad6e2276ef3a378650faf63d
f4f7eea3bb3fffdcad6e2276ef3a378650faf63d	refs/heads/main
```

## Change

The walk-display live-region helper now announces same shortest/sheltered geometry as `shortest same as sheltered walk` instead of `shortest same as sheltered route`.

## Focused web test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  19 passed (19)
   Start at  01:14:03
   Duration  2.20s (transform 927ms, setup 0ms, import 1.21s, tests 316ms, environment 0ms)
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
git check-ignore -v qa/verification/P179-same-walk-display-announcement.md; "exit=$LASTEXITCODE"
exit=1
```

## FINDINGS

1. `routeDisplayAnnouncement()` still announced same shortest/sheltered geometry as `shortest same as sheltered route` even though the surrounding control is now `Walk display`.
2. The P179 change is browser accessibility copy and test coverage only. It does not alter route selection, map rendering, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None for this slice.
