# P196 Preview Locked Score Label

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Scope

Changed the clicked-stop preview metric label from `Bundle score` to `Locked score`.

The preview-only caveat remains: clicked-stop shelter-map previews are not part of the published score bundle yet.

## Verification

```text
npm --prefix web test -- --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/route-evidence-map-interaction.test.ts

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  29 passed (29)
   Start at  02:28:15
   Duration  4.37s (transform 2.22s, setup 0ms, import 2.62s, tests 1.83s, environment 2ms)
```

```text
python C:\sgSHIOK2026\scripts\check_repo_integrity.py
repo_integrity=ok
integrity_exit=0
```

```text
git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml
weights_diff_start
weights_diff_end
```

## FINDINGS

1. The clicked-stop preview summary still had one visible `Bundle score: Preview only` label after the availability line moved to `Locked score availability`.
2. The distinction that matters is preserved: clicked-stop previews have shelter-map evidence but no published locked score.

## DISAGREEMENTS

1. None.
