# S.H.I.O.K. Shelter Map

A free, non-commercial civic web app for Singapore postal records that answers:
if I move here, what is the walk to transit actually like? It leads with the
covered-walkway ratio and exposed gaps on real routed walks, adds night lighting
evidence as a map layer, and keeps the locked SHIOK score visible but secondary.

**Status:** live static shelter-map pilot over the frozen v1 124,443-record universe.
Current product decisions and known evidence limits are tracked in `decisions.md`.
**Environment:** Windows 11, native pipeline work. No WSL, no Docker, no paid services.
GitHub Actions exists for repository automation and CI, not for heavy pipeline compute.

## Universe status

The current postal universe is frozen v1: 124,443 records built around a June
2020 OneMap-derived postal scrape plus later local route and source evidence.
The P19 v2 28 Aug 2026 public-source sample found a small sampled current-source gap: 6
coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of
976 sampled 2021-2026 public-source rows with postals. That is 0.61%
confirmed missing rows, or 0.82% including source-quality warnings. If that
sample row rate were applied to the 124,443 frozen v1 distinct postals, the
directional scale would be 765 confirmed missing rows, or 1,020 including
warnings; that is sampled evidence, not a measured full-universe gap or
approval to promote v2. Use `uv run python run.py p19-gap-status` to check
whether the cached sample is still current under the 7-day sample policy before
using it for current gap sizing. The confirmed HDB gaps are SUN PLAZA SPRING
and YISHUN BEACON, three postals each; CANAAN and MYRA remain unvalidated MCST
proxy warnings. The same P19 v2 run's Overpass coverage cross-check found
25,919 valid distinct OSM `addr:postcode` values: 25,899 overlap the 124,443
frozen postals and 20 are valid OSM-only postcodes, so OSM remains geometry
evidence rather than an address registry. OneMap Search validates and
geocodes known candidates, but it is a keyword search endpoint, not a national
postal enumerator. Any v2 universe should therefore be candidate-source-first:
use current free source datasets to propose rows, then pass bounded candidates
through OneMap Search under explicit token controls, 72-hour token refresh, and
the current documented token-authenticated call-limit cap unless SLA approves a
higher limit case-by-case. To inspect the cached P19 v2 28 Aug 2026 public-source
sample, evidence split, missing rows, P19 v2 Overpass coverage, unvalidated MCST proxy probe and cache ages without calling data.gov.sg, OneMap, or
Overpass, run
`uv run python run.py p19-gap-status`. To reprint the older cached P125 OSM
coverage cross-check, registry policy, and cache ages without calling Overpass
or writing files, run
`uv run python run.py p125-osm-status`. To see both postal-universe
measurements in one no-API/no-write report, run
`uv run python run.py universe-status`; it sizes the frozen-v1 gap but does not
approve building or promoting v2. The consolidated report includes the P19
confirmed-missing and confirmed-plus-warning sample rates and the P19 v2
OSM-only-postcode share of the frozen v1 universe; P125 remains a historical
OSM-only status report.

## Local data artifacts

Fresh clones do not contain the large or gitignored local payloads under `raw/`,
`processed/`, `web/public/data/`, or historical QA scratch directories. The live
shelter-map bundle remains configured as
`web/public/data/generated_20260805_prefer_scored_routed/`. That bundle has
locked-score coverage for 95,157 of 124,443 records; 29,286 records, 23.5% or roughly a quarter, do
not show a full locked score because they have partial shelter-map evidence, are
beyond locked transit range, or lack published locked scores. The night lighting map
layer is a separate local artifact at `web/public/data/lamp_posts_v1/`: 700 H3-r8
tile files plus `manifest.json`, 126,144 LTA lamp-post points, source last
modified 7 Jul 2026. It is map evidence only and is not part of the locked score.

Before any Vercel publish attempt, run `uv run python run.py readiness`.
For routine release review, `uv run python run.py readiness --gate-summary`
prints the same gate verdict, checks and warnings without the full nested
report. The readiness check validates the shelter-map bundle and also verifies
that the local lamp overlay artifact is present and internally consistent. Do
not rebuild, overwrite, or mutate existing public data directories to repair a
missing artifact; copy or create only a new versioned artifact after owner
approval.
If Vercel Hobby Edge Requests hit quota, first check whether production is
serving current `main`; automatic Git deployments are intentionally disabled in
`web/vercel.json`, so committed cache and crawler reductions do not affect live
traffic until the owner manually deploys. For an immediate hard stop, pause or
protect the Vercel project from the Vercel dashboard/API; that changes public
availability and is an owner decision, not an agent-default repository change.
If a replacement night lighting overlay is approved, run
`uv run python run.py lamp-overlay --output web/public/data/lamp_posts_v2 --confirm-lamp-overlay`
or another new numeric version path; the builder refuses non-empty output
directories, and `lamp_posts_v1/` remains the published artifact until a later
release decision points the site elsewhere.
For a zero-mutation source-age check, run
`uv run python run.py check --freshness-only`; it reads `raw/manifest.json` and
`pipeline/config/sources.yaml` only, does not probe upstream APIs, and reports
current, stale, manual, unknown-policy, and unknown-age sources; grouped action summaries include
source names such as `traffic_signals (Traffic Signals)`, and manifest-only sources missing
from `sources.yaml` are reported as unknown-policy instead of being omitted. Current/stale
lines plus the oldest-current summary include days until stale or days past stale so operators do not
need to cross-reference `sources.yaml`. Production readiness also exposes the
nearest current source to stale and stale sources with days past stale as
structured fields for downstream planning; stale sources are ordered by days
past stale and the most-overdue stale source is exposed separately. The source
policy covers every source currently recorded in `raw/manifest.json`, including
the ACRA, other-UEN, and June 2020 OneMap-derived postal-universe inputs. If stale sources appear, report them
and plan a versioned refresh; do not mutate frozen v1 in place. NParks Leaf Area Index can appear in
freshness as a tracked reference table, and the published legacy bundle may
carry it as a non-score reference source hash, but it is not route geometry,
shade-proxy geometry, or score evidence; future score provenance excludes it.
The current unknown-age source is the Overture Maps Addresses Singapore
candidate, because the cached manifest has no timestamp for that candidate
archive.
LTA geospatial listings such as Covered Linkway use a quarterly cadence with a
120-day stale threshold, so a current local freshness result does not prove no
newer upstream release exists. A 28 Aug 2026 discovery-only DataMall check
found Covered Linkway, bridge/underpass, and Traffic Signals URLs still match
frozen v1. To rerun that discovery-only check without downloading payloads or
writing the manifest, run
`uv run python run.py check --geospatial-discovery-only`; changed discovery URLs
require a new numbered input version, not an in-place repair.

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
  `check --geospatial-discovery-only`, `p19-gap-status`, `p19-mcst-locations`,
  `p125-osm-status`, `readiness`, `readiness --gate-summary`, `batch-plan`,
  `validate`)
  and gated pipeline tasks (`ingest`, `lamp-overlay`, `network`, `score`,
  `score-batch`, `postal-universe`, `geocode-universe`, `export`,
  `export-transit`, `publish`), plus the
  local `test` task. `publish` always runs `validate` first.

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
