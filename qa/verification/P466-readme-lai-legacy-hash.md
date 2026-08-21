# P466 README Legacy Leaf Area Index Hash Boundary

## Startup guard

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

README operator guidance now distinguishes the published legacy bundle's `leaf_area_index` source hash from the future policy that excludes LAI from score provenance. LAI remains a freshness/reference table only, not route geometry, shade-proxy geometry, or score evidence.

No scoring, export, rescore, subset run, ingest, network build, deployment, public data write, or input rebuild was run.

## Published manifest source-hash check

```text
source_hash_count=14
leaf_area_index=26281dbacf4d8707df48d40b83060c65bf81c3f1a39ff81aebaefb8fd628c899
```

## Focused test

```text
....                                                                     [100%]
4 passed in 6.56s
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
qa/verification/P466-readme-lai-legacy-hash.md
```

## FINDINGS

1. README said NParks Leaf Area Index was not score provenance, but the published legacy manifest carries `leaf_area_index` in `provenance.source_hashes`. That wording was too broad even though the policy direction was correct.
2. The corrected wording preserves the P23/P181 decision: LAI is a non-score reference source hash in legacy provenance and is excluded from future score provenance unless a separate route-level canopy model is approved.

## DISAGREEMENTS

1. None.
