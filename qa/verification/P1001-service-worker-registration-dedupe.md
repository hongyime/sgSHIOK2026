# P1001 Service worker registration dedupe

Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Date: 2026-08-29

## Scope

Free-tier Vercel request reduction follow-up for the service-worker registration path.

Change:

- Check `navigator.serviceWorker.getRegistration("/")` before registering `/sw.js`.
- Reuse an existing registration when present.
- Register `/sw.js` only when no root-scope registration exists.

This keeps the P996 service-worker quota benefit while avoiding unnecessary repeat registration/update checks on every production page load.

No pipeline, scoring, export, rescore, ingest, network build, dependency install, deployment, protected data mutation, or `weights.yaml` edit was performed.

## Command Output

```text
PS C:\sgSHIOK2026> npm --prefix web test -- deployment
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/deployment.test.ts (27 tests | 1 failed) 391ms
     × registers an optional service worker for repeat-visit request reduction 182ms

 Test Files  1 failed (1)
      Tests  1 failed | 26 passed (27)
   Start at  23:18:24
   Duration  2.82s (transform 508ms, setup 0ms, import 610ms, tests 391ms, environment 1ms)
```

```text
PS C:\sgSHIOK2026> npm --prefix web test -- deployment
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  27 passed (27)
   Start at  23:19:04
   Duration  1.18s (transform 278ms, setup 0ms, import 333ms, tests 74ms, environment 1ms)
```

## Findings

1. P996 registered `/sw.js` after every production page load whenever service workers were supported.
2. Browser service-worker registration is idempotent, but checking the existing registration first is a cheaper path and better aligned with the Edge-request quota goal.
3. The registration remains opportunistic: if service-worker APIs fail, the app still runs normally.
4. The first focused test run failed because the source assertion expected a single-line `navigator.serviceWorker.getRegistration("/")` call while the implementation formats the chain across lines; the assertion was corrected to test the actual `.getRegistration("/")` behavior.

## Disagreements

1. None.
