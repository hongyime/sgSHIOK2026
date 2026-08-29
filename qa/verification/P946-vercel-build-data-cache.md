# P946 Vercel Build Data Cache

## Working Root And Host

```text
pwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Goal

Reduce Vercel Edge/CDN request pressure caused by Vercel builds downloading the live data bundle from production.

## Live Header Check Before This Change

```text
URL=https://sgshiok.vercel.app/robots.txt
error=Response status code does not indicate success: 404 (Not Found).
status=404
URL=https://sgshiok.vercel.app/data/generated_20260805_prefer_scored_routed/manifest.json
status=200
cache-control=public, max-age=31536000, immutable
x-robots-tag=
x-vercel-cache=MISS
server=Vercel
URL=https://sgshiok.vercel.app/api/onemap-search?searchVal=560231
status=200
cache-control=public, must-revalidate, max-age=0
x-robots-tag=
x-vercel-cache=MISS
server=Vercel
```

## Vercel Project

```text
{
  "teams": [
    {
      "name": "The Prawn Vercel",
      "slug": "theprawnvercel",
      "id": "team_ARK7HKobyCMp0PCArQTLxbz6",
      "saml": {},
      "plan": "hobby"
    }
  ]
}
```

## Vercel Build Log Finding

```text
10:35:59  Running build in Washington, D.C., USA (East) - iad1
10:35:59  Build machine configuration: 2 cores, 8 GB
10:35:59  Cloning github.com/hongyime/sgSHIOK2026 (Branch: main, Commit: 0405ec9)
10:36:01  Cloning completed: 2.643s
10:36:02  Found .vercelignore
10:36:02  Removed 0 ignored files defined in .vercelignore
10:36:02  Restored build cache from previous deployment (G8jfyM14BbD3Km8BTeMBhz7AnJxQ)
10:36:02  Running "node scripts/ignore-build.mjs"
10:36:02  Vercel build required: commit touches web project files.
10:36:02  Running "vercel build"
10:36:02  Vercel CLI 59.3.0
10:36:02  Running "install" command: `npm ci`...
10:36:11  added 92 packages, and audited 93 packages in 9s
10:36:11  23 packages are looking for funding
10:36:11    run `npm fund` for details
10:36:11  found 0 vulnerabilities
10:36:11  Detected Next.js version: 16.3.0
10:36:11  Running "npm run build"
10:36:11  > shiok-web@0.1.0 build
10:36:11  > node scripts/ensure-data-bundle.mjs && next build
10:36:11  local data missing; downloading https://sgshiok.vercel.app/data/generated_20260805_prefer_scored_routed/
10:44:36  downloaded data bundle /vercel/path0/web/public/data/generated_20260805_prefer_scored_routed
10:44:36  ▲ Next.js 16.3.0 (Turbopack)
10:44:37    Applying modifyConfig from Vercel
10:44:37  ✓ Running next.config.js took 103ms
10:44:37    Creating an optimized production build ...
10:44:40  ✓ Compiled successfully in 2.9s
10:44:40    Running TypeScript ...
10:44:41    Finished TypeScript in 652ms ...
10:44:41    Collecting page data using 1 worker ...
10:44:42    Generating static pages using 1 worker (0/7) ...
10:44:42    Generating static pages using 1 worker (1/7)
10:44:42    Generating static pages using 1 worker (3/7)
10:44:42    Generating static pages using 1 worker (5/7)
10:44:42  ✓ Generating static pages using 1 worker (7/7) in 182ms
10:44:42    Finalizing page optimization ...
10:44:42    Running onBuildComplete from Vercel
10:44:42  Route (app)
10:44:42  ┌ ○ /
10:44:42  ├ ○ /_not-found
10:44:42  ├ ƒ /api/onemap-route
10:44:42  ├ ƒ /api/onemap-search
10:44:42  ├ ○ /icon.svg
10:44:42  └ ○ /robots.txt
10:44:42  ○  (Static)   prerendered as static content
10:44:42  ƒ  (Dynamic)  server-rendered on demand
```

## Focused Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment ensure-data-bundle

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  15 passed (15)
   Start at  18:46:39
   Duration  2.50s (transform 253ms, setup 0ms, import 440ms, tests 81ms, environment 1ms)
```

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  181 passed (181)
   Start at  18:47:00
   Duration  28.83s (transform 2.02s, setup 0ms, import 3.88s, tests 8.66s, environment 9ms)
```

## Repository Integrity

```text
repo_integrity=ok
exit_code=0
```

## Locked Weights Diff

```text
```

## Diff Check

```text
```

## FINDINGS

1. Vercel builds were downloading the live generated data bundle from `https://sgshiok.vercel.app/data/generated_20260805_prefer_scored_routed/` because the GitHub checkout does not include the untracked local data bundle.
2. The observed deployment downloaded data from 10:36:11 to 10:44:36, so each cache-missing web deployment can spend about 8 minutes 25 seconds fetching the bundle from production before Next.js build starts.
3. The helper now restores missing deployment data from `.next/cache/shiok-data/<bundle>` before downloading from the live site. If the cache is empty, it downloads once into that build cache and copies from cache into `public/data`.
4. This reduces repeated deployment self-downloads after Vercel has one cached build with the active bundle.
5. No scoring, export, rescore, subset run, ingest, network build, dependency install, deploy, protected payload write, or locked-weight change was performed for this change.

## DISAGREEMENTS

1. The largest avoidable Edge/CDN consumer may have been deployment self-downloads, not end-user page views. Vercel usage should be checked after the next successful cached deployment before assuming traffic was the main driver.
