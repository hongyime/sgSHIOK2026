# P221 Section 10 Walk Proposal Copy

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Head And Remote

```text
9d6f1cafbbad70b1ac0992c9ec262a8b75712c6e
9d6f1cafbbad70b1ac0992c9ec262a8b75712c6e	refs/heads/main
```

## Scope

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
 decisions.md                              | 3 +++
 web/lib/__tests__/score-card-copy.test.ts | 6 ++++++
 web/section10-presentation-proposal.md    | 6 +++---
 3 files changed, 12 insertions(+), 3 deletions(-)
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  05:04:39
   Duration  2.11s (transform 248ms, setup 0ms, import 326ms, tests 157ms, environment 1ms)
```

## Phrase Search

```text
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:297:    expect(proposalSource).toContain("Selected walk distance from this postal code to the chosen MRT/LRT or bus access point.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:298:    expect(proposalSource).toContain("deciding whether the walk actually works");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:299:    expect(proposalSource).toContain("[shelter-map walk]");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:301:    expect(proposalSource).not.toContain("Selected route distance from this postal code");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:302:    expect(proposalSource).not.toContain("deciding whether a route actually works");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:303:    expect(proposalSource).not.toContain("[route map]");
C:\sgSHIOK2026\web\section10-presentation-proposal.md:27:| 2 | Walk to transit | `{sheltered_m} to {transit_target}` | `Selected walk distance from this postal code to the chosen MRT/LRT or bus access point.` |
C:\sgSHIOK2026\web\section10-presentation-proposal.md:51:inspect the shelter map and exposed gaps before deciding whether the walk actually works
C:\sgSHIOK2026\web\section10-presentation-proposal.md:68:[shelter-map walk]
```

## Evidence Ignore Check

```text
exit=1
```

## Locked Weights Diff Check

```text
```

## Repository Integrity

```text
repo_integrity=ok
exit=0
```

## FINDINGS

1. The tracked Section 10 proposal still used route wording in review copy: selected route distance, deciding whether a route works, and `[route map]`.
2. The proposal now says selected walk distance, deciding whether the walk works, and `[shelter-map walk]`; old phrases remain only as negative regression guards.
3. The change is proposal copy and test coverage only; it does not alter app behavior, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
