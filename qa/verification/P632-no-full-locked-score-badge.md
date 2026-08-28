# P632 No Full Locked Score Badge

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
web/app/page.module.css
web/lib/__tests__/accessibility-render.test.tsx
web/lib/__tests__/score-card-copy.test.ts
qa/verification/P632-no-full-locked-score-badge.md
```

## Initial Focused Test Failure

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/score-card-copy.test.ts (16 tests | 1 failed) 121ms
     × keeps the locked score visually secondary to the shelter evidence 41ms

 FAIL  lib/__tests__/score-card-copy.test.ts > score card copy > keeps the locked score visually secondary to the shelter evidence
AssertionError: expected '.appShell {\n  position: relative;\n …' not to contain 'white-space: nowrap;'

- Expected
+ Received

- white-space: nowrap;
```

## Search Output

```text
web/lib/__tests__/accessibility-render.test.tsx:870:    expect(html).not.toContain("<span>No full score</span><strong>Published bundle</strong>");
web/lib/__tests__/accessibility-render.test.tsx:869:    expect(html).toContain("<span>No full locked score</span><strong>Published bundle</strong>");
web/lib/__tests__/accessibility-render.test.tsx:901:    expect(html).toContain("<span>No full locked score</span><strong>Published bundle</strong>");
web/lib/__tests__/accessibility-render.test.tsx:930:    expect(html).toContain("<span>No full locked score</span><strong>Published bundle</strong>");
web/lib/__tests__/accessibility-render.test.tsx:965:    expect(html).toContain("<span>No full locked score</span><strong>Published bundle</strong>");
web/lib/__tests__/accessibility-render.test.tsx:1004:    expect(html).toContain("<span>No full locked score</span><strong>Published bundle</strong>");
web/lib/__tests__/score-card-copy.test.ts:477:    expect(source).not.toContain('label: "No full score"');
web/lib/__tests__/score-card-copy.test.ts:476:    expect(source).toContain('label: "No full locked score"');
web/app/page.tsx:411:    : { label: "No full locked score", value: "Published bundle" };
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  50 passed (50)
   Start at  10:07:25
   Duration  3.56s (transform 1.28s, setup 0ms, import 1.63s, tests 781ms, environment 1ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  161 passed (161)
   Start at  10:07:25
   Duration  23.48s (transform 1.62s, setup 0ms, import 3.18s, tests 7.00s, environment 9ms)
```

## Python Collect

```text
457 tests collected in 7.13s
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
 web/app/page.module.css                         |  4 +++-
 web/app/page.tsx                                |  2 +-
 web/lib/__tests__/accessibility-render.test.tsx | 11 ++++++-----
 web/lib/__tests__/score-card-copy.test.ts       | 14 +++++++++++++-
 4 files changed, 23 insertions(+), 8 deletions(-)
```

## FINDINGS

1. The missing-score badge still said `No full score`, even though the app distinguishes missing locked scores from available shelter-map evidence elsewhere. It now says `No full locked score`.
2. The badge label previously forced `white-space: nowrap`; the longer honest label now wraps inside the fixed badge with `white-space: normal` and `overflow-wrap: anywhere`.
3. The first focused test run exposed an over-broad CSS assertion against every `white-space: nowrap` in the stylesheet. The final test scopes that assertion to `.scoreBadge span`.

## DISAGREEMENTS

1. None.
