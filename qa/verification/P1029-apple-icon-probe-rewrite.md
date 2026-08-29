# P1029 Apple icon probe rewrite

## Guard

```text
Prawn-E14
C:\sgSHIOK2026
ad2b6e08cb83528f2cd2da46cf6b06b57feeb724
ad2b6e08cb83528f2cd2da46cf6b06b57feeb724	refs/heads/main
```

## Change

```text
/apple-touch-icon.png now rewrites to /icon.svg.
/apple-touch-icon-precomposed.png now rewrites to /icon.svg.
Both probe paths receive Cache-Control: public, max-age=31536000, immutable.
This avoids uncached 404s for common browser icon probes without adding a web manifest link or changing data payloads.
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  28 passed (28)
   Start at  01:58:12
   Duration  2.77s (transform 465ms, setup 0ms, import 567ms, tests 174ms, environment 1ms)
```

## Repo Integrity

```text
repo_integrity=ok
repo_integrity_exit=0
```

## Locked Weights Check

```text
weights_diff_exit=0
```

## FINDINGS

1. Conventional Apple touch icon probe paths had no local asset or rewrite while `/icon.svg` already exists and is immutable-cacheable.
2. Rewriting the probes avoids repeat uncached 404 behavior after deployment, but it remains source-side only until the owner deploys current `main`.

## DISAGREEMENTS

1. None.
