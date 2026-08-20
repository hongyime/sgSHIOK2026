# P78 Score Coverage Wording

## Startup Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Focused Score Coverage Test

Command:

```text
npm --prefix web test -- --run lib/__tests__/score-coverage.test.ts
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-coverage.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  18:25:25
   Duration  1.85s (transform 197ms, setup 0ms, import 249ms, tests 145ms, environment 0ms)
```

## Evidence Trackability

Command:

```text
git check-ignore -v C:\sgSHIOK2026\qa\verification\P78-score-coverage-wording.md; "exit_code=$LASTEXITCODE"
```

Output:

```text
exit_code=1
```

## Focused Score Card Copy Test

Command:

```text
npm --prefix web test -- --run lib/__tests__/score-card-copy.test.ts
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  18:25:25
   Duration  1.79s (transform 182ms, setup 0ms, import 239ms, tests 58ms, environment 1ms)
```

## Full Web Test

Command:

```text
npm --prefix web test
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  122 passed (122)
   Start at  18:25:40
   Duration  10.82s (transform 7.07s, setup 0ms, import 9.91s, tests 15.52s, environment 22ms)
```

## Repo Integrity

Command:

```text
python scripts/check_repo_integrity.py; "exit_code=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
exit_code=0
```

## Diff And Weights Guard

Command:

```text
git diff --stat; git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml
```

Output:

```text
 web/lib/__tests__/score-coverage.test.ts |  6 +++---
 web/lib/score-coverage.ts                | 10 ++++++----
 2 files changed, 9 insertions(+), 7 deletions(-)
```

## Diff Check

Command:

```text
git diff --check; "exit_code=$LASTEXITCODE"
```

Output:

```text
exit_code=0
```

## Findings

1. The title-card score coverage line used internal score-state language (`partial`, `not yet scored`) where a home-search user needs route-evidence language.
2. The line now preserves the same manifest-derived counts while saying `full route scores`, `with partial route evidence`, `beyond current transit range`, and `awaiting scoring`.
3. The browser still does not derive source freshness from the public bundle manifest, because that manifest does not carry raw source freshness metadata.

## Disagreements

1. None.
