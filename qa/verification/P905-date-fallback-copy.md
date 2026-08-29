# P905 Date Fallback Copy

## Scope

Change title-card source/evidence date fallbacks from `Unavailable` to `Date unavailable`.

## Commands

### Root and remote

```text
PWD=C:\sgSHIOK2026
HOST=Prawn-E14
HEAD=6a0bfb5a5df4627e656be97611e0a9078e2d444c
REMOTE=6a0bfb5a5df4627e656be97611e0a9078e2d444c	refs/heads/main
```

### Copy context before edit

```text
C:\sgSHIOK2026\web\app\page.tsx:398:export function formatDataDate(manifest: Manifest | null): string {
C:\sgSHIOK2026\web\app\page.tsx:399:  if (!manifest?.data_as_of) return "Unavailable";
C:\sgSHIOK2026\web\app\page.tsx:407:export function formatGeneratedDate(manifest: Manifest | null): string {
C:\sgSHIOK2026\web\app\page.tsx:408:  if (!manifest?.generated_at) return "Unavailable";
C:\sgSHIOK2026\web\app\page.tsx:445:  return typeof value === "number" ? `${Math.round(value)}` : "Unavailable";
C:\sgSHIOK2026\web\app\page.tsx:459:  if (typeof value !== "number") return "Unavailable";
C:\sgSHIOK2026\web\app\page.tsx:464:  return typeof value === "number" ? `${value}%` : "Unavailable";
C:\sgSHIOK2026\web\app\page.tsx:884:  if (!score.subscores) return ["Unavailable locked-score rows", "Shelter-map evidence available"];
C:\sgSHIOK2026\web\app\page.tsx:1313:    extraWalkM === null ? "Unavailable" : sameRoute || extraWalkM === 0 ? "0 m" : `+${Math.round(extraWalkM)} m`;
C:\sgSHIOK2026\web\app\page.tsx:2402:              Shelter-map evidence as of {formatDataDate(manifest)}; published data built {formatGeneratedDate(manifest)}
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:278:      "Shelter-map evidence as of {formatDataDate(manifest)}; published data built {formatGeneratedDate(manifest)}"
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:281:      "Shelter-map evidence as of {formatDataDate(manifest)}; bundle generated {formatGeneratedDate(manifest)}"
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:284:      "Route evidence as of {formatDataDate(manifest)}; bundle generated {formatGeneratedDate(manifest)}"
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:286:    expect(source).toContain("function formatGeneratedDate(manifest: Manifest | null): string");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:427:      "Shelter-map evidence as of {formatDataDate(manifest)}; published data built {formatGeneratedDate(manifest)}",
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:710:    expect(source).toContain("Unavailable locked-score rows");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:15:  formatDataDate,
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:16:  formatGeneratedDate,
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:155:    expect(formatDataDate(manifest)).toBe("2 Aug 2026");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:156:    expect(formatGeneratedDate(manifest)).toBe("5 Aug 2026");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:157:    expect(formatDataDate(null)).toBe("Unavailable");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:158:    expect(formatGeneratedDate(null)).toBe("Unavailable");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1248:    expect(html).toContain("<strong>Unavailable</strong><small>Shelter-map walk unavailable</small>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1249:    expect(html).toContain("<strong>Unavailable</strong><small>Walk-to-transit score unavailable</small>");
```

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  15:23:58
   Duration  7.70s (transform 2.41s, setup 0ms, import 3.04s, tests 1.87s, environment 1ms)
```

### git diff --check

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

Exit code: 0.

### Locked weights diff

```text
```

Exit code: 0.

### Repository integrity

```text
repo_integrity=ok
```

Exit code: 0.

## FINDINGS

1. Date fallback text used the same bare `Unavailable` label as score and metric values, making a missing date less specific than it needs to be.

## DISAGREEMENTS

1. None.
