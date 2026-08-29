# P940 straight-line bus estimate copy

## Working root

```text
pwd=C:\sgSHIOK2026
hostname=PRAWN-E14
head=da871c3
da871c37fc3d0eea6500a0d864cb67890ce26c5a	refs/heads/main
repo_integrity=ok
repo_integrity_exit=0
```

## Evidence path ignore check

```text
exit_code=1
```

## Diff stat before commit

```text
 web/app/page.tsx                                |  8 ++++----
 web/lib/__tests__/accessibility-render.test.tsx | 12 ++++++++----
 web/lib/__tests__/score-card-copy.test.ts       | 12 ++++++++----
 3 files changed, 20 insertions(+), 12 deletions(-)
```

## Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  17:54:59
   Duration  3.42s (transform 1.04s, setup 0ms, import 1.39s, tests 870ms, environment 1ms)
```

## Remaining direct-bus fallback hits

```text
C:\sgSHIOK2026\web\app\page.tsx:495: *   - the score is a direct-bus fallback (routes are not comparable)
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1416:    expect(html).not.toContain("Published direct-bus fallback evidence selected.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1420:    expect(html).not.toContain('aria-label="Direct-bus fallback source evidence"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1421:    expect(html).not.toContain('aria-label="Direct-bus fallback evidence reasons"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1430:    expect(html).not.toContain('aria-label="Direct-bus fallback details"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:673:    expect(tsxSource).not.toContain("Direct-bus fallback details");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:1051:  it("announces direct-bus fallback evidence without implying a verified shelter-map walk", () => {
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:1059:  it("announces direct-bus fallback selection without implying a published shelter-map walk", () => {
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:1065:    expect(source).not.toContain("Published direct-bus fallback evidence selected.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:1068:  it("labels direct-bus fallback evidence regions without implying shelter-map evidence", () => {
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:1073:    expect(source).not.toContain("Direct-bus fallback source evidence");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:1074:    expect(source).not.toContain("Direct-bus fallback evidence reasons");
```

## Diff check

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

## Repository integrity

```text
repo_integrity=ok
exit_code=0
```

## weights.yaml diff

```text
```

## FINDINGS

1. Route-detail ARIA labels and selection announcements still exposed the implementation phrase direct-bus fallback even though the visible route mode is a straight-line bus estimate.
2. After the change, direct-bus fallback remains only in implementation comments, test names, and negative assertions guarding against the old user-facing strings.

## DISAGREEMENTS

1. None.
