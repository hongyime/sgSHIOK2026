# P132 Empty State Shelter Map Prompt

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

The no-selection route evidence panel now says:

```text
No shelter map route selected.
Search a Singapore postal code to inspect sheltered walk evidence, exposed gaps, and night lighting near transit.
```

## Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  22:18:26
   Duration  6.10s (transform 4.53s, setup 0ms, import 6.01s, tests 8.58s, environment 9ms)
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

1. The no-selection panel previously prompted for generic sheltered walk evidence, but did not name exposed gaps or night lighting.
2. The first-use prompt now names the three user-facing artifacts: sheltered walk evidence, exposed gaps, and night lighting near transit.
3. This is browser copy only. It does not alter search behavior, route geometry, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
