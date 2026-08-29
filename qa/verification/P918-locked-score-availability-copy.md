# P918 Locked Score Availability Copy

## Scope

Change the locked-score availability breakdown from `awaiting scoring` to a static published-data label for the `NOT_YET_SCORED` bucket.

## Commands

### Root and remote before edit

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
885a6aaad85e950ebc8c92d2846d69e9634ee71b
885a6aaad85e950ebc8c92d2846d69e9634ee71b	refs/heads/main
```

### Copy context before edit

```text
C:\sgSHIOK2026\web\lib\locked-score-availability.ts:41:  )} beyond the 1.2 km locked transit range, and ${formatWholeNumber(notYet)} awaiting scoring`;
C:\sgSHIOK2026\web\lib\__tests__\data.test.ts:37:      "Full locked scores: 95,157 of 124,443 June 2020 address-list records; 29,286 address-list records (23.5%, roughly a quarter) missing full scores: 18,983 with partial shelter-map evidence, 9,827 beyond the 1.2 km locked transit range, and 476 awaiting scoring."
C:\sgSHIOK2026\web\lib\__tests__\locked-score-availability.test.ts:33:      "Full locked scores: 95,157 of 124,443 June 2020 address-list records; 29,286 address-list records (23.5%, roughly a quarter) missing full scores: 18,983 with partial shelter-map evidence, 9,827 beyond the 1.2 km locked transit range, and 476 awaiting scoring."
C:\sgSHIOK2026\web\lib\__tests__\locked-score-availability.test.ts:47:      "Full locked scores: 900 of 1,000 June 2020 address-list records; 100 address-list records (10%) missing full scores: 80 with partial shelter-map evidence, 15 beyond the 1.2 km locked transit range, and 5 awaiting scoring."
C:\sgSHIOK2026\README.md:59:beyond locked transit range, or are awaiting scoring. The night lighting map
```

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs locked-score-availability.test.ts data.test.ts score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  4 passed (4)
      Tests  72 passed (72)
   Start at  16:17:10
   Duration  36.28s (transform 4.00s, setup 0ms, import 4.85s, tests 21.14s, environment 4ms)
```

### git diff --check

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
```

Exit code: 0.

### Locked weights diff

```text
```

Exit code: 0.

### Repository integrity

```text
repo_integrity=ok
EXIT=0
```

## FINDINGS

1. The locked-score availability disclosure still called the `NOT_YET_SCORED` bucket `awaiting scoring`, implying a queued future pipeline run instead of a published-data boundary.

## DISAGREEMENTS

1. None.
