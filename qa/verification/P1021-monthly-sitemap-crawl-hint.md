# P1021 Monthly Sitemap Crawl Hint

Date: 2026-08-30
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

Free-tier Vercel Edge Request reduction only.
No scoring, export, rescore, subset run, ingest, network build, deployment, dependency install, or protected data mutation.

## Change

The public sitemap now hints `monthly` recrawling with priority `0.3` instead of `weekly` at priority `1`.
This reflects the single-page app's mostly static public surface and reduces polite-crawler pressure.
It is advisory only; non-cooperating crawlers and first requests still count as Vercel Edge Requests.

## Command Output

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  27 passed (27)
   Start at  01:15:08
   Duration  8.20s (transform 431ms, setup 0ms, import 531ms, tests 480ms, environment 0ms)
```

```text
repo_integrity=ok
repo_integrity_exit=0
```

```text
weights_diff_exit=0
```

## FINDINGS

1. The sitemap was still telling polite crawlers to revisit weekly at top priority despite the app publishing a single canonical route.
2. Monthly crawl hints are lower-pressure but remain advisory. They do not control hostile or non-compliant traffic.
3. The change is not live until the owner deploys current main.

## DISAGREEMENTS

1. None.
