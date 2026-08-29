# P1020 Weekly App Shell Cache

Date: 2026-08-30
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

Free-tier Vercel Edge Request reduction only.
No scoring, export, rescore, subset run, ingest, network build, deployment, dependency install, or protected data mutation.

## Change

Increase the app-shell cache window from one day to one week in deployment headers and the service worker.
This can reduce repeat visitor app-shell Edge Requests after deployment.
It does not prevent Vercel from counting first requests, CDN requests, or non-cooperating bot traffic.

## Command Output

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  27 passed (27)
   Start at  01:10:21
   Duration  1.13s (transform 217ms, setup 0ms, import 276ms, tests 72ms, environment 0ms)
```

```text
repo_integrity=ok
repo_integrity_exit=0
```

```text
weights_diff_exit=0
```

## FINDINGS

1. Source-side cache tuning can reduce repeat visits only after the owner deploys current main; it cannot stop Vercel from counting the first Edge Request.
2. Immediate hard reduction remains an owner-level Vercel action: pause/protect the project, firewall-deny traffic, or enable an equivalent access-control mode.
3. The weekly app-shell cache trades deploy freshness for quota relief. A just-deployed shell may require a hard refresh for returning users until their cached shell ages out.

## DISAGREEMENTS

1. None.
