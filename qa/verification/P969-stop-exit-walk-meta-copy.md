# P969 Stop Exit Walk Meta Copy

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
03a0cdbab6ebde624eee50b92391cbc73c1a4eda
```

## Change

Changed the access-row meta label from `35% locked walk-to-transit` to `35% locked stop/exit walk`, matching the visible row label `Walk to stop or exit`.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy accessibility-render

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  20:53:02
   Duration  4.88s (transform 1.57s, setup 0ms, import 1.97s, tests 1.34s, environment 1ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
exit_code=1
```

## FINDINGS

1. The access display row already named the destination as a stop or exit, but its meta label still used the broader `walk-to-transit` wording.

## DISAGREEMENTS

1. None.
