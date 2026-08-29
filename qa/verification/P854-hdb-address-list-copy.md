# P854 HDB Address-List Copy

## Scope

Free-tier browser copy cleanup. No scoring, export, rescore, subset run, ingest, network build, deployment, source fetch, or protected payload mutation.

## Root And Host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

Postal-specific HDB missing-address caveats now say the row is missing from the June 2020 address list rather than missing from frozen v1.

## Command Output

### npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  11:36:50
   Duration  8.29s (transform 2.54s, setup 0ms, import 3.24s, tests 2.01s, environment 1ms)
```

### rg -n "HDB missing rows from frozen v1|HDB rows missing from the June 2020 address list|June 2020 address list" web\app web\lib\__tests__

```text
C:\sgSHIOK2026\web\app\page.tsx:167:    return `this postal is one of the 6 coordinate-backed HDB rows missing from the June 2020 address list in the ${RECENT_PUBLIC_SOURCE_SAMPLE_LABEL} (${source})`;
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:303:      "one of the 6 coordinate-backed HDB rows missing from the June 2020 address list in the ${RECENT_PUBLIC_SOURCE_SAMPLE_LABEL}"
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:305:    expect(source).not.toContain("HDB missing rows from frozen v1");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:306:    expect(source).not.toContain("one of the 6 coordinate-backed HDB missing rows from frozen v1 (${source})");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:505:      "Postal 521400 is outside the published shelter-map data tied to the frozen June 2020 address universe; this postal is one of the 6 coordinate-backed HDB rows missing from the June 2020 address list in the P19 v2 28 Aug 2026 public-source sample (HDB 2021-2026 geocoded rows)."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:508:      "No shelter-map walk is published for this postal; the published shelter-map data is tied to the frozen June 2020 address universe, and this postal is one of the 6 coordinate-backed HDB rows missing from the June 2020 address list in the P19 v2 28 Aug 2026 public-source sample (HDB 2021-2026 geocoded rows)."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:510:    expect(hdbHtml).not.toContain("HDB missing rows from frozen v1");
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

### git check-ignore -v qa/verification/P854-hdb-address-list-copy.md; Write-Output "exit_code=$LASTEXITCODE"

```text
exit_code=1
```

## FINDINGS

1. The HDB missing-postal caveat still used the version label `frozen v1` in user-facing search-result copy where `June 2020 address list` is clearer.

## DISAGREEMENTS

1. None.
