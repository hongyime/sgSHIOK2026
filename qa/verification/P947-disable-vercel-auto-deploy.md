# P947 Disable Vercel Auto Deploy

## Working Root And Host

```text
pwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Goal

Stop Git pushes from automatically consuming Vercel deployment quota and potentially live-data Edge/CDN requests.

## Latest Commit Status Before This Change

```text
{"sha":"e5e359c9227d627e77dd27761af42404be12b30d","state":"failure","statuses":[{"context":"Vercel","created_at":"2026-08-29T10:50:08Z","description":"Deployment rate limited — retry in 24 hours.","state":"failure","target_url":"https://vercel.com/theprawnvercel?upgradeToPro=build-rate-limit"},{"context":"Vercel Deployments – The Prawn Vercel","created_at":"2026-08-29T10:50:10Z","description":"Required and affected projects deploying","state":"pending","target_url":"https://vercel.com/theprawnvercel/~/deployments?repo=github%2Fhongyime%2FsgSHIOK2026&filterBranch=main&sha=e5e359c9227d627e77dd27761af42404be12b30d"}]}
```

## Build-Cache Commit Status Before This Change

```text
{"sha":"0868292ad1b21126570518921927fadb348e41df","state":"failure","statuses":[{"context":"Vercel","created_at":"2026-08-29T10:49:21Z","description":"Deployment rate limited — retry in 24 hours.","state":"failure","target_url":"https://vercel.com/theprawnvercel?upgradeToPro=build-rate-limit"},{"context":"Vercel Deployments – The Prawn Vercel","created_at":"2026-08-29T10:49:24Z","description":"Required and affected projects deploying","state":"pending","target_url":"https://vercel.com/theprawnvercel/~/deployments?repo=github%2Fhongyime%2FsgSHIOK2026&filterBranch=main&sha=0868292ad1b21126570518921927fadb348e41df"}]}
```

## Vercel Documentation Check

```text
Source: https://vercel.com/docs/project-configuration/git-configuration

Set deploymentEnabled to false to prevent any branch from triggering a deployment.

{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": {
    "deploymentEnabled": false
  }
}
```

## Live Header Check After P944 Became Ready

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

## Focused Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  14 passed (14)
   Start at  18:52:42
   Duration  1.98s (transform 360ms, setup 0ms, import 414ms, tests 82ms, environment 0ms)
```

## JSON Parse Check

```text
vercel_json_ok
```

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  182 passed (182)
   Start at  18:53:13
   Duration  93.31s (transform 5.67s, setup 0ms, import 8.77s, tests 50.38s, environment 59ms)
```

## Repository Integrity

```text
repo_integrity=ok
exit_code=0
```

## Locked Weights Diff

```text
```

## Diff Check

```text
```

## FINDINGS

1. Vercel is currently deployment-rate-limited for this Hobby team, with status text `Deployment rate limited — retry in 24 hours.`
2. The latest pushed commits after `0405ec9` are on GitHub main but did not become live deployments before this change because of the Vercel deployment rate limit.
3. P942/P943/P944 mitigations are live now: `/data/` has immutable cache headers, `/api/onemap-search` has a success cache header, `/data/` and `/api/` have `X-Robots-Tag`, and `/robots.txt` disallows `/api/` and `/data/`.
4. `web/vercel.json` now disables automatic Git deployments with `git.deploymentEnabled=false`, so future pushes should not automatically spend Vercel deployment quota. Manual deployment remains possible when the owner chooses to publish.
5. No scoring, export, rescore, subset run, ingest, network build, dependency install, deploy, protected payload write, or locked-weight change was performed for this change.

## DISAGREEMENTS

1. Keeping automatic production deployments enabled conflicts with the standing release rule that publishing is the owner's decision. Disabling Git-triggered deployments is the safer default for this project.
