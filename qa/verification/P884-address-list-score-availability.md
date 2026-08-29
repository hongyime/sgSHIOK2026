# P884 Address-List Score Availability

## Commands

```text
Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Pipeline cost: zero; no scoring, export, rescore, subset run, ingest, network build, dependency install, public-data write, or deploy.
Protected paths: not modified.
```

## Change

```text
Changed the full-score availability line from generic records:
- Full locked scores: 95,157 of 124,443 records; 29,286 records ...

to address-list-specific records:
- Full locked scores: 95,157 of 124,443 June 2020 address-list records; 29,286 records ...
```

## Verification

```text
npm --prefix web test -- --run lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

Test Files  2 passed (2)
     Tests  63 passed (63)
  Start at  13:58:07
  Duration  2.84s (transform 993ms, setup 0ms, import 1.27s, tests 711ms, environment 1ms)

git diff --check

warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit=0

python scripts/check_repo_integrity.py
repo_integrity=ok
exit=0

git diff -- pipeline/config/weights.yaml
exit=0
```

## FINDINGS

1. The missing-score availability line used a generic `records` denominator even though the product caveat is specifically about the June 2020 address list. That could make the coverage statement read broader than it is.

## DISAGREEMENTS

1. None.
