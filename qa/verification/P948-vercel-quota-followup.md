# P948 Vercel Quota Follow-Up

## Working Root And Host

```text
pwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Runtime Logs By Request Path

```text
## Runtime Log Counts

**Project:** prj_y6GIQUdEyXXmtg3UTWkcJECKHdEE
**Grouped by:** requestPath

| requestPath | count |
|---|---|
| /api/onemap-search | 2 |
| / | 1 |
```

## Static-Source Runtime Logs By Request Path

```text
## Runtime Log Counts

**Project:** prj_y6GIQUdEyXXmtg3UTWkcJECKHdEE
**Grouped by:** requestPath

| requestPath | count |
|---|---|
| / | 1 |
```

## Live Header Check After P944

```text
URL=https://sgshiok.vercel.app/robots.txt
status=200
cache-control=public, must-revalidate, max-age=0
x-robots-tag=
x-vercel-cache=MISS
body_start
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /data/


body_end
URL=https://sgshiok.vercel.app/data/generated_20260805_prefer_scored_routed/manifest.json
status=200
cache-control=public, max-age=31536000, immutable
x-robots-tag=noindex, nofollow, noarchive
x-vercel-cache=MISS
URL=https://sgshiok.vercel.app/api/onemap-search?searchVal=560231
status=200
cache-control=public, max-age=86400
x-robots-tag=noindex, nofollow, noarchive
x-vercel-cache=MISS
```

## Latest Deployment State

```text
deployment dpl_D9yuEBCYuK2Z54j2b6JCUyaGj2mn
commit 0405ec9fca8a78c0c8115bf7bf11106426cd78ae
message fix: keep crawlers off data and API payloads
state READY
target production
```

## Latest Commit Status After Auto-Deploy Disable

```text
{"sha":"9e2cffbb036beda8d1c7624e8a3bf14ea3a3363a","state":"pending","statuses":[]}
```

## Vercel Documentation

```text
Source: https://vercel.com/docs/project-configuration/git-configuration

Set deploymentEnabled to false to prevent any branch from triggering a deployment.
```

## FINDINGS

1. Vercel runtime logs for the last 24 hours showed only 2 `/api/onemap-search` requests and 1 `/` request, so serverless/API runtime traffic does not explain the quota pressure.
2. Static-source runtime logs exposed only `/` in the same sample; Vercel's runtime-log view does not provide the full CDN asset-request accounting needed to reconcile the dashboard Edge/CDN total.
3. The production deployment currently live is `0405ec9`, so P942/P943/P944 request mitigations are live, but P945 lazy transit loading, P946 build data cache reuse, and P947 automatic deployment disable are committed on main and not live.
4. The build/deployment path remains the stronger explanation for the immediate quota event: earlier evidence showed Vercel builds self-downloading the data bundle for about 8m25s, followed by deployment rate limiting.
5. No scoring, export, rescore, subset run, ingest, network build, dependency install, deploy, protected payload write, or locked-weight change was performed for this follow-up.

## DISAGREEMENTS

1. I would not spend more free-tier work on speculative app-side request shaving until the deployment-rate-limit window clears and the dashboard is checked after a quiet period with automatic Git deployments disabled.
