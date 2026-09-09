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

## ADR-15: Preserve published option evidence before ranking (2026-09-09)

Use one pure normalizer for the original score and geometry snapshot, before
any chosen-stop adapter drops candidates or replaces default fields. It accepts
an explicit paired bundle/postal context and one transit category; optional
POIs, live requests and inherited composite scores are not ranking inputs.
This is structural validation, not a new cryptographic provenance audit.

Retain category defaults as well as published candidate summaries. Default
identities are internal versioned keys, not fabricated stop IDs; preserve exact
published IDs separately. Join strong validated bus identities or unique exact
name/geometry evidence, never a POI label or station-only resemblance. Preserve
the chosen whole representation; do not fill its missing fields from a duplicate.
Validated contradictory evidence excludes that identity from recommendations;
unsupported trust, invalid state and malformed identity cannot poison valid
evidence by asserting an identity or contradiction they do not establish.

Keep valid, missing and invalid numerical capabilities distinct. Supported
routing type/category/state plus complete paired geometry establish a usable
published walk; a missing distance does not discard valid coverage. Defaults
do not need an extra positive-distance corroborator: routed_m and shortest_m
are produced from the same variable, not independent measurements. No metric
is replaced with straight-line distance, another route variant or zero.

Validate encoded route parts without changing coordinates or measuring a new
route. Incomplete multipart geometry remains partial, never silently repaired
from a flattened line. Logical score gaps retain their total/longest meaning;
map fragments cannot reconstruct whole stretches from part_index. Candidate
fragment-only evidence cannot acquire default logical gaps. Shortest-route
gaps remain unavailable unless separately published for that route variant.
Consumers must use validated geometry, not forward raw diagnostic geometry.
Optional route-segment styling needs its own validated adapter before reuse.

T05 will choose shortest shown walk, most covered and valid current selection,
deduplicated to at most three per category with stable unrounded ties. T06 will
wire those choices, map/summary/URL and explicit preview recovery. Neither UI
integration nor all-stop evaluation is established by T04 fixture validation.
Contract and real source identities:
`qa/revamp-r1/published-option-contract-20260909.json` and
`web/lib/__tests__/fixtures/published-options.provenance.json`.

### T05 selector boundary, 2026-09-09

`selectPublishedTransitChoices` consumes the normalized pool, category and
optional current key without reading raw score/geometry/POIs. Order shortest
shown walk by sheltered distance, known coverage descending, then exact key;
order most covered by known ratio, known positive distance, then exact key.
Use full source precision. Valid zero coverage is not missing coverage.

Merge winner roles, retain valid current, then add an eligible category default
only if absent and fewer than three choices remain. Never fill arbitrary spare
slots. Source locators identify the default without parsing a label or inventing
a stop ID. An unavailable default still owns reset but is not a selectable walk.
Omitted current selects the declared default; explicit null requests no current
role. A stale explicit key does not silently become the default selection.

This pure selector does not drive the page yet. T06 must preserve original
candidate geometry across mode changes, repair preview metric meanings and use
validated geometry/gap capabilities without copying raw optional segments.
The existing POI proximity helpers remain separate and do not rank walks.

## ADR-16: Compare category-default sheltered walks (2026-09-09)

Comparison adds a postal, not the inspector's currently selected candidate.
Every column uses the same explicit bus or MRT/LRT category and the published
default sheltered walk for that category. T05's shortest/most-covered picker
winners answer an inspection question; silently choosing either would change
the meaning of a home comparison. Do not add a hidden composite ranking.

Resolve the declared category-default source from the full normalized pool,
not the bounded picker or only geometrically retainable choices. A same-category
top-level default is allowed only when no category default is declared. An
unavailable, rejected or conflicting declared default stays unavailable; it is
not replaced with another candidate or transit category. Valid measurements may
remain useful when drawing is unavailable. Destination and evidence status must
be visible per column; adding a postal does not promise complete walk evidence.

Use the same pure walk-metrics adapter as the inspector. Preserve published
precision until presentation, including existing coverage-percent rounding.
Keep distance, coverage, logical uncovered total and longest logical gap
independently nullable. Missing is not zero, and mapped fragments do not
reconstruct logical gaps. No shortest-variant gaps may be borrowed.

The row carries bundle/postal/category, a versioned fixed selection policy,
route variant, selected option/source locator, destination and capability
status. It is derived from paired source contexts, not persisted as a score or
new artifact. Preserve source provenance as evidence, without claiming a
cryptographic audit or constructing candidate provenance from its default.
Default-group ownership is not selected-source authority: the picker may choose
a healthier alias. Comparison pins the actual declared representation instead.
Within that already-established identity group, trusted routed representations
must agree on valid shortest distance, sheltered distance and covered ratio even
when geometry is partial. Reuse normalizer validation for each representation;
do not create new aliases or accept unsupported/wholly invalid-geometry sources
as contradictions. A comparison-only metric contradiction clears displayed
metrics and names the field without rewriting the normalizer's original status.
T09 persists only validated postals, shared category and active column; T10
must make this fixed-policy meaning clear and show the actual destination.
Changing the inspector stop/variant cannot silently change stored comparison
semantics. Active column only controls which compared walk is on the map.
T10 must resolve that same pinned source for the map, not look up the group's
potentially substituted selectedSource again.

T08 implements this pure contract with reduced real fixtures. T09-T11 still
owe persistence, visible comparison, loading/failure handling and share URLs.
No pipeline, live routing, input expansion or new hosting service is needed.

## ADR-17: Keep a minimal local shortlist and transient request ownership (2026-09-09)

T09 stores only version1, zero to three unique six-digit postal strings, one
bus/MRT-LRT category and the active postal. Use the single owned key
shiok:comparison:v1. Preserve leading zeros; reject coercion, whitespace,
duplicates, excess homes, unknown versions/fields and inconsistent membership.
The entire stored payload is validated, not partially repaired. Never persist
metrics, provenance, bundle snapshots, request identifiers, report drafts or
browsing history alongside the shortlist.

Add appends and activates a new postal. Duplicate/fourth/invalid additions leave
state unchanged with an explicit rejection. Remove preserves order; removing
the active entry selects the next remaining position, otherwise the previous
last entry. Empty means no active postal. Category changes preserve the postal
list and active entry. Reset clears the list but keeps the chosen category.

Storage access and operations can fail. Inject access, catch failures, retain
usable in-memory state and report persistence availability to the caller.
Reading never writes, deletes or repairs storage. Write only the owned key,
once per explicit change after restoration, with no quota-retry loop or pruning
of unrelated keys. Do not save the initial empty UI state before restoration.

Network request ownership is separate and never persisted. T10 must allocate
monotonically increasing request IDs and keep the current token for each column.
Tokens include bundle, postal and category. Invalidate synchronously on removal,
category/bundle change, retry and comparison closure; re-add/reopen gets new IDs.
All success, failure and geometry callbacks must pass the same delivery guard.
Abort is supplementary, not the correctness guarantee. A predicate alone cannot
invalidate tokens: T10's actual loader must prove remove/re-add and category ABA
races in integration tests. T09 supplies the tested predicate contract only.

Inactive listed rows may finish loading; moving the map additionally requires
the postal to remain the active column and ADR-16's pinned default source.
Closed comparison starts no reads and accepts no old completions. Ordinary
postal search must remain independent of storage or comparison-load failures.
T10/T11 still own browser integration, accessible controls and explicit sharing.

## ADR-18: Open comparison owns a bounded drawer and one mapped walk (2026-09-09)

T10 adds an explicit Compare command and a contextual Add to comparison action.
The normal map-first inspector retains its top-left stack. Opening comparison
replaces the inspector with a bottom drawer, capped at three postal columns,
and hides the unrelated primary walk's controls. The map remains visible above
the drawer and required attribution remains below it. A native table aligns
destination and four measurements; its own scroll area contains overflow on
small screens. Show on map selects one column, never an overall winner.
Postal headings are the accessible map-selection buttons and stay pinned while
the measurements scroll. A compact Map: postal indicator names the active drawn
column even when another column is being inspected horizontally. Do not add a
second permanent card or repeat a map-selection row beneath each postal.

The common category always uses ADR-16's declared default sheltered walk,
regardless of the inspector's selected candidate or variant. The row and map
are returned by one pinned-source resolver. Shortest-only geometry cannot be
sent to a sheltered-only map: require surviving sheltered parts, otherwise keep
valid measurements and leave the route clear. Partial sheltered parts may be
shown with an explicit partial-drawing status, not joined into a complete walk.

A local controller owns subscriptions, restoration and transient request IDs.
Existing static readers remain responsible for transport caching. Score and
geometry settle independently; a geometry failure must not hide score evidence.
Every completion and rejection checks its current bundle/postal/category/token.
Removal, retry, category changes, closure and source replacement invalidate old
ownership synchronously. Source replacement replaces transport functions as well
as bundle identity. Inactive listed columns may finish; only the active column
supplies the map. No automatic retry, background shortlist load or live routing.

Restore once before user-action writes, never autosave an empty mount. Denied
storage leaves an in-memory shortlist and a session-only notice. Duplicate,
invalid, limit and semantically empty reset actions do not write. Only the owned
shortlist key changes. Closing and reloading preserve the list but not open UI
or request tokens. Ordinary search closes comparison and restores the inspector;
Add another postal returns focus to the same postal input, not a second search.
Removing a focused column moves focus to a remaining removal control or Close;
Close returns focus to Compare. New automatic focus must not steal deliberate
focus outside the removed controls.

No share control is claimed in T10; T11 must implement explicit URL semantics.
No data generation, scoring, deployment or external service is needed here.
