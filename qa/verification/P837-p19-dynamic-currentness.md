# P837 P19 Dynamic Currentness

Date: 2026-08-29
Working root: `C:\sgSHIOK2026`
Machine: `PRAWN-E14`

## Symptom Contract

Expected: batch-plan and production-readiness should report whether the P19 v2 sample is currently fresh by using the same read-only status command as `run.py p19-gap-status`.

Observed before fix: both report surfaces embedded a static `fresh_for_current_gap_sizing: true` policy block with `stale_after_utc: 2026-09-04T21:15:15.685030+00:00`, which would become false after that date while still printing as true.

Scope: free-tier reporting only. No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected-payload mutation, or locked-weight change was performed.

## Startup State

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
5cd69d98318d48207287af1dd254d19a8c74f514
5cd69d98318d48207287af1dd254d19a8c74f514	refs/heads/main
```

## Trackability

Command:

```text
git check-ignore -v qa/verification/P837-p19-dynamic-currentness.md; Write-Output "exit_code=$LASTEXITCODE"
```

Output:

```text
exit_code=1
```

## Dynamic Policy Probe

Command:

```text
uv run python -c "import json; from pipeline.batch_plan import build_batch_plan; ok, report = build_batch_plan(mode='candidate_full_registered', environment={}); sample = report['source_policy']['recent_public_source_gap_sample']; print(json.dumps({'ok': ok, 'summary_path': sample['summary_path'], 'detail_path': sample['detail_path'], 'currentness': sample['currentness'], 'evidence_split': sample['evidence_split']}, indent=2, sort_keys=True))"
```

Output:

```json
{
  "currentness": {
    "dynamic_status_command": "uv run python run.py p19-gap-status",
    "fresh_for_current_gap_sizing": true,
    "max_age_days": 0.204,
    "reason": "the cached v2 sample is fresh current-source evidence; promotion still requires explicit owner approval and candidate-source-first scope",
    "status": "fresh",
    "summary": "cached P19 sample age 0.204d is within the 7d current-gap sizing threshold",
    "threshold_days": 7.0
  },
  "detail_path": "qa/p19/universe_gap_measurement_detail_v2.json",
  "evidence_split": {
    "confirmed_missing_address_rows": 6,
    "coordinate_backed_hdb_missing_rows": 6,
    "source_quality_warning_rows": 2,
    "unvalidated_mcst_proxy_rows": 2
  },
  "ok": true,
  "summary_path": "qa/p19/universe_gap_measurement_summary_v2.json"
}
```

Command:

```text
uv run python -c "import json; from scripts.production_readiness import readiness_features; features = readiness_features(); sample = features['source_policy']['recent_public_source_gap_sample']; print(json.dumps({'evidence_split': features['recent_public_source_gap_evidence_split'], 'summary_path': sample['summary_path'], 'detail_path': sample['detail_path'], 'currentness': sample['currentness']}, indent=2, sort_keys=True))"
```

Output:

```json
{
  "currentness": {
    "dynamic_status_command": "uv run python run.py p19-gap-status",
    "fresh_for_current_gap_sizing": true,
    "max_age_days": 0.204,
    "reason": "the cached v2 sample is fresh current-source evidence; promotion still requires explicit owner approval and candidate-source-first scope",
    "status": "fresh",
    "summary": "cached P19 sample age 0.204d is within the 7d current-gap sizing threshold",
    "threshold_days": 7.0
  },
  "detail_path": "qa/p19/universe_gap_measurement_detail_v2.json",
  "evidence_split": {
    "confirmed_missing_address_rows": 6,
    "coordinate_backed_hdb_missing_rows": 6,
    "source_quality_warning_rows": 2,
    "unvalidated_mcst_proxy_rows": 2
  },
  "summary_path": "qa/p19/universe_gap_measurement_summary_v2.json"
}
```

## Stale Fixture Probe

Command:

```text
uv run python -c "import json; from pipeline.batch_plan import recent_public_source_gap_sample_policy; policy=recent_public_source_gap_sample_policy({'files': {'summary': {'path': 'qa\\p19\\universe_gap_measurement_summary_v2.json', 'generated_at_utc': '2026-08-28T21:15:15.685030+00:00'}, 'detail': {'path': 'qa\\p19\\universe_gap_measurement_detail_v2.json'}}, 'currentness': {'status': 'stale', 'max_age_days': 8.25, 'fresh_for_current_gap_sizing': False, 'threshold_days': 7.0, 'summary': 'cached P19 sample age 8.25d exceeds the 7d current-gap sizing threshold; refresh requires explicit owner approval and new versioned outputs'}}); print(json.dumps({'summary_path': policy['summary_path'], 'detail_path': policy['detail_path'], 'currentness': policy['currentness'], 'evidence_split': policy['evidence_split']}, indent=2, sort_keys=True))"
```

Output:

```json
{
  "currentness": {
    "dynamic_status_command": "uv run python run.py p19-gap-status",
    "fresh_for_current_gap_sizing": false,
    "max_age_days": 8.25,
    "reason": "the cached v2 sample is not fresh current-source evidence; refresh requires explicit owner approval and new versioned outputs before promotion",
    "status": "stale",
    "summary": "cached P19 sample age 8.25d exceeds the 7d current-gap sizing threshold; refresh requires explicit owner approval and new versioned outputs",
    "threshold_days": 7.0
  },
  "detail_path": "qa/p19/universe_gap_measurement_detail_v2.json",
  "evidence_split": {
    "confirmed_missing_address_rows": 6,
    "coordinate_backed_hdb_missing_rows": 6,
    "source_quality_warning_rows": 2,
    "unvalidated_mcst_proxy_rows": 2
  },
  "summary_path": "qa/p19/universe_gap_measurement_summary_v2.json"
}
```

## Tests

```text
........                                  [100%]
39 passed in 194.86s (0:03:14)
```

## FINDINGS

1. Batch-plan and production readiness were carrying a time-sensitive P19 currentness truth as a static policy literal; it would have continued saying the P19 v2 sample was current after the 7-day window expired.
2. The fix keeps the stable P19 v2 measurement facts literal, but overlays the currentness block from the same read-only `p19-gap-status` machinery used by operators.
3. Report-facing P19 evidence paths are normalized to forward slashes even when the status command reports Windows backslash paths.

## DISAGREEMENTS

1. None.
