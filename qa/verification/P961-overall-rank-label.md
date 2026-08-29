# P961 Overall Rank Label

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Intent

Keep the nearby-address comparison shelter-first by replacing the visible `Locked score order` option with `Overall locked score`, and make the overall-ranking branch depend on the metric id instead of a label suffix.

## Commands

```text
PS C:\sgSHIOK2026> npm --prefix C:\sgSHIOK2026\web test -- subscore-ranking score-card-copy accessibility-render
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs subscore-ranking score-card-copy accessibility-render

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  67 passed (67)
   Start at  20:16:11
   Duration  12.31s (transform 6.21s, setup 0ms, import 7.67s, tests 1.67s, environment 2ms)
```

```text
PS C:\sgSHIOK2026> python C:\sgSHIOK2026\scripts\check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

```text
PS C:\sgSHIOK2026> git -C C:\sgSHIOK2026 diff -- pipeline/config/weights.yaml
```

## FINDINGS

1. The nearby-address comparison control still exposed `Locked score order` as the overall option, which described implementation behavior rather than what the user selects.
2. `rankAnnouncement` and loading copy also depended on `rankMetricLabel.endsWith("order")`, so changing the label would have changed behavior unless the branch used the metric id directly.
3. The visible option now reads `Overall locked score`, while loading/status copy still says addresses are ordered by locked score.

## DISAGREEMENTS

1. None.
