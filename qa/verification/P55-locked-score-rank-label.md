# P55 Locked-Score Rank Label Evidence

## Root Guard

```text
ROOT=C:\sgSHIOK2026
HOST=Prawn-E14
BRANCH=main
```

## Scope

```text
P55 changes the overall rank option label from `Overall SHIOK` to `Locked SHIOK score`.
No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change is part of this change.
```

## Source Scan

```text
C:\sgSHIOK2026\web\lib\subscore-ranking.ts:6:  { id: "overall", label: "Locked SHIOK score" },
C:\sgSHIOK2026\web\app\page.tsx:165:  rankMetricLabel,
C:\sgSHIOK2026\web\app\page.tsx:169:  rankMetricLabel: string;
C:\sgSHIOK2026\web\app\page.tsx:171:  if (loading) return `Loading ${rankMetricLabel} ranks.`;
C:\sgSHIOK2026\web\app\page.tsx:172:  if (rankedCount === 0) return `No ${rankMetricLabel} ranks available.`;
C:\sgSHIOK2026\web\app\page.tsx:173:  return `${rankedCount} ${rankMetricLabel} rank${rankedCount === 1 ? "" : "s"} available.`;
C:\sgSHIOK2026\web\app\page.tsx:1059:  const rankMetricLabel =
C:\sgSHIOK2026\web\app\page.tsx:1060:    RANK_METRIC_OPTIONS.find((option) => option.id === rankMetric)?.label ?? "Locked SHIOK score";
C:\sgSHIOK2026\web\app\page.tsx:1073:    rankMetricLabel,
C:\sgSHIOK2026\web\app\page.tsx:1151:          label: "Locked SHIOK score",
C:\sgSHIOK2026\web\app\page.tsx:1347:              {rankingLoading && <span className={styles.rankEmpty}>Loading local ranks...</span>}
C:\sgSHIOK2026\web\app\page.tsx:1361:                    <small>{rankMetricLabel}</small>
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:165:    expect(html).toContain("Loading Locked SHIOK score ranks.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:245:    expect(html).toContain("Locked SHIOK score");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:117:    expect(source).toContain('label: "Locked SHIOK score"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:118:    expect(source).not.toContain('label: "Overall SHIOK"');
```

## Focused Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts subscore-ranking.test.ts rank-payload.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  4 passed (4)
      Tests  27 passed (27)
   Start at  16:18:48
   Duration  5.01s (transform 4.25s, setup 0ms, import 6.47s, tests 849ms, environment 27ms)

EXIT_CODE=0
```

## TypeScript

```text
C:\sgSHIOK2026\web\node_modules\.bin\tsc.cmd --noEmit --project C:\sgSHIOK2026\web\tsconfig.json
EXIT_CODE=0
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  122 passed (122)
   Start at  16:20:58
   Duration  13.10s (transform 8.50s, setup 0ms, import 12.05s, tests 19.07s, environment 23ms)

EXIT_CODE=0
```

## Repo Integrity

```text
repo_integrity=ok
EXIT_CODE=0
```

## Diff Check

```text
DIFF_CHECK_EXIT=0
```

## Weights Diff

```text
WEIGHTS_DIFF_EXIT=0
```

## Findings

1. The rank selector still used `Overall SHIOK` after the rest of the UI had moved to `Locked SHIOK score`.

## Disagreements

1. None.
