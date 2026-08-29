# P952 Vercel route preview session cache

## Working Root

```text
PS C:\sgSHIOK2026> Get-Location; hostname

Prawn-E14
Path
----
C:\sgSHIOK2026
```

## Change

Successful live OneMap walking preview responses are now cached in browser `sessionStorage` using a key built from:

```text
postal
selected stop id
origin latitude/longitude rounded to 6 decimals
stop latitude/longitude rounded to 6 decimals
```

The cache stores only the upstream preview payload (`ok`, `route_geometry`, `total_distance_m`, `total_time_s`). It does not persist derived score objects. Failed or malformed previews are not cached, so transient OneMap/API failures remain retryable.

This reduces repeat `/api/onemap-route` requests when a user reloads or revisits the same shared `?postal=&stop=` route during a browser session.

## Test Output

```text
PS C:\sgSHIOK2026> npm --prefix web test -- route-evidence-map-interaction --runInBand
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs route-evidence-map-interaction --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  11 passed (11)
   Start at  19:36:24
   Duration  3.34s (transform 1.53s, setup 0ms, import 692ms, tests 1.16s, environment 1ms)
```

```text
PS C:\sgSHIOK2026> npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  25 passed (25)
      Tests  186 passed (186)
   Start at  19:36:54
   Duration  112.34s (transform 5.56s, setup 0ms, import 10.97s, tests 37.50s, environment 54ms)
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

1. OneMap search submissions were already explicit and session-cached; direct 6-digit postal searches already avoid OneMap search.
2. Live route previews were cached only in React state before P952. Reloading or revisiting the same shared `?postal=&stop=` URL in the same browser session could call `/api/onemap-route` again.
3. Session-scoped route-preview caching is a request-count reduction, not a data or score change. It is not live until the owner explicitly deploys.

## DISAGREEMENTS

1. None.
