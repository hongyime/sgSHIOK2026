# P236 README Leaf Area Index Policy

## Working root and host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Policy evidence

```text
C:\sgSHIOK2026\decisions.md:69:2026-08-16 - P23 Leaf Area Index provenance policy:
C:\sgSHIOK2026\decisions.md:70:NParks Leaf Area Index is a species/generic reference table, not route-level geometry. The raw XLSX has a version sheet, an explanatory calculation sheet, and a 1,609-row plant list with species names and generic LAI values, but no coordinates, polygons, or network-edge coverage. Wiring it into the current shade proxy would require a separate species-located canopy inventory and model design, plus a network rebuild and rescore; doing that implicitly from a reference table would overstate the evidence. Future score records therefore exclude `leaf_area_index` from per-record score `source_hashes`. `raw/manifest.json` and source freshness can still track the file as an upstream reference candidate, but score provenance now names only sources that affect scoring or route evidence.
C:\sgSHIOK2026\decisions.md:531:Production readiness should expose the score-source hash policy by key name, not only by count. The active policy has 13 score-affecting source keys and excludes `leaf_area_index`; readiness now reports expected, present, missing, unexpected, and non-score reference source hashes so a future bundle that leaks reference-only inputs into score provenance is visible without blocking verified legacy artifacts. This is readiness reporting and test coverage only; it does not alter source manifests, scoring, exports, public data, deployment, or locked weights.
```

## Evidence path ignore check

```text
exit=1
```

## Focused README test

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 3 items

tests\test_readme.py ...                                                 [100%]

============================== 3 passed in 1.08s ==============================
```

## Repo integrity

```text
repo_integrity=ok
exit=0
```

## Locked weights diff

```text
```

## FINDINGS

1. Leaf Area Index is already excluded from score provenance and treated as a non-score reference table, but README onboarding did not expose that distinction beside the freshness-only command.
2. README now states that Leaf Area Index can appear in freshness as a tracked reference table, but is not route geometry, shade-proxy geometry, or score provenance.

## DISAGREEMENTS

1. None.
