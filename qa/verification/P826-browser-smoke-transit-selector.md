# P826 Browser Smoke Transit Selector

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Commands

```text
npm --prefix web test -- deployment.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  08:28:19
   Duration  1.22s (transform 184ms, setup 0ms, import 237ms, tests 52ms, environment 1ms)
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
rg -n 'Transit target"\] button|Transit stop or exit type"\] button' web/scripts/browser-smoke.mjs web/lib/__tests__/deployment.test.ts
web/scripts/browser-smoke.mjs:403:    `Array.from(document.querySelectorAll('[aria-label="Transit stop or exit type"] button')).some((button) => button.textContent?.trim() === '${label}')`,
web/scripts/browser-smoke.mjs:409:      const button = Array.from(document.querySelectorAll('[aria-label="Transit stop or exit type"] button'))
web/scripts/browser-smoke.mjs:416:    `Array.from(document.querySelectorAll('[aria-label="Transit stop or exit type"] button')).some((button) => button.textContent?.trim() === '${label}' && button.getAttribute('aria-pressed') === 'true')`,
web/scripts/browser-smoke.mjs:530:      const activeTransitButton = Array.from(document.querySelectorAll('[aria-label="Transit stop or exit type"] button'))
web/lib/__tests__/deployment.test.ts:75:    expect(script).toContain('[aria-label="Transit stop or exit type"] button');
web/lib/__tests__/deployment.test.ts:76:    expect(script).not.toContain('[aria-label="Transit target"] button');
```

## FINDINGS

1. `web/scripts/browser-smoke.mjs` still queried `[aria-label="Transit target"] button` after the shipped transit mode control was renamed to `Transit stop or exit type`.
2. Launch checks using `--transit-mode` could fail on selector lookup before checking the app state.

## DISAGREEMENTS

1. None.
