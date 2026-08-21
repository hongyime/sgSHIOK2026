# P457 Dated Public-Source Check Copy

## Root And Host

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Scope

Made the cached P19 recent-source measurement date visible in browser copy.
First-view, search no-result, outside-bundle, and known HDB missing-row caveats
now say `16 Aug 2026 public-source check` instead of timeless `recent`
wording. No scoring, export, rescore, subset run, ingest, network build, API
call, public data write, or deployment was run.

## Measurement Basis

```text
Get-Content -LiteralPath 'C:\sgSHIOK2026\qa\p19\universe_gap_measurement_summary.json' -TotalCount 45
{
  "combined_recent_completion_signal": {
    "missing_rows": 8,
    "missing_unique_postals": 8,
    "row_miss_rate": 0.008197,
    "rows_with_postal": 976
  },
  "generated_at_utc": "2026-08-16T02:08:55.624822+00:00",
  "hdb_2021_2026_geocoded": {
    "missing_postals": [
      "521400",
      "522400",
      "523400",
      "762936",
      "763936",
      "764936"
    ],
    "missing_rows": 6,
    "missing_unique_postals": 6,
    "row_miss_rate": 0.008075,
    "rows": 749,
    "rows_with_postal": 743,
    "sample_missing_postals": [
      "521400",
      "522400",
      "523400",
      "762936",
      "763936",
      "764936"
    ],
    "unique_miss_rate": 0.008075,
    "unique_postals": 743
  },
  "mcst_2021_2026": {
    "missing_postals": [
      "378720",
      "935456"
    ],
```

## Focused Web Tests

```text
npm --prefix C:\sgSHIOK2026\web test -- lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  2 passed (2)
      Tests  42 passed (42)
   Start at  22:44:39
   Duration  25.42s (transform 14.04s, setup 0ms, import 17.27s, tests 3.00s, environment 1ms)

[vitest-pool]: Timeout terminating forks worker for test files C:/sgSHIOK2026/web/lib/__tests__/accessibility-render.test.tsx.
```

## Tracking And Guards

```text
git check-ignore -v -- C:\sgSHIOK2026\qa\verification\P457-dated-public-source-check.md; Write-Output "EXIT=$LASTEXITCODE"
EXIT=1
```

```text
python C:\sgSHIOK2026\scripts\check_repo_integrity.py; Write-Output "EXIT=$LASTEXITCODE"
repo_integrity=ok
EXIT=0
```

```text
git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11 C:\sgSHIOK2026\qa\releases; Write-Output "EXIT=$LASTEXITCODE"
EXIT=0
```

## Diff Stat

```text
git diff --stat
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
 decisions.md                                    |  4 ++++
 web/app/page.tsx                                | 11 ++++++-----
 web/lib/__tests__/accessibility-render.test.tsx | 13 +++++++------
 web/lib/__tests__/score-card-copy.test.ts       |  9 +++++++--
 4 files changed, 24 insertions(+), 13 deletions(-)
```

## FINDINGS

1. The P19 public-source measurement has a concrete generation timestamp: `2026-08-16T02:08:55.624822+00:00`.
2. Browser copy previously described that cached measurement only as `recent`, which was less auditable than the surrounding dated freshness and DataMall checks.
3. The browser now names the `16 Aug 2026 public-source check` wherever it surfaces the generic recent-source miss signal and the known HDB missing-row status.
4. The focused web tests passed, but Vitest printed a post-pass worker-termination timeout for `accessibility-render.test.tsx`; exit code was still 0.

## DISAGREEMENTS

1. None.
