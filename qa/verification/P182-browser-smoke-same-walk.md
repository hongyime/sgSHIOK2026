# P182 Browser Smoke Same-Walk Copy

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Ignore Check

```text
check_ignore_exit=1
```

## Finding

`web/app/page.tsx` and unit tests had already moved the same-route note to `Shortest same as sheltered walk.`, but `web/scripts/browser-smoke.mjs` still searched for `Shortest same as sheltered route`. That made the executable browser smoke check stale against the shipped copy.

## Evidence

```text
C:\sgSHIOK2026\web\app\page.tsx:852:        Shortest same as sheltered walk.
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:428:    expression: `Boolean(Array.from(document.querySelectorAll('[class*=sameRouteNote]')).some((item) => item.textContent?.includes('Shortest same as sheltered walk')))`,
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:588:    summary.sameRouteNote.includes("Shortest same as sheltered walk");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:42:    expect(source).toContain("Shortest same as sheltered walk.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:43:    expect(source).not.toContain("Shortest same as sheltered route.");
```

## Scope

This is browser-smoke verification alignment only. It does not change app rendering, scoring, export, input artifacts, public data, deployment, or `pipeline/config/weights.yaml`.

## Verification

First focused test attempt used a path relative to the repository root while `test-web.mjs` runs Vitest from `web/`, so it correctly found no test file:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run web/lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

No test files found, exiting with code 1

filter: web/lib/__tests__/score-card-copy.test.ts
include: **/*.{test,spec}.?(c|m)[jt]s?(x)
exclude:  **/node_modules/**, **/.git/**
```

Corrected focused test:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  01:34:41
   Duration  880ms (transform 125ms, setup 0ms, import 170ms, tests 55ms, environment 0ms)

web_test_exit=0
```

```text
repo_integrity=ok
integrity_exit=0
```

```text
diff_check_exit=0
weights_diff_start
weights_diff_end
```

## FINDINGS

1. Browser smoke still expected `Shortest same as sheltered route` after the visible app and unit tests had moved to `Shortest same as sheltered walk`.
2. The stale expectation could falsely mark a same-route browser smoke path as missing even when the rendered app copy was correct.

## DISAGREEMENTS

1. None.
