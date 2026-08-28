# P775 sample postal entry

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

Add a compact sample postal action so the first screen can be evaluated without guessing a postal code.

No scoring, export, rescore, subset run, ingest, network build, OneMap search call for the sample, input mutation, protected payload write, deployment, or locked-weight change was performed.

## Evidence Commands

```text
npm --prefix web test -- score-card-copy.test.ts
npm --prefix web test
python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
git diff -- pipeline/config/weights.yaml checksums.json
git check-ignore -v qa/verification/P775-sample-postal-entry.md; Write-Output "exit=$LASTEXITCODE"
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
   Start at  01:08:01
   Duration  3.00s (transform 554ms, setup 0ms, import 621ms, tests 281ms, environment 1ms)

npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  01:08:00
   Duration  108.91s (transform 10.17s, setup 0ms, import 16.56s, tests 49.37s, environment 32ms)

python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0

git diff -- pipeline/config/weights.yaml checksums.json; if ($LASTEXITCODE -eq 0) { Write-Output 'protected_diff_check=ok' } else { Write-Output "protected_diff_check_exit=$LASTEXITCODE" }
protected_diff_check=ok

git check-ignore -v qa/verification/P775-sample-postal-entry.md; Write-Output "exit=$LASTEXITCODE"
exit=1

git diff --check
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it

git diff --stat
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
 decisions.md                              |  3 +++
 web/app/page.module.css                   | 26 ++++++++++++++++++++++++++
 web/app/page.tsx                          | 22 ++++++++++++++++++++++
 web/lib/__tests__/score-card-copy.test.ts |  7 +++++++
 4 files changed, 58 insertions(+)
```

## FINDINGS

1. The app had no sample postal action, so a first-time user needed to know or invent a valid Singapore postal before they could inspect the product.
2. `S560234` is already present in existing bundle/data tests, making it a low-risk sample entry point.
3. The sample action uses the existing direct postal selection path and does not add a OneMap search dependency.

## DISAGREEMENTS

1. None for this slice.
