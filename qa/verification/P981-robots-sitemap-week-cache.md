# P981 Robots Sitemap Week Cache

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
b9ff7bfe7ae7640685039c4d4bfe03eb3adb5f0f
b9ff7bfe7ae7640685039c4d4bfe03eb3adb5f0f	refs/heads/main
```

## Change

`robots.txt` and `sitemap.xml` now receive a one-week browser cache with a one-month stale-while-revalidate window. The app has one canonical page, a single-page sitemap, and manual deployments, so these crawler metadata files should not need daily browser revalidation while Edge Requests are quota-bound.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  21 passed (21)
   Start at  21:37:42
   Duration  1.02s (transform 153ms, setup 0ms, import 194ms, tests 88ms, environment 0ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
exit_code=1
```

## FINDINGS

1. `robots.txt` and `sitemap.xml` already had cache headers, but the browser `max-age` was still only one day.
2. A one-week browser cache reduces repeated crawler metadata requests without changing crawler disallow rules, sitemap contents, app behavior, or data artifacts.

## DISAGREEMENTS

1. None.
