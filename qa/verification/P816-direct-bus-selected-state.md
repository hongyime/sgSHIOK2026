# P816 Direct-Bus Selected State

## Startup Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Trackability

```text
exit=1
```

`git check-ignore -v qa/verification/P816-direct-bus-selected-state.md` returned exit 1, so this evidence file is trackable.

## Subagent Finding Implemented

```text
Direct-bus fallback screen-reader status still says a published shelter-map walk is selected.
```

## Focused Test Output

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  62 passed (62)
   Start at  07:16:53
   Duration  6.95s (transform 3.16s, setup 0ms, import 4.05s, tests 722ms, environment 1ms)
```

## Collect-Only Output

```text
630 tests collected in 10.02s
```

## Repository Integrity Output

```text
repo_integrity=ok
exit=0
```

## Protected Diff Guard

Command:

```text
git diff --name-only -- pipeline/config/weights.yaml checksums.json web/public/data qa/releases ':(glob)qa/p6_*' ':(glob)qa/p7_*' ':(glob)qa/p8_*' ':(glob)qa/p9_*' ':(glob)qa/p10_*' ':(glob)qa/p11/d_*'
```

Output:

```text
```

## Change

- `scoreCardAnnouncement()` now accepts `selectedStateText` for exceptional selected-state copy.
- Direct-bus fallback records pass `Published direct-bus fallback evidence selected.`
- Normal published routed walks keep `Published shelter-map walk selected.`
- Rendered and source-level tests cover the fallback announcement.

## FINDINGS

1. Direct-bus fallback status text could still announce `Published shelter-map walk selected.` for a record that visibly says no verified shelter-map walk exists.

## DISAGREEMENTS

1. None.
