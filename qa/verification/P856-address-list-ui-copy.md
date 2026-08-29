# P856 Address-List UI Copy

## Scope

Free-tier browser copy cleanup. No scoring, export, rescore, subset run, ingest, network build, deployment, source fetch, or protected payload mutation.

## Root And Host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

Browser-visible caveats now say June 2020 address list instead of address universe, while keeping frozen v1 as the version label inside Data limits.

## Command Output

### npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  11:46:55
   Duration  15.03s (transform 4.41s, setup 0ms, import 5.54s, tests 4.49s, environment 3ms)
```

### rg -n "address universe|Address universe|June 2020 address list|address registry|frozen v1 address" web\app web\lib\__tests__

```text
C:\sgSHIOK2026\web\app\page.tsx:106:  "28 Aug 2026 OSM addr:postcode coverage cross-check: 25,919 valid distinct postcodes measured; 25,899 overlap the 124,443 frozen postals, with 20 valid OSM-only postcodes. OSM remains geometry evidence, not the address registry.";
C:\sgSHIOK2026\web\app\page.tsx:167:    return `this postal is one of the 6 coordinate-backed HDB rows missing from the June 2020 address list in the ${RECENT_PUBLIC_SOURCE_SAMPLE_LABEL} (${source})`;
C:\sgSHIOK2026\web\app\page.tsx:173:  return `The published shelter-map data is tied to the June 2020 address list. ${RECENT_PUBLIC_SOURCE_SAMPLE_LABEL}: ${RECENT_PUBLIC_SOURCE_GAP_COPY}.`;
C:\sgSHIOK2026\web\app\page.tsx:279:    return `${postal} is outside the published shelter-map data tied to the June 2020 address list; ${recentPublicSourceGapCopyForPostal(selection.result.POSTAL)}.`;
C:\sgSHIOK2026\web\app\page.tsx:616:    return "This postal is in the June 2020 address list, but the published shelter-map data has no full locked score for it yet.";
C:\sgSHIOK2026\web\app\page.tsx:1220:          <span>The published shelter-map data is tied to the June 2020 address list.</span>
C:\sgSHIOK2026\web\app\page.tsx:1237:          <span>No shelter-map walk is published for this postal; the published shelter-map data is tied to the June 2020 address list, and {recentPublicSourceGapCopyForPostal(selection.result.POSTAL)}.</span>
C:\sgSHIOK2026\web\app\page.tsx:2470:            Sources: LTA/data.gov.sg and OneMap/SLA for official data; OpenStreetMap contributes geometry evidence, not the address registry (© OpenStreetMap contributors,{" "}
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:135:      "This postal is in the June 2020 address list, but the published shelter-map data has no full locked score for it yet."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:303:      "one of the 6 coordinate-backed HDB rows missing from the June 2020 address list in the ${RECENT_PUBLIC_SOURCE_SAMPLE_LABEL}"
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:309:      "28 Aug 2026 OSM addr:postcode coverage cross-check: 25,919 valid distinct postcodes measured; 25,899 overlap the 124,443 frozen postals, with 20 valid OSM-only postcodes. OSM remains geometry evidence, not the address registry."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:313:    expect(source).not.toContain("OSM remains the address registry");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:428:    expect(source).not.toContain("<summary>Data limits: frozen v1 addresses; roughly 1 in 4 lack full locked scores</summary>");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:429:    expect(source).not.toContain("<summary>Data limits: frozen v1 addresses; incomplete locked scores</summary>");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:430:    expect(source).not.toContain("<summary>Data limits: frozen v1 address list</summary>");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:439:      "Sources: LTA/data.gov.sg and OneMap/SLA for official data; OpenStreetMap contributes geometry evidence, not the address registry"
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:197:      "No OneMap address result found for this search. Try a 6-digit postal code. The published shelter-map data is tied to the June 2020 address list. P19 v2 28 Aug 2026 public-source sample: 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings. This is sampled evidence, not a measured full-universe gap or approval to promote v2."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:202:      "The published shelter-map data is tied to the June 2020 address list. P19 v2 28 Aug 2026 public-source sample: 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings. This is sampled evidence, not a measured full-universe gap or approval to promote v2."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:218:    expect(html).not.toContain("Data limits: frozen v1 addresses; roughly 1 in 4 lack full locked scores");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:219:    expect(html).not.toContain("Data limits: frozen v1 addresses; incomplete locked scores");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:282:    expect(html).toContain("The published shelter-map data is tied to the June 2020 address list.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:283:    expect(html).not.toContain("The published shelter-map data is tied to the frozen June 2020 address universe.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:454:      "Postal 560231 is outside the published shelter-map data tied to the June 2020 address list; the P19 v2 28 Aug 2026 public-source sample found 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:458:    expect(html).not.toContain("outside the shelter-map bundle tied to the frozen June 2020 address universe");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:463:      "No shelter-map walk is published for this postal; the published shelter-map data is tied to the June 2020 address list, and the P19 v2 28 Aug 2026 public-source sample found 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:467:      "No shelter-map walk is published for this postal; the current bundle is tied to the frozen June 2020 address universe.</span>"
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:471:    expect(html).not.toContain("No shelter map route is published for this postal in the frozen June 2020 address universe.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:506:      "Postal 521400 is outside the published shelter-map data tied to the June 2020 address list; this postal is one of the 6 coordinate-backed HDB rows missing from the June 2020 address list in the P19 v2 28 Aug 2026 public-source sample (HDB 2021-2026 geocoded rows)."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:509:      "No shelter-map walk is published for this postal; the published shelter-map data is tied to the June 2020 address list, and this postal is one of the 6 coordinate-backed HDB rows missing from the June 2020 address list in the P19 v2 28 Aug 2026 public-source sample (HDB 2021-2026 geocoded rows)."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:515:      "Postal 935456 is outside the published shelter-map data tied to the June 2020 address list; this postal appears only in an unverified MCST address candidate; OneMap Search did not locate MYRA at the recorded postal, so it is an address-quality warning rather than a confirmed missing address."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:518:      "No shelter-map walk is published for this postal; the published shelter-map data is tied to the June 2020 address list, and this postal appears only in an unverified MCST address candidate; OneMap Search did not locate MYRA at the recorded postal, so it is an address-quality warning rather than a confirmed missing address."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1256:      "This postal is in the June 2020 address list, but the published shelter-map data has no full locked score for it yet."
```

### python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"

```text
repo_integrity=ok
exit_code=0
```

### git diff --check; Write-Output "exit_code=$LASTEXITCODE"

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

### protected-path diff guard

```text
exit_code=1
```

### git check-ignore -v qa/verification/P856-address-list-ui-copy.md; Write-Output "exit_code=$LASTEXITCODE"

```text
exit_code=1
```

## FINDINGS

1. Browser copy still used `address universe` in user-facing caveats and attribution, which is less clear than address list or address registry.

## DISAGREEMENTS

1. None.
