# P998 Service worker freshness

Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Date: 2026-08-29

## Scope

Free-tier Vercel request reduction follow-up after P996/P997.

Change:

- Keep cache-first behavior for immutable static assets: `/_next/static/`, `/data/`, and `/icon.svg`.
- Bound service-worker reuse for stable non-hashed URLs:
  - `/`: 86,400,000 ms, matching the one-day app-shell browser cache policy.
  - `/robots.txt`: 604,800,000 ms, matching the one-week crawler-policy browser cache policy.
  - `/sitemap.xml`: 604,800,000 ms, matching the one-week sitemap browser cache policy.
- Re-fetch stable non-hashed URLs after their cache window instead of serving them forever.

No pipeline, scoring, export, rescore, ingest, network build, dependency install, deployment, protected data mutation, or `weights.yaml` edit was performed.

## Findings

1. P996's cache-first service worker reduced requests aggressively, but stable non-hashed URLs could remain stale indefinitely if the cache name was not changed in a future deploy.
2. Static versioned assets remain cache-first because their URLs change by version or content path.
3. The app shell and crawler-policy files now keep the quota benefit inside their declared freshness windows without making future manual deploys invisible indefinitely.

## Disagreements

1. None.
