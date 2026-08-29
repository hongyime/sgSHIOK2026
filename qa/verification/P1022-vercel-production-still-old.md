# P1022 Vercel Production Still Old

Date: 2026-08-30
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

Read-only Vercel quota triage.
No scoring, export, rescore, subset run, ingest, network build, deployment, dependency install, or protected data mutation.

## Local State

```text
Prawn-E14
C:\sgSHIOK2026
01715cc1c675004f2873226e21e6088966408132
01715cc1c675004f2873226e21e6088966408132	refs/heads/main
```

## Vercel Project Discovery

```text
team name: The Prawn Vercel
team id: team_ARK7HKobyCMp0PCArQTLxbz6
team plan: hobby
project name: sgshiok
project id: prj_y6GIQUdEyXXmtg3UTWkcJECKHdEE
linked repo: hongyime/sgSHIOK2026
```

## Latest Production Deployment

```text
deployment id: dpl_D9yuEBCYuK2Z54j2b6JCUyaGj2mn
deployment url: sgshiok-mw82e61zu-theprawnvercel.vercel.app
deployment state: READY
deployment target: production
githubCommitSha: 0405ec9fca8a78c0c8115bf7bf11106426cd78ae
githubCommitMessage: fix: keep crawlers off data and API payloads
```

## Project Detail

```text
id: prj_y6GIQUdEyXXmtg3UTWkcJECKHdEE
name: sgshiok
framework: nextjs
accountId: team_ARK7HKobyCMp0PCArQTLxbz6
nodeVersion: 24.x
live: false
latestDeployment.id: dpl_D9yuEBCYuK2Z54j2b6JCUyaGj2mn
latestDeployment.readyState: READY
latestDeployment.target: production
domains:
  sgshiok.hong-yi.me
  sgshiok.vercel.app
  sgshiok-theprawnvercel.vercel.app
  sgshiok-git-main-theprawnvercel.vercel.app
```

## Runtime Log Grouping

```text
## Runtime Log Counts

**Project:** prj_y6GIQUdEyXXmtg3UTWkcJECKHdEE
**Grouped by:** requestPath

| requestPath | count |
|---|---|
```

## FINDINGS

1. Production still serves `0405ec9fca8a78c0c8115bf7bf11106426cd78ae`, not current `main` at `01715cc1c675004f2873226e21e6088966408132`, so the accumulated source-side quota reductions are not live.
2. The Vercel runtime-log API exposed no grouped production request paths for the last 24 hours, so it does not explain the dashboard Edge Request burn.
3. The immediate free-tier action remains operational: deploy current `main` if the owner wants committed reductions live, or use Vercel pause/protection/firewall controls if traffic must stop immediately.

## DISAGREEMENTS

1. None.
