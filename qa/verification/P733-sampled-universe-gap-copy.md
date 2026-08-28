# P733 sampled universe gap copy

## Root and host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Evidence path ignore check

```text
exit_code=1
```

## Existing cached universe status

```text
The current postal universe is frozen v1: 124,443 records built around a June
2020 OneMap-derived postal scrape plus later local route and source evidence.
The 16 Aug 2026 public-source sample found a small sampled current-source gap: 6
coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of
976 sampled 2021-2026 public-source rows with postals. That is 0.61%
confirmed missing rows, or 0.82% including source-quality warnings. If that
sample row rate were applied to the 124,443 frozen v1 distinct postals, the
directional scale would be 765 confirmed missing rows, or 1,020 including
warnings; that is not a measured full-universe gap.
```

## Focused web test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  20:13:50
   Duration  3.75s (transform 514ms, setup 0ms, import 587ms, tests 195ms, environment 0ms)
```

## Collection and integrity

```text
531 tests collected in 20.49s
```

```text
repo_integrity=ok
exit_code=0
```

## Diff checks

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

```text
exit_code=0
```

## FINDINGS

1. README already warned that the 16 Aug 2026 public-source gap rate is directional and not a measured full-universe gap, but the first-view UI only said it was a sample.
2. The first-view title card now carries the same qualifier: `This is a sample, not a measured full-universe gap`.
3. The P732 freshness-source decision had evidence but no durable `decisions.md` entry; this commit appends that missing entry before the P733 decision.

## DISAGREEMENTS

1. None.
