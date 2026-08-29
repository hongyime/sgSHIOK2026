# P824 Transit Picker Stop-Or-Exit Copy

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Commands

```text
npm --prefix web test -- transit-stop-picker.test.tsx score-card-copy.test.ts accessibility-render.test.tsx route-evidence-map-interaction.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs transit-stop-picker.test.tsx score-card-copy.test.ts accessibility-render.test.tsx route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  4 passed (4)
      Tests  107 passed (107)
   Start at  08:17:23
   Duration  19.15s (transform 4.69s, setup 0ms, import 4.42s, tests 5.25s, environment 9ms)
```

```text
git check-ignore -v qa/verification/P824-transit-picker-stop-exit-copy.md; Write-Output "exit=$LASTEXITCODE"
exit=1
```

```text
python scripts/check_repo_integrity.py
repo_integrity=ok
exit=0
```

```text
git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4 qa/releases
```

```text
rg -n "Nearby transit targets|Transit target picker|Transit target type|Custom transit target selected|Viewing selected transit target|this clicked transit target|selected transit target|No qualifying transit target|No transit target loaded|transit targets" web/app/page.tsx web/components/transit-stop-picker.tsx web/components/route-evidence-map.tsx web/lib/__tests__/transit-stop-picker.test.tsx web/lib/__tests__/score-card-copy.test.ts web/lib/__tests__/accessibility-render.test.tsx web/lib/__tests__/route-evidence-map-interaction.test.ts
web/lib/__tests__/route-evidence-map-interaction.test.ts:49:    expect(source).not.toContain("Singapore shelter-map view for covered-walkway ratio, exposed gaps, transit targets, and the night-lighting map layer");
web/lib/__tests__/route-evidence-map-interaction.test.ts:51:    expect(source).not.toContain("Singapore shelter-map view for covered-walkway ratio, exposed gaps, transit targets, and night lighting evidence");
web/lib/__tests__/route-evidence-map-interaction.test.ts:244:    expect(pageSource).not.toContain("Preview only: this clicked transit target has shelter-map evidence");
web/lib/__tests__/score-card-copy.test.ts:38:    expect(source).not.toContain("No qualifying transit target within 1.2 km");
web/lib/__tests__/score-card-copy.test.ts:107:    expect(source).not.toContain("No transit target loaded");
web/lib/__tests__/score-card-copy.test.ts:159:    expect(source).not.toContain("Viewing selected transit target");
web/lib/__tests__/score-card-copy.test.ts:160:    expect(source).not.toContain("Custom transit target selected.");
web/lib/__tests__/score-card-copy.test.ts:168:    expect(source).not.toContain('aria-label="Transit target type"');
web/lib/__tests__/score-card-copy.test.ts:174:    expect(pickerSource).not.toContain("Nearby transit targets");
web/lib/__tests__/score-card-copy.test.ts:175:    expect(pickerSource).not.toContain('aria-label="Transit target picker"');
web/lib/__tests__/score-card-copy.test.ts:176:    expect(pickerSource).not.toContain('aria-label="Nearby transit targets"');
web/lib/__tests__/score-card-copy.test.ts:625:    expect(source).not.toContain("this clicked transit target has shelter-map evidence");
web/lib/__tests__/accessibility-render.test.tsx:297:    expect(html).not.toContain("Custom transit target selected.");
web/lib/__tests__/accessibility-render.test.tsx:404:    expect(html).not.toContain("this selected transit target");
web/lib/__tests__/accessibility-render.test.tsx:405:    expect(html).not.toContain("this clicked transit target");
web/lib/__tests__/accessibility-render.test.tsx:958:    expect(html).not.toContain('aria-label="Transit target type"');
web/lib/__tests__/accessibility-render.test.tsx:1107:    expect(html).not.toContain("No qualifying transit target within 1.2 km");
web/lib/__tests__/transit-stop-picker.test.tsx:316:    expect(html).not.toContain("Nearby transit targets");
web/lib/__tests__/transit-stop-picker.test.tsx:321:    expect(html).not.toContain('aria-label="Transit target picker"');
web/lib/__tests__/transit-stop-picker.test.tsx:322:    expect(html).not.toContain('aria-label="Nearby transit targets"');
```

## FINDINGS

1. The transit stop picker still used visible and accessible "transit target" wording for a selector whose actual choices are bus stops and MRT/LRT exits.
2. A restarted read-only subagent found the same inconsistency in page-level live status, preview fallback, and map-summary copy, so the fix includes those user-facing strings rather than only the picker component.
3. The fix is copy-only: the UI says "Nearby transit stops and exits", "auto-picked stop or exit", and "selected stop or exit", while code-level target terminology remains only where it describes the selected POI abstraction.

## DISAGREEMENTS

1. None.
