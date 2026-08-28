# P700 shelter audit output guard

## Working root

```text
C:\sgSHIOK2026
```

## Existing hardcoded outputs

```text
present 666958 C:\sgSHIOK2026\qa\560234_shelter_audit.geojson
present 9123 C:\sgSHIOK2026\qa\560234_shelter_audit_notes.md
qa/560234_shelter_audit.geojson
qa/560234_shelter_audit_notes.md
exit=1
```

## CLI no-argument guard

```text
{
  "errors": [
    "560234 shelter audit requires explicit --geojson-output",
    "560234 shelter audit requires explicit --notes-output"
  ]
}
exit=2
```

## Focused tests

```text
..                                                                       [100%]
2 passed in 21.53s
```

## Test collection

```text
471 tests collected in 14.01s
```

## Repository integrity

```text
repo_integrity=ok
exit=0
```

## Diff hygiene

```text
exit=0
```

## Protected-path guard

```text
exit=0
```

## Evidence ignore check

```text
exit=1
```

## FINDINGS

1. `scripts/audit_560234_shelter.py` had hardcoded tracked QA outputs and no explicit-output CLI. A no-argument run could replace both the GeoJSON and markdown audit evidence after doing heavy geospatial work.
2. The script now requires explicit `--geojson-output` and `--notes-output` before loading audit inputs, and refuses existing explicit paths.

## DISAGREEMENTS

1. None.
