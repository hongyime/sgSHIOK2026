# P944 Vercel Crawler Controls

## Working Root And Host

```text
pwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Goal

Reduce avoidable crawler-driven Vercel Edge/CDN requests without scoring, exporting, rescoring, ingesting, rebuilding inputs, deploying, or mutating protected data.

## Existing Crawler Controls Search

```text
C:\sgSHIOK2026\web\app\page.tsx:2169:  // Pre-fetch transit POIs and manifest on initial mount so metadata/date is immediately visible.
C:\sgSHIOK2026\web\app\layout.tsx:4:const metadataTitle = "S.H.I.O.K. Shelter Map";
C:\sgSHIOK2026\web\app\layout.tsx:5:const metadataDescription =
C:\sgSHIOK2026\web\app\layout.tsx:8:export const metadata = {
C:\sgSHIOK2026\web\app\layout.tsx:9:  title: metadataTitle,
C:\sgSHIOK2026\web\app\layout.tsx:10:  description: metadataDescription,
C:\sgSHIOK2026\web\app\layout.tsx:12:    title: metadataTitle,
C:\sgSHIOK2026\web\app\layout.tsx:13:    description: metadataDescription,
C:\sgSHIOK2026\web\app\layout.tsx:20:    title: metadataTitle,
C:\sgSHIOK2026\web\app\layout.tsx:21:    description: metadataDescription,
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:244:    expect(layoutSource).toContain('const metadataTitle = "S.H.I.O.K. Shelter Map";');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:245:    expect(layoutSource).toContain("const metadataDescription =");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:425:    expect(source).not.toContain("21 Aug 2026 metadata-only DataMall check");
```

## Focused Deployment Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  12 passed (12)
   Start at  18:33:47
   Duration  1.20s (transform 202ms, setup 0ms, import 261ms, tests 59ms, environment 0ms)
```

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  180 passed (180)
   Start at  18:34:06
   Duration  27.64s (transform 1.89s, setup 0ms, import 3.72s, tests 7.65s, environment 10ms)
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

1. The app had indexable metadata but no crawler policy for the heavy static data bundle or API endpoints.
2. `robots.txt` now allows the app root while disallowing `/api/` and `/data/`.
3. `/data/:path*` and `/api/:path*` now send `X-Robots-Tag: noindex, nofollow, noarchive` so direct crawler fetches get a payload-level indexing signal.
4. This is advisory crawler control and not an access-control mechanism; non-compliant clients can still request these paths.
5. No scoring, export, rescore, subset run, ingest, network build, dependency install, deploy, protected payload write, or locked-weight change was performed for this change.

## DISAGREEMENTS

1. Crawler controls are worth shipping, but they are not a substitute for traffic measurement in Vercel after deployment.
