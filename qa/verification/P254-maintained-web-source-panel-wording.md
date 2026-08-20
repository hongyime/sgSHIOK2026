# P254 maintained web source panel wording

## Root guard

```text
ROOT_OK C:\sgSHIOK2026
HOST PRAWN-E14
```

## Scope

Maintained web source/test comments still contained score-first phrasing:

```text
score card + map line
focused from the score card
the primary score card already displays the routed distance
renders live status for score card load, route mode
```

They now use the shelter-map panel / walk-mode frame.

## Focused tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs transit-stop-picker.test.tsx route-evidence-map-interaction.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  62 passed (62)
   Start at  07:41:15
   Duration  3.33s (transform 3.14s, setup 0ms, import 3.55s, tests 1.30s, environment 1ms)
```

## FINDINGS

1. Developer-facing web comments and test descriptions still carried the old score-card frame after the user-facing surface had moved to shelter-map evidence first.
2. The maintained source comments now describe the shelter-map panel and selected walk distance instead.
3. This was comment/test wording only. No scoring, export, rescore, ingest, network build, public-data write, deployment, or locked weight change was run.

## DISAGREEMENTS

1. None.
