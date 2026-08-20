# P142 Heat Proxy Temperature Caveat

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

The title-card heat caveat now says:

```text
Heat proxy: shelter plus sparse NParks greenery, not measured temperature
```

## Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  22:49:07
   Duration  10.36s (transform 4.64s, setup 0ms, import 7.05s, tests 13.65s, environment 11ms)
```

## Phrase Search

```text
C:\sgSHIOK2026\web\app\page.tsx:2036:            <p className={styles.heatLine}>Heat proxy: shelter plus sparse NParks greenery, not measured temperature</p>
C:\sgSHIOK2026\web\section10-presentation-proposal.md:19:| 5 | Heat: shelter + NParks shade proxy | Mostly the same covered-walkway shelter evidence as rain shelter, plus sparse greenery proxy. |
C:\sgSHIOK2026\web\section10-presentation-proposal.md:108:Heat: shelter + NParks shade proxy
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:82:    expect(source).toContain("Heat proxy: shelter plus sparse NParks greenery, not measured temperature");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:87:    expect(source).not.toContain("Heat: shelter + NParks shade proxy");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:88:    expect(source).not.toContain("Heat: shelter plus NParks shade proxy");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:89:    expect(source).not.toContain("Heat proxy: shelter + sparse NParks greenery");
```

## Diff Guards

```text
git diff --check
```

No output.

```text
git diff -- pipeline/config/weights.yaml
```

No output.

## FINDINGS

1. The first-viewport heat caveat said only `Heat proxy: shelter + sparse NParks greenery`, which named inputs but did not say the app does not measure actual temperature.
2. The rendered title-card caveat now explicitly says the heat proxy is not measured temperature.
3. The remaining `Heat: shelter + NParks shade proxy` hits are in the unshipped `web/section10-presentation-proposal.md` proposal document, not the rendered app.
4. This is browser copy and test coverage only. It does not alter heat proxy computation, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
