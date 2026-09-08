# SHIOK Revamp Execution Plan
Date: 2026-09-06
Authoritative design: ARCHITECTURE.md
Decisions: ARCHITECTURE-DECISIONS.md
Test catalogue: qa/SHIOK-acceptance-tests.md
All items below are pending unless explicitly marked complete with evidence.

## Milestones in order
1. Complete: commit agreed design, ADR and acceptance catalogue.
2. Owner approved: gesture-first prototype at 0de3d5f, in qa/prototypes/.
   Illustrative only. Empty/missing/failure states must be implemented and verified
   against real application behaviour in Round 1, not represented as already tested.
3. Establish cold/warm map baseline. Fix visible-route readiness, viewport fitting,
   stale requests and partial failures; add behaviour and visual regression checks.
4. Implement the approved core walk journey as one vertical slice with existing data.
5. Add bounded transit choices and home comparison with local persistence/sharing.
6. Present a free feedback-storage/moderation proposal with limits, retention and
   access control. Obtain infrastructure approval before durable submission work.
7. Implement and validate private reports and moderation under that approval.
8. Produce route-coverage gap register and source-refresh plan without modifying
   inputs. Present proposed fixes, candidate policy and measured compute pilot plan.
9. Run only separately approved processing into new versioned outputs; validate,
   compare and request release approval. Do not let this block frontend milestones.
10. Conduct task-based user sessions, resolve blockers and present a release candidate.
11. Deploy only with explicit approval; verify production, record artifact/commit
    identity and establish periodic source checks and report review.

## Definition of done per milestone
A coherent user outcome, relevant passing tests, evidence of visual checks where
applicable, documented limitations, clean scoped diff, commit pushed to main.
Catalogue entries are PLANNED until mapped to executed tests or manual evidence.
No placeholder submissions, fabricated fixtures claiming live truth or blanket
green status from source-string tests.
No new heavy run to satisfy a loop; stop at approval gates with a concrete proposal.
Use absolute write paths under the internal working root. Preserve all protected
data, existing verification lines, and locked weights.

## Round 1 status
Functional and portability repairs accepted by independent review (2026-09-07),
through 53651e9; diagnosis/performance/release decisions remain separate.
Earlier commits 0c6ba4c, f9e6e20 and 0ec2510 did not establish completion.
Their source-only PASS classifications and blank-map acceptance claims are
withdrawn by append-only corrections in qa/verification/REVAMP-R1-core-walk.md.

Milestone 3: measured overlays, current-render readiness, listener cleanup, stale
failures, partial errors/retry and MapLibre worker serving repaired. Four cold/warm
observations recorded with matching inspected route captures. M12 budget agreement
remains open; severe host memory pressure and page-target byte-count scope limit
performance interpretation. No production or representative phone benchmark claim.

Milestone 4: fixed centered top search and separate identity, 270px desktop panel,
compact four-metric mobile sheet and scrollable secondary details implemented.
Actual selected-route captures show 4 features at 1440x950, 390x844, 390x667 and
320x667 without overlap/overflow. Sheet/gesture/gap checks, paused-worker readiness,
stale A-failure/B-success, preview races, shared stops and real tile/geometry recovery
are executed. Alternate-stop summaries use their own evidence. Existing locked
scores, data and working secondary capabilities are preserved.

Prior functional validation: full web suite 228 passed in 30 files; focused regressions, TypeScript,
direct frontend-only build and repo integrity passed. Machine-readable report and
scoped file list: qa/revamp-r1/repair-final/summary.json. Local preview: localhost:4318.
Implementation commits 04fae3e and 7788e35 pushed to main; evidence is included with this handback.
No pipeline run, dependency install, protected-data change or deployment.

Final test-portability repair (2026-09-07): three test files now use a tracked
9,477-byte reduced fixture: four real score rows, two route geometries and one
alternate candidate, with original values and source hashes recorded. The isolated
baseline failed six tests plus walk-suite collection; after repair, focused tests
passed 15/15 and the full suite passed 228/228 across 30 files, with no skips.
The tracked-source test copy omits web/public/data and a Node filesystem guard
blocks both its data path and the original payload path. Existing dependencies
are linked; no install or payload mutation. TypeScript and integrity passed.
These are sampled regression checks, not a complete production index audit.
Evidence: qa/revamp-r1/repair-portability/summary.json and append-only corrections
in qa/verification/REVAMP-R1-core-walk.md. No new browser run or feature work.

Remaining: representative performance validation and
reviewed numerical timing budgets. Earlier cold/warm observations do not resolve
representative performance. Stop for review after this portability repair; the
next priority is a credible loading-time diagnosis, before comparison/reporting.
No independent user-session or release approval is claimed. Milestones 5-11 remain pending.

### Independent review decision, 2026-09-07
Round 1 functional and portability repairs through 53651e9 are accepted. The
reviewer checked fixture identity and all 11 source hashes, reran the isolated
focused selection successfully, and obtained repo_integrity=ok. The full 228-test
result remains the implementation agent's committed run, not a new reviewer run.
Performance and M12 budgets remain open; this is not production release approval.
Next: the bounded diagnosis in IMPLEMENTATION-BRIEF.md, before product fixes,
comparison/reporting, or deployment. Earlier memory-constrained timings do not
establish representative latency or identify its cause.

### Loading-time diagnosis handback, 2026-09-07
One cold/warm pair at 390x844 completed on the existing local production build;
the runtime source matches the prior tested code, but the build is not stamped
with current HEAD. Current selected-route observations were 10317.5/3291.0 ms;
text was visible at 3752.5/700.4 ms. Both inspected captures show four current-key
features with matching screenshot/count state. No blank-map acceptance claimed.

Sustained host pressure triggered the required stop gate: CPU 100% in all 15 valid
samples, 707-1377 MiB available and 1441-17792 pages input/sec. No repetitions or
desktop expansion. This does not prove that hardware is the sole cause.

The largest measured intervals occur after score readiness: map initialization
and selected-source processing. Each sample submits nine sources three times,
including three writes of the same route key. Proposed smallest frontend change:
separate route-source writes from optional lamp/feedback/POI updates. Its latency
benefit is a hypothesis to test after review, with zero pipeline cost; no fix is
implemented. Evidence, code locations, alternatives and proposed M12 budgets are
in qa/revamp-r1/loading-diagnosis/analysis.json and findings.json.

Native body read/decompression/parse remain combined. Server-internal execution
and worker transfer attribution remain unresolved; V8 trace export contained zero
events. Correct telemetry and obtain owner-arranged host headroom before another
controlled pair. Whole-app transfer, representative phone performance, reviewed
M12 budgets and release approval remain open. Stop for independent review.

### Route-source separation handback, 2026-09-08
Implemented only the fc6d1c6 authorization. The four route-owned sources now
publish separately from POIs, lamps, feedback and the active-gap highlight.
Executed component effect tests show zero route writes for those optional-only
changes; gap focus/clear still moves the camera intentionally. Replacement and
empty clearing publish all four route sources. Changed geometry at the same
postal/route ID propagates with a fresh readiness revision, without key-only
deduplication or JSON serialization for publication decisions.

Style recreation and explicit retry republish current collections, restore lamp
visibility/chosen-stop filters and rearm current-selection readiness. Queued retry
callbacks become inert on settlement/cleanup; repeated recovery does not accumulate
listeners. Stable default empty feedback avoids unrelated feedback writes.
Focused checks: 18 passed in 4 files. Isolated full suite: 236 passed in 31 files,
no failures/skips; existing dependencies linked, original and copied production
data paths denied. Installed TypeScript and integrity pass. Six diagnostic tests
prove completion-event waiting, detached-worker accounting and off-window payload
fingerprints. Original diagnostic files/captures and verification lines remain.

Browser/performance validation pending: seven valid host samples all show 100%
CPU, 541-835 MiB available and sustained page reads. No browser comparison, build,
new screenshot/count pair or latency saving is claimed. Reduced writes establish
publication behavior only. The accepted prior diagnosis recorded 27 source writes
EACH run, 54 across the pair; its pressured times are not a clean baseline.
Smallest owner action: provide a quieter session or suitable host, then audit
baseline/treatment builds and run the gated matching-profile comparison using the
new diagnostic driver. Native attribution, representative performance, M12 budgets
and release remain open. Evidence: qa/revamp-r1/route-source-separation/summary.json
and appended qa/verification/REVAMP-R1-core-walk.md. No pipeline, installation,
protected-data change, UI/schema change, deployment or unrelated feature.
Stop for independent review of this implementation before further work.
