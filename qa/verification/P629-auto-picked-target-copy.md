# P629 Auto-Picked Target Copy

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
qa/verification/P629-auto-picked-target-copy.md
```

## Initial Focused Test Failure

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/transit-stop-picker.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/transit-stop-picker.test.tsx (33 tests | 1 failed) 78ms
     × returns the % farther string when the pick is farther 13ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  lib/__tests__/transit-stop-picker.test.tsx > buildComparisonText > returns the % farther string when the pick is farther
AssertionError: expected '42% farther than auto-picked target (…' to be '42% farther than auto-picked stop (+4…' // Object.is equality

Expected: "42% farther than auto-picked stop (+42 m straight-line only; walk evidence updates after selection)"
Received: "42% farther than auto-picked target (+42 m straight-line only; walk evidence updates after selection)"

 ❯ lib/__tests__/transit-stop-picker.test.tsx:272:7
    270|     expect(
    271|       buildComparisonText({ fartherPct: 42, bestStraightM: 100, active…
    272|     ).toBe(
       |       ^
    273|       "42% farther than auto-picked stop (+42 m straight-line only; wa…
    274|     );

⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 32 passed (33)
   Start at  09:53:54
   Duration  922ms (transform 249ms, setup 0ms, import 362ms, tests 78ms, environment 0ms)
```

## Search Output

```text
web/components/transit-stop-picker.tsx:50:  return `${pct}% farther than auto-picked target (+${formatMeters(
web/lib/__tests__/transit-stop-picker.test.tsx:273:      "42% farther than auto-picked target (+42 m straight-line only; walk evidence updates after selection)"
web/lib/__tests__/transit-stop-picker.test.tsx:344:      /\d+% farther than auto-picked target \(\+\d+ m straight-line only; walk evidence updates after selection\)/
web/lib/__tests__/transit-stop-picker.test.tsx:346:    expect(html).not.toContain("farther than auto-picked stop");
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/transit-stop-picker.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  33 passed (33)
   Start at  09:54:17
   Duration  884ms (transform 259ms, setup 0ms, import 375ms, tests 79ms, environment 0ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  161 passed (161)
   Start at  09:54:17
   Duration  14.76s (transform 1.22s, setup 0ms, import 2.31s, tests 3.73s, environment 6ms)
```

## Python Collect

```text
457 tests collected in 6.03s
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
 web/components/transit-stop-picker.tsx         | 2 +-
 web/lib/__tests__/transit-stop-picker.test.tsx | 5 +++--
 2 files changed, 4 insertions(+), 3 deletions(-)
```

## FINDINGS

1. The visible straight-line comparison note still said `auto-picked stop`, even though the candidate can be an MRT/LRT exit or a bus stop. It now says `auto-picked target`.
2. The first focused test run correctly caught the direct helper assertion that still expected the old string; that fixture is now corrected and the old visible phrase is rejected in rendered output.

## DISAGREEMENTS

1. None.
