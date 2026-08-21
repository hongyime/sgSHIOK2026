# P486 Browser P19 Sample Label

Date: 2026-08-22
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Free-tier browser copy only.

No scoring, export, rescore, subset run, ingest, network build, deployment, input rebuild, API probe, public-data mutation, protected QA mutation, or weights.yaml edit was performed.

## Evidence commands

```text
PS C:\sgSHIOK2026> rg -n "public-source check|public-source sample|RECENT_PUBLIC_SOURCE_CHECK_LABEL" web/app/page.tsx web/lib/__tests__/score-card-copy.test.ts web/lib/__tests__/accessibility-render.test.tsx
web/lib/__tests__/accessibility-render.test.tsx:172:      "No OneMap address result found for this search. Try a 6-digit postal code. Separately, the published shelter-map bundle is tied to the frozen June 2020 address universe, and the 16 Aug 2026 public-source sample found 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unvalidated MCST proxy rows (CANAAN and MYRA) out of 976 (0.82%) sampled 2021-2026 public-source rows with postals."
web/lib/__tests__/accessibility-render.test.tsx:177:      "Separately, the published shelter-map bundle is tied to the frozen June 2020 address universe, and the 16 Aug 2026 public-source sample found 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unvalidated MCST proxy rows (CANAAN and MYRA) out of 976 (0.82%) sampled 2021-2026 public-source rows with postals."
web/lib/__tests__/accessibility-render.test.tsx:179:    expect(noResultsHtml).not.toContain("the recent public-source check found");
web/lib/__tests__/accessibility-render.test.tsx:180:    expect(noResultsHtml).not.toContain("the frozen shelter-map bundle&#x27;s recent public-source check found");
web/lib/__tests__/accessibility-render.test.tsx:335:      "Postal 560231 is outside the published shelter-map bundle tied to the frozen June 2020 address universe; the 16 Aug 2026 public-source sample found 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unvalidated MCST proxy rows (CANAAN and MYRA) out of 976 (0.82%) sampled 2021-2026 public-source rows with postals."
web/lib/__tests__/accessibility-render.test.tsx:344:      "No shelter-map walk is published for this postal; the published shelter-map bundle is tied to the frozen June 2020 address universe, and the 16 Aug 2026 public-source sample found 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unvalidated MCST proxy rows (CANAAN and MYRA) out of 976 (0.82%) sampled 2021-2026 public-source rows with postals."
web/lib/__tests__/accessibility-render.test.tsx:351:      "No shelter-map walk is published for this postal; the current bundle is tied to the frozen June 2020 address universe, and the recent public-source check found 8 missing rows out of 976."
web/lib/__tests__/accessibility-render.test.tsx:389:      "Postal 521400 is outside the published shelter-map bundle tied to the frozen June 2020 address universe; this postal is one of the 6 coordinate-backed HDB missing rows from frozen v1 in the 16 Aug 2026 public-source sample (HDB 2021-2026 geocoded rows)."
web/lib/__tests__/accessibility-render.test.tsx:392:      "No shelter-map walk is published for this postal; the published shelter-map bundle is tied to the frozen June 2020 address universe, and this postal is one of the 6 coordinate-backed HDB missing rows from frozen v1 in the 16 Aug 2026 public-source sample (HDB 2021-2026 geocoded rows)."
web/lib/__tests__/accessibility-render.test.tsx:398:      "Postal 521400 is outside the published shelter-map bundle tied to the frozen June 2020 address universe; recent public-source check found 8 missing rows out of 976"
web/lib/__tests__/score-card-copy.test.ts:186:      "Address universe: frozen v1 from a June 2020 OneMap-derived postal scrape; a 2021-2026 public-source sample found 8 missing rows out of 976."
web/lib/__tests__/score-card-copy.test.ts:191:      "{RECENT_PUBLIC_SOURCE_CHECK_LABEL}: {RECENT_PUBLIC_SOURCE_GAP_COPY}."
web/lib/__tests__/score-card-copy.test.ts:193:    expect(source).toContain('const RECENT_PUBLIC_SOURCE_CHECK_LABEL = "16 Aug 2026 public-source sample";');
web/lib/__tests__/score-card-copy.test.ts:194:    expect(source).not.toContain('const RECENT_PUBLIC_SOURCE_CHECK_LABEL = "16 Aug 2026 public-source check";');
web/lib/__tests__/score-card-copy.test.ts:195:    expect(source).not.toContain("Recent public-source check: {RECENT_PUBLIC_SOURCE_GAP_COPY}.");
web/lib/__tests__/score-card-copy.test.ts:201:      "one of the 6 coordinate-backed HDB missing rows from frozen v1 in the ${RECENT_PUBLIC_SOURCE_CHECK_LABEL}"
web/app/page.tsx:103:const RECENT_PUBLIC_SOURCE_CHECK_LABEL = "16 Aug 2026 public-source sample";
web/app/page.tsx:139:    return `this postal is one of the 6 coordinate-backed HDB missing rows from frozen v1 in the ${RECENT_PUBLIC_SOURCE_CHECK_LABEL} (${source})`;
web/app/page.tsx:141:  return `the ${RECENT_PUBLIC_SOURCE_CHECK_LABEL} found ${RECENT_PUBLIC_SOURCE_GAP_COPY}`;
web/app/page.tsx:177:    return `No OneMap address result found for this search. Try a 6-digit postal code. Separately, the published shelter-map bundle is tied to the frozen June 2020 address universe, and the ${RECENT_PUBLIC_SOURCE_CHECK_LABEL} found ${RECENT_PUBLIC_SOURCE_GAP_COPY}.`;
web/app/page.tsx:307:          No OneMap address result found for this search. Try a 6-digit postal code. Separately, the published shelter-map bundle is tied to the frozen June 2020 address universe, and the {RECENT_PUBLIC_SOURCE_CHECK_LABEL} found {RECENT_PUBLIC_SOURCE_GAP_COPY}.
web/app/page.tsx:2160:              {RECENT_PUBLIC_SOURCE_CHECK_LABEL}: {RECENT_PUBLIC_SOURCE_GAP_COPY}.
```

```text
PS C:\sgSHIOK2026> npm --prefix web test -- lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  42 passed (42)
   Start at  01:15:21
   Duration  6.61s (transform 3.40s, setup 0ms, import 4.30s, tests 1.51s, environment 2ms)
```

```text
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "EXIT=$LASTEXITCODE"
repo_integrity=ok
EXIT=0
```

```text
PS C:\sgSHIOK2026> git check-ignore -v qa/verification/P486-browser-p19-sample-label.md; Write-Output "EXIT=$LASTEXITCODE"
EXIT=1
```

```text
PS C:\sgSHIOK2026> git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4 qa/releases
```

## FINDINGS

1. The P19 browser body copy already said the 976-row result was sampled, but the label still said `public-source check`. The label now says `public-source sample` in first-view and known-postal outside-bundle copy.

## DISAGREEMENTS

1. None.
