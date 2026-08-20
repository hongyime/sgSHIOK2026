# P222 Section 10 Walk Trace Proposal

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Head And Remote

```text
5fbce0cd07c86a47f7b4b3a17df832a6be09dcc4
5fbce0cd07c86a47f7b4b3a17df832a6be09dcc4	refs/heads/main
```

## Scope

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
 decisions.md                              | 3 +++
 web/lib/__tests__/score-card-copy.test.ts | 6 ++++++
 web/section10-presentation-proposal.md    | 8 ++++----
 3 files changed, 13 insertions(+), 4 deletions(-)
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  05:08:25
   Duration  706ms (transform 94ms, setup 0ms, import 123ms, tests 42ms, environment 0ms)
```

## Phrase Search

```text
C:\sgSHIOK2026\web\section10-presentation-proposal.md:8:walk trace and its exposed gaps. Keep the locked score visible, but
C:\sgSHIOK2026\web\section10-presentation-proposal.md:16:| 2 | Access | Useful, but should sit beside walk distance and transit target rather than above walk exposure. |
C:\sgSHIOK2026\web\section10-presentation-proposal.md:94:SHIOK's current strongest evidence is the shelter-map walk trace. The score remains the
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:300:    expect(proposalSource).toContain("the shelter-map\nwalk trace and its exposed gaps");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:301:    expect(proposalSource).toContain("walk distance and transit target rather than above walk exposure");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:302:    expect(proposalSource).toContain("current strongest evidence is the shelter-map walk trace");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:307:    expect(proposalSource).not.toContain("routed shelter trace");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:308:    expect(proposalSource).not.toContain("route distance and transit target");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:309:    expect(proposalSource).not.toContain("above route exposure");
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

1. The Section 10 proposal still framed the defended artifact as a routed shelter trace and route exposure in its overview/current-state critique.
2. The proposal now uses shelter-map walk trace, walk distance, and walk exposure in those reader-facing proposal sections.
3. The change is proposal copy and test coverage only; it does not alter app behavior, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
