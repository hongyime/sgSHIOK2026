# P1006 Vercel Live Deployment Gap

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

### git rev-parse HEAD; git ls-remote origin refs/heads/main

```text
fa893cbebe90ff53cc090e19e5216f4c6507a833
fa893cbebe90ff53cc090e19e5216f4c6507a833	refs/heads/main
```

### web/vercel.json

```text
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": {
    "deploymentEnabled": false
  },
  "ignoreCommand": "node scripts/ignore-build.mjs"
}
```

### git log --oneline -- web/vercel.json

```text
0e44821 chore: disable automatic Vercel git deployments
21f871d chore: skip vercel builds for docs-only commits
```

### Live header check

```text
robots_status=200
robots_cache_control=public, must-revalidate, max-age=0
robots_body_begin
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /data/


robots_body_end
root_status=200
root_cache_control=public, must-revalidate, max-age=0
```

## Vercel Connector Output

### Runtime logs, production, 24h, grouped by requestPath

```text
## Runtime Log Counts

**Project:** prj_y6GIQUdEyXXmtg3UTWkcJECKHdEE
**Grouped by:** requestPath

| requestPath | count |
|---|---|
| / | 1 |
```

### Runtime logs, production static source, 24h, grouped by requestPath

```text
## Runtime Log Counts

**Project:** prj_y6GIQUdEyXXmtg3UTWkcJECKHdEE
**Grouped by:** requestPath

| requestPath | count |
|---|---|
| / | 1 |
```

### Runtime logs, production serverless/edge sources, 24h, grouped by requestPath

```text
## Runtime Log Counts

**Project:** prj_y6GIQUdEyXXmtg3UTWkcJECKHdEE
**Grouped by:** requestPath

| requestPath | count |
|---|---|
```

### Latest listed production deployment

```text
id: dpl_D9yuEBCYuK2Z54j2b6JCUyaGj2mn
state: READY
target: production
githubCommitSha: 0405ec9fca8a78c0c8115bf7bf11106426cd78ae
githubCommitMessage: fix: keep crawlers off data and API payloads
```

## FINDINGS

1. `origin/main` is `fa893cb`, but the latest listed Vercel production deployment is still commit `0405ec9`. The Vercel site has not picked up the later request-reduction commits.
2. Live `/robots.txt` still lacks the committed sitemap, `/_next/` disallow, query-variant disallow, 300-second crawl delay, and training-crawler blocklist.
3. Live `/` and `/robots.txt` still send `Cache-Control: public, must-revalidate, max-age=0`, so the committed app-shell and robots caching changes are not currently reducing live Edge Requests.
4. Runtime logs exposed through the connector do not explain a 100% Edge Request dashboard reading: the 24-hour grouped sample only shows `/` with count 1 and no serverless/edge request paths.

## DISAGREEMENTS

1. More code-side quota work is now lower leverage than making the already-committed quota fixes live. The repository has several request-reduction commits that cannot affect production until the owner performs an explicit Vercel deployment.
