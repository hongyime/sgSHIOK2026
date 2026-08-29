# P950 Vercel gzip probe reduction

## Working Root

```text
PS C:\sgSHIOK2026> Get-Location; hostname

Prawn-E14
Path
----
C:\sgSHIOK2026
```

## Vercel Request Accounting

Vercel documentation reviewed on 2026-08-29:
- https://vercel.com/docs/manage-cdn-usage says static assets and functions incur CDN Requests, shown as Edge Requests in billing and usage charts.
- https://vercel.com/docs/pricing/manage-and-optimize-usage says Edge Requests include cached and uncached requests received by deployments.

Decision: cache headers still matter for function/origin load, but reducing Edge Request count requires reducing how many URLs the browser asks Vercel for.

## Bundle Compression Shape

```text
PS C:\sgSHIOK2026> $root='C:\sgSHIOK2026\web\public\data\generated_20260805_prefer_scored_routed'; if (Test-Path -LiteralPath $root) { $json = Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.json' | Where-Object { $_.Name -notlike '*.json.gz' }; $missing = @(); foreach ($f in $json) { if (-not (Test-Path -LiteralPath ($f.FullName + '.gz'))) { $missing += $f.FullName.Substring($root.Length+1) } }; 'json_count=' + $json.Count; 'missing_gz_count=' + $missing.Count; $missing | Select-Object -First 80 } else { 'missing local bundle root' }
json_count=3763
missing_gz_count=3759
geom\h3\886520c121fffff.json
geom\h3\886520c123fffff.json
geom\h3\886520c125fffff.json
geom\h3\886520c127fffff.json
geom\h3\886520c129fffff.json
geom\h3\886520c12bfffff.json
geom\h3\886520c12dfffff.json
geom\h3\886520c131fffff.json
geom\h3\886520c133fffff.json
geom\h3\886520c135fffff.json
geom\h3\886520c137fffff.json
geom\h3\886520c13bfffff.json
geom\h3\886520c13dfffff.json
geom\h3\886520c181fffff.json
geom\h3\886520c183fffff.json
geom\h3\886520c185fffff.json
geom\h3\886520c187fffff.json
geom\h3\886520c189fffff.json
geom\h3\886520c18bfffff.json
geom\h3\886520c18dfffff.json
geom\h3\886520c1a1fffff.json
geom\h3\886520c1a3fffff.json
geom\h3\886520c1a5fffff.json
geom\h3\886520c1a7fffff.json
geom\h3\886520c1a9fffff.json
geom\h3\886520c1abfffff.json
geom\h3\886520c1adfffff.json
geom\h3\886520c1bdfffff.json
geom\h3\886520c1c3fffff.json
geom\h3\886520c1c7fffff.json
geom\h3\886520c1d1fffff.json
geom\h3\886520c1d5fffff.json
geom\h3\886520c1d7fffff.json
geom\h3\886520c1e3fffff.json
geom\h3\886520c1e5fffff.json
geom\h3\886520c1e7fffff.json
geom\h3\886520c1ebfffff.json
geom\h3\886520c827fffff.json
geom\h3\886520c841fffff.json
geom\h3\886520c843fffff.json
geom\h3\886520c849fffff.json
geom\h3\886520c84dfffff.json
geom\h3\886520c851fffff.json
geom\h3\886520c853fffff.json
geom\h3\886520c857fffff.json
geom\h3\886520c85bfffff.json
geom\h3\886520c85dfffff.json
geom\h3\886520c901fffff.json
geom\h3\886520c903fffff.json
geom\h3\886520c909fffff.json
geom\h3\886520c90bfffff.json
geom\h3\886520c90dfffff.json
geom\h3\886520c913fffff.json
geom\h3\886520c917fffff.json
geom\h3\886520c91bfffff.json
geom\h3\886520c91dfffff.json
geom\h3\886520c941fffff.json
geom\h3\886520c943fffff.json
geom\h3\886520c945fffff.json
geom\h3\886520c947fffff.json
geom\h3\886520c949fffff.json
geom\h3\886520c94bfffff.json
geom\h3\886520c94dfffff.json
geom\h3\886520c96dfffff.json
geom\h3\886520c9cdfffff.json
geom\h3\886520ca01fffff.json
geom\h3\886520ca05fffff.json
geom\h3\886520ca07fffff.json
geom\h3\886520ca09fffff.json
geom\h3\886520ca0bfffff.json
geom\h3\886520ca0dfffff.json
geom\h3\886520ca11fffff.json
geom\h3\886520ca15fffff.json
geom\h3\886520ca19fffff.json
geom\h3\886520ca1bfffff.json
geom\h3\886520ca1dfffff.json
geom\h3\886520ca23fffff.json
geom\h3\886520ca25fffff.json
geom\h3\886520ca29fffff.json
geom\h3\886520ca2bfffff.json
```

```text
PS C:\sgSHIOK2026> $root='C:\sgSHIOK2026\web\public\data\generated_20260805_prefer_scored_routed'; Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.gz' | ForEach-Object { $_.FullName.Substring($root.Length+1) -replace '\\[^\\]+$','\\*' } | Group-Object | Sort-Object Name | Select-Object Count,Name | Format-Table -AutoSize

Count Name
----- ----
    2 geom\\*
  523 geom\postal-prefix\\*
    1 manifest.json.gz
    1 scores\\*
  558 transit\h3\\*
```

```text
PS C:\sgSHIOK2026> $root='C:\sgSHIOK2026\web\public\data\generated_20260805_prefer_scored_routed'; Get-ChildItem -LiteralPath (Join-Path $root 'scores') -Recurse -File -Filter '*.gz' | ForEach-Object { $_.FullName.Substring($root.Length+1) } | Select-Object -First 30; Get-ChildItem -LiteralPath (Join-Path $root 'scores') -File -Filter '*.json' | Measure-Object | ForEach-Object { 'score_json_root_count=' + $_.Count }
scores\index.json.gz
score_json_root_count=306
```

## Change

`web/lib/data.ts` now tries `.json.gz` only for artifact classes that the active bundle actually compresses:
- `manifest.json`
- `scores/index.json`
- `geom/index.json`
- `geom/postal-index.json`
- `geom/postal-prefix/*.json`
- `transit/h3/*.json`

It fetches uncompressed score shards, `scores/prefix-index.json`, `geom/h3/*.json`, and `transit/pois.json` directly. This removes failed `.gz` probes from common search/score/geometry paths.

## Test Output

```text
PS C:\sgSHIOK2026> npm --prefix web test -- data-fetch-policy transit-shards --runInBand
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs data-fetch-policy transit-shards --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  5 passed (5)
   Start at  19:15:52
   Duration  1.83s (transform 246ms, setup 0ms, import 258ms, tests 192ms, environment 1ms)
```

```text
PS C:\sgSHIOK2026> npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  25 passed (25)
      Tests  185 passed (185)
   Start at  19:16:13
   Duration  46.45s (transform 2.55s, setup 0ms, import 5.44s, tests 11.04s, environment 17ms)
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

1. Edge Requests cannot be solved by CDN cache headers alone because Vercel counts cached and uncached deployment requests; request count per visit has to come down.
2. The active bundle has 3,763 `.json` artifacts and only 1,085 `.gz` siblings. The old loader speculatively requested `.json.gz` first for every artifact, so most uncompressed artifacts incurred one failed extra request.
3. The highest-value saved probes are score shards and geometry H3 route shards. A normal successful postal lookup can now avoid failed gzip probes for `scores/prefix-index.json`, the selected score shard, and the selected geometry H3 shard.
4. This is not live until the owner performs an explicit Vercel deployment. Automatic Git deployments remain disabled.

## DISAGREEMENTS

1. None.
