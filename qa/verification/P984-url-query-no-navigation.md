# P984 URL Query No Navigation

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
009ce40dfc595430fc5d4fdf451be89d80fc1905
009ce40dfc595430fc5d4fdf451be89d80fc1905	refs/heads/main
```

## Change

Postal and stop share-link URL updates now use `window.history.replaceState()` instead of `router.replace()`. The app still mirrors `?postal=` and `?stop=`, but it no longer asks Next.js to navigate just to update same-page query parameters.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs route-evidence-map-interaction typescript-contract

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  12 passed (12)
   Start at  21:54:03
   Duration  12.07s (transform 1.03s, setup 0ms, import 519ms, tests 8.54s, environment 2ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
weights_diff_exit=0
```

## FINDINGS

1. Same-page share-link URL updates used Next.js `router.replace()`, even though the page is already client-rendered and only needs browser history state updated.
2. Replacing `router.replace()` with `window.history.replaceState()` avoids potential same-page App Router navigation/RSC traffic when a user loads a postal or changes the selected stop.
3. The change preserves the visible URL and share-link behavior while reducing one class of avoidable Vercel request pressure after deployment.

## DISAGREEMENTS

1. None.
