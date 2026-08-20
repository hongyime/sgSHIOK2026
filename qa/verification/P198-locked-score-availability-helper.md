# P198 Locked Score Availability Helper

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Scope

Renamed the web helper and test around the manifest-derived full-score disclosure:

- `web/lib/score-coverage.ts` -> `web/lib/locked-score-availability.ts`
- `formatScoreCoverageLine` -> `formatLockedScoreAvailabilityLine`
- `score coverage copy` test description -> `locked score availability copy`

The rendered copy and manifest-derived count logic are unchanged.

## Verification

```text
npm --prefix web test -- --run lib/__tests__/locked-score-availability.test.ts lib/__tests__/score-card-copy.test.ts

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/locked-score-availability.test.ts lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  19 passed (19)
   Start at  02:34:08
   Duration  988ms (transform 276ms, setup 0ms, import 343ms, tests 142ms, environment 1ms)
```

```text
python C:\sgSHIOK2026\scripts\check_repo_integrity.py
repo_integrity=ok
integrity_exit=0
```

```text
git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml
weights_diff_start
weights_diff_end
```

## FINDINGS

1. The browser helper still used `score coverage` naming after the rendered disclosure had moved to `Locked score availability`.
2. Renaming the helper/test makes future copy work less likely to reintroduce generic score-first framing while preserving behavior.

## DISAGREEMENTS

1. None.
