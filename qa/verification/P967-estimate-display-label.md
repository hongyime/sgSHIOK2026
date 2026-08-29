# P967 Estimate Display Label

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
83f930f34a2e7aa61de8d32701dcf64f70d6c4fa
```

## Change

Changed the straight-line bus status prefix from `Evidence display` to `Estimate display`. The regular routed-walk status remains `Walk display`.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy accessibility-render

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  20:46:20
   Duration  6.65s (transform 2.07s, setup 0ms, import 2.60s, tests 1.87s, environment 1ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
exit_code=1
```

## FINDINGS

1. Straight-line bus status text still used the generic visible prefix `Evidence display`; `Estimate display` better names what the user is seeing.

## DISAGREEMENTS

1. None.
