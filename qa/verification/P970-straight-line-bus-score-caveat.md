# P970 Straight-Line Bus Score Caveat

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
3a0525334d773faedbf53a32aa9d016d9bc880c3
```

## Change

Changed the direct-bus locked-score caveat from saying nearby direct bus service evidence is not connected to saying the straight-line bus estimate is not a verified shelter-map walk.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy accessibility-render

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  20:55:50
   Duration  4.16s (transform 1.29s, setup 0ms, import 1.66s, tests 1.15s, environment 1ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
exit_code=1
```

## FINDINGS

1. The direct-bus caveat still exposed connectivity wording; naming the estimate as not a verified shelter-map walk is clearer and matches the product surface.

## DISAGREEMENTS

1. None.
