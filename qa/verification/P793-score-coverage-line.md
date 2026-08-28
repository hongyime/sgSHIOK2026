# P793 Score Coverage Line

## Working Root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Scope

Browser-only locked-score coverage copy. No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected QA payload write, or locked-weight change.

## Evidence Path Ignore Check

```text
exit_code=1
```

## Change

The first-card score-availability line now leads with `Full locked scores` and keeps the same manifest-derived counts and state breakdown. The previous wording was accurate but read like an audit sentence.

## Initial Focused Web Test

Command:

```text
npm --prefix web test -- locked-score-availability.test.ts data.test.ts score-card-copy.test.ts accessibility-render.test.tsx
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs locked-score-availability.test.ts data.test.ts score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/score-card-copy.test.ts (16 tests | 1 failed) 589ms
     × puts data freshness and heat proxy copy in the title card 237ms

 Test Files  1 failed | 3 passed (4)
      Tests  1 failed | 63 passed (64)
   Start at  03:03:47
   Duration  36.20s (transform 5.31s, setup 0ms, import 6.69s, tests 19.81s, environment 5ms)
```

The failure was a stale source-level assertion expecting the old phrase `full locked score` inside `locked-score-availability.ts`; the formatter was intentionally changed to `missing full scores`.

## Final Focused Web Test

Command:

```text
npm --prefix web test -- locked-score-availability.test.ts data.test.ts score-card-copy.test.ts accessibility-render.test.tsx
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs locked-score-availability.test.ts data.test.ts score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  4 passed (4)
      Tests  64 passed (64)
   Start at  03:04:57
   Duration  8.64s (transform 1.42s, setup 0ms, import 1.90s, tests 3.81s, environment 2ms)
```

## Collection

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
625 tests collected in 49.48s
```

## Protected Diff Guard

Command:

```text
git diff --name-only | Where-Object { $_ -eq 'pipeline/config/weights.yaml' -or $_ -eq 'checksums.json' -or $_ -like 'web/public/data/*' -or $_ -like 'qa/p6_*' -or $_ -like 'qa/p7_*' -or $_ -like 'qa/p8_*' -or $_ -like 'qa/p9_*' -or $_ -like 'qa/p10_*' -or $_ -like 'qa/p11/*' -or $_ -like 'qa/releases/*' }; Write-Output "exit_code=$LASTEXITCODE"
```

Output:

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

## Repository Integrity

Command:

```text
python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
exit_code=0
```

## FINDINGS

1. The old score-availability sentence was correct but audit-shaped: it led with `Locked score coverage` and buried the missing-full-score condition after a semicolon.
2. The browser now says `Full locked scores: 95,157 of 124,443 records; 29,286 records (23.5%, roughly a quarter) missing full scores...`, which keeps the same manifest-derived evidence while making the limitation faster to scan.
3. No protected paths or locked weights appear in the diff.

## DISAGREEMENTS

1. None for this phase.
