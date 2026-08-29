# P986 Pinned First Load Metadata

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
0baedf188b8436315f4801ac8ff5dcff084c6899
0baedf188b8436315f4801ac8ff5dcff084c6899	refs/heads/main
```

```text
{
  "bundle": "generated_20260805_prefer_scored_routed"
}
```

```text
{
  "data_as_of": "2026-08-01T21:49:20.977890+00:00",
  "generated_at": "2026-08-05T14:00:15.974693+00:00",
  "geom": {
```

## Change

The active bundle metadata needed on first paint now lives in tracked `web/data-bundle.json`: `generated_at`, `data_as_of`, `record_count`, and `state_counts`. The page initializes from that pinned metadata and no longer fetches `manifest.json.gz` on mount just to render the data-as-of and locked-score coverage lines.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs data-base data-fetch-policy route-evidence-map-interaction typescript-contract

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  4 passed (4)
      Tests  21 passed (21)
   Start at  22:05:46
   Duration  6.84s (transform 812ms, setup 0ms, import 701ms, tests 2.97s, environment 2ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
weights_diff_exit=0
```

## FINDINGS

1. A cold visit to `/` still fetched static `manifest.json.gz` on mount solely to display bundle dates and locked-score coverage.
2. The needed first-paint metadata is tiny and stable for the pinned active bundle, so keeping it in tracked `web/data-bundle.json` saves one static Edge request per cold app load.
3. The alignment test caught that PowerShell `ConvertFrom-Json` normalized the manifest timestamps to Singapore time; the committed metadata uses the raw UTC strings from `manifest.json`.

## DISAGREEMENTS

1. None.
