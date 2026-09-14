# S.H.I.O.K. Shelter Map

A free, non-commercial civic web app for Singapore postal records that answers:
if I move here, what is the walk to transit actually like? It leads with the
covered-walkway ratio and exposed gaps on real routed walks, adds night lighting
evidence as a map layer. Score methodology stays in this repository.

**Status:** live static shelter-map pilot over the frozen v1 124,443-record universe.
Current product decisions and known evidence limits are tracked in `decisions.md`.
**Environment:** Windows 11, native pipeline work. No WSL, no Docker, no paid services.
GitHub Actions exists for repository automation and CI, not for heavy pipeline compute.

## Current walk viewer (local frontend revision, 13 September 2026)

Search accepts six-digit postal codes only. The viewer offers **MRT/LRT exits**
and **Bus stops**, automatically selecting the shortest usable saved walk among
the routes available for that postal. "Closest" means recorded walking distance,
not straight-line proximity or a guarantee that every nearby stop has a route.
Explicit saved-walk links retain their chosen stop and route variant.

The result shows destination, distance, covered percentage, uncovered distance
and longest recorded gap. Walk details holds mapped exposed sections and saved
alternatives. Missing geometry or metrics remain unavailable, never zero.
Online previews are non-authoritative and can fail independently of saved walks;
loading is bounded to 12 seconds and Retry is explicit. The previous usable
saved walk stays visible. The local QA proxy now forwards GET /api/onemap-route;
provider authentication/availability is a separate dependency.

Night lighting loads automatically at neighbourhood zoom for the current map
view. These are mapped LTA lamp-post locations, not measured brightness, current
operating condition or a safety rating. No full-island lamp download is requested.
The map retains required provider attribution. Dataset attribution, methodology,
historical provenance and limitations belong here, in [ATTRIBUTION.md](ATTRIBUTION.md)
and [decisions.md](decisions.md), not an About data control.

Home comparison, its share-view entry point and About data have been removed from
the application. Existing saved comparison data is left untouched and is not
loaded. Reporting is still planned; there is no working submission service yet.
See [postplan.html](postplan.html) and [PRODUCT-PLAN.md](PRODUCT-PLAN.md) for current
delivery gaps. A commit or local preview does not mean production is deployed.

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
approval to promote v2. Use `uv run python run.py universe-status` first when
sizing the frozen-v1 gap; it checks whether the cached P19 v2 sample is still
current under the 7-day sample policy and includes the current P19 v2 Overpass
coverage result. The confirmed HDB gaps are SUN PLAZA SPRING
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
higher limit case-by-case. For narrower debugging, inspect the cached P19 v2 28 Aug 2026 public-source
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
**Release execution remains gated (T27/T28).** T31 replaces the unsafe preparation
chain with committed-source staging and byte-preserving copies of the pinned main
bundle plus the required lamp overlay. Missing gzip companions or lookup files fail;
nothing is regenerated. A fresh stage under repository `tmp/` records source, input,
derived configuration and copied-byte identities. Its creation hash is retained and
checked before parsing the ledger and again after build/before submission.

The PowerShell deploy/preflight helpers without confirmation are plan-only. Explicit
`-ConfirmProductionPreflight` authorizes staging, read-only artifact validation,
dependency audit, committed-stage web tests and direct installed Next build, but no
deployment. No local installation or package data-preparation hook is invoked.
Real artifact copying/building remains separately gated; passing fixtures is not
approval to run it. Missing local dependencies or symlink privilege stops preparation.

**Previous frontend assets are now an explicit preparation input.** A returning
tab can request an old map module that it never cached; retaining the service-worker
cache alone does not supply it. Capture an explicitly identified existing build
with `python -B -m scripts.frontend_archive --build-web-root ABS_BUILD_WEB_ROOT
--output ABS_NEW_ARCHIVE --expected-build-id REVIEWED_ID --maplibre-version VERSION`.
Use absolute paths under this repository. Capture reads only `.next/static/` and
the named `public/maplibre/VERSION/` runtime, preserves its licence, omits source
maps, and does not copy data or server files. It does not prove that the build was
deployed; review that identity and old-runtime security before approving retention.

After separate preparation approval, the canonical entry is
`python -B -m pipeline.publish --prepare --confirm-preparation --previous-frontend
ABS_ARCHIVE MANIFEST_SHA256`. Repeat the archive pair at most twice. Archives must
be under repository `tmp/` or `qa/frontend-assets/`; never discover them implicitly.
The older PowerShell helpers do not forward archive selections and therefore
cannot complete confirmed preparation. Their plan-only behavior is unchanged.
Production submission through the canonical entry additionally requires the
existing `--deploy --confirm-production` gate, with the same archive selection.
These command descriptions are not approval to execute preparation or submission.

The limit is two selected builds, 5,000 files per archive and 64 MiB across archive
inputs (counting duplicate input bytes). Staging deduplicates identical URLs;
same-URL/different-byte or case-alias conflicts block. Current-build files take
precedence; missing old URLs use Next fallback rewrites into a reserved retained
namespace. The installed-Next build wrapper verifies retained bytes before and
after compilation and rejects new-output collisions; the provider uses the same
wrapper. This is bounded compatibility for selected builds, not indefinite support
for every old tab. Removing a generation is an explicit future release decision,
not an automatic purge or a forced navigation that discards drafts.

An approved deployment additionally requires reviewed `VERCEL_PROJECT_ID` and
`VERCEL_ORG_ID`, authentication and readable project configuration. Exact project/team
IDs, project name, root `web`, Next framework, default output directory and relevant
production-variable metadata must agree. Hidden/incomplete or conflicting metadata
blocks; project-variable reads are not an atomic lock against dashboard changes.
Submission explicitly pins the staged Vercel config and public artifact bases. The
remote install command uses the committed lockfile with lifecycle scripts disabled;
it is a deployment-side operation, not a local preparation install.

Preparation, submission, provider READY and production smoke are distinct states.
The exact returned deployment URL is inspected; a queued response is not success.
Timeout or ambiguous submission means inspect that attempt, never blindly resubmit.
Provider READY does not prove browser/artifact identity or complete T28. No helper
rewrites the artifact pointer, allowlists or Git history. The former data-release and
activation entry points now refuse execution, including old bypass flags; changing
the data pointer needs a separately approved implementation. Neither a main push nor
a plan-only command is permission to publish. Current commands are fixture-validated,
not an exercised production release. See the maintenance runbook below for rollback.
If Vercel Hobby Edge Requests hit quota, first check whether production is
serving current `main`; automatic Git deployments are intentionally disabled in
`web/vercel.json`, so committed cache and crawler reductions do not affect live
traffic until the owner manually deploys. For an immediate hard stop, pause or
protect the Vercel project from the Vercel dashboard/API; firewall deny rules
or temporary attack mode are also owner-level controls. All of those change
public availability or visitor friction and are owner decisions, not
agent-default repository changes.
If a replacement night lighting overlay is approved, run
`uv run python run.py lamp-overlay --output web/public/data/lamp_posts_v2 --confirm-lamp-overlay`
or another new numeric version path; the builder refuses non-empty output
directories, and `lamp_posts_v1/` remains the published artifact until a later
release decision points the site elsewhere.
For routine checks use the standalone **Bounded Source Metadata Monitor (Local)**
below. The standing prohibition on `run.py check` includes its freshness and
discovery variants; do not use a pipeline entry point for maintenance. Source
update, local check and release dates are different facts. If stale sources appear,
report them and propose a separately approved versioned refresh; do not mutate
frozen v1 in place. NParks Leaf Area Index can appear in
freshness as a tracked reference table, and the published legacy bundle may
carry it as a non-score reference source hash, but it is not route geometry,
shade-proxy geometry, or score evidence; future score provenance excludes it.
Unknown publisher dates stay unknown. The local monitor also leaves unsupported
and manual sources explicit, rather than treating them as successfully checked.
LTA geospatial listings such as Covered Linkway use a quarterly cadence with a
120-day stale threshold, so a current local freshness result does not prove no
newer upstream release exists. A 28 Aug 2026 discovery-only DataMall check
found Covered Linkway, bridge/underpass, and Traffic Signals URLs still match
frozen v1. That is historical evidence, not current verification. The standalone
monitor now has a bounded listing adapter; missing credentials stay explicit and
listing changes never trigger a payload download or in-place repair.

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
- `run.py` — cross-platform task runner for safe reports (`p19-gap-status`, `p19-mcst-locations`,
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

## Bounded Source Metadata Monitor (Local)

`source-metadata-catalog.json` is a reviewed local metadata baseline, not a dataset
or proof of the deployed bundle. The standalone checker does not import the
pipeline, load `.env`, download datasets, follow listing download links, refresh
inputs, score, export or deploy. Do not use `run.py check` for this routine.

For the first metadata-check history only, from the internal working root, using
the existing environment and a fresh output directory:

```powershell
if ((Get-Location).Path -ne 'C:\sgSHIOK2026') { throw 'Wrong working root' }
$run = Get-Date -Format 'yyyyMMdd_HHmmss'
C:\sgSHIOK2026\.venv\Scripts\python.exe -B -m scripts.check_source_metadata --bootstrap --output "C:\sgSHIOK2026\qa\source-monitor\$run"
```

On subsequent runs, replace `--bootstrap` with `--previous` and the absolute path
to the preceding run's `state.json`. Exactly one mode is required: omitting both
or supplying both stops before catalog reads, requests or output creation. Do not
use bootstrap to work around a missing/corrupt predecessor or to reset a cooldown.
Keep its sibling `report.json`: restoration requires a matching
verified completion receipt, catalog identity and state hash. A verified exit-1
attention report is reusable, including deferred checks, so retry deadlines and
known observations survive. Do not select an interrupted run without that receipt
or an exit-2 stopped run. A missing/corrupt receipt stops before
requests; it is not interpreted as unchanged metadata. Every output directory is
new, and prior run files are preserved. No generic cleanup or input repair belongs
in this command.

- Bounds: at most 24 requests, 256 KiB response bodies plus one oversize-detection
  byte, a 10-second isolated-request deadline, at least 13 seconds between requests
  to the same host, and a 300-second HTTP budget. Local validation/persistence time
  is additional. There are no automatic retries, redirect following or payload
  fallbacks. The spacing is our conservative policy, not a claimed metadata quota.
- Only data.gov.sg dataset-metadata and DataMall geospatial-listing endpoints are
  supported. The process environment may supply `LTA_DATAMALL_ACCOUNT_KEY`; its
  absence is explicitly reported. The checker never reads credentials from `.env`
  or prints their values. Manual and unsupported sources stay distinct from errors.
- `started.json` and `observations.jsonl` preserve partial-run evidence. A terminal
  `report.json` records outcomes, successful-check times, publisher dates, immutable
  baseline ages and pending notice intents separately. State is flushed, synced and
  read back before a verified completion report is published. The report is first
  written, synced, closed and verified as `report.pending.json`, then atomically
  hard-linked to the previously absent `report.json`. The staged file is retained;
  neither name is edited afterwards. Unsupported hard links or publication errors
  fail closed, with no fallback overwrite. State or report persistence failure
  stops the run and cannot authorize a later conditional request. These guarantees
  use local filesystem write/sync semantics, not a tested physical power-loss recovery.
- Exit 0 means no current automatic-check attention condition; it is not proof that
  physical conditions or payload bytes are unchanged. Exit 1 means attention is
  required, including unknown/stale/unavailable/unsupported sources, pending notices
  or a deferred check. Exit 2 means local integrity, state or IO failure: inspect
  the receipt and do not retry blindly. Preserve known 429 not-before times across
  runs, including when cleanup or a deadline changes the final error classification.
- A changed publisher timestamp is a metadata signal, not evidence of changed
  dataset bytes. A stable DataMall listing reference does not prove its payload is
  unchanged. Checking an old baseline today never makes it current.
- The initial builder records Git and local text identities separately after an
  exact LF/CRLF-only comparison of the two allowlisted metadata files. Runtime checks
  default to the exact recorded local raw-byte hashes. The approved Actions adapter
  explicitly selects the separately pinned `gitAnchors` profile; it never falls
  back between profiles or converts inputs. Do not rewrite protected
  inputs or substitute expected hashes. Routine read-only diagnosis is approved;
  unresolved content differences stop consumption of the affected input. A changed
  checkout representation needs a separately reviewed local catalog, not a payload
  repair or automatic catalog overwrite.

Owner approval on 14 September supersedes the proposed Tuesday cadence: weekly
Monday 01:17 UTC / 09:17 SGT to [one issue](https://github.com/hongyime/sgSHIOK2026/issues/34).
The repository owner operates the routine. `source-metadata-weekly.yml` is the
serialized GitHub Actions adapter; activation evidence is recorded separately from
its fixture tests. The local CLI still requires the Windows root. The adapter
requires this repository's main-branch Actions environment and uses only its
short-lived `GITHUB_TOKEN`, with contents/actions read and issues write permissions.
No laptop credential is copied. Missing `LTA_DATAMALL_ACCOUNT_KEY` is reported as
`credentials_required`; unsupported sources remain unsupported, not healthy.

The first manual dispatch alone uses `bootstrap=true`. Later attempts restore the
immediately preceding run's immutable artifact, never a guessed older success.
Deleted, expired, stopped or conflicting history stops before source/notice IO;
all reruns are rejected, since deleted newer runs are invisible to discovery.
Use a new manual dispatch only with an intact ready predecessor. Preserve evidence and investigate,
never bootstrap again to clear a fault. Each 30-day artifact carries the whole
retained monitor/send/request history with hashes, not pipeline inputs or tokens.
Bounds: 12,000 files, 64 MiB raw/ZIP, 4,096 lifetime notice requests; reserve worst
case growth before IO and stop at capacity without pruning. This is bounded
operational persistence, not indefinite archival or a backup of project data.
At most 24 metadata requests/300 seconds plus three notice batches of eight
notices and 24 requests/300 seconds each: 3 * 24 = 72 notice API requests per
workflow, separately from bounded Actions control-plane requests. Job cap:25min.

Pending notices are intents, not delivered alerts; only read-back receipts prove delivery.
Only minimized source notices go to the issue. No dataset refresh, scoring,
export, resident-report storage or deployment runs. Missing receipts are unknown,
not success; an Actions failure remains visible if issue delivery is unavailable.
GitHub schedules are best effort and public-repository inactivity can disable
them after 60 days. A manual activation is not proof of a natural cron run.
[GitHub schedule rules](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

Activation on 14 September: [first manual run](https://github.com/hongyime/sgSHIOK2026/actions/runs/34798579347)
completed 14 metadata requests and 48 notice API requests, delivering and verifying
16 notices with none pending. Its retained checkpoint is `ready`; exit 1 / Actions
failure represents source attention, not a stopped scheduler. Source outcomes:
14 observed + 3 credentials_required + 4 unsupported + 3 manual = 24.
The missing credentials affect Covered Linkway,
Pedestrian Overhead Bridge/Underpass and Traffic Signals. No input was refreshed.
Standard GitHub-hosted runners for this public repository are covered by
[GitHub's free Actions policy](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
A [normal follow-up dispatch](https://github.com/hongyime/sgSHIOK2026/actions/runs/34799037563)
restored all 157 retained files, checked metadata again and made zero notice API
requests. It retained the same 16 verified comments and added five monitor files.
Both downloaded checkpoints passed every recorded hash and state-pair pin.
The first eligible natural weekly run is 21 September 2026 at 09:17 SGT; it has
not been observed. See `qa/revamp-r1/weekly-metadata-20260914/` for the receipts.

Documented endpoints: [data.gov.sg metadata API](https://guide.data.gov.sg/developer-guide/dataset-apis/get-dataset-metadata)
and [DataMall API guide](https://datamall.lta.gov.sg/content/dam/datamall/datasets/LTA_DataMall_API_User_Guide.pdf).
Evidence and limitations: `qa/verification/REVAMP-R1-core-walk.md`, task T23 in
`PRODUCT-PLAN.md`, and the monitor receipts under `qa/revamp-r1/source-monitor-20260909/`.

## Maintenance And Recovery

T24's reporting, backup and deployment procedures remain proposals. The weekly
metadata routine above is now owner-approved. The project owner is accountable for release and privacy decisions;
an agent can execute approved checks but cannot become the permanent operator.

### Ownership And Cadence

| Routine | Proposed cadence | Agent action | Owner action and fallback |
| --- | --- | --- | --- |
| Source metadata | Monday 01:17 UTC / 09:17 SGT | Approved metadata-only Actions routine; retain immutable checkpoints and notices in issue34. | Review the issue and terminal run that day. Missing receipt is unknown, not success. Investigate stopped/expired history without deleting or reinitializing it. |
| Resident reports, only after T13-T18 | Tuesday and Friday 18:00 SGT; privacy/abuse incidents promptly when noticed | After approval, inspect the private queue, retention and quotas using least privilege. | Name moderator and absence cover before enabling intake. Close intake if nobody can maintain review/cleanup; no public issue containing resident notes. |
| Release | Each candidate, then first-day error/quota review after an approved publish | Assemble exact identities, tests, unresolved gates and rollback target. | Approve the exact candidate and target. A failed stage stops further action; inspect actual remote state before retry or rollback. |
| Capacity and recoverability | First Saturday monthly, and before input changes or releases | Inspect bounded metadata/receipts; propose backup scope and record gaps. | Check free-plan usage, own private backup destination/keys, and separately approve a restore drill. No existing backup is assumed. |

No response-time SLA is established by this table. Keep
maintenance receipts linked from `.agents/STATE.md` and durable decisions here or
in `decisions.md`; never place secrets or resident report content in public Git.

### Identify What Is Actually Running

Start every session by asserting `C:\sgSHIOK2026`, reading STATE and inspecting
Git status/HEAD. X: is not a working root. The default artifact is named by
`web/data-bundle.json`; `NEXT_PUBLIC_DATA_BASE` can override it in a built frontend.
Record the actual requested data base as well as the configured default.

The 2026-09-10 inspection found all 142 source hashes still matching the validated
local snapshot `Hb1o7rptP9IxSDBxSb8ID`. Its build and browser evidence are in
`qa/revamp-r1/source-freshness-20260909/summary.json`. This does **not** identify
production. A separate read captured live HTML and the pinned remote manifest in
`qa/revamp-r1/maintenance-20260910/`: the manifest SHA256 matches local
`7108e66e70628f3211883402fc753c2f5809db5a822d6a2415f6ae6459a1070e`.
That compares this manifest only, not every deployed shard or the running browser.

Before release, obtain the actual production deployment ID, commit/staged-source
ledger, domains, build ID, worker identity, requested artifact and prior eligible
deployment from Vercel and browser receipts. Production deployment ID/source commit
remain unverified in this inspection. Git auto-deploy is disabled in checked-in
`web/vercel.json`; do not assume dashboard settings or remote code match local HEAD.

### Failure And Rollback Rules

- Monitor exit 1 retains unavailable, stale, manual/unsupported and missing-secret
  distinctions; only a verified terminal receipt authorizes previous-state reuse.
  Exit 2 or an input mismatch stops use of that input. Diagnose read-only; do not
  rebuild, normalize or overwrite it. Preserve cooldowns and failed receipts.
- Validation failure before publication must leave the live pointer alone (O06).
  T31's fixture-tested helpers validate committed staging before external changes;
  real preparation, release configuration and production smoke remain T27/T28 gates.
  `-ConfirmProduction`, activation, preflight and publish are not inspection modes.
- For deployment failure (O07), record the named stage and remote deployment status.
  `--no-wait` success is not READY. Stop if remote state is unknown; do not blindly
  resubmit. A successful manifest request alone does not prove frontend readiness.
- Plan rollback to an identified previous immutable production deployment, never
  by moving data directories, resetting the working root or just reverting Git.
  On Hobby, Instant Rollback is limited to the immediately previous deployment.
  It reuses old build configuration, and changes production auto-assignment.
  Confirm target eligibility/configuration before owner-approved execution.
  [Vercel rollback documentation](https://vercel.com/docs/instant-rollback).
- After any approved release or rollback, test fresh, returning and retained-tab
  clients with current route and artifact identities. A hosting rollback does not
  roll browser caches back. Current `sw.js` claims clients immediately and preserves
  immutable asset caches. Do not delete unrelated caches or call a local preview an
  exercised production rollback. O08 and T01's old-tab acceptance remain release gates.
- Current MapLibre security disposition (T29), client upgrade acceptance and real
  immutable-stage acceptance precede release. No install, deployment or rollback ran in T24.

### Append-Only Maintenance Notices

`scripts/source_metadata_comments.py` and `scripts/source_metadata_github.py`
implement the issue-comment path used by the approved weekly adapter above.
They never edit the issue body. The old injected issue-replacement contract in
`source_metadata_delivery.py` is historical and must not be adapted to GitHub PATCH.

The approved destination is issue34, posting as `github-actions[bot]`, numeric ID
41898282 verified through GitHub's API. The artifact chain is the authoritative
journal for this serialized workflow. Validate the monitor state/report pair before planning notices.
The current local journal is restricted to a new directory beneath
`tmp/source-notice-journals/`; initialization returns a unique identity hash that
must be retained externally. Do not treat an ephemeral Actions checkout as persistence.
Missing/corrupt history, a changed original plan or an uncertain POST stops delivery;
never delete journal files, bootstrap again or automatically resend to repair it.

One send-intent is exclusively created, synced and read back before its sole POST.
Exact comment ID, destination, body and expected author must be read back before a
create-only receipt authorizes acknowledgement. A received POST ID is retained as
unverified evidence, so restart can GET that exact comment without scanning pages.
If the POST response was lost, recovery uses one complete page of at most 100
comments; a next-page link, absent, duplicated or conflicting evidence requires an
operator. Offset pagination can skip duplicates during concurrent changes and is
not a snapshot. Remote comments remain editable/deletable by authorized users.
This is at-most-once automatic attempts with unresolved outcomes, not exactly-once
delivery, a distributed lock, rollback defense or power-loss proof. Journal
ancestors must be trusted and stable: link checks are not a sandbox against another
local writer changing directories into junctions between validation and open.
The API adapter uses one isolated 10-second request per operation with no redirects
or retries. Production calls now require a `GitHubRequestBudget` reopened from the
same pinned journal; injected fixture transports are not an activation path.
Explicit initialization (`GitHubRequestBudget.initialize(journal)`) is a one-time
local setup step after choosing durable storage, never an automatic startup repair.
The `github-requests/` child contains create-only, hash-linked request/result pairs,
not tokens, comment bodies or raw response headers. Keep it with the journal.

One budget object allows at most 24 requests in a 300-second admission window,
leaving ten seconds for the next worker and spacing requests at least one second
after the previous completion. All participating callers must use that same
journal; this does not coordinate other hosts, accounts or API consumers. A new
object resets the batch count, not the retained cooldown or unresolved history.
An exhausted quota, `Retry-After` or 403/429 stops the batch and persists the wait.
Long waits are not shortened to fit the batch; short spacing is the only sleep.
History is capped at 4,096 requests, after which operator planning is required.
These bounds follow the [GitHub REST guidance](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api)
without adding automatic retries.

For a new notice, guarded delivery admits the request before exclusively claiming
the notice, then claims before POST. A cooldown rejection therefore leaves an
unsent notice unclaimed and eligible for a later approved batch. A successful POST
that consumes the last quota slot retains its ID even when verification must wait.
Timeouts, malformed results, interrupts or failed result persistence leave an
unresolved request reservation and block all subsequent IO. This preserves the
uncertainty; it does not recover headers or outcomes that were never received.
Stop for operator investigation, retaining every file; do not delete a reservation,
reinitialize storage, or assume a cooldown has expired to bypass the stop.
`scripts/acknowledge_source_notices.py` now connects verified receipts to an
immutable monitor checkpoint. After approved delivery setup, provide a private
proof-reference JSON file containing 1..8 entries with `originState` (the absolute
original `state.json` path), `noticeId` and the independently pinned
`receiptSha256`. Supply the current predecessor separately: an unchanged pending
notice may have originated in an earlier check. Exact original/current notice
content must agree; equivalent but changed representations are not silently merged.

The acknowledgement command requires `--previous`, `--output`, `--proofs`,
`--journal`, `--journal-sha256`, `--destination` and `--author-id`. The private
`SHIOK_NOTICE_TOKEN` is read from the process environment, never a command argument
or evidence file. It makes authenticated comment GETs only, never POST, LIST,
receipt repair, source checks or input downloads. A missing/corrupt receipt or
changed comment stops before checkpoint publication. Existing outputs are never
overwritten; preserve partial failures and choose a new output only after review.
The notice receipts and source evidence stay byte-identical; production GETs do
append separate request-budget records. GET-only is not filesystem-read-only.

Success writes a new `qa/source-monitor/<label>/state.json` and verified report,
marked `operation: notice_acknowledgement` and `sourceHealth: not_rechecked`.
Only the selected pending notices and their acknowledgement timestamps change.
Cooldowns, ETags, observation/freshness and actual check times remain unchanged.
The next metadata check must explicitly select the checkpoint with `--previous`.
Restoration validates its referenced predecessor/origin hashes and replays the
allowed transition; it does not perform another GitHub verification or authenticate
untrusted local report assertions. Retain the original referenced pairs, journal
and trusted pins. This is not automatic latest-checkpoint selection or rollback
protection by itself. The approved weekly adapter adds explicit Git-profile
selection and artifact-backed continuity; it does not relax this local CLI's
Windows/source-anchor requirements. An ephemeral checkout without the trusted
predecessor cannot resume. Operator resolution is still manual. No actual
scheduled-delivery claim follows from local fixture tests.

Inspect an existing, independently pinned journal without network or mutation:

```powershell
python -B -m scripts.inspect_source_notice_journal --journal <absolute-journal-path> --journal-sha256 <retained-identity-sha256>
```

The `-B` flag prevents Python import bytecode writes. No token is required or read.
The command opens only the named journal under `tmp/source-notice-journals/`.
It bounds directory entries and captured bytes, validates canonical intent and
companion hashes, checks the request chain and cooldown, and rechecks the read
files before reporting. Links, hard-link aliases, unexpected objects, partial
history and changed input stop inspection. Existing trusted, stable ancestors
remain required; this is not a lock or hostile-writer filesystem sandbox.

Exit 0 means locally consistent, not remotely delivered, monitored or ready to
activate. Exit 1 means attention: setup absent, a retained cooldown/capacity limit,
or a notice outcome needing review. Exit 2 means invalid or unreadable history.
An intent alone means outcome unknown, never definitely sent or unsent. A posted
ID permits investigation of that exact comment, not a resend. A recorded receipt
still needs its independently retained pin and authenticated GET before the
acknowledgement command; its computed hash here is not a new trusted pin.
Request reservations have no notice ID or method, so a missing result cannot
be assigned to a particular notice by this command. Expired cooldowns do not
clear unresolved reservations. Preserve all files and investigate; never delete,
repair, reinitialize or automatically retry to make the inspection pass.

### Free-Cap And Report Operations

Before release, record the current account's plan, billing period, Edge Requests,
transfer, function use and headroom. Proposed internal thresholds are 80% for owner
review and 95% to hold optional releases/checks; these are not provider guarantees
or automatic shutdowns. Project protection/pausing changes availability and remains
an owner decision. Never upgrade a plan or accept paid overages automatically.
Check [Vercel's current usage policy](https://vercel.com/docs/limits/fair-use-guidelines),
including Hobby's non-commercial restriction, instead of relying on old quota figures.

Reports are still drafts, not a live moderation service. Supabase Free was
approved on 14 September for private resident reports. Cloudflare was explicitly rejected.
T13 still needs the intended project connection and the remaining owner access,
privacy, caps and absence-cover decisions before service activation. The reviewed proposal
is `qa/revamp-r1/report-service-proposal-20260908.json`; its application caps are
100 new reports/day, five per short-lived IP bucket/day, 500 pending and 5,000
retained, all proposed rather than implemented. Provider quotas are shared and
must be rechecked at activation. Quota exhaustion means honest unavailability,
not paid scaling or a false receipt. Moderation acceptance never edits map truth.

The proposal expires content at the earlier of 90 days from receipt or 30 days
after resolution, with daily cleanup. Cleanup outages and recovery copies can
extend physical retention. Keep deletion evidence independent of restored snapshots;
apply expiry/deletion before reopening access. Credential/MFA setup
and moderator/backup-key custody require the owner; never request secrets in chat.

Supabase setup: identify or create a dedicated project in a **Free organization**,
prefer Singapore where available, and share only its project name/dashboard URL.
Do not select a paid plan or add billing to work around a quota. Confirm the project
before linking or applying any schema. Keep server credentials in approved secret
storage, not `NEXT_PUBLIC_*`, public issues, report bodies or Git. Implementation
and the private database tests are specified in `ARCHITECTURE.md` and T15-T18.
[Supabase Free](https://supabase.com/pricing) does not include automatic backups
or point-in-time recovery. [Low-activity pausing](https://supabase.com/docs/guides/platform/free-project-pausing)
is possible; the old Cloudflare proposal's recovery claims do not transfer.
Private storage is installed but intake remains disabled in the owner-designated
sgbuslaobu project. The separate shiok_reports schema leaves existing transit
tables alone. The server adapter has no public route or resident form yet;
moderator authentication, retention cleanup and real concurrent/HTTP acceptance
remain before activation. Owner UI feedback is desktop Chrome
with a resized viewport, not physical-phone acceptance.

### Preserve And Recover Local Payloads

The named-path inspection confirms `.env`, `processed/`, `web/public/data/`, P8,
P10 and eight P11 `d_*` directories exist with no tracked files beneath those
directories. `raw/`, `data/` and `qa/releases/` have some tracked metadata (1, 1
and 56 paths respectively), not proof that Git contains their payloads.
`checksums.json` itself is tracked; that does not back up the files it describes.
P6, P7 and P9's named evidence directories are absent locally and untracked.
No other drive was searched. This is presence/index evidence, not a new recursive
inventory, capacity estimate, complete hash audit or independent-backup verification.

Before any backup: the owner must select an existing private destination with
adequate capacity, encryption/key custody and a retention/loss-window policy.
Propose an additive snapshot, including untracked payloads, local Git evidence and
private configuration. Inventory before excluding rebuildable dependencies; do not
silently omit `tmp/`, logs or QA references. Protect `.env` separately from public
evidence. Do not sync deletions, prune old versions or mutate the only source copy.
Prefer one verified snapshot before an approved input change and monthly thereafter;
missed snapshots increase the recovery gap. This policy is not an executed backup.

An owner-approved drill restores into a **new** isolated destination, leaves the
working root/old payloads untouched, compares expected paths/sizes/hashes, then uses
non-writing checks with existing dependencies. Hash mismatch stops the drill; it
does not authorize regeneration. Keep an explicit manifest of successes, missing
paths, errors and elapsed time. For future private reports, use the separately
approved encrypted backup and deletion-ledger rules; never put reports into this
public QA tree. No data copy, migration, backup or restore was performed in T24.

## License And Attribution

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE). Source data and map
attribution are recorded in [ATTRIBUTION.md](ATTRIBUTION.md).
