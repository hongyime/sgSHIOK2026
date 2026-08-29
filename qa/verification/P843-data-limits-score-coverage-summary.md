# P843 Data Limits Score Coverage Summary

Date: 2026-08-29
Working root: `C:\sgSHIOK2026`
Machine: `PRAWN-E14`

## Scope

Free-tier browser copy/test/evidence work only. No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected-payload mutation, or locked-weight change was performed.

## Search Evidence

Command:

```text
git grep -n "Data limits: frozen v1 addresses; incomplete locked scores\|Data limits: frozen v1 addresses; roughly 1 in 4" -- web ':!qa/verification/*'
```

Output:

```text
web/app/page.tsx:2446:          <summary>Data limits: frozen v1 addresses; roughly 1 in 4 lack full locked scores</summary>
web/lib/__tests__/accessibility-render.test.tsx:217:    expect(html).toContain("Data limits: frozen v1 addresses; roughly 1 in 4 lack full locked scores");
web/lib/__tests__/accessibility-render.test.tsx:218:    expect(html).not.toContain("Data limits: frozen v1 addresses; incomplete locked scores");
web/lib/__tests__/score-card-copy.test.ts:396:      "<summary>Data limits: frozen v1 addresses; roughly 1 in 4 lack full locked scores</summary>",
web/lib/__tests__/score-card-copy.test.ts:412:    expect(source).not.toContain("<summary>Data limits: frozen v1 addresses; incomplete locked scores</summary>");
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
   Start at  10:45:59
   Duration  6.85s (transform 2.29s, setup 0ms, import 2.88s, tests 1.70s, environment 1ms)
```

## FINDINGS

1. The collapsed Data limits summary still hid the scale of incomplete locked scores behind the generic phrase `incomplete locked scores`.
2. The summary now says `roughly 1 in 4 lack full locked scores`, matching the standing product requirement to tell users that roughly a quarter of published records do not render a full score.
3. The detailed manifest-derived count line remains unchanged and still gives exact counts when the manifest is loaded.

## DISAGREEMENTS

1. None.
