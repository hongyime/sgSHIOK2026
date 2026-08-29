# P971 Locked Score Note Copy

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
762ca65fb3c32e3f57ae836094e3416a2f4f989a
```

## Change

Changed the direct-bus locked-score state prefix from `Locked score caveat` to `Locked score note` while preserving the explanation that the straight-line bus estimate is not a verified shelter-map walk.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render score-card-copy

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  20:58:52
   Duration  4.40s (transform 1.40s, setup 0ms, import 1.81s, tests 1.16s, environment 1ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
exit_code=1
```

## FINDINGS

1. The direct-bus locked-score explanation used `caveat`, which was heavier than needed for an ordinary score-state note.
2. Vercel read-only inspection could not proceed from this checkout because neither `web/.vercel/project.json` nor root `.vercel/project.json` exists and no Vercel project/team environment variables are set.

## DISAGREEMENTS

1. None.
