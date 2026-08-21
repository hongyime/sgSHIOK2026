# P547 Search No-Result Copy

Date: 2026-08-22
Machine: PRAWN-E14
Working root: C:\sgSHIOK2026

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
ca416d37f70ae8dd8d6fa95a1e1fa5959c5ddd9b
```

## Scope

No scoring, export, rescore, subset run, ingest, network build, upstream probe, public-data write, protected QA mutation, deployment, or locked-weight change was performed.

Changed only the browser search no-result copy:

```text
diff --git a/web/app/page.module.css b/web/app/page.module.css
diff --git a/web/app/page.tsx b/web/app/page.tsx
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
```

The visible no-result state now separates the action hint from the frozen-bundle caveat. The screen-reader announcement still includes the full measured P19/P379 sample fact.

## Focused Test, First Run

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/accessibility-render.test.tsx (29 tests | 1 failed) 1044ms
     × renders search result announcements and assertive error alerts 51ms

 Test Files  1 failed | 1 passed (2)
      Tests  1 failed | 44 passed (45)
   Start at  06:28:53
   Duration  7.81s (transform 4.12s, setup 0ms, import 5.41s, tests 1.37s, environment 6ms)
```

Cause: CSS modules hash class names, so the test assertion needed to match the generated token containing `emptyBoxNote` rather than the literal un-hashed class attribute.

## Focused Test, Fixed

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  45 passed (45)
   Start at  06:29:27
   Duration  2.14s (transform 1.11s, setup 0ms, import 1.49s, tests 498ms, environment 1ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  150 passed (150)
   Start at  06:30:04
   Duration  6.64s (transform 5.94s, setup 0ms, import 7.27s, tests 10.10s, environment 10ms)
```

## Python Collect-Only

```text
437 tests collected in 12.23s
```

## Repo Integrity

```text
repo_integrity=ok
repo_integrity_exit=0
```

## Check Ignore

```text
check_ignore_exit=1
```

## Protected Diff

```text
```

## Findings

1. The old no-result UI presented three concepts as one dense status sentence: OneMap found no address result, the user should try a postal code, and the published shelter-map bundle is frozen to the June 2020 address universe.
2. The measured public-source caveat remains valid and unchanged in substance: `16 Aug 2026 public-source sample: 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unvalidated MCST proxy rows (CANAAN and MYRA) out of 976 (0.82%) sampled 2021-2026 public-source rows with postals.`
3. The copy issue was user-visible but free-tier: it required no data regeneration, scoring, export, deployment, protected evidence mutation, or locked weight change.

## Disagreements

1. None.
