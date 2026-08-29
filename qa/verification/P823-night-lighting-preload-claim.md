# P823 Night-Lighting Pre-Load Claim

## Startup

```text
C:\sgSHIOK2026
Prawn-E14
7539a8c
```

## Scope

```text
No scoring, export, rescore, subset run, ingest, network build, deploy, public-data write, lamp artifact mutation, or locked-weight change.
```

## Ignore Check

```text
exit=1
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  74 passed (74)
   Start at  08:05:45
   Duration  12.10s (transform 4.65s, setup 0ms, import 6.09s, tests 2.49s, environment 2ms)
```

## Diff Check

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

## Protected Diff Guard

```text
```

## Change

```text
The persistent browser note now avoids exact lamp count/date claims before the runtime overlay artifact is loaded. Exact count/date evidence remains in README/readiness surfaces that validate the artifact.
```

## Findings

1. The title-card night-lighting note previously hardcoded `126,144 LTA lamp-post points, source last modified 7 Jul 2026` before runtime artifact loading could prove those tiles were available to the user.
2. The map component already reports unavailable, partial, empty, loading, below-zoom, and loaded states; the title-card copy should not make an exact availability-adjacent claim ahead of that state.
3. This fix changes browser copy/tests only; it does not modify `web/public/data/lamp_posts_v1/`, scoring, export, protected payloads, checksums, or `pipeline/config/weights.yaml`.

## Disagreements

1. None.
