# P392 Exposed-Gap Legend Wording

## Scope

Free-tier browser copy/test change only. No scoring, export, rescore, ingest, network build, deploy, public-data write, route-geometry mutation, or data mutation was run.

## Working Root Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Change

The inline map legend now names the red dashed gap layer:

```text
Exposed gaps
```

instead of:

```text
Exposed
```

## Focused Tests

Command:

```text
npm --prefix web test -- accessibility-render.test.tsx score-card-copy.test.ts
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  36 passed (36)
   Start at  17:58:14
   Duration  8.61s (transform 3.77s, setup 0ms, import 5.05s, tests 1.73s, environment 3ms)
```

## FINDINGS

1. The map legend used `Exposed`, while the selected-walk panel and product objective are specifically about recorded exposed gaps.
2. The legend now names the actual evidence layer as `Exposed gaps`, aligning the map with the headline exposure-gaps artifact.

## DISAGREEMENTS

1. None.
