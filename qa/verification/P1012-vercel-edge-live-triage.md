# P1012 Vercel Edge Request live triage

Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Date: 2026-08-30

## Scope

Read-only Vercel connector checks only. No deployment, project-setting mutation, scoring, export, rescore, subset run, ingest, network build, public-data write, dependency install, or locked weight change was run.

## Command Output

```text
Prawn-E14
C:\sgSHIOK2026
23fa7fc3a12e25e210b0a4d76aa381e492bd8b0d
23fa7fc3a12e25e210b0a4d76aa381e492bd8b0d	refs/heads/main
```

```text
Runtime logs, 24h, grouped by requestPath:
/ 3

Runtime logs, 24h, grouped by statusCode:
200 2
416 1

Runtime logs, 24h, grouped by source:
cache 3
```

```text
Latest listed production deployment:
id dpl_D9yuEBCYuK2Z54j2b6JCUyaGj2mn
state READY
target production
githubCommitSha 0405ec9fca8a78c0c8115bf7bf11106426cd78ae
githubCommitMessage fix: keep crawlers off data and API payloads
```

## FINDINGS

1. Vercel runtime logs exposed through the connector do not explain the Hobby Edge Request dashboard reaching 100%: the 24-hour grouped sample only reported three cached `/` requests.
2. Production is still listed on commit `0405ec9fca8a78c0c8115bf7bf11106426cd78ae`, while repository `main` is `23fa7fc3a12e25e210b0a4d76aa381e492bd8b0d`; the request-reduction commits after `0405ec9` are therefore not live in that production deployment.
3. The fastest real reduction remains operational: deploy current `main` or use Vercel project controls such as pause/protection/firewall. More repository-only crawler/cache changes can only help after deployment and cannot stop clients that ignore robots.txt.

## DISAGREEMENTS

1. None.
