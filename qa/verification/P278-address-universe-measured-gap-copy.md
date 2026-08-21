# P278 Address Universe Measured Gap Copy

## root guard

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

## git check-ignore -v qa/verification/P278-address-universe-measured-gap-copy.md

```text
EXIT_CODE=1
```

## npm --prefix web test -- score-card-copy.test.ts

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  09:21:00
   Duration  29.10s (transform 405ms, setup 0ms, import 489ms, tests 140ms, environment 1ms)
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

1. The first-view address-universe caveat said measured recent-source misses existed, but the main caveat did not carry the measured P19 sample count.
2. The first-view caveat now names the P19 measurement directly: a 2021-2026 public-source sample found 8 missing rows out of 976.
3. This was web copy and test coverage only; no scoring, export, rescore, subset run, ingest, network build, public data write, deploy, or locked-weight change was run.

## DISAGREEMENTS

1. None.
