# P251 freshness cadence interpretation

Root: `C:\sgSHIOK2026`
Host: `PRAWN-E14`
Date: 2026-08-21

## Scope

The README documented the zero-mutation source-age check but did not explicitly say that LTA geospatial `current` means within a local quarterly/120-day freshness policy, not proof that no newer upstream release exists. This phase adds that operator caveat and guards it in `tests/test_readme.py`.

No scoring, export, rescore, subset run, ingest, network build, deployment, upstream probe, input mutation, public-data mutation, or locked weight change was run.

## Commands

```text
uv run pytest C:\sgSHIOK2026\tests\test_readme.py -p no:cacheprovider
```

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 3 items

tests\test_readme.py ...                                                 [100%]

============================== 3 passed in 0.65s ==============================
```

```text
rg -n "LTA geospatial listings such as Covered Linkway|120-day stale threshold|does not prove no newer upstream release exists" C:\sgSHIOK2026\README.md C:\sgSHIOK2026\tests\test_readme.py
```

```text
C:\sgSHIOK2026\tests\test_readme.py:59:    assert "LTA geospatial listings such as Covered Linkway use a quarterly cadence" in normalized
C:\sgSHIOK2026\tests\test_readme.py:60:    assert "120-day stale threshold" in normalized
C:\sgSHIOK2026\tests\test_readme.py:61:    assert "does not prove no newer upstream release exists" in normalized
C:\sgSHIOK2026\README.md:52:LTA geospatial listings such as Covered Linkway use a quarterly cadence with a
C:\sgSHIOK2026\README.md:53:120-day stale threshold, so a current local freshness result does not prove no
```

## FINDINGS

1. README freshness guidance did not explicitly tell operators that LTA geospatial `current` is policy-relative rather than proof that upstream has no newer release.
2. README now records the quarterly/120-day interpretation for Covered Linkway-class sources and tells operators to check upstream before an approved release batch.

## DISAGREEMENTS

1. None.
