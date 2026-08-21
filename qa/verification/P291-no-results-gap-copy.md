# P291 No Results Gap Copy

## Evidence

Command output is recorded below for the no-results frozen-bundle caveat copy change.

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

```text
> npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  19 passed (19)
   Start at  10:13:29
   Duration  5.53s (transform 3.60s, setup 0ms, import 4.67s, tests 299ms, environment 0ms)
```

```text
> python scripts/check_repo_integrity.py; Write-Output "EXIT_CODE=$LASTEXITCODE"
repo_integrity=ok
EXIT_CODE=0
```

```text
> git diff -- pipeline/config/weights.yaml; Write-Output "EXIT_CODE=$LASTEXITCODE"
EXIT_CODE=0
```

## FINDINGS

1. The address-search no-results state still said the frozen shelter-map bundle had `measured recent-source misses` without naming the measured P19 count. It now states that the recent public-source check found 8 missing rows out of 976.

## DISAGREEMENTS

1. None.
