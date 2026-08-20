# P223 Clicked-Stop Walk Preview Loading

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Head And Remote

```text
97dcec14807a0bb69d6cdf9874521c2bc11308b0
97dcec14807a0bb69d6cdf9874521c2bc11308b0	refs/heads/main
```

## Scope

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
 decisions.md                                             | 3 +++
 web/app/page.tsx                                         | 2 +-
 web/lib/__tests__/route-evidence-map-interaction.test.ts | 2 ++
 3 files changed, 6 insertions(+), 1 deletion(-)
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  05:11:35
   Duration  2.81s (transform 1.16s, setup 0ms, import 330ms, tests 1.11s, environment 1ms)
```

## Phrase Search

```text
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:188:    expect(pageSource).toContain("Fetching OneMap walking preview");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:189:    expect(pageSource).toContain("until that walk preview returns");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:190:    expect(pageSource).not.toContain("until that route returns");
C:\sgSHIOK2026\web\app\page.tsx:791:    return "Fetching OneMap walking preview; the selected stop is shown as a straight-line preview until that walk preview returns.";
```

## Evidence Ignore Check

```text
exit=1
```

## Locked Weights Diff Check

```text
```

## Repository Integrity

```text
repo_integrity=ok
exit=0
```

## FINDINGS

1. The clicked-stop loading note used walk-preview wording at the start but ended by saying the straight-line preview remained until `that route returns`.
2. The loading note now says `until that walk preview returns`; the old phrase remains only as a negative regression guard.
3. The change is browser copy and test coverage only; it does not alter live preview behavior, OneMap calls, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
