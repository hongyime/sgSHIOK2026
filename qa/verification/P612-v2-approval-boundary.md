# P612 v2 approval boundary

## Root guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

```text
No scoring, export, rescore, subset run, ingest, network build, upstream API probe, input mutation, protected QA mutation, public-data write, deployment, or locked-weight change was performed.
```

## Head before commit

```text
517aaf0143f33560415dc78818996a7c9d02f0f3
517aaf0143f33560415dc78818996a7c9d02f0f3	refs/heads/main
 decisions.md                       |  4 ++++
 pipeline/batch_plan.py             | 20 +++++++++++++++++++-
 tests/test_batch_plan.py           | 20 +++++++++++++++++++-
 tests/test_production_readiness.py | 20 +++++++++++++++++++-
 4 files changed, 61 insertions(+), 3 deletions(-)
```

## Source policy probe

Command:

```text
uv run python -c "import json; from pipeline.batch_plan import build_batch_plan; ok, report = build_batch_plan(mode='candidate_full_registered'); print('ok=' + str(ok).lower()); print(json.dumps(report['source_policy']['recent_public_source_gap_sample'], indent=2, sort_keys=True))"
```

Output:

```text
ok=true
{
  "cache_status_calls_apis": false,
  "cache_status_command": "uv run python run.py p19-gap-status",
  "cache_status_reports_age_days": true,
  "cache_status_reports_hdb_cluster_coordinates": true,
  "cache_status_reports_mcst_proxy_location_probe": true,
  "cache_status_reports_missing_development_clusters": true,
  "cache_status_reports_missing_rows": true,
  "cache_status_writes_files": false,
  "confirmed_missing_pct": 0.614754,
  "coordinate_backed_hdb_missing_development_clusters": [
    {
      "coordinate_source": "cached_onemap_search_result",
      "development": "SUN PLAZA SPRING",
      "missing_postals": [
        "521400",
        "522400",
        "523400"
      ],
      "missing_rows": 3,
      "year_completed": 2026
    },
    {
      "coordinate_source": "cached_onemap_search_result",
      "development": "YISHUN BEACON",
      "missing_postals": [
        "762936",
        "763936",
        "764936"
      ],
      "missing_rows": 3,
      "year_completed": 2026
    }
  ],
  "detail_path": "qa/p19/universe_gap_measurement_detail.json",
  "directional_scale_if_sample_rate_applied_to_v1": {
    "basis": "directional only; applies sampled recent-completion row rates to the frozen-v1 distinct postal count, not a measured full-universe gap",
    "confirmed_missing_rows_estimate": 765,
    "missing_or_source_quality_warning_rows_estimate": 1020,
    "v1_distinct_postals": 124443
  },
  "evidence_split": {
    "confirmed_missing_address_rows": 6,
    "coordinate_backed_hdb_missing_rows": 6,
    "source_quality_warning_rows": 2,
    "unvalidated_mcst_proxy_rows": 2
  },
  "generated_at_utc": "2026-08-16T02:08:55.624822+00:00",
  "mcst_proxy_location_probe": {
    "cache_path": "qa/p379/p19_mcst_missing_onemap_cache.json",
    "command": "uv run python run.py p19-mcst-locations",
    "command_calls_apis": false,
    "command_writes_files": false,
    "conflicting_candidate_postals": {
      "CANAAN": {
        "candidate_postals": [
          "387720"
        ],
        "recorded_postal": "378720"
      }
    },
    "located_rows": 0,
    "mcst_missing_rows": 2,
    "report_path": "qa/p379/p19_mcst_missing_locations_report.json",
    "unlocated_developments": [
      "CANAAN",
      "MYRA"
    ],
    "unlocated_rows": 2,
    "verdict": "MCST proxy rows remain unvalidated; HDB clusters are the coordinate-backed actionable gap",
    "will_export": false,
    "will_mutate_p19": false,
    "will_score": false
  },
  "measurement": "P19 16 Aug 2026 public-source gap sample",
  "missing_or_source_quality_warning_pct": 0.819672,
  "missing_pct": 0.819672,
  "missing_postals_by_source": {
    "hdb_2021_2026_geocoded": [
      "521400",
      "522400",
      "523400",
      "762936",
      "763936",
      "764936"
    ],
    "mcst_2021_2026": [
      "378720",
      "935456"
    ]
  },
  "missing_rows": 8,
  "source_limitations": [
    "HDB rows use completion year but require OneMap geocoding to obtain postals",
    "BCA MCST constitution date is private-strata onboarding proxy evidence, not TOP or completion date"
  ],
  "source_rows_with_postals": 976,
  "source_window": "2021-2026",
  "sources": [
    "HDB completion geocoded rows",
    "BCA MCST constitution-date proxy rows"
  ],
  "summary_path": "qa/p19/universe_gap_measurement_summary.json",
  "v2_build_decision": {
    "reason": "current cached sample indicates a small gap; building postal-universe v2 requires separate owner approval and candidate-source-first scope",
    "status": "not_approved_from_current_sample"
  },
  "verdict": "small sampled current-source gap in frozen v1; v2 remains candidate-source-first if approved"
}
```

## Live batch-plan probe

```text
uv run python run.py batch-plan
```

Selected output from `source_policy.recent_public_source_gap_sample`:

```text
"confirmed_missing_pct": 0.614754
"missing_or_source_quality_warning_pct": 0.819672
"directional_scale_if_sample_rate_applied_to_v1": {"confirmed_missing_rows_estimate": 765, "missing_or_source_quality_warning_rows_estimate": 1020, "v1_distinct_postals": 124443}
"v2_build_decision": {"status": "not_approved_from_current_sample", "reason": "current cached sample indicates a small gap; building postal-universe v2 requires separate owner approval and candidate-source-first scope"}
"verdict": "small sampled current-source gap in frozen v1; v2 remains candidate-source-first if approved"
```

## Readiness gate probe

```text
uv run python run.py readiness --gate-summary
```

Selected output:

```text
[production-readiness] readiness report complete
"ok": true
"release_gate_passed": false
"release_gate_status": "blocked"
"static_artifact_validation": {"errors": [], "ok": true, "warnings": []}
"scoring_fingerprint_status": {"blocking_provenance_signals": [], "ok": true, "state": "legacy"}
"onemap_validation": {"gate_passed": false, "invalid_cache_results": 62, "missing_cache_results": 0, "sample_size": 95157, "cached_results": 95095, "state": "failed"}
```

## Tests and guards

Focused tests:

```text
uv run pytest tests/test_batch_plan.py tests/test_production_readiness.py -q
36 passed in 155.13s (0:02:35)
```

Collect-only:

```text
uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 23.49s
```

Repository integrity:

```text
python scripts/check_repo_integrity.py
Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

Evidence path ignore check:

```text
git check-ignore -v qa/verification/P612-v2-approval-boundary.md
Write-Output "exit=$LASTEXITCODE"
exit=1
```

Protected diff:

```text
protected_diff=clean
exit=0
```

## FINDINGS

1. The current cached public-source sample is a scale signal, not approval to build postal-universe v2: 0.614754% confirmed missing rows and 0.819672% warning-inclusive rows directionally imply 765 or 1,020 rows against the frozen 124,443-postal v1, but this is not a measured full-universe gap.
2. Batch-plan and readiness source-policy output now record `v2_build_decision.status = not_approved_from_current_sample`.
3. Any later postal-universe v2 remains candidate-source-first and owner-approved; this change intentionally does not build v2, probe APIs, mutate inputs, score, export, deploy, or touch locked weights.

## DISAGREEMENTS

1. None.
