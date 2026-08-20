# P195 Locked Score Availability Copy

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Scope

Updated the manifest-derived score availability line from `Bundle score availability` to `Locked score availability`.

The counts, state breakdown, manifest parsing, score values, exported data, and locked weights are unchanged.

## Verification

```text
npm --prefix web test -- --run lib/__tests__/score-coverage.test.ts lib/__tests__/score-card-copy.test.ts

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-coverage.test.ts lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  19 passed (19)
   Start at  02:25:38
   Duration  3.28s (transform 940ms, setup 0ms, import 1.10s, tests 388ms, environment 2ms)
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

1. The score availability disclosure still used `Bundle score availability`, which was accurate as bundle context but weaker than the settled `Locked score` framing used elsewhere in the app.
2. The change is intentionally copy-only: it preserves the manifest-derived score counts and the partial/no-transit/awaiting-scoring breakdown.

## DISAGREEMENTS

1. None.
