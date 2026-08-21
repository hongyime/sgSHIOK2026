# P542 Browser Freshness Priority

## Scope

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

Change: align browser first-view data-freshness copy with the prioritized manifest-only freshness report.

Hard limits observed:
- No scoring, export, rescore, subset run, ingest, network build, or deployment was run.
- No upstream API probes were run.
- `pipeline/config/weights.yaml` was not modified.
- Existing protected QA evidence, `web/public/data/`, `qa/releases/`, and `checksums.json` were not modified.
- Existing `qa/verification/` evidence was not rewritten.

## Command Output

### Working Root

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

### git check-ignore -v qa/verification/P542-browser-freshness-priority.md

```text
exit_code=1
```

### npm --prefix web test -- --runInBand score-card-copy.test.ts

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --runInBand score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  05:59:44
   Duration  2.81s (transform 303ms, setup 0ms, import 387ms, tests 135ms, environment 0ms)
```

### npm --prefix web test -- --runInBand --reporter=dot

```text
 Test Files  23 passed (23)
      Tests  147 passed (147)
   Start at  06:00:04
   Duration  14.58s (transform 10.24s, setup 0ms, import 14.31s, tests 23.56s, environment 13ms)
```

### uv run pytest -q --collect-only | Select-Object -Last 5

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

437 tests collected in 18.38s
```

### python scripts/check_repo_integrity.py

```text
repo_integrity=ok
exit_code=0
```

### git diff --check

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

### Protected Diff Guard

Command:

```text
git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases qa/p11
```

Output:

```text
```

## FINDINGS

1. The browser first-view freshness copy still listed stale sources in an older order and did not name the days-left value for the oldest current source.
2. The browser now says NParks Leaf Area Index is 6.4 days from its 120-day threshold.
3. The browser now lists stale sources by days past threshold, led by Planning Area Boundaries, NParks Tracks, and NParks Heritage Road Green Buffers, matching the prioritized readiness report.

## DISAGREEMENTS

1. None.
