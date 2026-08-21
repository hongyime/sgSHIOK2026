# P290 Title Card Gap Copy

## Evidence

Command output is recorded below for the title-card address-universe copy change.

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

```text
> npm --prefix web test -- --runTestsByPath lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --runTestsByPath lib/__tests__/score-card-copy.test.ts
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
> npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  10:10:08
   Duration  1.90s (transform 225ms, setup 0ms, import 270ms, tests 90ms, environment 1ms)
```

```text
> python scripts/check_repo_integrity.py; Write-Output "EXIT_CODE=$LASTEXITCODE"
repo_integrity=ok
EXIT_CODE=0
```

```text
> git diff -- pipeline/config/weights.yaml; Write-Output "EXIT_CODE=$LASTEXITCODE"
EXIT_CODE=0
```

## FINDINGS

1. The title card repeated the 8-of-976 recent-source miss measurement in adjacent address-universe lines. The copy now states the frozen June 2020 universe once and carries the measured P19 miss count in a single dedicated recent-public-source line.

## DISAGREEMENTS

1. None.
