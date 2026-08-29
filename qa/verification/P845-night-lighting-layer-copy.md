# P845 Night-Lighting Layer Copy

## Scope

Free-tier browser copy cleanup. No scoring, export, rescore, subset run, ingest, network build, deployment, source fetch, or protected payload mutation.

## Root And Host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

The browser note now says LTA lamp-post locations load from the published lamp-post layer instead of the published night-lighting artifact.

## Command Output

### npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx route-evidence-map-interaction.test.ts

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  74 passed (74)
   Start at  10:55:03
   Duration  6.31s (transform 1.88s, setup 0ms, import 2.44s, tests 1.36s, environment 1ms)
```

### rg -n "published night-lighting artifact|published lamp-post layer" web\app web\components web\lib\__tests__

```text
web\app\page.tsx:133:  return `Night lighting layer: LTA lamp-post locations load from the published lamp-post layer. ${action} Night-lighting map layer only; not part of the locked score.`;
web\lib\__tests__\accessibility-render.test.tsx:248:      "Night lighting layer: LTA lamp-post locations load from the published lamp-post layer. Switch on and zoom into a neighbourhood to load lamp-post points. Night-lighting map layer only; not part of the locked score."
web\lib\__tests__\accessibility-render.test.tsx:251:      "Night lighting layer: LTA lamp-post locations load from the published lamp-post layer. Zoom into a neighbourhood to load lamp-post points. Night-lighting map layer only; not part of the locked score."
web\lib\__tests__\route-evidence-map-interaction.test.ts:121:    expect(pageSource).toContain("LTA lamp-post locations load from the published lamp-post layer.");
web\lib\__tests__\route-evidence-map-interaction.test.ts:122:    expect(pageSource).not.toContain("LTA lamp-post locations load from the published night-lighting artifact.");
web\lib\__tests__\score-card-copy.test.ts:456:    expect(source).toContain("LTA lamp-post locations load from the published lamp-post layer.");
web\lib\__tests__\score-card-copy.test.ts:457:    expect(source).not.toContain("LTA lamp-post locations load from the published night-lighting artifact.");
```

### python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"

```text
repo_integrity=ok
exit_code=0
```

### git diff --check; Write-Output "exit_code=$LASTEXITCODE"

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

### protected-path diff guard

```text
exit_code=0
```

### git check-ignore -v qa/verification/P845-night-lighting-layer-copy.md; Write-Output "exit_code=$LASTEXITCODE"

```text
exit_code=1
```

## FINDINGS

1. The night-lighting note exposed implementation terminology (`artifact`) in user-facing copy even though the UI behavior is a map layer.

## DISAGREEMENTS

1. None.
