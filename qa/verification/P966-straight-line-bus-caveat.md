# P966 Straight-Line Bus Estimate Caveat

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
967d08427e591f8df0243bcffd17729e27459455
```

## Change

Aligned the direct-bus caveat with the already-settled `Straight-line bus estimate` language. The row still states that no verified shelter-map walk to an official LTA bus stop is published and that the locked bus score remains 0.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy accessibility-render

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  20:42:34
   Duration  6.46s (transform 2.02s, setup 0ms, import 2.46s, tests 2.03s, environment 1ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
exit_code=1
```

## FINDINGS

1. One visible bus caveat still used `fallback evidence` even though the route-detail surface had already moved to `Straight-line bus estimate`; the phrase is now consistent.

## DISAGREEMENTS

1. None.
