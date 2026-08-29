# P951 Vercel robots cache

## Working Root

```text
PS C:\sgSHIOK2026> Get-Location; hostname

Prawn-E14
Path
----
C:\sgSHIOK2026
```

## Change

`/robots.txt` now receives:

```text
Cache-Control: public, max-age=86400, stale-while-revalidate=604800
```

This keeps crawler controls intact while avoiding needless browser/crawler revalidation of the same small policy file on every visit.

## Test Output

```text
PS C:\sgSHIOK2026> npm --prefix web test -- deployment --runInBand
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  19:23:59
   Duration  934ms (transform 168ms, setup 0ms, import 214ms, tests 49ms, environment 0ms)
```

```text
PS C:\sgSHIOK2026> npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/data.test.ts (5 tests | 1 failed) 43098ms
     × geometry postal prefix shards match the full postal index 38624ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  lib/__tests__/data.test.ts > generated data bundle > geometry postal prefix shards match the full postal index
Error: Test timed out in 15000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ lib/__tests__/data.test.ts:95:3
     93|   });
     94|
     95|   it("geometry postal prefix shards match the full postal index", () =…
       |   ^
     96|     const geomPostalIndex = readJson<Record<string, string>>("geom/pos…
     97|     const expectedPrefixIndex: Record<string, Record<string, string>> …


⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

 Test Files  1 failed | 24 passed (25)
      Tests  1 failed | 185 passed (186)
   Start at  19:24:21
   Duration  126.34s (transform 10.90s, setup 0ms, import 15.83s, tests 66.00s, environment 26ms)
```

```text
PS C:\sgSHIOK2026> npm --prefix web test -- data --runInBand
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs data --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  4 passed (4)
      Tests  14 passed (14)
   Start at  19:26:45
   Duration  11.84s (transform 512ms, setup 0ms, import 873ms, tests 6.79s, environment 4ms)
```

```text
PS C:\sgSHIOK2026> npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  25 passed (25)
      Tests  186 passed (186)
   Start at  19:28:02
   Duration  60.11s (transform 4.26s, setup 0ms, import 7.20s, tests 24.75s, environment 15ms)
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

1. `robots.txt` existed and disallowed `/api/` and `/data/`, but without an explicit long-lived cache header it could still be revalidated frequently by crawlers.
2. The first full web-suite run hit the existing generated-data prefix-shard timeout in `web/lib/__tests__/data.test.ts`; the targeted rerun passed and the second full web-suite run passed. No product code was changed to mask that flake.
3. This is not live until the owner performs an explicit Vercel deployment. Automatic Git deployments remain disabled.

## DISAGREEMENTS

1. None.
