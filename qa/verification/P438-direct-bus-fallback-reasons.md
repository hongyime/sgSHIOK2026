# P438 direct bus fallback reasons

## Working root

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Base

```text
9b462a6f6f26a70fca87e00d16e797317fee5e82
9b462a6 docs: update agent state after P437
8ca6a67 fix: clarify bus fallback walk proof chip
b39b305 docs: update agent state after P436
```

## Change

Direct-bus fallback score reasons no longer say "Nearby bus stop with service data" or "Shelter-map walk not verified yet".

They now say:

```text
Nearby bus service found
No verified shelter-map walk yet
```

## Diff stat

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
 web/app/page.tsx                                |  2 +-
 web/lib/__tests__/accessibility-render.test.tsx | 22 ++++++++++++++++++++++
 web/lib/__tests__/score-card-copy.test.ts       |  6 +++++-
 3 files changed, 28 insertions(+), 2 deletions(-)
```

## Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  42 passed (42)
   Start at  21:21:46
   Duration  2.14s (transform 1.06s, setup 0ms, import 1.37s, tests 434ms, environment 1ms)
```

## Repo integrity

```text
repo_integrity=ok
EXIT=0
```

## Protected diff guard

```text
EXIT=0
```

## Evidence ignore check

```text
EXIT=1
```

## FINDINGS

1. The previous direct-bus fallback reason pair was mechanically correct but too source-shaped: "Nearby bus stop with service data" and "Shelter-map walk not verified yet" still implied the important fact indirectly.
2. The replacement pair is shorter and closer to the user-visible distinction: bus service exists, but there is no verified shelter-map walk.
3. The existing bus-term caveat remains unchanged: records with direct-bus fallback evidence still explain that the locked bus term remains 0 because shelter-map walk access was not verified.

## DISAGREEMENTS

1. None.
