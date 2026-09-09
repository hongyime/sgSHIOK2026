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
**Release safety hold (T31): do not execute the existing deploy/publish/activation
helpers under the protected-artifact rules.** The normal deploy path can install
dependencies and invoke `npm run build`, whose data-preparation step writes missing
derived files into the existing bundle or restores/downloads inputs. Staging copies
the working web tree rather than an exact committed inventory, omits the separate
lamp overlay and recompresses selected files. The data-release helper deploys before
its final preflight and pointer commit. A failing command therefore does not prove
production stayed unchanged. Use the maintenance runbook below for inspection and
rollback planning; repair and test the immutable staging path before T27/T28.
Neither a main push nor a plan-only command is permission to publish.
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

From the internal working root, using the existing environment and a fresh output
directory:

```powershell
if ((Get-Location).Path -ne 'C:\sgSHIOK2026') { throw 'Wrong working root' }
$run = Get-Date -Format 'yyyyMMdd_HHmmss'
C:\sgSHIOK2026\.venv\Scripts\python.exe -B -m scripts.check_source_metadata --output "C:\sgSHIOK2026\qa\source-monitor\$run"
```

On subsequent runs, also pass `--previous` with the absolute path to the preceding
run's `state.json`. Keep its sibling `report.json`: restoration requires a matching
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
  still require the exact recorded local raw-byte hashes. Do not rewrite protected
  inputs or substitute expected hashes. Routine read-only diagnosis is approved;
  unresolved content differences stop consumption of the affected input. A changed
  checkout representation needs a separately reviewed local catalog, not a payload
  repair or automatic catalog overwrite.

The proposed cadence is weekly, Tuesday 09:43 UTC. It is **not scheduled or an alert
service yet**. GitHub Actions plus one persistent issue for durable state and
deduplicated notices remains a proposal requiring explicit external-write approval.
No workflow, issue, external cache, secret or notification delivery is configured by
this checker. Pending notices are intents, not delivered alerts. Actual scheduled
execution, state restoration and destination readback remain T23 acceptance work.
The current command intentionally requires the Windows root; it is not yet a hosted
Actions runner. T24 covers the broader ownership/recovery procedure separately.

Documented endpoints: [data.gov.sg metadata API](https://guide.data.gov.sg/developer-guide/dataset-apis/get-dataset-metadata)
and [DataMall API guide](https://datamall.lta.gov.sg/content/dam/datamall/datasets/LTA_DataMall_API_User_Guide.pdf).
Evidence and limitations: `qa/verification/REVAMP-R1-core-walk.md`, task T23 in
`PRODUCT-PLAN.md`, and the monitor receipts under `qa/revamp-r1/source-monitor-20260909/`.

## Maintenance And Recovery

This is T24's operating proposal, not activation of monitoring, reporting, backup
or deployment. The project owner is accountable for release and privacy decisions;
an agent can execute approved checks but cannot become the permanent operator.

### Ownership And Cadence

| Routine | Proposed cadence | Agent action | Owner action and fallback |
| --- | --- | --- | --- |
| Source metadata | Tuesday 09:43 UTC / 17:43 SGT | Run the bounded local monitor; retain verified state and every outcome. | Review the receipt that day. T23 schedule/delivery is unapproved; no unattended check is promised. Missing receipt is unknown, not success. |
| Resident reports, only after T13-T18 | Tuesday and Friday 18:00 SGT; privacy/abuse incidents promptly when noticed | After approval, inspect the private queue, retention and quotas using least privilege. | Name moderator and absence cover before enabling intake. Close intake if nobody can maintain review/cleanup; no public issue containing resident notes. |
| Release | Each candidate, then first-day error/quota review after an approved publish | Assemble exact identities, tests, unresolved gates and rollback target. | Approve the exact candidate and target. A failed stage stops further action; inspect actual remote state before retry or rollback. |
| Capacity and recoverability | First Saturday monthly, and before input changes or releases | Inspect bounded metadata/receipts; propose backup scope and record gaps. | Check free-plan usage, own private backup destination/keys, and separately approve a restore drill. No existing backup is assumed. |

No response-time SLA or activated calendar job is established by this table. Keep
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
  Current release helpers do not establish that invariant for all stages: T31 must
  fix staging/build side effects and move local validation before external changes.
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
- Current MapLibre security disposition (T29), client upgrade acceptance and T31
  staging repairs precede release. No install, deployment or rollback ran in T24.

### Free-Cap And Report Operations

Before release, record the current account's plan, billing period, Edge Requests,
transfer, function use and headroom. Proposed internal thresholds are 80% for owner
review and 95% to hold optional releases/checks; these are not provider guarantees
or automatic shutdowns. Project protection/pausing changes availability and remains
an owner decision. Never upgrade a plan or accept paid overages automatically.
Check [Vercel's current usage policy](https://vercel.com/docs/limits/fair-use-guidelines),
including Hobby's non-commercial restriction, instead of relying on old quota figures.

Reports are still drafts, not a live moderation service. T13 must explicitly
approve the provider (including any change to the current no-Cloudflare policy),
owner access, privacy, caps and absence cover before T14-T18. The reviewed proposal
is `qa/revamp-r1/report-service-proposal-20260908.json`; its application caps are
100 new reports/day, five per short-lived IP bucket/day, 500 pending and 5,000
retained, all proposed rather than implemented. Provider quotas are shared and
must be rechecked at activation. Quota exhaustion means honest unavailability,
not paid scaling or a false receipt. Moderation acceptance never edits map truth.

The proposal expires content at the earlier of 90 days from receipt or 30 days
after resolution, with daily cleanup. Cleanup outages and recovery copies can
extend physical retention. Keep deletion evidence independent of restored snapshots;
apply expiry/deletion before reopening access. Credential/MFA/payment-method setup
and moderator/backup-key custody require the owner; never request secrets in chat.

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
