# P211 First-view Covered-walkway Copy

Date: 2026-08-21

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
3ef0b59d38b9fc2e227099c3217dfbedbe2ffe69
3ef0b59d38b9fc2e227099c3217dfbedbe2ffe69	refs/heads/main
```

## Scope

```text
Browser copy only.
No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, or locked-weight change.
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  34 passed (34)
   Start at  04:27:55
   Duration  1.63s (transform 844ms, setup 0ms, import 1.10s, tests 311ms, environment 1ms)
```

## Locked Weights Diff Check

```text
exit=0
```

## Evidence Ignore Check

```text
exit=1
```

## Repo Integrity

```text
repo_integrity=ok
exit=0
```

## FINDINGS

1. The first-view subtitle still used generic shelter-first wording even though the settled product direction says the covered-walkway ratio and exposure gaps are the headline artifact.
2. The empty shelter-map panel also used generic `sheltered walk evidence` wording instead of naming the covered-walkway ratio explicitly.
3. A first attempt used a subtitle beginning with `Covered-`, which tripped the existing regression guard against reverting the walk-display label to `Covered`; the final copy keeps the artifact wording without weakening that guard.

## DISAGREEMENTS

1. None.
