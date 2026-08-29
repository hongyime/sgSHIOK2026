# P996 Service worker request cache

Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Date: 2026-08-29

## Scope

Reduce repeat browser requests that count against Vercel Edge/CDN quota without running pipeline work, exporting, deploying, or mutating protected data.

Change:

- Register an optional production-only browser service worker from the root layout.
- Cache only same-origin static app assets: `/`, `/icon.svg`, `/robots.txt`, `/sitemap.xml`, `/_next/static/`, and `/data/`.
- Keep `/api/` out of the service-worker cache so OneMap proxy responses keep their existing request-time behavior.
- Normalize navigations to the cached `/` app shell so repeat `?postal=` and `?stop=` shared-link visits can avoid an app-shell network request after first load.
- Remove the obsolete `.gitignore` rule for `web/public/sw.js` so the service worker is tracked deployment source instead of local-only output.

## Command Output

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
e00fd97a503bda4ab7984412cbac5663e502cb5e
```

```text
PS C:\sgSHIOK2026> git ls-remote origin refs/heads/main
e00fd97a503bda4ab7984412cbac5663e502cb5e	refs/heads/main
```

```text
PS C:\sgSHIOK2026> npm --prefix web test -- deployment
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  25 passed (25)
   Start at  22:53:57
   Duration  820ms (transform 143ms, setup 0ms, import 177ms, tests 56ms, environment 0ms)
```

```text
PS C:\sgSHIOK2026> git check-ignore -v web/public/sw.js; if ($LASTEXITCODE -eq 0) { "sw_check_ignore_exit=0" } else { "sw_check_ignore_exit=$LASTEXITCODE" }
sw_check_ignore_exit=1
```

## Findings

1. A service worker is the strongest remaining code-side free-tier reduction because repeat visits can be served from the browser cache without reaching Vercel at all.
2. This change is not live until the owner performs a manual Vercel deployment.
3. The service worker deliberately does not cache `/api/` so stale OneMap search or route responses are not served from a local browser cache.
4. Query-string navigation variants are normalized to the cached `/` shell; the client app still reads the live URL after loading, so shared postal/stop links remain functional.
5. `.gitignore` previously ignored `web/public/sw.js`; leaving that rule in place would have made the quota fix local-only unless force-added. The rule is removed and tested.

## Disagreements

1. None with the quota-reduction goal. The remaining caveat is operational: code-side request reductions cannot lower the active production deployment's traffic until that deployment is replaced.
