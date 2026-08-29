# P1004 Training Crawler Robots Policy

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

### hostname; working root; HEAD; status

```text
Prawn-E14
C:\sgSHIOK2026
76ea5060ff4217e78afda72956be5187729b0a59
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

### npm --prefix web test -- deployment

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  27 passed (27)
   Start at  23:38:27
   Duration  2.82s (transform 535ms, setup 0ms, import 674ms, tests 539ms, environment 1ms)
```

### python scripts/check_repo_integrity.py

```text
repo_integrity=ok
repo_integrity_exit=0
```

### git diff -- pipeline/config/weights.yaml

```text
```

### git check-ignore -v qa/verification/P1004-training-crawler-robots.md

```text
p1004_check_ignore_exit=1
```

## Sources Checked

OpenAI crawler controls: https://developers.openai.com/api/docs/bots
Anthropic crawler controls: https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
Common Crawl CCBot controls: https://commoncrawl.org/ccbot

## FINDINGS

1. The site can reduce avoidable Vercel edge requests by telling training/common-crawl crawlers not to crawl the app root at all while leaving ordinary users and search-oriented fetchers under the existing public root rule.
2. The live deployment is not changed by this commit. The committed robots policy will only affect traffic after an explicit Vercel deployment.
3. `pipeline/config/weights.yaml` remained untouched.

## DISAGREEMENTS

1. I did not block every AI-related crawler. Blocking only `GPTBot`, `ClaudeBot`, and `CCBot` is the lower-risk split because it targets training/common-crawl traffic without deliberately suppressing search/user-fetch integrations.
