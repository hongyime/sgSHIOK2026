# P439 OSM source role

## Working root

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Base

```text
07f29944b2543cf66d960852711b6997f30dab60
07f2994 docs: update agent state after P438
8cdeb99 fix: clarify direct bus fallback reasons
9b462a6 docs: update agent state after P437
```

## Change

The first-view source line now states OpenStreetMap's role as geometry evidence rather than presenting it as a peer address source:

```text
Sources: LTA/data.gov.sg and OneMap/SLA for official data; OpenStreetMap contributes geometry evidence, not the address universe
```

## Diff stat

```text
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
 web/app/page.tsx                          | 2 +-
 web/lib/__tests__/score-card-copy.test.ts | 4 ++++
 2 files changed, 5 insertions(+), 1 deletion(-)
```

## Focused web test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  21:26:20
   Duration  1.97s (transform 311ms, setup 0ms, import 372ms, tests 173ms, environment 1ms)
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

1. The prior first-view source line listed OpenStreetMap beside official sources without saying what role OSM plays.
2. The revised line preserves OSM attribution while making the settled project policy visible: OSM contributes geometry evidence, not the address universe.
3. This is a zero-pipeline user-visible change and does not touch scoring inputs, generated bundles, protected evidence, or weights.

## DISAGREEMENTS

1. None.
