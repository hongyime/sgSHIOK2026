# P631 Reset Auto-Picked Target Copy

## Root Guard

```text
root=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

```text
No scoring, export, rescore, subset run, ingest, network build, upstream API probe, deployment, public-data write, protected QA write, checksums write, or locked weights change was performed.
Changed files:
web/components/transit-stop-picker.tsx
web/lib/__tests__/transit-stop-picker.test.tsx
qa/verification/P631-reset-auto-picked-target-copy.md
```

## Initial Focused Test Failure

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/transit-stop-picker.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/transit-stop-picker.test.tsx (33 tests | 1 failed) 95ms
     × keeps transit picker comments aligned with the shelter-map panel frame 37ms

 FAIL  lib/__tests__/transit-stop-picker.test.tsx > deriveNearestTransitCandidates > keeps transit picker comments aligned with the shelter-map panel frame
AssertionError: expected '"use client";\n\nimport React, { useM…' to contain 'The shelter-map panel already announc…'

- Expected
+ Received

- The shelter-map panel already announces the active stop's selected
```

## Search Output

```text
web/lib/__tests__/transit-stop-picker.test.tsx:137:    expect(source).toContain("The shelter-map panel already announces the active target's selected");
web/lib/__tests__/transit-stop-picker.test.tsx:333:    expect(html).toContain("Reset to auto-picked target");
web/lib/__tests__/transit-stop-picker.test.tsx:334:    expect(html).toContain('aria-label="Reset to auto-picked transit target"');
web/lib/__tests__/transit-stop-picker.test.tsx:335:    expect(html).not.toContain("Reset to best");
web/lib/__tests__/transit-stop-picker.test.tsx:336:    expect(html).not.toContain('aria-label="Reset to auto-picked best transit"');
web/components/transit-stop-picker.tsx:18:  /** POI id of the auto-picked transit target for the current transit mode. */
web/components/transit-stop-picker.tsx:130:            aria-label="Reset to auto-picked transit target"
web/components/transit-stop-picker.tsx:132:            Reset to auto-picked target
web/components/transit-stop-picker.tsx:153:                The shelter-map panel already announces the active target's selected
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/transit-stop-picker.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  33 passed (33)
   Start at  10:01:40
   Duration  858ms (transform 281ms, setup 0ms, import 397ms, tests 77ms, environment 0ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  161 passed (161)
   Start at  10:01:40
   Duration  16.93s (transform 1.19s, setup 0ms, import 2.49s, tests 4.89s, environment 6ms)
```

## Python Collect

```text
457 tests collected in 5.30s
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
 web/components/transit-stop-picker.tsx         | 10 +++++-----
 web/lib/__tests__/transit-stop-picker.test.tsx |  9 ++++++---
 2 files changed, 11 insertions(+), 8 deletions(-)
```

## FINDINGS

1. The reset chip still used the vague visible label `Reset to best` and an aria label naming `best transit`, which is less precise than the settled transit-target model. It now says `Reset to auto-picked target` with `Reset to auto-picked transit target` for assistive technology.
2. The source-contract test caught one stale `active stop` comment assertion after the component comment was corrected to `active target`; that fixture is now aligned.

## DISAGREEMENTS

1. None.
