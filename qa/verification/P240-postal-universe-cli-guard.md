# P240 Postal Universe CLI Guard

## Working root and host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Direct CLI unsafe-default check

```text
{
  "error": "postal universe output paths must include a numeric version tag such as _v2; got: C:\\sgSHIOK2026\\processed\\postal_universe_official_current.parquet, C:\\sgSHIOK2026\\processed\\postal_universe_official_current_summary.json",
  "ok": false
}
exit=2
```

## CLI help

```text
usage: postal_universe.py [-h]
                          [--mode {official_current,candidate_full_registered,candidate_full_all}]
                          [--download-missing] [--output OUTPUT]
                          [--summary SUMMARY] [--include-overture-candidate]
                          [--overture-candidate OVERTURE_CANDIDATE]

Build postal universe candidates.

options:
  -h, --help            show this help message and exit
  --mode {official_current,candidate_full_registered,candidate_full_all}
  --download-missing
  --output OUTPUT       New versioned parquet path, for example processed/post
                        al_universe_candidate_full_registered_v2.parquet.
  --summary SUMMARY     New versioned summary JSON path; defaults to <output
                        stem>_summary.json.
  --include-overture-candidate
                        Include the archived Overture Addresses SG candidate;
                        does not change defaults.
  --overture-candidate OVERTURE_CANDIDATE
                        Override archived Overture postcode-candidate parquet
                        path.
```

## Focused postal-universe tests

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 15 items

tests\test_postal_universe.py ...............                            [100%]

============================= 15 passed in 5.73s ==============================
```

## PowerShell parser check

```text
ps_parse_ok
```

## Evidence path ignore check

```text
exit=1
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

1. P239 prevented unsafe unversioned postal-universe outputs, but direct CLI calls still reported the unsafe default as a traceback.
2. Direct CLI calls now validate output paths before source loading and return a clean JSON error for unversioned defaults.
3. A versioned `--output` now infers a matching `<output stem>_summary.json`, so safe direct use does not require repeating the summary path.

## DISAGREEMENTS

1. None.
