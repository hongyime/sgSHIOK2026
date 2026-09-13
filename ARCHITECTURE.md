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
No new backend or provider is approved by this design.

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
