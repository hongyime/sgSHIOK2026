# P453 Section 10 Displayed-Walk Copy

## Root And Host

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Scope

Updated the tracked Section 10 presentation reference so the shelter-exposure
row, top block, and gap heading use the same displayed-walk framing as the
shipped browser. No scoring, export, rescore, subset run, ingest, network build,
public data write, or deployment was run.

## Evidence Tracking

```text
git check-ignore -v -- C:\sgSHIOK2026\qa\verification\P453-section10-displayed-walk-copy.md; Write-Output "EXIT=$LASTEXITCODE"
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
   Start at  22:22:13
   Duration  1.46s (transform 208ms, setup 0ms, import 249ms, tests 111ms, environment 0ms)
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

## Diff Stat

```text
git diff --stat -- C:\sgSHIOK2026\web\section10-presentation-proposal.md C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
 web/lib/__tests__/score-card-copy.test.ts | 5 +++++
 web/section10-presentation-proposal.md    | 6 +++---
 2 files changed, 8 insertions(+), 3 deletions(-)
```

## FINDINGS

1. `web/section10-presentation-proposal.md` still used the pre-displayed-walk shelter copy in three places: `Sheltered walk: {covered_ratio}%`, `{covered_ratio}% of the selected walk is covered.`, and generic `Exposed gaps`.
2. The shipped browser already names the active displayed walk in the exposure hero and exposed-gap heading, so the reference document was behind the product copy rather than the app being wrong.
3. The focused source-copy test now pins the displayed-walk reference wording and rejects the stale selected-walk shelter sentence.

## DISAGREEMENTS

1. None.
