# P840 Browser Source Freshness Snapshot Copy

Date: 2026-08-29
Working root: `C:\sgSHIOK2026`
Machine: `PRAWN-E14`

## Scope

Free-tier browser and README-adjacent copy/test/evidence work only. No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected-payload mutation, or locked-weight change was performed.

## Search Evidence

Command:

```text
git grep -n "are current but 1.2 days from stale\|51.2 days until stale\|0.0 days until stale" -- README.md web ':!qa/verification/*'
```

Output:

```text
web/lib/__tests__/accessibility-render.test.tsx:231:    expect(html).not.toContain("Bus Stops, Bus Services, and Bus Routes are current but 1.2 days from stale");
web/lib/__tests__/score-card-copy.test.ts:326:    expect(source).not.toContain("Bus Stops, Bus Services, and Bus Routes are current but 1.2 days from stale");
web/lib/__tests__/score-card-copy.test.ts:327:    expect(source).not.toContain("51.2 days until stale");
web/lib/__tests__/score-card-copy.test.ts:329:    expect(source).not.toContain("0.0 days until stale");
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
   Start at  10:32:02
   Duration  6.64s (transform 1.82s, setup 0ms, import 2.36s, tests 1.77s, environment 2ms)
```

Command:

```text
uv run pytest tests/test_readme.py -q
```

Output:

```text
....                                                                     [100%]
4 passed in 1.99s
```

## FINDINGS

1. Browser `Source freshness detail` copy still described the 28 Aug 2026 manifest-only freshness snapshot as if its days-to-stale values were live.
2. The browser now frames those values as facts at the 28 Aug 2026 check and tells operators to use the zero-mutation source-age check for live days-to-stale numbers before release work.
3. The old live-currentness phrases remain only as negative assertions in tests.

## DISAGREEMENTS

1. None.
