# P464 README DataMall Discovery Date

## Startup guard

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

README operator guidance now names the dated 21 Aug 2026 metadata-only DataMall geospatial discovery result for Covered Linkway and bridge/underpass drift. This is documentation and test coverage only.

No scoring, export, rescore, subset run, ingest, network build, deployment, public data write, or input rebuild was run.

## Relevant pre-change README excerpt

```text
65: LTA geospatial listings such as Covered Linkway use a quarterly cadence with a
66: 120-day stale threshold, so a current local freshness result does not prove no
67: newer upstream release exists. To check DataMall geospatial discovery links
68: without downloading payloads or writing the manifest, run
69: `uv run python run.py check --geospatial-discovery-only`; a nonzero result means
70: the current discovery URL differs from frozen v1 and any approved refresh must
71: be a new numbered input version, not an in-place repair.
```

## Focused test

```text
....                                                                     [100%]
4 passed in 0.65s
```

## Evidence path ignore check

```text
EXIT=1
```

## Repository integrity

```text
repo_integrity=ok
EXIT=0
```

## Changed files

```text
README.md
decisions.md
tests/test_readme.py
qa/verification/P464-readme-datamall-discovery-date.md
```

## FINDINGS

1. README still had the generic DataMall geospatial discovery warning after the browser and readiness policy had been updated with the dated 21 Aug 2026 result. This left operator guidance less specific than user-facing and machine-readable release guidance.
2. The update is zero pipeline cost: it changes README prose, a README assertion, this evidence file, and decisions.md only.

## DISAGREEMENTS

1. None.
