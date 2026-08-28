# P630 Disconnected Transit Target Copy

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
web/lib/__tests__/score-card-copy.test.ts
qa/verification/P630-disconnected-transit-target-copy.md
```

## Search Output

```text
web/lib/__tests__/accessibility-render.test.tsx:896:    expect(html).toContain("Transit target found");
web/lib/__tests__/accessibility-render.test.tsx:897:    expect(html).toContain("Transit targets exist, but the published shelter-map bundle has no connected shelter-map walk yet.");
web/lib/__tests__/accessibility-render.test.tsx:898:    expect(html).not.toContain("Transit stop or exit found");
web/lib/__tests__/accessibility-render.test.tsx:899:    expect(html).not.toContain("Transit stops or exits exist, but the published shelter-map bundle has no connected shelter-map walk yet.");
web/app/page.tsx:565:      return "Transit targets exist, but the published shelter-map bundle has no connected shelter-map walk yet.";
web/app/page.tsx:817:      return ["Transit target found", "Shelter-map walk not connected yet"];
web/lib/__tests__/score-card-copy.test.ts:27:    expect(source).toContain("Transit target found");
web/lib/__tests__/score-card-copy.test.ts:28:    expect(source).not.toContain("Transit stop or exit found");
web/lib/__tests__/score-card-copy.test.ts:32:    expect(source).toContain("Transit targets exist, but the published shelter-map bundle has no connected shelter-map walk yet.");
web/lib/__tests__/score-card-copy.test.ts:33:    expect(source).not.toContain("Transit stops or exits exist, but the published shelter-map bundle has no connected shelter-map walk yet.");
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  50 passed (50)
   Start at  09:57:42
   Duration  6.55s (transform 1.97s, setup 0ms, import 2.54s, tests 1.57s, environment 1ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  161 passed (161)
   Start at  09:58:11
   Duration  25.88s (transform 1.78s, setup 0ms, import 3.54s, tests 7.37s, environment 11ms)
```

## Python Collect

```text
457 tests collected in 19.92s
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
 web/app/page.tsx                                | 4 ++--
 web/lib/__tests__/accessibility-render.test.tsx | 6 ++++--
 web/lib/__tests__/score-card-copy.test.ts       | 6 ++++--
 3 files changed, 10 insertions(+), 6 deletions(-)
```

## FINDINGS

1. The graph-disconnected no-transit reason chip still said `Transit stop or exit found`, even though the user-facing selection model is a transit target. It now says `Transit target found`.
2. The matching explanatory note now says `Transit targets exist`, while the detailed no-candidate sentence still names the exact qualifying classes, `MRT/LRT exit or bus stop`.

## DISAGREEMENTS

1. None.
