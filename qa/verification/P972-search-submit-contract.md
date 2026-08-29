# P972 Search Submit Contract

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
ad40b4f0deafb5afa9d99ed41381a03ecd0ff839
```

## Change

Added a source-level test guard that OneMap search stays submit-driven: typing updates local query state, while backend search remains behind form submit. This protects the Vercel Edge Request budget from accidental typeahead search traffic.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  22 passed (22)
   Start at  21:03:15
   Duration  1.92s (transform 640ms, setup 0ms, import 692ms, tests 216ms, environment 1ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
exit_code=1
```

## FINDINGS

1. OneMap search is already submit-only and cached; adding a test guard is the right free-tier action because changing runtime search behavior would not reduce current calls further.
2. Vercel project log inspection remains blocked from this checkout because local project/team linkage is absent.

## DISAGREEMENTS

1. None.
