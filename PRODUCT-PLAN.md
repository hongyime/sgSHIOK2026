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
Milestones 3 and 4 complete (pushed to main as of 2026-09-07):
  3. 0c6ba4c — map reliability: readiness, nav control, stale-request race, fitPadding
  4. f9e6e20 — approved core walk layout: identity row, floating panel, bottom sheet,
     srOnly tagline; f9e6e20 + 0ec2510 — 152-line behaviour test coverage
Evidence: qa/verification/REVAMP-R1-core-walk.md
Remaining gaps (explicit): M01/M02 route-visible screenshot (cold CDP pass); M12 network profiling.
Next: independent reviewer inspects diffs and evidence, then issues Round 2 bounded prompt.
Milestones 5-11 remain pending.
