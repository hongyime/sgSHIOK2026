# P817 Direct-Bus Region Labels

## Startup Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Trackability

```text
exit=1
```

`git check-ignore -v qa/verification/P817-direct-bus-region-labels.md` returned exit 1, so this evidence file is trackable.

## Focused Test Output

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  07:22:26
   Duration  3.81s (transform 1.16s, setup 0ms, import 1.49s, tests 1.45s, environment 1ms)
```

## Collect-Only Output

```text
630 tests collected in 34.66s
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

- Direct-bus fallback source-strip ARIA label now says `Direct-bus fallback source evidence`.
- Direct-bus fallback reason-list ARIA label now says `Direct-bus fallback evidence reasons`.
- Normal shelter-map records retain `Shelter source evidence` and `Shelter-map evidence reasons`.
- Rendered and source-level tests cover the fallback-specific region labels.

## FINDINGS

1. Direct-bus fallback cards no longer announced selected-state text as a published shelter-map walk after P816, but their source and reason regions still carried shelter-map-specific ARIA labels.

## DISAGREEMENTS

1. None.
