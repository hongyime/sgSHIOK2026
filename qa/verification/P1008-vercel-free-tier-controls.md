# P1008 Vercel Free Tier Controls

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

### git check-ignore -v qa/verification/P1008-vercel-free-tier-controls.md

```text
p1008_check_ignore_exit=1
```

## Vercel Documentation Evidence

Documentation search topic:

```text
Hobby plan edge request quota reduce traffic pause project firewall bot protection deployment disabled
```

Relevant read-only excerpts from the Vercel documentation search:

```text
POST https://api.vercel.com/v1/projects/{projectId}/pause

Pause a project by passing its project id in the URL. If the project does not exist, the request will fail with a 400 status code. If successful, the project disables auto-assigning custom production domains and blocks the active Production Deployment.
```

```text
vercel project protection [action] [name]

Show or toggle deployment protection settings for a project. Pass enable or disable as the action; omit both to show current settings.
```

```text
Integrate BotID to Block Bot Requests

Use the checkBotId function in your server-side request handlers to detect and block requests originating from bots, returning a 403 status for denied access.
```

```text
Deny requests via vercel.json

Use the mitigate property within a route to block requests based on specific header conditions.
```

## FINDINGS

1. Repository changes can reduce future requests only after the owner manually deploys current `main`; P1006 proved the live site is still on an older deployment and still sends no-cache headers for `/` and `/robots.txt`.
2. If the Vercel quota needs an immediate hard stop, the documented project-level control is pausing the project, which blocks the active Production Deployment. That is an owner-visible availability change and was not executed here.
3. Deployment protection, firewall rules, and BotID are the harder request controls after deployment. They are not equivalent to cache headers: they can change public access behavior and may require plan support or dashboard/API configuration.
4. Code-side bot handling inside Next.js routes can prevent expensive upstream work, but it cannot prevent the initial edge request from reaching Vercel. For the Edge Request counter itself, Vercel-side firewall/protection controls are more direct.

## DISAGREEMENTS

1. I do not recommend treating another repository commit as the immediate fix for a 100% Edge Request counter. The already-pushed cache/crawler reductions need deployment, and hard request suppression is a Vercel project setting decision.
