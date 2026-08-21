# P279 Full Locked Score Availability Copy

## root guard

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

## git check-ignore -v qa/verification/P279-full-locked-score-availability-copy.md

```text
EXIT_CODE=1
```

## npm --prefix web test -- locked-score-availability.test.ts score-card-copy.test.ts

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs locked-score-availability.test.ts score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  19 passed (19)
   Start at  09:24:36
   Duration  782ms (transform 242ms, setup 0ms, import 306ms, tests 129ms, environment 0ms)
```

## python scripts/check_repo_integrity.py

```text
repo_integrity=ok
EXIT_CODE=0
```

## git diff -- pipeline/config/weights.yaml

```text
EXIT_CODE=0
```

## FINDINGS

1. The first-view availability line was already scoped to locked score availability, but its count phrase still said generic `full scores` and `full score`.
2. The formatter now says `full locked scores` and `full locked score`, preserving the same manifest-derived counts while keeping the locked score secondary and explicitly named.
3. This was browser copy and test coverage only; no scoring, export, rescore, subset run, ingest, network build, public data write, deploy, or locked-weight change was run.

## DISAGREEMENTS

1. None.
