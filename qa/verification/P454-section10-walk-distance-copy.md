# P454 Section 10 Walk Distance Copy

## Root And Host

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Scope

Updated the Section 10 reference's Walk to transit detail copy from selected-walk
wording to sheltered-walk wording, matching the shipped browser row. No scoring,
export, rescore, subset run, ingest, network build, public data write, or
deployment was run.

## Evidence Tracking

```text
git check-ignore -v -- C:\sgSHIOK2026\qa\verification\P454-section10-walk-distance-copy.md; Write-Output "EXIT=$LASTEXITCODE"
EXIT=1
```

## Focused Web Test

```text
npm --prefix C:\sgSHIOK2026\web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  22:26:09
   Duration  479ms (transform 80ms, setup 0ms, import 99ms, tests 43ms, environment 0ms)
```

## Repo Integrity

```text
python C:\sgSHIOK2026\scripts\check_repo_integrity.py; Write-Output "EXIT=$LASTEXITCODE"
repo_integrity=ok
EXIT=0
```

## Protected Diff Guard

```text
git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11 C:\sgSHIOK2026\qa\releases; Write-Output "EXIT=$LASTEXITCODE"
EXIT=0
```

## Stale-Copy Search

```text
rg -n "selected walk|Selected walk|selected route|Selected route|sheltered route|Sheltered route|route evidence|current bundle|score bundle" C:\sgSHIOK2026\web\section10-presentation-proposal.md C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:55:    expect(source).not.toContain("Transit candidates exist, but this bundle has no connected walking route evidence yet.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:56:    expect(source).not.toContain("Transit stops or exits exist, but this bundle has no connected walking route evidence yet.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:68:    expect(source).not.toContain("Shortest same as sheltered route.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:283:    expect(source).not.toContain("Source-derived route evidence.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:301:    expect(source).not.toContain('"Sheltered route"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:303:    expect(smokeSource).not.toContain('summary.cardText.includes("Sheltered route")');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:311:    expect(source).not.toContain("sheltered route and shortest route");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:336:    expect(source).not.toContain('const otherLabel = viewedIsShortest ? "Sheltered route" : "Shortest";');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:376:    expect(tsxSource).not.toContain("onto mapped walking-route evidence");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:405:    expect(source).not.toContain("Not scored in the current bundle");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:437:    expect(source).not.toContain("Start with the shelter trace and exposed gaps; use the locked score only to sort the current bundle.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:438:    expect(source).not.toContain("Use this locked score to sort the current bundle");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:514:    expect(proposalSource).not.toContain("sort the current bundle");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:518:    expect(proposalSource).not.toContain("{covered_ratio}% of the selected walk is covered.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:519:    expect(proposalSource).not.toContain("Exposed gaps show where the selected walk leaves shelter.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:521:    expect(proposalSource).not.toContain("Selected walk distance from this postal code");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:535:    expect(proposalSource).not.toContain("Selected route distance from this postal code");
```

## Diff Stat

```text
git diff --stat -- C:\sgSHIOK2026\web\section10-presentation-proposal.md C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
 web/lib/__tests__/score-card-copy.test.ts | 3 ++-
 web/section10-presentation-proposal.md    | 2 +-
 2 files changed, 3 insertions(+), 2 deletions(-)
```

## FINDINGS

1. The Section 10 reference still had one positive `Selected walk distance...` string after P453.
2. The shipped browser row already says `Sheltered walk distance to transit.`, so the reference was stale rather than the app being wrong.
3. The stale-copy search now finds only negative assertions in tests for this reference scope.

## DISAGREEMENTS

1. None.
