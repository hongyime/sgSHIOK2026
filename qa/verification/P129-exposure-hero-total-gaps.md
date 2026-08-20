# P129 Exposure Hero Total Gaps

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

The route evidence hero now promotes the selected walk's total exposed metres and recorded exposed-gap count next to the covered-walkway ratio.

## Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  22:07:55
   Duration  6.55s (transform 4.81s, setup 0ms, import 6.21s, tests 8.37s, environment 26ms)
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

1. The previous route hero showed the selected walk's covered-walkway ratio and longest exposed gap, but the total exposed metres and gap count were only lower in the panel.
2. The hero now states the total exposure burden directly, for example `181 m exposed across 2 gaps; 142 m is the longest exposed gap.`
3. This is browser presentation only. It does not alter route geometry, exposure-gap data, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
