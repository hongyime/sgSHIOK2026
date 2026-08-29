# P973 Robots Next Asset Crawl Control

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
79b4cc054728651fe419921b441fb13c91c8816b
```

## Change

Added `/_next/` to the robots disallow list. The app has a single-page sitemap and does not need polite crawlers to fetch Next.js build assets; normal browsers are unaffected because robots.txt is crawler policy, not routing control.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  21 passed (21)
   Start at  21:06:50
   Duration  1.31s (transform 196ms, setup 0ms, import 252ms, tests 191ms, environment 1ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
exit_code=1
```

## FINDINGS

1. The crawler policy already kept polite crawlers away from API, data, and query variants, but still left Next.js build assets crawlable. Disallowing `/_next/` reduces crawler-driven asset fan-out on Vercel once deployed.
2. This is not a hard bot block; aggressive clients can ignore robots.txt.

## DISAGREEMENTS

1. None.
