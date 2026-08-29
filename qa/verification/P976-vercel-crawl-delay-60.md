# P976 Vercel Crawl Delay 60

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
d9f9a621602e5fb3687b1673430af07862d6f49f
d9f9a621602e5fb3687b1673430af07862d6f49f	refs/heads/main
```

## Change

Raised the polite crawler delay in `robots.ts` from 10 seconds to 60 seconds. The app is a single-page public tool with `/api/`, `/data/`, `/_next/`, and query variants already disallowed, so a longer crawl delay is an appropriate free-tier throttle while Edge Requests are quota-bound.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  21 passed (21)
   Start at  21:19:23
   Duration  924ms (transform 147ms, setup 0ms, import 188ms, tests 72ms, environment 0ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
exit_code=1
```

## FINDINGS

1. The site already asks polite crawlers not to crawl API, data, Next asset, or query-variant URLs, but the crawl delay was still only 10 seconds.
2. Raising the delay to 60 seconds is a low-risk request throttle for crawlers that honor `Crawl-delay`; it does not affect normal browser navigation and is not hard access control.

## DISAGREEMENTS

1. None.
