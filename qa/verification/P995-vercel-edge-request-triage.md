# P995 Vercel Edge request triage

Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Date: 2026-08-29

## Scope

Question: Edge Requests on Vercel are at 100%; can we turn usage down enough to stay within the free tier?

No pipeline, scoring, export, rescore, ingest, network build, deployment, or protected payload mutation was performed.

## Local and Remote State

```text
PS C:\sgSHIOK2026> hostname
Prawn-E14
```

```text
PS C:\sgSHIOK2026> Get-Location

Path
----
C:\sgSHIOK2026
```

```text
PS C:\sgSHIOK2026> git rev-parse HEAD
41f57e1a8a14458129c50d6d43c85905743411ca
```

```text
PS C:\sgSHIOK2026> git ls-remote origin refs/heads/main
41f57e1a8a14458129c50d6d43c85905743411ca	refs/heads/main
```

## Live Header Checks

```text
PS C:\sgSHIOK2026> curl.exe -I https://sgshiok.vercel.app/
HTTP/1.1 200 OK
Accept-Ranges: bytes
Access-Control-Allow-Origin: *
Age: 10912
Cache-Control: public, max-age=0, must-revalidate
Content-Disposition: inline
Content-Length: 15464
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://www.onemap.gov.sg https://*.onemap.gov.sg; font-src 'self' data:; connect-src 'self' https://www.onemap.gov.sg https://*.onemap.gov.sg; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
Content-Type: text/html; charset=utf-8
Date: Sat, 29 Aug 2026 14:44:40 GMT
Etag: "0133f422300e81697088368caa5e9f97"
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
X-Content-Type-Options: nosniff
X-Matched-Path: /
X-Nextjs-Prerender: 1
X-Nextjs-Stale-Time: 300
X-Vercel-Cache: HIT
X-Vercel-Id: sin1::zthtl-1788014679921-db3413684623
```

```text
PS C:\sgSHIOK2026> curl.exe -I https://sgshiok.vercel.app/robots.txt
HTTP/1.1 200 OK
Accept-Ranges: bytes
Access-Control-Allow-Origin: *
Age: 14050
Cache-Control: public, max-age=0, must-revalidate
Content-Disposition: inline; filename="robots.txt"
Content-Length: 57
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://www.onemap.gov.sg https://*.onemap.gov.sg; font-src 'self' data:; connect-src 'self' https://www.onemap.gov.sg https://*.onemap.gov.sg; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
Content-Type: text/plain; charset=utf-8
Date: Sat, 29 Aug 2026 14:44:40 GMT
Etag: "b6f4693d2ccd7106ce3530c1e33dd1f3"
Last-Modified: Sat, 29 Aug 2026 10:50:30 GMT
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Matched-Path: /robots.txt
X-Vercel-Cache: HIT
X-Vercel-Id: sin1::9f4zb-1788014680605-b3e83a2a1868
```

```text
PS C:\sgSHIOK2026> curl.exe -s https://sgshiok.vercel.app/robots.txt
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /data/
```

```text
PS C:\sgSHIOK2026> curl.exe -I https://sgshiok.vercel.app/data/generated_20260805_prefer_scored_routed/manifest.json
HTTP/1.1 200 OK
Accept-Ranges: bytes
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Origin: *
Age: 14050
Cache-Control: public, max-age=31536000, immutable
Content-Disposition: inline; filename="manifest.json"
Content-Length: 13626
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://www.onemap.gov.sg https://*.onemap.gov.sg; font-src 'self' data:; connect-src 'self' https://www.onemap.gov.sg https://*.onemap.gov.sg; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
Content-Type: application/json; charset=utf-8
Date: Sat, 29 Aug 2026 14:44:41 GMT
Etag: "2575ab7463a61051a2f79287ec5fa69c"
Last-Modified: Sat, 29 Aug 2026 10:50:31 GMT
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Matched-Path: /data/generated_20260805_prefer_scored_routed/manifest.json
X-Robots-Tag: noindex, nofollow, noarchive
X-Vercel-Cache: HIT
X-Vercel-Id: sin1::rf7sf-1788014681186-3ccc0bdb37d1
```

```text
PS C:\sgSHIOK2026> curl.exe -I "https://sgshiok.vercel.app/api/onemap-search?searchVal=560231"
HTTP/1.1 200 OK
Age: 0
Cache-Control: public, max-age=86400
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://www.onemap.gov.sg https://*.onemap.gov.sg; font-src 'self' data:; connect-src 'self' https://www.onemap.gov.sg https://*.onemap.gov.sg; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
Content-Type: application/json
Date: Sat, 29 Aug 2026 14:44:44 GMT
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Matched-Path: /api/onemap-search
X-Robots-Tag: noindex, nofollow, noarchive
X-Vercel-Cache: MISS
X-Vercel-Id: sin1::iad1::nk8lj-1788014681557-4b4d26eba6d7
```

## Local Controls Already Committed

```text
PS C:\sgSHIOK2026> Get-Content web\app\robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/data/", "/_next/", "/*?*"],
      crawlDelay: 300,
    },
    sitemap: "https://sgshiok.vercel.app/sitemap.xml",
  };
}
```

```text
PS C:\sgSHIOK2026> git log --oneline --no-renames -20 -- web/app/robots.ts web/next.config.js web/vercel.json
c9cdfff perf: cache Next static chunks
6ec4a41 perf: rewrite favicon probes without redirect
2dca58d perf: slow polite crawler pacing further
a6943dc perf: extend app shell browser cache
684852e perf: extend crawler metadata cache
d94503b perf: slow polite crawler pacing
c8b50a1 perf: keep crawlers off Next assets
04aba6f perf: extend app shell browser cache
9d18265 perf: route favicon probes to cached icon
e539e8e perf: discourage crawler query variants
6cbce5d perf: cache app shell briefly
be3c255 perf: cache app icon response
dbc8cc4 perf: cache crawler sitemap response
4a12a0d perf: publish single-page crawler sitemap
131922d perf: add crawler delay to robots policy
5f1fcee perf: cache crawler policy response
0e44821 chore: disable automatic Vercel git deployments
0405ec9 fix: keep crawlers off data and API payloads
03d3a0f fix: cache versioned web data artifacts
0910e0c fix: close P4 carry-forward web issues
```

## Vercel Project Check

```text
Vercel connector list_projects included:
{
  "id": "prj_y6GIQUdEyXXmtg3UTWkcJECKHdEE",
  "name": "sgshiok",
  "accountId": "team_ARK7HKobyCMp0PCArQTLxbz6",
  "link": {
    "type": "github",
    "org": "hongyime",
    "repo": "sgSHIOK2026"
  }
}
```

## Findings

1. There is no single repository switch that makes Vercel Edge Requests stop counting. Vercel counts requests received by deployments at the edge/CDN layer, including cached static assets.
2. The live deployment still serves `/` and `/robots.txt` with `Cache-Control: public, max-age=0, must-revalidate`, while current `main` has longer cache and crawler-throttle controls. A manual deployment of current `main` is the lowest-risk code-side reduction.
3. `/data/` is already live with immutable cache headers and `X-Robots-Tag`, so the most obvious data-artifact request reduction has reached production.
4. If the dashboard is already at 100%, the immediate free-tier action is operational: pause the project or add Vercel Firewall/protection rules from the Vercel dashboard. I did not perform those actions because they change public availability.
5. Further code-side reductions are possible but product-impacting: change robots to disallow `/`, add noindex to `/`, or make the app shell cache for a week or more. Those reduce crawler/repeat traffic but trade away discoverability or freshness.

## Disagreements

1. None with the premise that Edge Request pressure needs action. The constraint is that code-only mitigations require a deployment before they affect live traffic, and immediate hard throttling belongs in Vercel project controls.
