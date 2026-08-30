# P1046 Compressed Vercel Staging

Date: 2026-08-30
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

No scoring, export, rescore, subset run, ingest, network build, input rebuild, protected payload mutation, or `pipeline/config/weights.yaml` edit was performed.

## Problem

The first production deploy attempt after P1045 was interrupted because the staged Vercel source was too large.

```text
Mode  Length Name
----  ------ ----
d----        .vercel
d----        web
-a--- 333    .vercelignore
files=4925
bytes=5637244615
dir=.vercel files=2 bytes=632
dir=web files=4922 bytes=5637243650
```

The active selected bundle was the source of the size:

```text
dir=geom files=3980 bytes=4215721577
dir=scores files=307 bytes=1415806659
dir=transit files=559 bytes=4747107
```

## Change

`pipeline.publish.prepare_vercel_source()` now builds the temporary Vercel source with gzip-only deploy copies for large JSON artifact classes under `scores/`, `geom/`, and `transit/`. The source bundle under `web/public/data/` is not rewritten.

`web/lib/data.ts` now tries compressed score, geometry, and transit artifacts first, while retaining fallback to uncompressed JSON for older bundles.

## Staging Measurement

```text
stage=C:\sgSHIOK2026\tmp\vercel_source_generated_20260805_prefer_scored_routed_20260830_114001
elapsed_seconds=104.091
files=4922
bytes=430315171
dir=.vercel files=2 bytes=632
file=.vercelignore bytes=333
dir=web files=4919 bytes=430314206
```

Size reduction arithmetic:

```text
5637244615 - 430315171 = 5206929444 bytes reduced
430315171 / 5637244615 = 0.0763, so the staged source is about 7.6% of the prior size
```

## Tests

```text
.....                                                                    [100%]
5 passed in 31.87s
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs data-fetch-policy.test.ts deployment.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  35 passed (35)
   Start at  19:39:34
   Duration  3.18s (transform 498ms, setup 0ms, import 517ms, tests 407ms, environment 1ms)
```

## FINDINGS

1. The supported production deploy wrapper was still staging 5.64 GB because the selected active data bundle contains large uncompressed score and geometry JSON shards.
2. The Vercel CLI looked hung because it was processing/uploading that oversized archive before `--no-wait` could return a deployment URL.
3. Deploy staging can be reduced to 430.3 MB without mutating the protected local bundle by generating compressed copies only under `tmp/`.

## DISAGREEMENTS

1. I do not think we should rely on GitHub auto-deploy for this project right now. The deploy needs the local protected data bundle, and `web/vercel.json` intentionally disables automatic Git deployments to prevent surprise quota spend.
