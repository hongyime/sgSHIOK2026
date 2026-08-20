# P187 Browser Smoke Walk Mode CLI

## Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Findings

1. Browser smoke already selected the `Walk display` segmented control and emitted walk-mode QA aliases, but the CLI and launch-check caller still exposed the old `--route-mode` argument as the primary command surface.
2. The fix adds `--walk-mode` as the preferred browser-smoke argument while keeping `--route-mode` accepted for compatibility.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts lib/__tests__/deployment.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  23 passed (23)
   Start at  01:55:31
   Duration  703ms (transform 189ms, setup 0ms, import 246ms, tests 72ms, environment 1ms)
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
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:80:    else if (arg === "--walk-mode" || arg === "--route-mode") args.routeMode = next();
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:65:    expect(smokeSource).toContain('arg === "--walk-mode" || arg === "--route-mode"');
C:\sgSHIOK2026\scripts\launch-check.ps1:276:        Invoke-ExternalStep -Label "Walk compare browser smoke" -FilePath "npm.cmd" -TimeoutSec 180 -ArgumentList @("--prefix", "web", "run", "qa:browser", "--", "--url", "http://127.0.0.1:$Port/", "--postal", "560109", "--walk-mode", "both", "--must-include", "shortest segments", "--out", "$SmokeRoot\walk-compare\summary.json", "--debug-port", "$($Port + 98)")
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:41:    expect(script).toContain("--walk-mode");
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:42:    expect(script).toContain("--route-mode");
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:115:    expect(script).toContain('"--walk-mode", "both"');
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:116:    expect(script).not.toContain('"--route-mode", "both"');
```

## FINDINGS

1. The remaining live QA drift was at the command boundary: launch-check still invoked browser smoke with `--route-mode` even though the app control and output metadata now say walk mode.

## DISAGREEMENTS

1. None.
