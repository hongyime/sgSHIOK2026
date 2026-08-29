# P822 Retryable Lamp Manifest

## Startup

```text
C:\sgSHIOK2026
Prawn-E14
a7ada072251b307a7a7264a44b0f9560f03da10c
a7ada072251b307a7a7264a44b0f9560f03da10c	refs/heads/main
```

## Scope

```text
No scoring, export, rescore, subset run, ingest, network build, deploy, public-data write, lamp artifact mutation, or locked-weight change.
```

## Ignore Check

```text
exit=1
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  11 passed (11)
   Start at  08:04:26
   Duration  1.83s (transform 767ms, setup 0ms, import 249ms, tests 707ms, environment 1ms)
```

## Diff Check

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
```

## Protected Diff Guard

```text
```

## Change

```text
Night-lighting map layer manifest fetches now cache valid manifests only. Failed/null manifest reads remain retryable on later overlay updates.
```

## Findings

1. A transient unavailable `web/public/data/lamp_posts_v1/manifest.json` response could previously be cached as `null`, leaving the night-lighting layer unavailable until page reload.
2. The fix changes only client retry behavior; the existing lamp overlay artifact and score bundle are unchanged.
3. The LAI/greenery-proxy audit found no current false UI/docs/readiness claim that Leaf Area Index is consumed or that the greenery proxy is measured temperature.

## Disagreements

1. None.
