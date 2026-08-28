# P805 Rendered Data Limits Currentness

## Working Root

```text
PWD=C:\sgSHIOK2026
Prawn-E14
```

## Intent

```text
Add rendered test coverage for the page-level Data limits disclosure so fresh P19 v2 public-source evidence cannot regress back to stale 16/20 Aug copy while source-only string checks still pass. This is web test/evidence work only; it does not score, export, rescore, ingest, build network inputs, deploy, or modify protected payloads.
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  56 passed (56)
   Start at  05:42:58
   Duration  12.59s (transform 5.79s, setup 0ms, import 7.22s, tests 1.43s, environment 1ms)
```

## Collect Only

```text
629 tests collected in 16.60s
exit_code=0
```

## Repo Integrity

```text
repo_integrity=ok
exit_code=0
```

## Protected Diff Guard

```text
protected_diff_exit_code=0
```

## Diff Stat

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
 web/lib/__tests__/accessibility-render.test.tsx | 14 +++++++++++++-
 1 file changed, 13 insertions(+), 1 deletion(-)
```

## FINDINGS

1. Before P805, the fresh P19 v2 Data limits copy was protected mainly by source-text assertions, while rendered tests covered no-result copy and score-card copy but not the page-level Data limits disclosure itself.
2. P805 renders `Home` and asserts the visible Data limits disclosure carries the P19 v2 28 Aug 2026 sample label and refreshed OSM counts, while rejecting stale 16 Aug and 20 Aug literals.

## DISAGREEMENTS

1. None.
