# P990 Next Static Cache

## Working Root

```text
Prawn-E14
C:\sgSHIOK2026
```

## Scope

```text
Reduce repeat Vercel Edge Requests with a config-only cache header for Next static chunks.
No scoring, export, rescore, subset run, ingest, network build, deployment, dependency install, protected payload mutation, or weights.yaml change was performed.
```

## Subagent Attempt

```text
collab spawn failed: agent thread limit reached
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  22 passed (22)
   Start at  22:20:15
   Duration  2.76s (transform 571ms, setup 0ms, import 655ms, tests 129ms, environment 1ms)
```

```text
repo_integrity=ok
```

```text
git diff -- pipeline/config/weights.yaml
```

## FINDINGS

1. Next static chunk requests are a remaining free-tier reduction target. The app already disallows `/_next/` in `robots.txt`, but browsers and non-compliant crawlers can still request hashed static chunks. Explicit `Cache-Control: public, max-age=31536000, immutable` on `/_next/static/:path*` reduces repeat Edge Requests after the first load.
2. The Vercel quota work remains committed but not live until the owner performs an explicit deployment, because `web/vercel.json` keeps Git-triggered deployments disabled.
3. Subagent restart was not available in this harness continuation because the agent thread limit was reached.

## DISAGREEMENTS

1. I did not restart old P11-P17 tasks. They are settled by the owner and restarting them would spend time and increase risk without addressing the current Edge Requests quota problem.
2. I did not deploy, pause, firewall, or otherwise mutate the Vercel project. Those are owner-level production controls and need explicit approval.
