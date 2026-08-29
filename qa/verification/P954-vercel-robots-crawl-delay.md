# P954 Vercel robots crawl delay

## Working Root

```text
PS C:\sgSHIOK2026> Get-Location; hostname

Prawn-E14
Path
----
C:\sgSHIOK2026
```

## Change

`web/app/robots.ts` now adds:

```text
crawlDelay: 10
```

The root remains crawlable, while `/api/` and `/data/` remain disallowed. This is a polite-crawler throttle, not a hard access-control mechanism.

## Support Check

```text
PS C:\sgSHIOK2026> rg -n "crawlDelay|Robots" C:\sgSHIOK2026\web\node_modules\next\dist C:\sgSHIOK2026\web\node_modules\next\types C:\sgSHIOK2026\web\node_modules\next -g "*.d.ts"
C:\sgSHIOK2026\web\node_modules\next\dist\lib\metadata\types\metadata-interface.d.ts:550:    crawlDelay?: number | undefined;
```

## Test Output

```text
PS C:\sgSHIOK2026> npm --prefix web test -- deployment --runInBand
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  19:45:27
   Duration  1.04s (transform 169ms, setup 0ms, import 213ms, tests 43ms, environment 0ms)
```

```text
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

```text
PS C:\sgSHIOK2026> git diff -- pipeline/config/weights.yaml
```

## FINDINGS

1. `MetadataRoute.Robots` supports `crawlDelay`, so the crawler throttle can live in the same generated robots policy as the existing `/api/` and `/data/` disallows.
2. This can reduce requests only from crawlers that respect `Crawl-delay`; it does not stop abusive traffic and is not a substitute for project pause/firewall controls.
3. This is not live until the owner explicitly deploys current `main`.

## DISAGREEMENTS

1. None.
