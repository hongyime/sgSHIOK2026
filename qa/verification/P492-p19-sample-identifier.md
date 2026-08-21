# P492 P19 Sample Identifier

Working root:

```text
C:\sgSHIOK2026
Prawn-E14
```

## Check-ignore

```text
Command: git check-ignore -v qa/verification/P492-p19-sample-identifier.md; if ($LASTEXITCODE -eq 0) { "exit=$LASTEXITCODE" } else { "exit=$LASTEXITCODE" }
exit=1
```

## Initial Focused Test Command Attempts

```text
Command: npm --prefix C:\sgSHIOK2026\web test -- --runTestsByPath C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --runTestsByPath C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts
file:///C:/sgSHIOK2026/web/node_modules/vitest/dist/chunks/cac.DdICfEr1.js:406
          throw new CACError(`Unknown option \`${name.length > 1 ? `--${name}` : `-${name}`}\``);
                ^

CACError: Unknown option `--runTestsByPath`
    at Command.checkUnknownOptions (file:///C:/sgSHIOK2026/web/node_modules/vitest/dist/chunks/cac.DdICfEr1.js:406:17)
    at CAC.runMatchedCommand (file:///C:/sgSHIOK2026/web/node_modules/vitest/dist/chunks/cac.DdICfEr1.js:606:13)
    at CAC.parse (file:///C:/sgSHIOK2026/web/node_modules/vitest/dist/chunks/cac.DdICfEr1.js:547:12)
    at file:///C:/sgSHIOK2026/web/node_modules/vitest/dist/cli.js:11:13
    at ModuleJob.run (node:internal/modules/esm/module_job:569:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:650:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)

Node.js v26.5.0
```

```text
Command: npm --prefix C:\sgSHIOK2026\web test -- web/lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs web/lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

No test files found, exiting with code 1

filter: web/lib/__tests__/score-card-copy.test.ts
include: **/*.{test,spec}.?(c|m)[jt]s?(x)
exclude:  **/node_modules/**, **/.git/**
```

## Focused Web Test

```text
Command: npm --prefix C:\sgSHIOK2026\web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  01:52:09
   Duration  1.37s (transform 205ms, setup 0ms, import 277ms, tests 186ms, environment 1ms)
```

## Identifier Search

```text
Command: rg -n "RECENT_PUBLIC_SOURCE_CHECK_LABEL" C:\sgSHIOK2026\web\app\page.tsx; if ($LASTEXITCODE -eq 0) { "page_exit=$LASTEXITCODE" } else { "page_exit=$LASTEXITCODE" }
page_exit=1
```

```text
Command: rg -n "RECENT_PUBLIC_SOURCE_SAMPLE_LABEL" C:\sgSHIOK2026\web\app\page.tsx C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts; if ($LASTEXITCODE -eq 0) { "sample_exit=$LASTEXITCODE" } else { "sample_exit=$LASTEXITCODE" }
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:191:      "{RECENT_PUBLIC_SOURCE_SAMPLE_LABEL}: {RECENT_PUBLIC_SOURCE_GAP_COPY}."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:193:    expect(source).toContain('const RECENT_PUBLIC_SOURCE_SAMPLE_LABEL = "16 Aug 2026 public-source sample";');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:202:      "one of the 6 coordinate-backed HDB missing rows from frozen v1 in the ${RECENT_PUBLIC_SOURCE_SAMPLE_LABEL}"
C:\sgSHIOK2026\web\app\page.tsx:103:const RECENT_PUBLIC_SOURCE_SAMPLE_LABEL = "16 Aug 2026 public-source sample";
C:\sgSHIOK2026\web\app\page.tsx:139:    return `this postal is one of the 6 coordinate-backed HDB missing rows from frozen v1 in the ${RECENT_PUBLIC_SOURCE_SAMPLE_LABEL} (${source})`;
C:\sgSHIOK2026\web\app\page.tsx:141:  return `the ${RECENT_PUBLIC_SOURCE_SAMPLE_LABEL} found ${RECENT_PUBLIC_SOURCE_GAP_COPY}`;
C:\sgSHIOK2026\web\app\page.tsx:177:    return `No OneMap address result found for this search. Try a 6-digit postal code. Separately, the published shelter-map bundle is tied to the frozen June 2020 address universe, and the ${RECENT_PUBLIC_SOURCE_SAMPLE_LABEL} found ${RECENT_PUBLIC_SOURCE_GAP_COPY}.`;
C:\sgSHIOK2026\web\app\page.tsx:307:          No OneMap address result found for this search. Try a 6-digit postal code. Separately, the published shelter-map bundle is tied to the frozen June 2020 address universe, and the {RECENT_PUBLIC_SOURCE_SAMPLE_LABEL} found {RECENT_PUBLIC_SOURCE_GAP_COPY}.
C:\sgSHIOK2026\web\app\page.tsx:2160:              {RECENT_PUBLIC_SOURCE_SAMPLE_LABEL}: {RECENT_PUBLIC_SOURCE_GAP_COPY}.
sample_exit=0
```

## Repository Integrity

```text
Command: python C:\sgSHIOK2026\scripts\check_repo_integrity.py; if ($LASTEXITCODE -eq 0) { "exit=$LASTEXITCODE" } else { "exit=$LASTEXITCODE" }
repo_integrity=ok
exit=0
```

## Protected Path Diff

```text
Command: git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4 qa/releases
```

## FINDINGS

1. Browser copy had already moved to `16 Aug 2026 public-source sample`, but the source constant still used the stale `RECENT_PUBLIC_SOURCE_CHECK_LABEL` name.
2. The rendered copy did not change; this was a source/test naming cleanup to keep future edits from reintroducing `check` framing.
3. Vitest file filters are relative to the `web` package root through `npm --prefix web test`; Jest-style `--runTestsByPath` and repo-root-prefixed filters fail before running tests.

## DISAGREEMENTS

1. None.
