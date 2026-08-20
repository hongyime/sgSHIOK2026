# P131 Shelter Map Title

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

The app's visible title and metadata title now say `S.H.I.O.K. Shelter Map` instead of `S.H.I.O.K. Index`.

The subtitle remains `Shelter-first walks to transit`, and the locked SHIOK score remains visible as a secondary route-evidence field.

## Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  22:15:01
   Duration  14.51s (transform 9.87s, setup 0ms, import 15.22s, tests 18.42s, environment 30ms)
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

1. The browser still used `S.H.I.O.K. Index` as the visible H1 and document metadata title, which made the first brand signal score/index-first.
2. The title now says `S.H.I.O.K. Shelter Map`, matching the settled shelter-first product direction while leaving locked-score UI and score logic unchanged.
3. This is browser naming only. It does not alter scoring, ranking, route geometry, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
