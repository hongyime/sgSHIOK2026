# P968 Beyond-Range Locked Score Copy

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
060745d936a4cb9799e5d049360f2eaf0bf468c1
```

## Change

Changed the beyond-range shelter-map note from saying the locked score is `suppressed` to saying it is `not published` beyond the locked 1.2 km transit range.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render score-card-copy

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  20:49:56
   Duration  13.15s (transform 4.57s, setup 0ms, import 5.61s, tests 3.13s, environment 5ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
exit_code=1
```

## FINDINGS

1. The beyond-range shelter-map note used `suppressed`, which could read like a hidden score rather than an unpublished score state; `not published` is clearer for users deciding whether a route is inside the locked release rules.

## DISAGREEMENTS

1. None.
