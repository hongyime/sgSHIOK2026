# P82 Alternate Stop Distance Delta

## Startup Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Focused Stop Picker Test

Command:

```text
npm --prefix web test -- --run lib/__tests__/transit-stop-picker.test.tsx
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/transit-stop-picker.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  31 passed (31)
   Start at  18:45:39
   Duration  1.29s (transform 367ms, setup 0ms, import 517ms, tests 89ms, environment 0ms)
```

## Evidence Trackability

Command:

```text
git check-ignore -v C:\sgSHIOK2026\qa\verification\P82-alternate-stop-distance-delta.md; "exit_code=$LASTEXITCODE"
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
   Start at  18:45:55
   Duration  6.70s (transform 5.74s, setup 0ms, import 7.25s, tests 9.83s, environment 10ms)
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
 web/components/transit-stop-picker.tsx         | 3 ++-
 web/lib/__tests__/transit-stop-picker.test.tsx | 6 +++---
 2 files changed, 5 insertions(+), 4 deletions(-)
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

1. The alternate-stop comparison note used only a percentage, which made the actual tradeoff harder to judge.
2. The note now includes both the percentage and metre delta, while keeping the straight-line caveat.
3. This uses existing candidate distances only; candidate ranking, routing, and score values are unchanged.

## Disagreements

1. None.
