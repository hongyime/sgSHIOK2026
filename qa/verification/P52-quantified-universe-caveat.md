# P52 Quantified Postal-Universe Caveat Evidence

## Root Guard

```text
ROOT=C:\sgSHIOK2026
HOST=Prawn-E14
BRANCH=main
```

## Scope

```text
P52 surfaces the P19 measured recent-completion miss signal in the title-card address-universe caveat.
No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change is part of this change.
```

## P19 Measurement Cited

```json
{
  "combined_recent_completion_signal": {
    "missing_rows": 8,
    "missing_unique_postals": 8,
    "row_miss_rate": 0.008197,
    "rows_with_postal": 976
  }
}
```

## Source Scan

```text
C:\sgSHIOK2026\decisions.md:142:The page footer should not reintroduce the old comfort-index framing after the title card, result panel, README, and metadata have moved to shelter-first route evidence. The visible footer now says `Source-derived route evidence.` instead of `Source-derived comfort index.`. This is browser copy only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.
C:\sgSHIOK2026\decisions.md:148:The title-card address-universe caveat should cite the measured P19 public-sample miss signal instead of leaving `newer completions may be missing` completely unquantified. The browser now states that the recent public-sample check found 8 missing rows out of 976 completions from 2021-2026 with postals. This is an honesty-copy change only; it does not alter the frozen v1 universe, scoring, exports, inputs, public data, deployment, or locked weights.
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:32:      "Address universe: frozen v1 from a June 2020 OneMap-derived postal scrape; newer completions may be missing."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:35:      "Recent public-sample check: 8 missing rows out of 976 completions from 2021-2026 with postals."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:57:    expect(source).not.toContain("Source-derived comfort index.");
C:\sgSHIOK2026\web\app\page.tsx:1938:              Address universe: frozen v1 from a June 2020 OneMap-derived postal scrape; newer completions may be missing.
C:\sgSHIOK2026\web\app\page.tsx:1941:              Recent public-sample check: 8 missing rows out of 976 completions from 2021-2026 with postals.
```

## Focused Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  16:07:32
   Duration  744ms (transform 75ms, setup 0ms, import 102ms, tests 32ms, environment 0ms)

EXIT_CODE=0
```

## TypeScript

```text
C:\sgSHIOK2026\web\node_modules\.bin\tsc.cmd --noEmit --project C:\sgSHIOK2026\web\tsconfig.json
EXIT_CODE=0
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  121 passed (121)
   Start at  16:07:47
   Duration  8.30s (transform 5.28s, setup 0ms, import 7.71s, tests 11.38s, environment 12ms)

EXIT_CODE=0
```

## Final Guards

```text
repo_integrity=ok
EXIT_CODE=0
```

```text
git diff --check
DIFF_CHECK_EXIT=0
```

```text
git diff -- pipeline/config/weights.yaml
WEIGHTS_DIFF_EXIT=0
```

## Findings

1. The browser already warned that newer completions may be missing, but it did not surface the P19 measurement that sized the limitation at 8 missing rows out of 976 recent public completion rows with postals.
2. The P52 change is intentionally copy-only; it cites the existing P19 measurement and does not rerun OneMap, Overpass, ingest, scoring, export, or any input build.

## Disagreements

1. None.
