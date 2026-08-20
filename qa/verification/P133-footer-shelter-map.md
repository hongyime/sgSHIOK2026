# P133 Footer Shelter Map Copy

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

The footer now says:

```text
Source-derived shelter map evidence.
```

## Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  22:21:02
   Duration  5.34s (transform 3.38s, setup 0ms, import 6.60s, tests 7.21s, environment 10ms)
```

## Diff Guards

```text
git diff --check
```

No output.

```text
git diff -- pipeline/config/weights.yaml
```

No output.

## FINDINGS

1. The footer still used generic `Source-derived route evidence` wording after the app title moved to `S.H.I.O.K. Shelter Map`.
2. The footer now matches the shelter-map framing while preserving source-derived evidence attribution.
3. This is browser copy only. It does not alter search behavior, route geometry, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
