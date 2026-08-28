# P627 Selected Transit Target Copy

## Root Guard

```text
root=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

```text
No scoring, export, rescore, subset run, ingest, network build, upstream API probe, deployment, public-data write, protected QA write, checksums write, or locked weights change was performed.
Changed files:
web/app/page.tsx
web/lib/__tests__/accessibility-render.test.tsx
web/lib/__tests__/route-evidence-map-interaction.test.ts
web/lib/__tests__/score-card-copy.test.ts
qa/verification/P627-selected-transit-target-copy.md
```

## Search Output

```text
web/lib/__tests__/route-evidence-map-interaction.test.ts:224:    expect(pageSource).toContain("Preview only: this clicked transit target has shelter-map evidence");
web/lib/__tests__/route-evidence-map-interaction.test.ts:225:    expect(pageSource).not.toContain("Preview only: this clicked transit stop has shelter-map evidence");
web/lib/__tests__/score-card-copy.test.ts:113:  it("names selected transit targets explicitly in the selected-target badge", () => {
web/lib/__tests__/score-card-copy.test.ts:116:    expect(source).toContain("Viewing selected transit target");
web/lib/__tests__/score-card-copy.test.ts:117:    expect(source).toContain("Custom transit target selected.");
web/lib/__tests__/score-card-copy.test.ts:120:    expect(source).not.toContain("Viewing selected transit stop");
web/lib/__tests__/score-card-copy.test.ts:121:    expect(source).not.toContain("Custom transit stop selected.");
web/lib/__tests__/score-card-copy.test.ts:485:    expect(source).toContain("this clicked transit target has shelter-map evidence");
web/lib/__tests__/score-card-copy.test.ts:486:    expect(source).not.toContain("this clicked transit stop has shelter-map evidence");
web/lib/__tests__/score-card-copy.test.ts:490:    expect(source).not.toContain("this clicked transit stop has shelter map evidence");
web/app/page.tsx:265:      : "Custom transit target selected."
web/app/page.tsx:557:    return "Preview only: this clicked transit target has shelter-map evidence, but it is not part of the published shelter-map bundle yet.";
web/app/page.tsx:915:    return "Fetching OneMap walking preview; the selected transit target is shown as a straight-line preview until that walk preview returns.";
web/app/page.tsx:918:    return "OneMap walking preview is unavailable for this selected transit target; showing straight-line preview only.";
web/app/page.tsx:1449:              <span>{previewRoute ? "Preview shelter-map evidence only" : "Viewing selected transit target"}</span>
web/lib/__tests__/accessibility-render.test.tsx:276:    expect(html).toContain("Custom transit target selected.");
web/lib/__tests__/accessibility-render.test.tsx:277:    expect(html).not.toContain("Custom transit stop selected.");
web/lib/__tests__/accessibility-render.test.tsx:374:      "OneMap walking preview is unavailable for this selected transit target; showing straight-line preview only."
web/lib/__tests__/accessibility-render.test.tsx:377:      "Preview only: this clicked transit target has shelter-map evidence, but it is not part of the published shelter-map bundle yet."
web/lib/__tests__/accessibility-render.test.tsx:380:    expect(html).not.toContain("this selected transit stop");
web/lib/__tests__/accessibility-render.test.tsx:381:    expect(html).not.toContain("this clicked transit stop");
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  60 passed (60)
   Start at  09:47:11
   Duration  5.84s (transform 1.46s, setup 0ms, import 1.95s, tests 1.32s, environment 2ms)
```

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  161 passed (161)
   Start at  09:47:12
   Duration  32.27s (transform 2.11s, setup 0ms, import 4.35s, tests 8.63s, environment 13ms)
```

## Python Collect

```text
457 tests collected in 13.97s
```

## Repository Integrity

```text
repo_integrity=ok
exit=0
```

## Evidence Check Ignore

```text
exit=1
```

## Protected Path Diff

```text
exit=0
```

## Diff Stat

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
 web/app/page.tsx                                         | 10 +++++-----
 web/lib/__tests__/accessibility-render.test.tsx          |  9 ++++++---
 web/lib/__tests__/route-evidence-map-interaction.test.ts |  3 ++-
 web/lib/__tests__/score-card-copy.test.ts                | 11 +++++++----
 4 files changed, 20 insertions(+), 13 deletions(-)
```

## FINDINGS

1. User-facing selected custom transit copy still used stop-specific language in four places even though the picker can represent MRT/LRT exits and bus stops. The UI now says transit target for selected/custom/preview target states.
2. The lower-level live-route source label "Clicked transit POI" remains unchanged because it is type-neutral and accurately names the raw selected map feature.

## DISAGREEMENTS

1. None.
