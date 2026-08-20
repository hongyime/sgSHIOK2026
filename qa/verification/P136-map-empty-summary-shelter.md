# P136 Map Empty Summary Shelter Copy

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

The non-visual map summary now says:

```text
Search for a postal code to show shelter map evidence, exposed gaps, and nearby transit.
```

## Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  22:28:50
   Duration  7.82s (transform 6.09s, setup 0ms, import 8.56s, tests 10.92s, environment 10ms)
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

1. The empty non-visual map summary still said `show route evidence`, which was less specific than the current shelter-map product frame.
2. The summary now names shelter map evidence, exposed gaps, and nearby transit before a postal is selected.
3. This is browser accessibility copy only. It does not alter map rendering, route geometry, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
