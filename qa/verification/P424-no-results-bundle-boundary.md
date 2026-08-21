# P424 no-results bundle boundary evidence

## Guard

```text
ROOT=C:\sgSHIOK2026
HOST=Prawn-E14
```

## Scope

```text
No scoring, export, rescore, subset run, ingest, network build, deploy, or public-data write was run.
Protected files and directories were not intentionally modified.
```

## Search

```text
C:\sgSHIOK2026\web\app\page.tsx:167:    return `No OneMap address result found for this search. Try a 6-digit postal code. Separately, the published shelter-map bundle is tied to the frozen June 2020 address universe, and the recent public-source check found ${RECENT_PUBLIC_SOURCE_GAP_COPY}.`;
C:\sgSHIOK2026\web\app\page.tsx:286:          No OneMap address result found for this search. Try a 6-digit postal code. Separately, the published shelter-map bundle is tied to the frozen June 2020 address universe, and the recent public-source check found {RECENT_PUBLIC_SOURCE_GAP_COPY}.
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:172:      "No OneMap address result found for this search. Try a 6-digit postal code. Separately, the published shelter-map bundle is tied to the frozen June 2020 address universe, and the recent public-source check found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) 2021-2026 public-source rows with postals."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:177:      "Separately, the published shelter-map bundle is tied to the frozen June 2020 address universe, and the recent public-source check found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) 2021-2026 public-source rows with postals."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:179:    expect(noResultsHtml).not.toContain("the frozen shelter-map bundle&#x27;s recent public-source check found");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:341:      "No shelter-map walk is published for this postal; the published shelter-map bundle is tied to the frozen June 2020 address universe, and the recent public-source check found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) 2021-2026 public-source rows with postals."
```

## Verification

```text
npm --prefix C:\sgSHIOK2026\web test -- accessibility-render.test.tsx --runInBand
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  23 passed (23)
   Start at  20:04:13
   Duration  3.22s (transform 1.37s, setup 0ms, import 1.77s, tests 654ms, environment 1ms)
```

```text
git -C C:\sgSHIOK2026 check-ignore -v -- C:\sgSHIOK2026\qa\verification\P424-no-results-bundle-boundary.md
EXIT=1
```

```text
python C:\sgSHIOK2026\scripts\check_repo_integrity.py
repo_integrity=ok
EXIT=0
```

```text
git -C C:\sgSHIOK2026 diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11 C:\sgSHIOK2026\qa\releases
EXIT=0
```

## FINDINGS

1. The no-results search fallback was the last user-visible public-source gap copy found using the possessive phrase `the frozen shelter-map bundle's recent public-source check`; that wording blurred the published artifact boundary with the frozen v1 address universe.
2. The fixed fallback now matches the outside-bundle copy pattern: the published shelter-map bundle is tied to the frozen June 2020 address universe, and the recent public-source check is separate supporting evidence.

## DISAGREEMENTS

1. None.
