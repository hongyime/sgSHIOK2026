# P175 live-status walk fallback

## Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
objective_read=ok
git=ok
7f30e20eda82d002cc9358ecbacd0f20074b9e10
7f30e20eda82d002cc9358ecbacd0f20074b9e10	refs/heads/main
```

## Change

The score-card live-region fallback now says `walk active` when no selected walk label is passed. The previous defensive fallback said `route active`, which was the last generic route fallback in `scoreCardAnnouncement`.

## Focused web test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  18 passed (18)
   Start at  00:52:50
   Duration  2.94s (transform 1.12s, setup 0ms, import 1.49s, tests 530ms, environment 0ms)
```

## Diff check

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
```

## Locked weights check

```text
git diff -- pipeline/config/weights.yaml
```

No output.

## Repository integrity

```text
repo_integrity=ok
exit=0
```

## Evidence path ignore check

```text
git check-ignore -v qa/verification/P175-live-status-walk-fallback.md; "exit=$LASTEXITCODE"
exit=1
```

## FINDINGS

1. `scoreCardAnnouncement` still had one user-facing fallback that could announce `route active` if a selected walk label was not passed; it now falls back to `walk active`.
2. The change is browser accessibility copy and test coverage only. It does not alter route selection, geometry, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None for this slice.
