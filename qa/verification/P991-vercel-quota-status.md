# P991 Vercel Quota Status

## Working Root

```text
Prawn-E14
C:\sgSHIOK2026
```

## Scope

```text
Read-only Vercel project status and narrow grouped runtime-log check after Edge Requests hit 100%.
No scoring, export, rescore, subset run, ingest, network build, deployment, dependency install, protected payload mutation, Vercel project mutation, or weights.yaml change was performed.
```

## Project Status

```json
{
  "id": "prj_y6GIQUdEyXXmtg3UTWkcJECKHdEE",
  "name": "sgshiok",
  "framework": "nextjs",
  "accountId": "team_ARK7HKobyCMp0PCArQTLxbz6",
  "createdAt": 1785037769440,
  "updatedAt": 1788000403294,
  "nodeVersion": "24.x",
  "live": false,
  "latestDeployment": {
    "id": "dpl_D9yuEBCYuK2Z54j2b6JCUyaGj2mn",
    "url": "sgshiok-mw82e61zu-theprawnvercel.vercel.app",
    "createdAt": 1787999758240,
    "readyState": "READY",
    "target": "production"
  },
  "domains": [
    "sgshiok.hong-yi.me",
    "sgshiok.vercel.app",
    "sgshiok-theprawnvercel.vercel.app",
    "sgshiok-git-main-theprawnvercel.vercel.app"
  ]
}
```

## Runtime Log Sample

```text
## Runtime Log Counts

**Project:** prj_y6GIQUdEyXXmtg3UTWkcJECKHdEE
**Grouped by:** requestPath

| requestPath | count |
|---|---|
| / | 5 |
```

## FINDINGS

1. The Vercel project metadata reports `live: false` while the latest production deployment is `READY`. That suggests the owner should confirm the current production exposure in the Vercel dashboard before spending more code time on request shaving.
2. The narrow six-hour grouped static runtime sample only surfaced `/` with count 5, so runtime logs are not sufficient evidence for the dashboard Edge Request total.
3. The strongest code-side quota lever is now deployment of current `main`, because many committed request reductions are explicitly not live while Git-triggered deployment remains disabled.
4. If Edge Requests are still at 100% after deploying current `main`, the remaining immediate controls are owner-level: pause the project, add Vercel firewall/deployment protection, or intentionally disallow all crawling. Each changes public availability or discoverability.

## DISAGREEMENTS

1. I did not deploy or change Vercel settings. The standing project rule says publishing and production access changes are owner decisions.
2. I did not keep broadening code changes without measured evidence. The last safe app-level duplicate-request reducers have already landed, and further browser behavior changes are now likely to trade against user experience or discoverability.
