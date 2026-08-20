# P77 Exposed Gap Summary

## Startup Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Focused Web Test

Command:

```text
npm --prefix web test -- --run lib/__tests__/accessibility-render.test.tsx
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  12 passed (12)
   Start at  18:20:47
   Duration  6.50s (transform 3.40s, setup 0ms, import 4.49s, tests 185ms, environment 0ms)
```

## Evidence Trackability

Command:

```text
git check-ignore -v C:\sgSHIOK2026\qa\verification\P77-exposed-gap-summary.md; "exit_code=$LASTEXITCODE"
```

Output:

```text
exit_code=1
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
   Start at  18:21:08
   Duration  10.43s (transform 3.70s, setup 0ms, import 8.26s, tests 12.73s, environment 10ms)
```

## Diff And Weights Guard

Command:

```text
git diff --stat; git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml
```

Output:

```text
 web/app/page.module.css                         | 15 +++++++++++++++
 web/app/page.tsx                                | 21 ++++++++++++++++++++-
 web/lib/__tests__/accessibility-render.test.tsx |  2 ++
 3 files changed, 37 insertions(+), 1 deletion(-)
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

1. The score card previously named the longest exposed gap and showed up to three gap rows, but it did not state the total exposed distance or total recorded gap count.
2. The score card now states total exposed metres, total exposed-gap count, and whether the visible list is complete or only the longest three gaps.
3. This keeps the exposed-gap artifact readable without hiding that shorter gaps may be included in the total when more than three gaps exist.

## Disagreements

1. None.
