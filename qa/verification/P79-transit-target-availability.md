# P79 Transit Target Availability

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
      Tests  13 passed (13)
   Start at  18:31:57
   Duration  1.65s (transform 732ms, setup 0ms, import 956ms, tests 183ms, environment 0ms)
```

## Evidence Trackability

Command:

```text
git check-ignore -v C:\sgSHIOK2026\qa\verification\P79-transit-target-availability.md; "exit_code=$LASTEXITCODE"
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
      Tests  123 passed (123)
   Start at  18:32:12
   Duration  13.77s (transform 5.34s, setup 0ms, import 8.59s, tests 19.11s, environment 99ms)
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
 web/app/page.module.css                         | 14 ++++++++++
 web/app/page.tsx                                |  8 +++++-
 web/lib/__tests__/accessibility-render.test.tsx | 36 +++++++++++++++++++++++++
 3 files changed, 57 insertions(+), 1 deletion(-)
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

1. The transit target segmented control exposed best transit, MRT/LRT, and bus choices, but did not say whether each target had route evidence before switching.
2. The control now labels each target as `selected route`, `route evidence`, or `no route evidence` using existing record paths and route-option paths.
3. The full web test count rose from 122 to 123 because P79 adds one render test for the availability labels.

## Disagreements

1. None.
