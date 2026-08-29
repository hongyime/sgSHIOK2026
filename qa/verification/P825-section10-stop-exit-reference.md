# P825 Section 10 Stop-Or-Exit Reference

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Commands

```text
npm --prefix web test -- score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  22 passed (22)
   Start at  08:23:32
   Duration  1.05s (transform 241ms, setup 0ms, import 294ms, tests 133ms, environment 0ms)
```

```text
python scripts/check_repo_integrity.py
repo_integrity=ok
exit=0
```

```text
git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4 qa/releases
```

```text
rg -n "transit_target|walk distance and transit target|route distance and transit target|chosen MRT/LRT or bus access point" web/section10-presentation-proposal.md web/lib/__tests__/score-card-copy.test.ts
web/lib/__tests__/score-card-copy.test.ts:807:    expect(proposalSource).not.toContain("{sheltered_m} to {transit_target}");
web/lib/__tests__/score-card-copy.test.ts:808:    expect(proposalSource).not.toContain("chosen MRT/LRT or bus access point");
web/lib/__tests__/score-card-copy.test.ts:832:    expect(proposalSource).not.toContain("route distance and transit target");
web/lib/__tests__/score-card-copy.test.ts:833:    expect(proposalSource).not.toContain("walk distance and transit target");
```

## FINDINGS

1. The tracked Section 10 reference still used the internal `transit_target` placeholder after P824 changed shipped UI copy to stop-or-exit language.
2. The reference is now aligned with the browser vocabulary: `stop_or_exit`, chosen MRT/LRT exit, and bus stop.

## DISAGREEMENTS

1. None.
