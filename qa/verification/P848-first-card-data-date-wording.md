# P848 First-Card Data Date Wording

## Scope

Free-tier browser copy cleanup. No scoring, export, rescore, subset run, ingest, network build, deployment, source fetch, or protected payload mutation.

## Root And Host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

The first card now says the published data was built on the generated date instead of saying the bundle was generated.

## Command Output

### npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  11:06:09
   Duration  8.47s (transform 2.44s, setup 0ms, import 3.08s, tests 2.38s, environment 2ms)
```

### rg -n first-card data date wording

```text
web\app\page.tsx:2383:              Shelter-map evidence as of {formatDataDate(manifest)}; published data built {formatGeneratedDate(manifest)}
web\lib\__tests__\score-card-copy.test.ts:267:      "Shelter-map evidence as of {formatDataDate(manifest)}; published data built {formatGeneratedDate(manifest)}"
web\lib\__tests__\score-card-copy.test.ts:270:      "Shelter-map evidence as of {formatDataDate(manifest)}; bundle generated {formatGeneratedDate(manifest)}"
web\lib\__tests__\score-card-copy.test.ts:273:      "Route evidence as of {formatDataDate(manifest)}; bundle generated {formatGeneratedDate(manifest)}"
web\lib\__tests__\score-card-copy.test.ts:401:      "Shelter-map evidence as of {formatDataDate(manifest)}; published data built {formatGeneratedDate(manifest)}",
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

### git check-ignore -v qa/verification/P848-first-card-data-date-wording.md; Write-Output "exit_code=$LASTEXITCODE"

```text
exit_code=1
```

## FINDINGS

1. The first-card data date exposed bundle-generation language in the primary UI; P848 keeps the date while using product-facing published-data wording.

## DISAGREEMENTS

1. None.
