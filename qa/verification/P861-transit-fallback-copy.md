# P861 Transit Fallback Copy

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

- Keep proper-case formatting for named transit stops and exits.
- Keep the unnamed fallback sentence-case: "No transit stop or exit loaded".
- No scoring, export, rescore, subset run, ingest, network build, deployment, protected payload write, or `pipeline/config/weights.yaml` edit.

## Evidence

### Startup Guard

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
fde6d03cb8c1215deb2670c2d544e37ccbd8abc2
fde6d03cb8c1215deb2670c2d544e37ccbd8abc2	refs/heads/main
```

### Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  12:13:36
   Duration  11.94s (transform 3.53s, setup 0ms, import 4.35s, tests 2.55s, environment 8ms)
```

### Copy Grep

```text
C:\sgSHIOK2026\web\app\page.tsx:1272:        : "No transit stop or exit loaded";
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:360:    expect(html).toContain("No transit stop or exit loaded");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:361:    expect(html).not.toContain("No Transit Stop Or Exit Loaded");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:362:    expect(html).not.toContain("No Transit Target Loaded");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:106:    expect(source).toContain("No transit stop or exit loaded");
```

### Repo Integrity

```text
repo_integrity=ok
exit_code=0
```

### Diff Check

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

### Protected Diff Guard

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
exit_code=1
```

### Evidence Ignore Check

```text
exit_code=1
```

## FINDINGS

1. The rendered fallback for a scored walk with no named best node was title-cased as "No Transit Stop Or Exit Loaded", even though the source-level copy policy already expected sentence case.
2. Proper-casing is still appropriate for real station or stop names, so the fix only bypasses `toProperCase()` for the fallback string.

## DISAGREEMENTS

1. None.
