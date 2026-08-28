# P810 Agent Docs P19 v2 Alignment

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

Update agent-facing operating context so it matches the P19 v2 source-policy status already exposed by README, runner help, `universe-status`, production-readiness, and the web Data limits copy.

No scoring, export, rescore, subset run, ingest, network build, public-data mutation, protected evidence mutation, deployment, or locked-weight change was performed.

## Startup Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Ignored Evidence Check

```text
exit_code=1
```

`git check-ignore -v qa/verification/P810-agent-docs-p19-v2.md` returned exit 1, so this evidence file is trackable.

## Stale Surface Found

```text
CLAUDE.md:10:OneMap-derived postal scrape. The 16 Aug 2026 P19 public-source sample found 6
CLAUDE.md:14:unvalidated MCST proxy warnings. P125's 20 Aug 2026 Overpass coverage cross-check
CLAUDE.md:15:found 25,879 valid distinct OSM `addr:postcode` values, of which 25,873
tests\test_agent_docs.py:25:        "The 16 Aug 2026 P19 public-source sample found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) sampled 2021-2026"
tests\test_agent_docs.py:35:    assert "P125's 20 Aug 2026 Overpass coverage cross-check found 25,879 valid distinct OSM `addr:postcode` values" in normalized
tests\test_agent_docs.py:38:    assert "25,873 overlap frozen v1 and 6 are valid OSM-only postcodes" in normalized
```

## Change

`CLAUDE.md` now describes the current P19 v2 28 Aug 2026 public-source sample and the same run's Overpass coverage values:

```text
25,919 valid distinct OSM `addr:postcode` values
25,899 overlap frozen v1
20 valid OSM-only postcodes
```

The task runner list still includes `p125-osm-status` as a historical no-write report command.

## Verification

```text
..                                                                       [100%]
2 passed in 1.13s
```

```text
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs
tests/test_triage_onemap_outliers.py::test_triage_cli_refuses_existing_explicit_output_before_input_reads

629 tests collected in 11.33s
exit_code=0
```

```text
repo_integrity=ok
exit_code=0
```

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

## FINDINGS

1. Agent-facing context was lagging behind the operator and browser surfaces after P808/P809: `CLAUDE.md` still named the 16 Aug P19 sample and P125's 20 Aug Overpass coverage values.
2. The stale text was guarded by `tests/test_agent_docs.py`, so the test suite would have preserved the old context until the assertions were updated.
3. `p125-osm-status` remains valid as a historical report command; the correction is about which measurement is described as current source-policy context.

## DISAGREEMENTS

1. None.
