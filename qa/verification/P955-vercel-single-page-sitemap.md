# P955 Vercel single-page sitemap

## Working Root

```text
PS C:\sgSHIOK2026> Get-Location; hostname

Prawn-E14
Path
----
C:\sgSHIOK2026
```

## Change

Added `web/app/sitemap.ts` with exactly one URL:

```text
https://sgshiok.vercel.app/
```

`web/app/robots.ts` now points polite crawlers at:

```text
https://sgshiok.vercel.app/sitemap.xml
```

The sitemap contains no `/data/` or `/api/` URLs. This complements the existing robots disallow rules and gives crawlers an explicit crawl surface of the public app shell only.

## Test Output

```text
PS C:\sgSHIOK2026> npm --prefix web test -- deployment --runInBand
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  19:48:39
   Duration  1.87s (transform 269ms, setup 0ms, import 336ms, tests 84ms, environment 2ms)
```

```text
PS C:\sgSHIOK2026> npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  25 passed (25)
      Tests  187 passed (187)
   Start at  19:48:56
   Duration  23.77s (transform 2.85s, setup 0ms, import 5.85s, tests 6.89s, environment 7ms)
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

1. The app had robots controls but no sitemap, so polite crawlers did not have a canonical crawl surface constrained to the public app shell.
2. The new sitemap intentionally lists only `/`; generated data and API paths remain absent and disallowed.
3. This is not live until the owner explicitly deploys current `main`.

## DISAGREEMENTS

1. None.
