# P80 Night-Lighting Zoom Disclosure

## Startup Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Focused Map Interaction Test

Command:

```text
npm --prefix web test -- --run lib/__tests__/route-evidence-map-interaction.test.ts
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  18:36:53
   Duration  1.42s (transform 506ms, setup 0ms, import 140ms, tests 500ms, environment 0ms)
```

## Evidence Trackability

Command:

```text
git check-ignore -v C:\sgSHIOK2026\qa\verification\P80-night-lighting-zoom-disclosure.md; "exit_code=$LASTEXITCODE"
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
   Start at  18:36:53
   Duration  918ms (transform 97ms, setup 0ms, import 128ms, tests 48ms, environment 0ms)
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
   Start at  18:37:06
   Duration  7.48s (transform 4.54s, setup 0ms, import 5.99s, tests 10.92s, environment 23ms)
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
 web/app/page.tsx                                         | 2 +-
 web/lib/__tests__/route-evidence-map-interaction.test.ts | 2 +-
 web/lib/__tests__/score-card-copy.test.ts                | 2 +-
 3 files changed, 3 insertions(+), 3 deletions(-)
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

1. The visible night-lighting layer note named the source and score separation, but not the interaction needed before points appear.
2. The route map already reports `below_zoom` status after the overlay is enabled; P80 brings that expectation into the always-visible layer note.
3. This change is copy only and does not alter the lamp artifact or map loading threshold.

## Disagreements

1. None.
