# P842 Browser Source-Age Summary

Date: 2026-08-29
Working root: `C:\sgSHIOK2026`
Machine: `PRAWN-E14`

## Scope

Free-tier browser copy/test/evidence work only. No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected-payload mutation, or locked-weight change was performed.

## Search Evidence

Command:

```text
git grep -n "Data freshness: 28 Aug 2026 22:21 UTC\|11 current, 9 stale" -- web README.md ':!qa/verification/*'
```

Output:

```text
web/lib/__tests__/accessibility-render.test.tsx:227:    expect(html).not.toContain("Data freshness: 28 Aug 2026 22:21 UTC");
web/lib/__tests__/score-card-copy.test.ts:311:    expect(source).not.toContain("Data freshness: 28 Aug 2026 22:21 UTC");
```

## Tests

Command:

```text
npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  10:41:41
   Duration  5.27s (transform 2.05s, setup 0ms, import 2.48s, tests 1.26s, environment 1ms)
```

## FINDINGS

1. The browser's dated freshness summary still started with `Data freshness`, which could read as live state even though the body named a manifest-only snapshot.
2. The summary now starts with `Source-age snapshot` and says `11 sources were current`, making the dated nature of the statement explicit.
3. The previous `Data freshness: 28 Aug 2026 22:21 UTC` wording remains only as negative assertions in browser tests.

## DISAGREEMENTS

1. None.
