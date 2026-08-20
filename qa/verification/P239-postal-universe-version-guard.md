# P239 Postal Universe Version Guard

## Working root and host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Pre-change path scan

```text
C:\sgSHIOK2026\scripts\prepare-postal-universe.ps1:14:$UniversePath = "processed\postal_universe_${Mode}.parquet"
C:\sgSHIOK2026\scripts\prepare-postal-universe.ps1:15:$GeocodedPath = "processed\postal_universe_${Mode}_geocoded.parquet"
C:\sgSHIOK2026\scripts\prepare-postal-universe.ps1:58:    $UniverseArgs = @("run", "python", "run.py", "postal-universe", "--mode", $Mode)
C:\sgSHIOK2026\scripts\prepare-postal-universe.ps1:68:        "--output", $GeocodedPath,
C:\sgSHIOK2026\pipeline\postal_universe.py:1158:    output_path = output_path or PROCESSED_DIR / f"postal_universe_{mode}.parquet"
C:\sgSHIOK2026\pipeline\postal_universe.py:1159:    summary_path = summary_path or PROCESSED_DIR / f"postal_universe_{mode}_summary.json"
C:\sgSHIOK2026\pipeline\postal_universe.py:1160:    df.to_parquet(output_path, index=False)
```

## Evidence path ignore check

```text
exit=1
```

## Focused postal-universe tests

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 13 items

tests\test_postal_universe.py .............                              [100%]

============================= 13 passed in 18.61s =============================
```

## PowerShell parser check

```text
ps_parse_ok
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

1. The postal-universe wrapper still targeted unversioned `processed\postal_universe_<mode>` paths, conflicting with the standing v1/v2/v3 artifact rule.
2. The Python postal-universe builder wrote output and summary paths directly, so an existing artifact path could be overwritten.
3. The wrapper now defaults to `-Version v2`, writes versioned universe and geocoded paths, and refuses existing artifacts before running.
4. The Python builder now requires numeric version tags in output and summary filenames, and refuses to overwrite existing output or summary paths even when called directly.

## DISAGREEMENTS

1. None.
