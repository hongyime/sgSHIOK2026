# P841 Browser Freshness User Copy

Date: 2026-08-29
Working root: `C:\sgSHIOK2026`
Machine: `PRAWN-E14`

## Scope

Free-tier browser copy/test/evidence work only. No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected-payload mutation, or locked-weight change was performed.

## Search Evidence

Command:

```text
git grep -n "zero-mutation source-age check before release work\|Use the zero-mutation source-age check before release work" -- web README.md ':!qa/verification/*'
```

Output:

```text
web/lib/__tests__/accessibility-render.test.tsx:232:    expect(html).not.toContain("zero-mutation source-age check before release work");
web/lib/__tests__/score-card-copy.test.ts:326:    expect(source).not.toContain("zero-mutation source-age check before release work");
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
   Start at  10:35:34
   Duration  5.55s (transform 1.97s, setup 0ms, import 2.35s, tests 1.43s, environment 1ms)
```

## FINDINGS

1. P840 correctly stopped the browser from claiming dated freshness as live, but its replacement sentence used internal operator language in the product UI.
2. The browser copy now says freshness may have changed since the 28 Aug 2026 snapshot and that refreshes use new versioned inputs rather than changing frozen v1 in place.
3. The internal zero-mutation release-work phrase remains only as a negative assertion in browser tests.

## DISAGREEMENTS

1. None.
