# P851 Footer Walk-Evidence Wording

## Scope

Free-tier browser copy cleanup. No scoring, export, rescore, subset run, ingest, network build, deployment, source fetch, or protected payload mutation.

## Root And Host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

The footer now says `Walk evidence` instead of `Source-derived walk evidence`.

## Command Output

### npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  11:21:14
   Duration  10.72s (transform 2.95s, setup 0ms, import 3.53s, tests 2.30s, environment 1ms)
```

### rg -n "Source-derived walk evidence|Walk evidence: covered-walkway ratio" web\app web\lib\__tests__

```text
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:488:      "Walk evidence: covered-walkway ratio and exposed gaps, plus the night-lighting map layer.",
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:491:      "Source-derived walk evidence: covered-walkway ratio and exposed gaps, plus the night-lighting map layer.",
C:\sgSHIOK2026\web\app\page.tsx:2522:        <footer className={styles.pageFooter}>Walk evidence: covered-walkway ratio and exposed gaps, plus the night-lighting map layer.</footer>
```

### python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"

```text
repo_integrity=ok
exit_code=0
```

### git diff --check; Write-Output "exit_code=$LASTEXITCODE"

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

### protected-path diff guard

```text
exit_code=0
```

### git check-ignore -v qa/verification/P851-footer-walk-evidence-wording.md; Write-Output "exit_code=$LASTEXITCODE"

```text
exit_code=1
```

## FINDINGS

1. The footer still used provenance-first wording (`Source-derived`) where the product surface should close with the user-facing walk evidence.

## DISAGREEMENTS

1. None.
