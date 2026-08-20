# P81 Snap Connector Wording

## Startup Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Focused Render Test

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
   Start at  18:41:31
   Duration  2.15s (transform 886ms, setup 0ms, import 1.22s, tests 214ms, environment 0ms)
```

## Evidence Trackability

Command:

```text
git check-ignore -v C:\sgSHIOK2026\qa\verification\P81-snap-connector-wording.md; "exit_code=$LASTEXITCODE"
```

Output:

```text
exit_code=1
```

## Focused Copy Contract Test

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
   Start at  18:41:31
   Duration  893ms (transform 104ms, setup 0ms, import 135ms, tests 38ms, environment 0ms)
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
   Start at  18:41:46
   Duration  9.22s (transform 5.60s, setup 0ms, import 7.57s, tests 12.59s, environment 14ms)
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
 web/app/page.module.css                         | 8 ++++++++
 web/app/page.tsx                                | 7 ++++++-
 web/lib/__tests__/accessibility-render.test.tsx | 4 ++++
 web/lib/__tests__/score-card-copy.test.ts       | 6 ++++--
 4 files changed, 22 insertions(+), 3 deletions(-)
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

1. The route details strip used `Map connector`, which did not explain what the connector distance meant.
2. The browser now labels the value `Snap connector` and states that it is the short link from the postal or transit point onto the walking graph.
3. This is presentation-only; route geometry and score values are unchanged.

## Disagreements

1. None.
