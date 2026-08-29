# P1019 SEO Data Crawler Robots

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

Robots policy, deployment test, decision entry, and evidence only. No Vercel project mutation, deploy, scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, dependency install, or locked-weight change.

## Command Output

### npm --prefix web test -- deployment.test.ts

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  27 passed (27)
   Start at  01:04:15
   Duration  2.97s (transform 511ms, setup 0ms, import 614ms, tests 230ms, environment 1ms)
```

### python scripts/check_repo_integrity.py

```text
repo_integrity=ok
repo_integrity_exit=0
```

### git diff -- pipeline/config/weights.yaml

```text
weights_diff_exit=0
```

### git check-ignore -v qa/verification/P1019-seo-data-crawler-robots.md

```text
check_ignore_exit=1
```

### git diff --stat

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
 decisions.md                         |  3 +++
 web/app/robots.ts                    |  8 ++++++++
 web/lib/__tests__/deployment.test.ts | 10 ++++++++++
 3 files changed, 21 insertions(+)
```

## FINDINGS

1. The existing non-user crawler blocklist covered major AI crawlers plus Semrush and Ahrefs, but omitted several common SEO/data crawlers that can spend Edge Requests without being ordinary user search discovery.
2. The blocklist now adds MJ12bot, DotBot, BLEXBot, PetalBot, Barkrowler, DataForSeoBot, MauiBot, and serpstatbot while tests pin that Googlebot and Bingbot remain absent from the blocklist.
3. This is a polite-crawler request-reduction measure only. It does not hard-block Vercel traffic and is not live until the owner deploys current main.

## DISAGREEMENTS

1. None.
