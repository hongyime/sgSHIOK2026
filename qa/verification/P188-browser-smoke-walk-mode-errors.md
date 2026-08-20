# P188 Browser Smoke Walk Mode Errors

## Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Findings

1. After P187, browser smoke accepted `--walk-mode`, but invalid walk-display arguments still surfaced as `invalid route mode` errors.
2. The fix changes the operator-facing validation errors to `invalid walk mode` while preserving the legacy `--route-mode` alias and route-mode compatibility fields.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  01:59:14
   Duration  2.03s (transform 284ms, setup 0ms, import 362ms, tests 136ms, environment 1ms)
```

```text
repo_integrity=ok
integrity_exit=0
```

```text
weights_diff_start
weights_diff_end
```

```text
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:65:    expect(smokeSource).toContain('arg === "--walk-mode" || arg === "--route-mode"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:71:    expect(smokeSource).toContain("invalid walk mode");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:72:    expect(smokeSource).not.toContain("invalid route mode");
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:80:    else if (arg === "--walk-mode" || arg === "--route-mode") args.routeMode = next();
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:107:    throw new Error(`invalid walk mode: ${args.routeMode}`);
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:424:  if (!label) throw new Error(`invalid walk mode: ${routeMode}`);
```

## FINDINGS

1. The browser-smoke CLI had one remaining operator-facing route-mode label in its validation errors after the walk-mode alias was added.

## DISAGREEMENTS

1. None.
