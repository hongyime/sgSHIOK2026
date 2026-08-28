# P692 Freshness Check Time

## Startup

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Reason

The visible source-freshness line now records a same-day boundary-sensitive result. The date-only
phrase `28 Aug 2026 UTC manifest-only check` was too coarse after NParks Leaf Area Index crossed
from current to stale later on the same UTC date.

## Verification

```text
npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
Test Files  1 passed (1)
Tests  16 passed (16)
```

```text
npm --prefix web test
Test Files  24 passed (24)
Tests  166 passed (166)
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
459 tests collected in 21.19s
```

```text
python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

```text
git diff --check; Write-Output "exit=$LASTEXITCODE"
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit=0
```

```text
git diff --exit-code -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases raw processed; Write-Output "exit=$LASTEXITCODE"
exit=0
```

## FINDINGS

1. Date-only freshness copy can become ambiguous within a single UTC day when a source is near its
   stale threshold.
2. The visible copy now pins the manifest-only check as `28 Aug 2026 08:05 UTC`, matching the
   recorded local report that changed the UI from 10/8 to 9/9 current/stale.

## DISAGREEMENTS

1. None.
