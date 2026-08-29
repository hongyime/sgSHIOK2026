# P989 Favicon Rewrite

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
5787383ec82fcffd0fcccf9b34a479d28ad747be
5787383ec82fcffd0fcccf9b34a479d28ad747be	refs/heads/main
```

## Change

Legacy `/favicon.ico` probes now use a Next.js internal rewrite to `/icon.svg` instead of a client-visible permanent redirect. `/favicon.ico` also gets the same immutable one-year cache header as `/icon.svg`.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  21 passed (21)
   Start at  22:14:31
   Duration  747ms (transform 118ms, setup 0ms, import 151ms, tests 39ms, environment 1ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
weights_diff_exit=0
```

## FINDINGS

1. Legacy clients or bots probing `/favicon.ico` previously received a redirect to `/icon.svg`, which can spend two Edge requests for one icon lookup.
2. An internal rewrite preserves the existing SVG icon while avoiding the client-visible second request.
3. Adding immutable cache headers for `/favicon.ico` reduces repeat probes from clients that continue requesting the legacy path.

## DISAGREEMENTS

1. None.
