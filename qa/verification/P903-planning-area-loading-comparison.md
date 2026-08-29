# P903 Planning-Area Loading Comparison

## Scope

Change the visible planning-area loading message for evidence and locked-score row views from `ranks` to `comparison`.

## Commands

### Root and remote

```text
PWD=C:\sgSHIOK2026
HOST=Prawn-E14
HEAD=798fc12db4419287ebf3af05a13a79aac2143c5d
REMOTE=798fc12db4419287ebf3af05a13a79aac2143c5d	refs/heads/main
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
?? qa/p19/hdb_2021_2026_onemap_geocode_cache.json
?? qa/p19/overpass_addr_postcodes_cache.json
?? qa/p19/universe_gap_measurement_detail.json
?? qa/p19/universe_gap_measurement_summary.json
?? qa/p21/
?? qa/p379/
?? qa/p567_baseline/
?? qa/p572_post_refresh/
?? qa/p575_compare/p575_build_delta_report.py
?? qa/p575_compare/p575_delta_report.json
?? qa/p575_compare/p575_partitions/
?? qa/p575_compare/p575_subset_first50_universe.parquet
?? qa/p575_compare/p575_subset_universe.parquet
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
```

### Copy context before edit

```text
C:\sgSHIOK2026\web\app\page.tsx:314:    if (loading) return `Loading planning-area ${sentenceLabel}.`;
C:\sgSHIOK2026\web\app\page.tsx:318:  if (loading) return `Loading planning-area ${sentenceLabel} comparison.`;
C:\sgSHIOK2026\web\app\page.tsx:1299:  const rankLoadingText = rankMetricLabel.endsWith("order")
C:\sgSHIOK2026\web\app\page.tsx:1300:    ? `Loading planning-area ${rankSentenceLabel}.`
C:\sgSHIOK2026\web\app\page.tsx:1301:    : `Loading planning-area ${rankSentenceLabel} ranks.`;
C:\sgSHIOK2026\web\app\page.tsx:1710:                <span className={styles.rankEmpty}>{rankLoadingText}</span>
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:793:    expect(source).not.toContain("Show ranks");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:811:    expect(source).toContain("const rankLoadingText = rankMetricLabel.endsWith(\"order\")");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:812:    expect(source).toContain("{rankLoadingText}");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:813:    expect(source).not.toContain("Loading planning-area {rankSentenceLabel} ranks.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:814:    expect(source).not.toContain("Loading planning-area locked score order ranks.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:815:    expect(source).not.toContain("Loading planning-area ${sentenceLabel} ranks.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:816:    expect(source).toContain("Loading planning-area ${sentenceLabel}.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:817:    expect(source).toContain("Loading planning-area ${sentenceLabel} comparison.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:818:    expect(source).not.toContain("Loading planning-area ranks...");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:825:    expect(source).not.toContain("locked score sorting index ranks");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:330:    expect(html).toContain("Loading planning-area locked score order.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:331:    expect(html).not.toContain("Loading planning-area locked score order ranks.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:332:    expect(html).not.toContain("Loading planning-area locked score sorting index ranks.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:333:    expect(html).not.toContain("Loading planning-area Locked SHIOK score ranks.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:334:    expect(html).not.toContain("Loading planning-area Locked score sorting index ranks.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:629:    expect(closedRankHtml).not.toContain("Show ranks");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:723:    ).toBe("Loading planning-area covered-walkway evidence comparison.");
C:\sgSHIOK2026\web\lib\__tests__\rank-payload.test.ts:12:  it("does not fetch area ranks until the rank panel is opened", () => {
C:\sgSHIOK2026\web\lib\__tests__\rank-payload.test.ts:29:  it("ranks compact projected records without route geometry or provenance", () => {
```

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  15:15:59
   Duration  10.21s (transform 3.21s, setup 0ms, import 4.01s, tests 2.02s, environment 1ms)
```

### git diff --check

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

Exit code: 0.

### Locked weights diff

```text
```

Exit code: 0.

### Repository integrity

```text
repo_integrity=ok
```

Exit code: 0.

## FINDINGS

1. The screen-reader planning-area loading copy already said `comparison`, but the visible loading text still said `ranks` for non-order views.

## DISAGREEMENTS

1. None.
