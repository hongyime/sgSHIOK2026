# P65 README Universe Status

## Root Guard

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Starting State

```text
b6b8ca8 docs: record OneMap enumeration feasibility
f98beac docs: record OSM postcode coverage measurement
75129e4 fix: summarize stale freshness source keys
8752851 fix: name stale source categories in title card
```

## Change

README now includes a `Universe status` section that records the current v1/v2 source policy:

```text
The current postal universe is frozen v1: a 124,443-record source-derived set
built around a June 2020 OneMap-derived postal scrape and later local sources.
Recent public-source checks found a small current-completion gap: 8 missing rows
out of 976 HDB/MCST completion rows from 2021-2026 with postals. Live OSM
`addr:postcode` covers only 25,873 of the 124,443 frozen postals, so OSM remains
geometry evidence rather than an address registry. OneMap Search validates and
geocodes known candidates, but it is a keyword search endpoint, not a national
postal enumerator. Any v2 universe should therefore be candidate-source-first:
use current free source datasets to propose rows, then pass bounded candidates
through OneMap Search under explicit rate and token controls.
```

## README Term Checks

Command:

```text
rg -n "frozen v1|8 missing rows out of 976|25,873 of the 124,443|keyword search endpoint|candidate-source-first" README.md
```

Output:

```text
15:The current postal universe is frozen v1: a 124,443-record source-derived set
19:`addr:postcode` covers only 25,873 of the 124,443 frozen postals, so OSM remains
21:geocodes known candidates, but it is a keyword search endpoint, not a national
22:postal enumerator. Any v2 universe should therefore be candidate-source-first:
positive_exit=0
```

Command:

```text
rg -n "OSM remains|geometry evidence|OneMap Search validates|geocodes known candidates" README.md
```

Output:

```text
19:`addr:postcode` covers only 25,873 of the 124,443 frozen postals, so OSM remains
20:geometry evidence rather than an address registry. OneMap Search validates and
21:geocodes known candidates, but it is a keyword search endpoint, not a national
line_local_policy_exit=0
```

## Guard Outputs

Command:

```text
python scripts/check_repo_integrity.py
```

Output:

```text
repo_integrity=ok
```

Command:

```text
git diff --check
git diff -- pipeline/config/weights.yaml
```

Output:

```text
```

## FINDINGS

1. README onboarding now carries the current universe policy instead of only a generic `124,443-record source-derived universe` line.
2. The README now links the P19/P63/P64 conclusions in one place: frozen v1, 8/976 recent-completion miss signal, OSM not an address registry, and OneMap Search as bounded candidate validation/geocoding.
3. No scoring, export, rescore, subset run, ingest, network build, input rebuild, public data write, deployment, API collection, or weight change was run.

## DISAGREEMENTS

1. None.
