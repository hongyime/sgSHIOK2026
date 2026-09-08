# Architecture Decision Record: Shelter Service
Date: 2026-09-06
Status: accepted product direction; provider and numerical budgets unresolved.
Supersedes the assumption that the app is primarily a score inspection tool.
Does not supersede locked weights, protected data or release approvals.

## Context
The existing UI combines evidence inspection, ranking and route exploration.
Users need understandable walk trade-offs, home comparison and shelter feedback.
A shared map/data foundation can support all three without placing every feature
on one screen. The owner approved postal-to-transit first, no weather, a small
useful transit list, private reports pending owner moderation, and a $0 budget.

## ADR-01: One foundation, three task entry points
Decision: share route evidence across inspection, comparison and reporting.
Alternative rejected: separate applications or one screen containing every tool.
Consequence: common selection semantics, contextual actions and progressive detail.

## ADR-02: Evidence before composite
Decision: lead with destination, distance, shelter and exposure; retain the
existing score in secondary details without changing any weights.
Alternative rejected: a new score or a weather-dependent umbrella recommendation.
Consequence: coverage is not a guarantee of dryness, safety or accessibility.

## ADR-03: Bounded transit choices
Decision: show a small useful eligible list with distance/shelter trade-offs.
Avoid duplicate nearest/most-sheltered choices when they identify the same stop.
Alternative rejected: immediately computing every origin/destination combination.
Consequence: document candidate coverage and selection limits before computation.
Exact candidate limit and ordering are pending fixture-backed implementation design.

## ADR-04: Local home shortlist
Decision: up to three postals, local persistence and explicit share links.
Alternative rejected: accounts or server-side home histories.
Consequence: no cross-device synchronization except user-shared URLs.

## ADR-05: Private moderated feedback
Decision: separate map errors from requests for new shelter. Owner reviews
reports before publication; no direct agency submission or automatic data edits.
Alternative rejected: immediately public crowd edits.
Consequence: durable submission storage, abuse protection, moderation, retention
and deletion are unresolved infrastructure requirements, not frontend-only work.
Choose only a bounded free solution; no provider is selected or authorized.

## ADR-06: Versioned maintenance
Decision: scheduled checks and periodic validated releases; distinct source,
check and release dates. Government cadence is a constraint, not a freshness claim.
Alternative rejected: silently overwriting frozen inputs or automatic heavy runs.
Consequence: inventory gaps and pilot changes before approving local processing.

## ADR-07: Incremental architecture
Decision: extract feature boundaries around existing readers and map code.
Alternative rejected: wholesale framework rewrite.
Consequence: ship vertical slices and test visible outcomes, not source wording.

## ADR-08: Autonomous execution boundaries
Decision: a future goal/loop may work through approved reversible implementation
tasks, commit coherent changes and push main; it must honor all explicit gates.
Never interpret this record as authority for scoring, exports, input rebuilds,
deployment, provider signup, paid services or mutations of protected payloads.
Stop on hash mismatch, unsafe operations or unresolved required approvals.
Report a concrete blocker instead of spending iterations on cosmetic substitutions.

## ADR-09: Approved map-first presentation
Owner approved prototype 0de3d5f: full-screen map, centered search, small floating
desktop panel and mobile bottom sheet; no tagline, empty transit section or visible
zoom/reset toolbar. Retain mandatory attribution, gestures and keyboard access.
Success is quiet; partial failures remain actionable. Production reuses MapLibre,
not the prototype canvas, and all displayed metrics come from actual selected data.

## ADR-10: Bounded delegated implementation and independent review
Delegate one vertical slice at a time, beginning with IMPLEMENTATION-BRIEF.md.
The implementing agent owns scoped edits/tests/evidence and pushes main; the reviewer
independently checks diffs and outcomes before authorizing the next slice.
Owner approval of a mockup does not approve deployment, infrastructure or compute.
No fake comparison/report controls in production while those workflows are pending.

## Delivery cost classes
Documentation, prototypes and frontend changes: zero pipeline cost, not zero effort.
Feedback: zero pipeline cost; free durable infrastructure feasibility unresolved.
New artifact generation/export: gated, pilot-derived cost; no fixed estimate accepted.
Routing/rescore/refresh: gated local compute, measured separately from fixed startup.
Arbitrary origin/destination: future scope requiring its own design and budget.

## ADR: Map-first home and restrained data disclosure (2026-09-08)
Status: owner-requested, implemented locally; deployment separate.
The basemap is the primary surface even with no selected postal. Mount MapLibre
from `/` and defer postal score/geometry reads until intent. Empty route state
is idle; selected-record geometry failures still retain explicit retry/evidence.
Put SHIOK beside the centered input, accessible icon submit inside the field,
and a collapsed About data disclosure at bottom center. Keep mandatory map
attribution outside that disclosure. Opening data hides, but does not discard,
the result selection; close it to return to the same walk.
Test real homepage and worker-controlled revisits as well as direct postal links.
Readiness of one viewer is not completion of comparison, reporting, maintenance
or a new release. Current outcomes and acceptance gates live in PRODUCT-PLAN.md.

## ADR-11: Owner revision to a top-left control stack (2026-09-08)
Supersedes ADR-09 and the centered layout in the preceding map-first ADR for
positioning only. SHIOK goes at top left; postal search below it; search/result
cards below search at the same width. The stack is at most 300px and shrinks
for narrow viewports. About data expands from bottom right. The empty-home
basemap, quiet success state, postal-only input and icon submit remain.
Measure the whole stack: reserve its left edge on wide screens and its bottom
as top padding on narrow screens. Expanded content scrolls within a bounded
stack so a usable route viewport remains. This replaces the bottom-sheet
assumption, not just its CSS coordinates.
OneMap's GreyLite integration guidance explicitly says not to remove its
attribution: https://www.onemap.gov.sg/docs/maps/greylite.html (checked 2026-09-08).
Keep logo and copyright independently visible; About data is not a replacement.

## ADR-12: Direct execution from resumable tickets (2026-09-08)
Supersedes ADR-10's delegated-agent procedure; the owner asked Codex to execute
directly. PRODUCT-PLAN.md is the single task board, not a second copy under
ignored docs/ or a private session store. Each ticket names dependencies, file
scope, acceptance cases, size and an approval gate; STATE points to the next
startable ticket. Tests land with their feature and completion includes evidence
and a pushed commit, not only a checked box or mock implementation.
Finish one narrow slice at a time. Gates stop dependent work only; continue
independent free work. Core walk, comparison, reports and data expansion can
ship as separate explicitly approved releases; reports/rescore do not block
an otherwise complete frontend-only improvement. Planning does not authorize
pipeline work, account/provider setup, protected payload writes or deployment.

## ADR-13: Mutable shell revalidation and bounded cache recovery (2026-09-08)
Mutable root HTML and the stable worker script revalidate; versioned data/chunks
retain immutable caching. Keep existing static assets for open old tabs. A new
shell cache must neither read unrelated caches nor remove unknown/future ones.
Quota/cache failures cannot turn a successful fetch into a page failure. A slow
navigation times out only when a fallback exists, and a settled response must
never be aborted by a later cache-read completion. Newer successful navigation
wins cache-write races; a later failure must not suppress an earlier success.
Request worker update on page intent; failures allow a later intent to retry,
without polling or automatic reload loops. Exclude RSC/prefetch and API traffic.

T01's browser evidence is conditional, not complete: explicit worker update
activated B and preserved route rendering and unrelated caches. Automatic A-to-B
activation did not meet its observation gate. A's shipped code cannot be changed
retroactively by B's headers/helper; do not equate this with permanent lockout.
The origin-outage failure is separate: cached plain JSON was not tried when the
compressed probe returned 503. Recover only available cached alternate bytes on
transport failure, never silently substitute for successful-but-corrupt data.
No pipeline payload, schema, value or version is changed by frontend recovery.

The owner's subsequent all-tasks goal explicitly requests independent agents,
superseding ADR-12's no-delegation procedure only. Keep disjoint write scopes;
the parent reviews, commits and pushes. All owner-only gates remain in force.

### T02 implementation, 2026-09-09

On gzip transport failure or 5xx, a same-origin browser may recover an existing
plain artifact using `only-if-cached` and `same-origin`. Do not add an uncached
plain network fallback, mask cancellation, suppress successful-response decode
errors, or probe plain versions of compressed-only transit shards. Cache misses
retain the original failure. The server does not use this browser-only fallback.
Worker in-flight keys separate cache-only and network-allowed consumers in both
arrival orders. Executed regressions cover these distinctions.

This recovers data, not every map dependency. A later origin-outage test records
the MapLibre worker URL returning503. Keep worker-asset availability, pre-load
failure deadlines, and automatic legacy-upgrade acceptance separate and open.
Evidence: `qa/revamp-r1/data-cache-recovery-20260909/summary.json`.

### T01 worker dependencies, 2026-09-09

The shipped MapLibre worker and shared module are immutable release dependencies,
like hashed application chunks. Cache only their pinned `/maplibre/6.1.0/`
directory in the SW and assign immutable HTTP headers to that same directory.
An upgrade must use a new versioned path, not replace bytes under the old URL.
Do not widen the rule to unversioned assets or arbitrary worker endpoints.
Observed origin-outage rendering now passes for a previously visited walk;
unvisited data, external tile outages and legacy client upgrades remain distinct.
Evidence: `qa/revamp-r1/worker-cache-20260909/summary.json`.

### T01 startup ownership and recovery, 2026-09-09

Bound map-component startup from before its MapLibre import through the first
`load` event with a 30-second deadline. This is a recoverability limit, not a
load-time target. `style.load` alone is not completion. Keep the existing
selection-specific rendered-feature probe separate after startup.

A recoverable basemap tile error can still settle and allow `load`; keep that
map and its deadline alive. Retry before load creates a fresh owned attempt;
retry after load retains the existing source-recovery path. Terminal startup
failure detaches the old map before teardown and requests an explicit page
reload. MapLibre's global dispatcher can keep a failed worker alive across map
remounts; the real fault-injection test reproduced that limitation. No private
worker-pool reset or automatic reload is introduced. Retain the URL; ask before
discarding unsent feedback. Late imports/events cannot change a newer attempt.
The page's outer lazy-component chunk and automatic old-client upgrades remain
separate acceptance requirements, not implicitly covered by this deadline.
Evidence: `qa/revamp-r1/map-startup-20260909/summary.json`.

## ADR-14: Bounded private reporting proposal (2026-09-09)

Status: proposed, awaiting T13 owner approval. T12 design work is complete, not
the reporting service. Recommend Cloudflare Workers Free, D1 Free, Turnstile
Free, and a separate moderator Worker protected by Access Free on all domains
and previews. Retain Vercel for the resident map and avoid a submission proxy.
Access's documented Free onboarding still requires owner payment details.

Use private minimal location/note reports of two types: mapping error and
shelter request. No resident account, contact field, photograph, public listing
or report-body lookup. Admit a report, debit bounded quotas and write its audit
event atomically; only a committed report gets a receipt. An authenticated
retry of an already committed request must not depend on a fresh challenge.
T14 must pin request expiry and deduplication tombstone lifetime before coding.

Propose 100 new reports/day, 500 pending and 5,000 retained; select non-paid
plans and accept outages instead of automatic paid scaling. Provider account
quotas include retries, moderation and maintenance, not just report inserts.
Validate real operation costs with synthetic data only after approval.

Expire report content at the earlier of 90 days from receipt or 30 days after
resolution. Delete abuse buckets from active storage within 48 hours, subject
to outages. Recovery history can retain deleted data for seven further days;
exclude abuse buckets from independent backups. Early-deletion records must
survive independently of any restored snapshot; otherwise keep restored access
closed. No immediate total-erasure or Singapore-only residency promise.

Owner approval must cover provider/payment setup, privacy, quotas, moderation
twice weekly, backup destination/keys and recovery handling. Provisioning,
tooling, backend validation and production activation stay separately gated.
Detailed proposal, alternatives and official sources:
`qa/revamp-r1/report-service-proposal-20260908.json`.
