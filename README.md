# S.H.I.O.K. Shelter Map

A free, non-commercial civic web app for Singapore postal records that answers:
if I move here, what is the walk to transit actually like? It leads with the
covered-walkway ratio and exposed gaps on real routed walks, adds night-lighting
evidence as a map layer, and keeps the locked SHIOK score visible but secondary.

**Status:** live static shelter-map pilot over a 124,443-record source-derived universe.
Current product decisions and known evidence limits are tracked in `decisions.md`.
**Environment:** Windows 11, native pipeline work. No WSL, no Docker, no paid services.
GitHub Actions exists for repository automation and CI, not for heavy pipeline compute.

## Universe status

The current postal universe is frozen v1: a 124,443-record source-derived set
built around a June 2020 OneMap-derived postal scrape and later local sources.
Recent public-source checks found a small current-source gap: 6 coordinate-backed
HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) 2021-2026
public-source rows with postals. The
P125 live Overpass measurement found OSM `addr:postcode` covers only 25,873 of
the 124,443 frozen postals, so OSM remains geometry evidence rather than an
address registry. OneMap Search validates and
geocodes known candidates, but it is a keyword search endpoint, not a national
postal enumerator. Any v2 universe should therefore be candidate-source-first:
use current free source datasets to propose rows, then pass bounded candidates
through OneMap Search under explicit token controls, 72-hour token refresh, and
the current documented token-authenticated call-limit cap unless SLA approves a
higher limit case-by-case. To inspect the cached P19 measurement, missing rows,
MCST proxy probe and cache ages without calling data.gov.sg, OneMap, or
Overpass, run
`uv run python run.py p19-gap-status`. To reprint the cached P125 OSM coverage
measurement and cache ages without calling Overpass or writing files, run
`uv run python run.py p125-osm-status`.

## Local data artifacts

Fresh clones do not contain the large or gitignored local payloads under `raw/`,
`processed/`, `web/public/data/`, or historical QA scratch directories. The live
shelter-map bundle remains configured as
`web/public/data/generated_20260805_prefer_scored_routed/`. That bundle has
95,157 full locked scores out of 124,443 records; 29,286 records, 23.5% or roughly a quarter, do
not show a full locked score because they have partial shelter-map evidence, are
beyond locked transit range, or are awaiting scoring. The night-lighting map
layer is a separate local artifact at `web/public/data/lamp_posts_v1/`: 700 H3-r8
tile files plus `manifest.json`, 126,144 LTA lamp-post points, source last
modified 7 Jul 2026. It is map evidence only and is not part of the locked score.

Before any Vercel publish attempt, run `uv run python run.py readiness`.
That readiness check validates the shelter-map bundle and also verifies that the local
lamp overlay artifact is present and internally consistent. Do not rebuild,
overwrite, or mutate existing public data directories to repair a missing
artifact; copy or create only a new versioned artifact after owner approval.
For a zero-mutation source-age check, run
`uv run python run.py check --freshness-only`; it reads `raw/manifest.json` and
`pipeline/config/sources.yaml` only, does not probe upstream APIs, and reports
current, stale, manual, and unknown-age sources. NParks Leaf Area Index can
appear in freshness as a tracked reference table, but it is not route geometry,
shade-proxy geometry, or score provenance.
LTA geospatial listings such as Covered Linkway use a quarterly cadence with a
120-day stale threshold, so a current local freshness result does not prove no
newer upstream release exists. To check DataMall geospatial discovery links
without downloading payloads or writing the manifest, run
`uv run python run.py check --geospatial-discovery-only`; a nonzero result means
the current discovery URL differs from frozen v1 and any approved refresh must
be a new numbered input version, not an in-place repair.

Before any full geocode, scoring, or release batch, run both
`uv run python run.py readiness` and `uv run python run.py batch-plan`. The
next full-batch release is approved in principle but is not approved to run. It
is one attempt only, requires explicit owner approval before execution, and must
bundle the bus remodel, the `NO_TRANSIT_IN_RANGE` partial-score fix, network
conflation repair, and any approved postal-universe v2 promotion after each
change passes on the 1,200-record subset. Do not run piecemeal full-bundle
reruns, deploy, or repoint the live site without explicit owner approval.

## Repo map

- `CLAUDE.md` — agent instructions: hard constraints, stack, layout, conventions. Read first.
  (Using a non-Claude agent? It still applies — point your agent at it explicitly.)
- `decisions.md` — durable decision log. Append evidence and rationale; do not overwrite.
- `pipeline/config/weights.yaml` — locked score weights.
- `pipeline/config/params.yaml` — tunable pipeline constants.
- `.github/workflows/` — CI and repository automation workflows.
- `env.example` — copy to `.env` and fill in (see prerequisites).
- `run.py` — cross-platform task runner for safe reports (`check --freshness-only`,
  `check --geospatial-discovery-only`, `p19-gap-status`, `p125-osm-status`, `readiness`, `batch-plan`)
  and gated pipeline tasks (`ingest`, `network`, `score`, `export`, `validate`,
  `publish`, `test`). `publish` always runs `validate` first.

## Human prerequisites (do these once — agents can't register accounts)

1. Install **Python 3.12+** and **uv** (https://docs.astral.sh/uv/), **Node LTS**, and **Git**.
2. One-time Windows setup, in an elevated PowerShell:
   - `git config --global core.longpaths true`
   - Enable long paths: `Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name LongPathsEnabled -Value 1`
   - Set UTF-8 for Python: `setx PYTHONUTF8 1`
   - (Optional, speeds up raw-data I/O): add the repo's `raw\` folder to Microsoft Defender exclusions.
3. Register a free **LTA DataMall** account → `AccountKey` (datamall.lta.gov.sg).
4. Register a free **OneMap** developer account (onemap.gov.sg).
5. `copy env.example .env` and fill in the credentials.
6. `npm i -g vercel`, then `vercel login` once (Hobby tier, no card).

## Kickoff prompt for the coding agent

> Read README.md, CLAUDE.md, decisions.md, pipeline/config/weights.yaml, and
> pipeline/config/params.yaml. Infer missing product context from code, tests, and tracked
> release evidence. Verify acceptance criteria before moving on. Log durable decisions in
> decisions.md. This machine is Windows 11 — PowerShell commands only, no WSL, no Docker.

## Ground rules (enforced in CLAUDE.md — summary)

$0 budget, no paid services, Vercel Hobby only, no Cloudflare; all heavy compute runs
natively on this Windows machine (uv-managed Python); runtime backend surface is limited to
the two current OneMap helper routes; all routing runs in python-igraph on the project's own
graph; published score values, coordinates and route origins have been independently verified,
while the active legacy bundle predates record-level scoring-input and network provenance.

## License And Attribution

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE). Source data and map
attribution are recorded in [ATTRIBUTION.md](ATTRIBUTION.md).
