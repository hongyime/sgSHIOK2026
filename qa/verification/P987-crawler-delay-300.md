# P987 Crawler Delay 300

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
c6653b7b6b7a405f7c28b8cdae89c7e3e482002f
c6653b7b6b7a405f7c28b8cdae89c7e3e482002f	refs/heads/main
```

## Change

`robots.txt` now asks polite crawlers to wait 300 seconds between requests instead of 60 seconds. The app remains crawlable at `/`, while `/api/`, `/data/`, `/_next/`, and query variants remain disallowed.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  21 passed (21)
   Start at  22:09:06
   Duration  736ms (transform 121ms, setup 0ms, import 154ms, tests 44ms, environment 0ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
weights_diff_exit=0
```

## FINDINGS

1. sgSHIOK publishes a single-page sitemap, so a 60-second polite crawl delay is still generous during a Vercel Edge-request quota incident.
2. A 300-second crawl delay can reduce request pressure from crawlers that honor `robots.txt` without blocking real users.
3. This is not hard access control; non-compliant crawlers and ordinary user traffic still require Vercel-side controls or deployment of the other cache changes.

## DISAGREEMENTS

1. None.
