# P913 Locked Transit Range Copy

## Scope

Change no-transit range copy from passive `was found` wording to active locked-boundary wording while preserving the 1.2 km scoring-policy caveat.

## Commands

### Root and remote before edit

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
d0f25105840ac6b0989964567eccd2b8aed62b6a
d0f25105840ac6b0989964567eccd2b8aed62b6a	refs/heads/main
```

### Copy context before edit

```text
C:\sgSHIOK2026\web\app\page.tsx:599:  if (reason === "no_transit_candidates_selected") return "No qualifying transit stop or exit within 1.2 km";
C:\sgSHIOK2026\web\app\page.tsx:618:      return "No qualifying MRT/LRT exit or bus stop was found within the locked 1.2 km transit range for this postal.";
C:\sgSHIOK2026\web\app\page.tsx:622:      return `Closest connected shelter-map walk found is about ${formatDistance(nearestM)} away; locked transit range is 1.2 km.`;
C:\sgSHIOK2026\web\app\page.tsx:624:    return `No shelter-map walk to ${transitModeLabel(transitMode)} was found within the locked 1.2 km transit range.`;
C:\sgSHIOK2026\web\app\page.tsx:870:      return ["No qualifying transit stop or exit within 1.2 km", "Beyond 1.2 km locked range"];
C:\sgSHIOK2026\web\app\page.tsx:874:      ? [`Closest connected shelter-map walk to ${label} is ${formatDistance(nearestM)}`, "Locked transit range is 1.2 km"]
C:\sgSHIOK2026\web\app\page.tsx:875:      : [`No shelter-map walk to ${label} within 1.2 km locked range`, "Nearby transit may still exist beyond the locked 1.2 km transit range"];
```

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  15:59:02
   Duration  8.66s (transform 2.49s, setup 0ms, import 3.18s, tests 2.39s, environment 2ms)
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
EXIT=0
```

## FINDINGS

1. No-transit range copy still used passive `was found` wording for the selected transit candidate and mode-specific shelter-map walk states.

## DISAGREEMENTS

1. None.
