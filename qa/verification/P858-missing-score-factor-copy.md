# P858 Missing Score-Factor Copy

## Scope

Free-tier browser copy cleanup. No scoring, export, rescore, subset run, ingest, network build, deployment, source fetch, or protected payload mutation.

## Root And Host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

Partial-score and no-subscore browser copy now says missing score factors instead of locked score inputs or unavailable score inputs.

## Command Output

### npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  11:56:01
   Duration  6.91s (transform 2.28s, setup 0ms, import 2.90s, tests 1.76s, environment 2ms)
```

### rg -n "Locked score inputs unavailable|unavailable score inputs|Missing locked-score factors|missing score factors" web\app web\lib\__tests__

```text
C:\sgSHIOK2026\web\app\page.tsx:599:    return "Partial locked score: shelter-map evidence may still be present, but missing score factors count as zero in the locked formula.";
C:\sgSHIOK2026\web\app\page.tsx:873:  if (!score.subscores) return ["Missing locked-score factors", "Shelter-map evidence available"];
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1189:      "Partial locked score: shelter-map evidence may still be present, but missing score factors count as zero in the locked formula."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1191:    expect(html).not.toContain("unavailable score inputs count as zero");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:679:    expect(source).toContain("Missing locked-score factors");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:680:    expect(source).not.toContain("Locked score inputs unavailable");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:684:      "Partial locked score: shelter-map evidence may still be present, but missing score factors count as zero in the locked formula."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:686:    expect(source).not.toContain("unavailable score inputs count as zero");
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
exit_code=1
```

### git check-ignore -v qa/verification/P858-missing-score-factor-copy.md; Write-Output "exit_code=$LASTEXITCODE"

```text
exit_code=1
```

## FINDINGS

1. Browser locked-score caveats still exposed `locked score inputs` and `unavailable score inputs`, which are implementation terms rather than user-facing limitations.

## DISAGREEMENTS

1. None.
