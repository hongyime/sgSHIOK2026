# P997 Service worker headers

Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Date: 2026-08-29

## Scope

Free-tier Vercel request reduction follow-up after P996.

Change:

- Add explicit `/sw.js` response headers.
- Use bounded caching for the service-worker script: `public, max-age=3600, stale-while-revalidate=86400`.
- Add `X-Robots-Tag: noindex, nofollow, noarchive`.
- Add `Service-Worker-Allowed: /`.

This does not make `/sw.js` immutable. The app needs service-worker updates to propagate, so one-year caching would be the wrong tradeoff for this file.

## Findings

1. P996 made `web/public/sw.js` a tracked deployment artifact, but did not give the service-worker script explicit headers.
2. `/sw.js` should not use the same immutable policy as hashed Next chunks because the filename is stable and future service-worker changes must reach browsers.
3. A one-hour browser cache with one-day stale revalidation is a bounded quota reduction without pinning stale service-worker behavior for a year.

## Disagreements

1. None.
