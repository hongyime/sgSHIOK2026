# P835 DataMall Discovery Operator Surfaces

Working root: `C:\sgSHIOK2026`
Machine: `PRAWN-E14`

## Evidence Path Ignore Check

```text
git check-ignore -v qa/verification/P835-datamall-discovery-operator-surfaces.md; Write-Output "exit=$LASTEXITCODE"
exit=1
```

## Missed Surface Review

```text
Subagent Hume read-only review:
1. pipeline/config/sources.yaml still said Covered Linkway and bridge/underpass current discovery may require authenticated GeospatialWholeIsland fallback, without naming the 28 Aug matched-frozen-v1 result.
2. CLAUDE.md still carried only the generic changed-URL action and no 28 Aug matched-all discovery result.
3. tests/test_fetch.py covered the changed-discovery path but not the current matched-all DataMall geospatial discovery result.
```

## Change Diff Summary

```text
git diff --stat
 CLAUDE.md                    |  6 ++--
 pipeline/config/sources.yaml |  4 +--
 tests/test_agent_docs.py     |  4 ++-
 tests/test_fetch.py          | 71 ++++++++++++++++++++++++++++++++++++++++++--
 4 files changed, 78 insertions(+), 7 deletions(-)
```

## Focused Tests

```text
uv run pytest tests/test_fetch.py tests/test_agent_docs.py tests/test_batch_plan.py tests/test_production_readiness.py -q
....................................................................     [100%]
68 passed in 124.76s (0:02:04)
```

## Diff Check

```text
git diff --check
```

## FINDINGS

1. P834 aligned batch-plan and production-readiness structured policy, but agent-facing docs, source notes, and fetch report tests still did not directly encode the latest P682 matched-all DataMall discovery result.
2. The source-note wording was incomplete rather than false: P682 did use authenticated GeospatialWholeIsland fallback, but the important result was that fallback still matched frozen v1.

## DISAGREEMENTS

1. None.
