# P953 Vercel quota emergency options

## Working Root

```text
PS C:\sgSHIOK2026> Get-Location; hostname

Prawn-E14
Path
----
C:\sgSHIOK2026
```

## Current Remote State

```text
PS C:\sgSHIOK2026> git rev-parse HEAD; git ls-remote --heads origin main; git status --short --untracked-files=no; git log --oneline -6
54195387b75f334d8364423f34f0664154ffe8a0
54195387b75f334d8364423f34f0664154ffe8a0	refs/heads/main
5419538 docs: update state after P952
734e0ec perf: cache live route previews per session
78735ea docs: update state after P951
5f1fcee perf: cache crawler policy response
dd4f287 docs: update state after P950
32dcd34 perf: skip missing gzip probes for web data
```

## Vercel Read-Only Project Check

Vercel connector read on 2026-08-29:

```json
{
  "id": "prj_y6GIQUdEyXXmtg3UTWkcJECKHdEE",
  "name": "sgshiok",
  "framework": "nextjs",
  "accountId": "team_ARK7HKobyCMp0PCArQTLxbz6",
  "latestDeployment": {
    "id": "dpl_D9yuEBCYuK2Z54j2b6JCUyaGj2mn",
    "url": "sgshiok-mw82e61zu-theprawnvercel.vercel.app",
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

Latest production deployment still points at commit `0405ec9fca8a78c0c8115bf7bf11106426cd78ae`, so P945-P952 request reductions are committed but not live.

## Vercel Documentation Findings

Sources reviewed through the Vercel connector:
- https://vercel.com/docs/manage-cdn-usage
- https://vercel.com/docs/pricing/manage-and-optimize-usage
- https://vercel.com/docs/rest-api/projects/pause-a-project
- https://vercel.com/docs/project-configuration/git-configuration
- https://vercel.com/docs/cli/project

Relevant platform controls:

```text
git.deploymentEnabled=false prevents Git pushes from automatically deploying.
Project pause blocks the active Production Deployment and disables auto-assigning custom production domains.
Password protection and SSO protection are deployment-protection controls; password protection requires an eligible plan.
Firewall custom rules can deny traffic, but rule changes are project/platform mutations and should be owner-approved.
```

## Recommendation

Immediate live quota relief without a deployment requires an owner-level Vercel action:

1. **Emergency stop:** pause the project. This should drop live traffic, but it also intentionally takes the app down.
2. **Controlled friction:** enable deployment protection or firewall rules if the plan supports the needed feature. This may reduce unwanted traffic but changes public access semantics.
3. **Preferred product path:** wait for the quota/deployment gate, then explicitly deploy current `main`, which contains P945-P952 request reductions.

No Vercel project mutation, deployment, domain change, firewall change, or protection change was performed in this phase.

## Verification

```text
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

```text
PS C:\sgSHIOK2026> git diff -- pipeline/config/weights.yaml
```

## FINDINGS

1. The strongest immediate way to turn Edge Requests down without deploying new code is to pause the Vercel project, but that blocks the active production deployment and is therefore an owner availability decision.
2. Current `main` has P945-P952 request reductions, but live production still points at `0405ec9`, so those reductions have not affected the dashboard yet.
3. Automatic Git deployments are already disabled, which prevents further accidental build/deployment quota spend from normal pushes.
4. Password/SSO/firewall controls could reduce unwanted traffic, but they change public access behavior or require plan support and should not be mutated by the agent without explicit approval.

## DISAGREEMENTS

1. None.
