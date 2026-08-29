# P849 Published Shelter Data Copy

## Scope

Free-tier browser copy cleanup. No scoring, export, rescore, subset run, ingest, network build, deployment, source fetch, or protected payload mutation.

## Root And Host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

Browser-visible messages now call the release surface `published shelter-map data` instead of a `published shelter-map bundle`.

## Command Output

### npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx route-evidence-map-interaction.test.ts

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  74 passed (74)
   Start at  11:11:43
   Duration  11.74s (transform 3.06s, setup 0ms, import 3.93s, tests 3.07s, environment 3ms)
```

### rg -n "published shelter-map bundle|Not in published bundle|Published bundle|Outside published shelter-map bundle|No full locked score in published shelter-map bundle" app, smoke, tests, components

```text
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:825:    expect(proposalSource).toContain("Use it to sort the published shelter-map bundle")
C:\sgSHIOK2026\web\lib\__tests__\transit-stop-picker.test.tsx:121:    expect(source).toContain("The published shelter-map bundle does NOT ship a ranked candidate list");
C:\sgSHIOK2026\web\lib\__tests__\transit-stop-picker.test.tsx:122:    expect(source).toContain("scoring data that the published shelter-map bundle does not ship");
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

### git check-ignore -v qa/verification/P849-published-shelter-data-copy.md; Write-Output "exit_code=$LASTEXITCODE"

```text
exit_code=1
```

## FINDINGS

1. User-facing empty states, preview caveats, and unavailable-score messages still used `published shelter-map bundle`, exposing packaging language where the user needs a data limitation.

## DISAGREEMENTS

1. None.
