# P416 footer headline evidence copy

## Root guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## git rev-parse HEAD / origin main

```text
1a3b18cba0eee104d0af65b9ed170758164bf50b
1a3b18cba0eee104d0af65b9ed170758164bf50b	refs/heads/main
```

## git status --short before commit

```text
?? qa/p10_network_provenance_20260813/
?? qa/p11/d_calibration_w2_0050/
?? qa/p11/d_full_w2_1200/
?? qa/p11/d_pilot_w2_0200_final/
?? qa/p11/d_pilot_w2_0200_retry3/
?? qa/p11/d_pilot_w2_0200_retry4/
?? qa/p11/diffs/
?? qa/p11/subset_0050_ready.parquet
?? qa/p11/subset_0200_ready.parquet
?? qa/p11/wip-worktree.diff
?? qa/p12/
?? qa/p125/
?? qa/p13/
?? qa/p16/
?? qa/p19/
?? qa/p21/
?? qa/p379/
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
```

## git check-ignore evidence path

```text
EXIT=1
```

## Focused source inspection

```text
web\app\page.tsx:2232:        <footer className={styles.pageFooter}>Source-derived covered-walkway, exposure-gap, and night-lighting map evidence.</footer>
web\lib\__tests__\score-card-copy.test.ts:249:  it("keeps the footer aligned with covered-walkway and night-lighting evidence framing", () => {
web\lib\__tests__\score-card-copy.test.ts:252:    expect(source).toContain("Source-derived covered-walkway, exposure-gap, and night-lighting map evidence.");
```

## npm focused test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  19:28:53
   Duration  2.29s (transform 361ms, setup 0ms, import 447ms, tests 197ms, environment 1ms)
```

## repo integrity

```text
repo_integrity=ok
EXIT=0
```

## protected path diff

```text
EXIT=0
```

## git diff --stat

```text
decisions.md                              | 3 +++
web/app/page.tsx                          | 2 +-
web/lib/__tests__/score-card-copy.test.ts | 2 +-
3 files changed, 5 insertions(+), 2 deletions(-)
```

## FINDINGS

1. The page footer still used `covered-walkway, exposure-gap` wording while the rest of the first-view copy had converged on `covered-walkway ratio` and `exposed gaps`. That was a visible product-copy inconsistency, not a data or scoring issue.
2. The change is free-tier browser copy/test/decision evidence only. It does not run scoring, export, rescore, subset, ingest, network, deploy, or public-data mutation.
3. Protected paths remain untouched by diff: locked weights, checksums, published data, protected QA evidence, and release evidence all have empty diff output.

## DISAGREEMENTS

1. None.
