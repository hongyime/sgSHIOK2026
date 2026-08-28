# P774 first-card density

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

Reduce first-viewport audit-copy density and make exposed-gap map focus read like a direct action.

No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.

## Evidence Commands

```text
npm --prefix web test -- score-card-copy.test.ts
npm --prefix web test
python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
git diff -- pipeline/config/weights.yaml checksums.json
git check-ignore -v qa/verification/P774-first-card-density.md; Write-Output "exit=$LASTEXITCODE"
git diff --stat
```

## Command Output

```text
npm --prefix web test -- score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  00:59:11
   Duration  3.05s (transform 275ms, setup 0ms, import 336ms, tests 190ms, environment 0ms)

npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  01:02:17
   Duration  103.00s (transform 5.96s, setup 0ms, import 11.66s, tests 38.19s, environment 27ms)

python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0

git diff -- pipeline/config/weights.yaml checksums.json; if ($LASTEXITCODE -eq 0) { Write-Output 'protected_diff_check=ok' } else { Write-Output "protected_diff_check_exit=$LASTEXITCODE" }
protected_diff_check=ok

git check-ignore -v qa/verification/P774-first-card-density.md; Write-Output "exit=$LASTEXITCODE"
exit=1

git diff --stat
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
 decisions.md                                    |  3 +
 web/app/page.module.css                         | 28 ++++++++-
 web/app/page.tsx                                | 82 +++++++++++++------------
 web/lib/__tests__/accessibility-render.test.tsx |  8 +--
 web/lib/__tests__/score-card-copy.test.ts       |  9 ++-
 5 files changed, 84 insertions(+), 46 deletions(-)

git diff --check
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

## FINDINGS

1. The first title card still carried address-universe, sample-gap, OSM postcode, source-freshness, covered-linkway freshness, LAI caveat, source attribution, and heat-proxy audit copy before the user reached search.
2. The detailed caveats are still necessary, but they are better as an explicit `Data limits` disclosure below search/results than as first-viewport product copy.
3. Exposed-gap rows previously said `Focus map`; `Focus on map` is clearer action wording for the product's best inspectable artifact.

## DISAGREEMENTS

1. None for this slice.
