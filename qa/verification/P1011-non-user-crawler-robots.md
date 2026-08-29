# P1011 non-user crawler robots block

Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Date: 2026-08-30

## Scope

No scoring, export, rescore, subset run, ingest, network build, public-data write, deployment, dependency install, or locked weight change was run.

## Change

Broadened `web/app/robots.ts` crawler disallow list from the three existing training crawlers to common non-user AI/SEO crawlers. This is a polite-crawler request reduction for Vercel Hobby Edge Requests. It is not hard access control; crawlers that ignore robots.txt can still request the site. Immediate hard reduction still requires owner action in Vercel, such as deploying current main, pausing/protecting the project, or applying firewall controls.

## Command Output

```text
Prawn-E14
C:\sgSHIOK2026
4fa553da2672a75859d1053013d4a09f5f27c754
```

```text
manifest.json PRESENT 13626
manifest.json.gz PRESENT 3281
scores/index.json PRESENT 1751005
scores/index.json.gz PRESENT 308035
scores/prefix-index.json PRESENT 39674
scores/prefix-index.json.gz ABSENT
geom/index.json PRESENT 86724
geom/index.json.gz PRESENT 11303
geom/postal-index.json PRESENT 3538342
geom/postal-index.json.gz PRESENT 347381
```

## FINDINGS

1. The active bundle's gzip-probe paths are not the obvious source of avoidable 404 Edge Requests: every path in `hasCompressedArtifact()` has a matching `.gz` artifact in the active bundle, and `scores/prefix-index.json` is not probed as gzip.
2. The repository can still reduce polite crawler pressure by blocking additional non-user crawlers in `robots.txt`, but this only affects clients that respect robots rules.
3. The practical free-tier answer remains: committed request reducers do not affect live traffic until current `main` is manually deployed, because automatic Git deployments are disabled.

## DISAGREEMENTS

1. None.
