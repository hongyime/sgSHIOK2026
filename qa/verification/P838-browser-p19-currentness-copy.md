# P838 Browser P19 Currentness Copy

Date: 2026-08-29
Working root: `C:\sgSHIOK2026`
Machine: `PRAWN-E14`

## Scope

Free-tier browser and README copy only. No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected-payload mutation, or locked-weight change was performed.

## Search Evidence

Command:

```text
rg -n "Current for gap sizing until 4 Sep 2026 UTC|The sample is current for|current for gap sizing until" C:\sgSHIOK2026\README.md C:\sgSHIOK2026\web\app C:\sgSHIOK2026\web\lib\__tests__
```

Output:

```text
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:295:    expect(source).not.toContain("Current for gap sizing until 4 Sep 2026 UTC");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:220:    expect(html).not.toContain("Current for gap sizing until 4 Sep 2026 UTC");
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
   Start at  10:21:35
   Duration  13.89s (transform 6.64s, setup 0ms, import 8.50s, tests 1.26s, environment 1ms)
```

Command:

```text
uv run pytest tests/test_readme.py -q
```

Output:

```text
....                                                                     [100%]
4 passed in 3.78s
```

## FINDINGS

1. Browser and README copy still contained an expiring P19 currentness claim after P837 fixed the machine-readable report surfaces.
2. The user-facing copy now says the P19 v2 result is sampled evidence, not a measured full-universe gap or approval to promote v2.
3. README now directs operators to `uv run python run.py p19-gap-status` for live currentness instead of carrying a hardcoded deadline.

## DISAGREEMENTS

1. None.
