# P965 Supporting Score Row Copy

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
8416504bc97d7f9a70f24578a94ca8544cd33ee4
```

## Change

Changed the nearby-address comparison helper for bus, heat, and crossing from `locked-score row` to `supporting score row`. Rain and walk-distance rows remain evidence rows; the locked SHIOK score remains visible but secondary and unchanged.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy accessibility-render

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  20:37:55
   Duration  5.00s (transform 1.54s, setup 0ms, import 1.97s, tests 1.49s, environment 1ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
exit_code=1
```

## FINDINGS

1. `locked-score row` was still visible as helper copy in the nearby-address comparison panel for bus, heat, and crossing; `supporting score row` better matches the four-row shelter-first presentation without changing scoring behavior.

## DISAGREEMENTS

1. None.
