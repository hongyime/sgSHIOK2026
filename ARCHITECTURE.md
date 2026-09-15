# SHIOK Product and Technical Design
Date: 2026-09-06
Status: accepted direction; core viewer partially implemented. Current delivery gaps in PRODUCT-PLAN.md.
Decision record: ARCHITECTURE-DECISIONS.md
Acceptance catalogue: qa/SHIOK-acceptance-tests.md
Execution plan: PRODUCT-PLAN.md

## Purpose and audience
Help Singapore residents understand and improve sheltered walks from
a postal code to nearby transit. Support inspecting a walk today, evaluating
potential homes, and reporting mapping errors or stretches needing shelter.
This is a maintained public civic service, not a live weather advisor.
Covered structures help with rain but do not guarantee a dry or accessible walk.

## Scope
Initial scope is postal-to-transit. Arbitrary origin/destination routing is later.
Preserve postal-only search. No personal sample address. No accounts, ads,
agency submissions, photos, live weather or new composite score.
Use a small useful list of transit candidates with distance/shelter trade-offs.
Show the nearest and most sheltered eligible options when evidence supports
them; they may be the same candidate. Do not imply all stops have been evaluated.
Reports remain private pending owner review. Both mapping corrections and new
shelter suggestions are supported, with distinct handling.

## Core journey and proposed copy
Search -> shortest usable saved walk -> inspect gaps or another transit category.
Title: SHIOK
No supporting tagline in the primary map UI (owner feedback accepted).
Search: Enter 6-digit postal code
Summary: Walk to {destination}
Metrics: {distance} m walk; {coverage}% covered; {exposed} m uncovered;
Longest uncovered stretch: {longest} m.
Commands: MRT/LRT exits; Bus stops; Walk details.
Data and calculation notes: GitHub README and ATTRIBUTION, not an in-app dock.
Report a problem remains a future workflow, not a functioning submission button.
Report choices: The map is incorrect; This stretch needs shelter.
Never turn missing evidence into zero, or turn a recorded structure into a
claim about current condition, wheelchair access, temperature or safety.

## Layout specification
Desktop: full-viewport basemap from the empty homepage. A top-left stack holds
SHIOK, then the postal field with its icon submit, then an equal-width result
panel (300px maximum). No About data or comparison controls; retain
required map attribution independently. Fit routes outside overlays. Transit choices only appear
when meaningful real alternatives exist; gap details expand within the results area.
Mobile: the same top-left order and equal widths, constrained to the viewport.
Compact results show destination and key metrics; expanded results scroll within
the stack. Reserve visible map space below it, not above an imaginary bottom sheet.
Refit with the actual unobscured map bounds after panel, viewport and route
changes. Do not reset a user's intentional pan on every data/render update.
Keep map attribution visible. Distinguish selected route from basemap lines.
No visible zoom/reset toolbar or successful-load badge. Preserve MapLibre gestures,
keyboard navigation, accessible loading announcements and actionable failure states.
Prototype approved at 0de3d5f; use its layout, not its illustrative canvas/data.
Keep score methodology and technical limitations in GitHub documentation.
Night lighting is enabled automatically, with neighbourhood zoom and viewport
bounds controlling requests. It is never a safety rating or a whole-island fetch.

## Retired comparison
The owner removed comparison on 2026-09-13. Home mounts no comparison view,
controller, storage restore or shared-link handler. Existing local storage is
left intact. Historical modules and tests are retained without a product entry
point; ADR-16 through the comparison-sharing decisions are superseded for scope.

## Default walk and preview recovery
Only MRT/LRT exits and Bus stops are selectable categories. Automatically select
the shortest usable authoritative saved walking geometry across both categories;
category clicks apply the same policy within that category. Deterministic ties
use canonical option identity. This is not straight-line proximity or proof that
all nearby stops have been routed. Explicit stop/category/variant links retain
their named selection instead of silently adopting the automatic default.
Online stop previews are explicit and non-authoritative. HTTP errors and a
12-second deadline (including response body) end loading, with no automatic retry.
Retain the previous usable saved walk and marker, even across categories with no
saved geometry. Retry starts one request; Back restores the saved selection/URL.
Do not say a saved route remains if none exists. Stale responses cannot take
ownership of a newer stop or postal.

## Frontend boundaries
Incrementally separate search, walk summary, transit selection and future
feedback from web/app/page.tsx.
Existing artifact readers remain behind a typed repository interface.
A selection controller owns postal/destination selection and request identity.
Map adapter owns MapLibre initialization, layers, viewport and readiness.
Presentation components consume typed states, not network response internals.
Keep established Next.js/React/MapLibre dependencies; no rewrite or new framework.

## Loading and map state
Track essential record, geometry and basemap readiness independently.
A loaded style does not prove a visible selected route.
States include idle, loading, partial, ready, unavailable and failed.
Ready requires the selected route's visible geometry in the usable viewport.
Basemap failure may retain the route and text result with an honest partial state.
Cancel or ignore stale responses on rapid selection changes.
Deduplicate in-flight reads; load only viewport-bounded lamp tiles and explicit route previews on demand.
Cache immutable artifacts by version. Never replace the working result with an
older response or clear useful text because optional tiles fail.

## Data strategy
Read existing protected artifacts first. Inventory usable walk coverage by
postal, transit category and reason; score availability is not route availability.
Identify source gaps, network disconnects, selection limits, processing defects
and absent export artifacts separately.
Candidate-selection limits and shelter ordering must be defined and tested
before approving additional computation.
No complete-data or all-stops claim until coverage is measured.
Existing scored values and weights remain unchanged during frontend work.
Processing and refreshes require explicit approval, measured pilots and fresh
versioned output directories. Never repair identity mismatches by rebuilding inputs.

## Feedback design
Proposed report contract: schema version, client request ID, report type,
postal/context, point or bounded segment, note, referenced bundle version.
Server assigns ID, received time and moderation state. Treat all text as untrusted.
Lifecycle: pending -> accepted, rejected or duplicate. Accepted suggestions do
not establish that shelter exists. Accepted mapping corrections require evidence
and a separately approved data change before affecting published routes.
Do not request contact details. Warn against personal information in free text.
Storage, abuse limits, deletion/retention and moderator access are an explicit
design gate: do not claim a draft was submitted until durable receipt exists.
### Supabase implementation boundary, 14 September 2026

The owner approved Supabase Free for private resident reports. This supersedes
the provider-choice gate, not the tests required before accepting real reports.
Keep the existing Vercel frontend and Node server; do not add Cloudflare.
Use the owner-designated Free project, verifying its organization plan first.
Project name/dashboard URL is safe setup information; secret keys are not chat,
public evidence or NEXT_PUBLIC configuration. On15September the owner supplied
the dedicated sgshiok project, ztjilsfgoephcdcsgcks. Its identity, Singapore region
and Free organization are verified; web/lib/report-project.json pins the only
allowed origin for both setup and the server adapter. Storage is installed with
intake disabled. The earlier use of sgbuslaobu was an agent targeting error, not
owner approval. That project remains prohibited; its three remote QA scripts
stay retired. The default-disabled resident endpoint is implemented; no runtime
secret or resident form is configured.

Use a same-origin report API with the existing bounded report parser. The browser
must not have database read/moderation privileges. Store report content in a
non-exposed schema, with RLS and explicit privilege revocation as defense in depth.
Expose only narrowly granted server RPCs, never general anonymous table access.
Supabase secret keys remain server-only. Moderator identity must be authenticated
and independently allowlisted; user-editable metadata cannot grant moderation.
Secret-key service access bypasses RLS: server authorization is mandatory and
RLS must not be cited as protection against a compromised server secret.

One Postgres transaction must own idempotency, private receipt, pending state
and quota debit. Bind retries to a separate random secret, store its hash, and
never expose report content through receipt lookup. A timeout can follow a commit:
retry the same identity rather than issue a new report or pretend it was unsent.
Serialize moderation against every revision in the lifecycle plan's read set,
including duplicate targets and intermediate links, with the audit write.

Before activation, verify direct API access denial, real transaction races,
timeout-after-commit recovery, revoked moderator access, expiry and cap exhaustion
on synthetic reports. Local validation tests are not proof of database privacy.
Implement resident composition and the private queue after that boundary works.
No report acceptance changes published shelter evidence or the locked scores.

Admission caps are implemented but not activated: 100/day, 5 per short-lived IP
bucket/day, 500 pending, 5,000 retained. The owner selected 30 days from receipt,
with daily cleanup and weekly moderation. Resolution never extends expiry.
Free Supabase has no included automatic backups/PITR; do not carry over D1's
seven-day recovery claim. Any private backup requires a destination, key owner,
retention and independently retained deletion rules. Do not invent a backup.
Provider pauses and quota exhaustion mean unavailable reporting, never a false
receipt, paid upgrade, automatic public-issue fallback or artificial keepalive.
Reporting failure must leave the map and saved walks usable.

Owner testing currently means desktop Chrome with resized viewports. Record
responsive acceptance separately from unperformed physical-phone acceptance.

Dedicated-project checkpoint: migration20260914161526 creates only shiok_reports and one
service-role-only public RPC. All three tables have RLS and no public/authenticated
grants or policies; this is intentional default denial, not missing resident access.
The schema is not exposed through the Data API. The existing transit schema and
its grants/settings are outside this migration. The RPC is security invoker,
not an anonymously executable privileged function.
This migration is byte-identical to the old schema SQL; its filename now matches
the native history on the dedicated project, avoiding duplicate local migrations.
Historical wrong-project objects remain outside this setup; do not access,
reactivate or delete them without separately approved cleanup. Before any future
schema application, confirm the exact project's identity and Free plan; never
derive a target from an unrelated test receipt or general account access.

Real dedicated-project HTTP checks deny the publishable-key RPC (401/42501),
deny access to the private schema (406/PGRST106), and reject server-key admission
while disabled (503/PT503), with zero reports/quota rows before and after. These
are not moderator authentication or successful resident-submission acceptance.

Server adapter: web/app/api/reports/store.ts, behind the default-disabled route.ts.
It accepts only the pinned dedicated Supabase origin and a server secret key,
never a management PAT. It reuses
the wire validator, hashes retry proof and bounds provider/body IO to eight seconds.
No redirects, logs, public reads or automatic retries. A timed-out write has
unknown outcome, not proof it failed to commit. The HTTP handler now imports it;
resident UI and runtime activation remain separate work.
NUL in a note is now explicitly invalid_note because PostgreSQL cannot represent
it; literal backslash-u0000 text is preserved. No text is stripped or normalized.

The singleton admission lock covers report identity and both usage counters.
Retries with matching proof/content return the original receipt without another
debit; altered proof/content conflicts, expired identity cannot become a new report.
Activation additionally requires policy approval, an allowed bundle and verified
cleanup within26hours. Those controls are deliberately unset. The proposed caps
are implemented but not activated. Moderation, scheduled cleanup, early-deletion
replay protection and genuine concurrent RPC races remain unfinished.
No complete F04-F12 or durable browser receipt claim follows from rollback tests.

The HTTP boundary accepts only an exact configured HTTPS Origin and request URL,
JSON with a custom retry-secret header, and the strict8KiB wire contract. One10s
deadline covers upload and persistence; no-store applies to success and every
error/method response. It is anonymous submission, not browser authentication.
Only Vercel production/preview Node deployments may trust x-vercel-forwarded-for;
missing/list/invalid headers fail closed with no fallback to x-real-ip or arbitrary
x-forwarded-for. Daily HMAC buckets canonicalize IPv4/mapped IPv6 and IPv6 /64.
Per-instance6network/60global attempts per minute bound provider dispatches and
memory, including retries and conflicts, but do not establish a distributed
request budget. Database admission caps are atomic and separate. Activation
still requires abuse/concurrency, cleanup and moderator acceptance.
Generic upstream503 is outcome_unknown. Only the exact bounded PostgREST
PT503/reporting_unavailable envelope establishes the RPC's pre-admission denial.
No provider text, report content, raw IP, retry secret or credential is logged
or echoed; hosting access logs are a distinct platform-retention consideration.

Owner30-day policy is enforced by migration20260915000630, not an edit to the
original applied migration. A validating constraint rejects pre-existing longer
expiries; the atomic migration must fail rather than rewrite resident data.
RPC source is byte-equal to the prior body except90days becomes30days. Ten actual
database check groups passed in rollback before apply and again after apply,
with disabled/empty state restored. The next migration below implements normal
expiry cleanup without altering this historical migration.

### Cleanup and request validity, 15 September 2026

Migration20260915010921 is applied on the dedicated disabled project. Request IDs
now use RFC9562 UUIDv7 (48-bit Unix milliseconds, 74 random bits); receipt IDs
remain UUIDv4 and retry proof remains a separate 32-byte random secret. The server
admits a new request only within the preceding 24 hours, allowing at most five
minutes of future client clock skew. Receipt time comes from the database clock,
not the ID. A matching saved receipt remains recoverable until its 30-day expiry,
even after the initial admission window closes or new intake is paused.

The V2 RPC samples UTC day after taking the shared singleton lock. HTTP binds
its HMAC bucket and UTC date to the same post-upload sample, and the RPC rejects
a different day for new admission. A queued midnight request cannot split a
network's daily quota. Wrong-day receipt recovery still works without a debit.
V1 execution is revoked, including from service_role; no silent fallback exists.

The table now requires expires_at - received_at =720hours, not merely <=30days.
A shorter direct-insert expiry could otherwise delete a still-valid request and
allow it to be recreated. The table also enforces the UUIDv7 admission bounds.
This is an exact elapsed duration, independent of timezone/DST calendar arithmetic.

Private cleanup_expired_v1 takes the same lock, deletes only expired reports and
quota buckets older than UTC yesterday, then advances a monotone request-time
floor and cleanup health in the same transaction. An expired, purged request can
never become new again, including after a clock regression. This normal-expiry
scheme needs no permanent per-resident tombstone. Early deletion before the
24-hour admission window ends needs separate bounded tombstones before shipping.
An absent expired ID while intake is disabled can return503 before410; neither
recreates content. Do not promise a universal410 response.

The submitter cannot execute cleanup, delete report rows or edit health/floor/
failure fields. It has only UPDATE(singleton) for SELECT FOR UPDATE. Ordinary SQL
delete failures roll back both delete phases, retain a content-free failure latch
and pause new admission, while saved receipts remain recoverable. Cancellation,
connection loss and lock timeout are not covered by that inner failure handler;
they require scheduler monitoring and the 26-hour stale-success gate. The future
scheduler must set statement_timeout before calling the function. A function-local
setting does not prove a whole-statement timeout.

Twenty-three actual PostgreSQL rollback groups pass before and after application.
Nine actual distinct-backend races and one outer statement cancellation now pass.
Separate actual pg_cron runs prove normal cleanup, ordinary-failure latching and
statement-timeout rollback using namespace-transformed applied function bodies.
All synthetic schemas/jobs were removed; production reports/usage remain zero.
Migration20260915023644 installs pg_cron1.6.4 and a disabled daily job. A separately
verified operational activation enables only job1 after zero-row cleanup. Its
command sets a30s statement timeout before the cleanup SELECT; the function's
2s lock timeout remains. UTC17:17 is01:17 Singapore the next day. Configuration
is checked as GMT, libpq jobs (background workers off), postgres and localhost5432.
The first natural daily execution has not yet been observed. Intake is disabled;
moderator authorization, health monitoring and resident acceptance remain gates.
Cron status alone is insufficient: an ordinary caught error returns ok:false
and cron reports succeeded. Inspect cleanup_failed_at and cleanup_verified_at,
not only cron.job_run_details.status. A cancellation rolls back the failure latch;
the26hour stale-success gate remains necessary. Job activation uses the supported
cron.alter_job API in a checked serializable transaction, not new cron table grants.
Expiry at30days is not an exact physical-erasure instant: a daily job introduces
up to one job interval, and outages/recovery copies need explicit handling.

The ReportComposer keeps one validated original selection and one prepared
request envelope in memory. Review precedes explicit Send; uncertainty preserves
the exact body, ID and retry proof. Closing uncertain work does not cancel or
delete a possible write. Received confirms only storage, not implementation.
Home integrates point/section selection with bounded validation, measured active
overlays and draft-loss/focus guards. UI availability is a separate hard-disabled
capability, not a server secret or an intake authorization. The default page
offers no reporting entry or feedback handler while it is false. Same-page
history keeps the original report mounted; cross-route SPA departures without
a cancelable Navigation API need an app-level guard before activation. Synthetic
component browser observations are not integrated Home or durable HTTP acceptance.

Migration20260915013223 revokes public/anon/authenticated execution of the platform
rls_auto_enable event-trigger helper without changing its body or trigger. Six
rollback groups plus post-apply metadata confirm automatic RLS, unchanged owner/
service-role permissions and no report-state mutation. Global security advisors
now have zero WARN/ERROR; three INFO no-policy notices reflect intentionally denied
private tables. The earlier reachable HTTP400 RPC was not proof of harmlessness.

Browser preparation creates a frozen request/secret envelope before any POST.
Concurrent callers share one promise; confirmed receipts are reused. Unknown
commit outcome persists across later denied attempts until receipt confirmation.
No automatic retry, local persistence, cloned-envelope recovery or resident form
integration is provided by this module. Use explicit empty referrer with the
same-origin referrer policy for consistency with Fetch's specified Origin rules.
The actual Chrome loopback probe sent correct Origin and no Referer under both
old and new policies; the predicted old-policy Chrome failure was not reproduced.

## Freshness and operations
Check source metadata on a documented schedule, within source/API constraints.
Show source-update date, last-check date and release date as different facts.
Government source cadence constrains refresh frequency, but processing failures
and unanswered reports remain our responsibility.
Publish versioned releases with coverage/value-change reports and rollback.
Keep heavy work local; no heavy compute in CI. Preserve all historical payloads.
Deployment must name its artifact version and show stage progress/failures.
Shared config sync must preserve project-specific protections; upstream ownership
and safe update strategy need resolution before changing sync automation.
AGENTS.md describes conventions; .agents/STATE.md is a concise current handoff.

## Performance and observability
Measure cold/warm lookup transfer, time to usable text and time to visible route
on agreed mobile/desktop profiles before adopting numerical budgets.
Capture non-sensitive error stages and timing; do not collect postal histories.
Default to no analytics. User-visible retry and optional diagnostic copy should
exclude secrets, private reports and unnecessary device identifiers.
Static requests and optional layer loading must remain within a hard free cap.

## Validation and release
See acceptance catalogue for executable-test targets and manual checks.
Use real live-bundle/P10 fixtures where relevant without modifying their sources.
Prototype and approve the complete mobile/desktop flow before broad UI changes.
Tests alone do not prove usability: observe intended users doing all three tasks.
Production deployment, feedback infrastructure and pipeline work have independent
approval gates. Documentation approval does not satisfy those gates.
