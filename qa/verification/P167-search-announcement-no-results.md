# P167 Search Announcement No Results

## Scope

Browser accessibility copy/test-only change: make the hidden search-results live-region helper announce searched no-result OneMap lookup failures with the same core message as visible feedback.

## Command Output

```text
npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  00:22:36
   Duration  10.38s (transform 4.34s, setup 0ms, import 5.88s, tests 1.65s, environment 2ms)
```

```text
python scripts/check_repo_integrity.py
repo_integrity=ok
exit=0
```

```text
git diff -- pipeline/config/weights.yaml
```

```text
git diff --check
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
```

## Findings

1. The visible no-results feedback was explicit, but `searchResultsAnnouncement()` returned an empty string for the same searched/no-results state.
2. The standing objective file says P18 landed at `365fa9f`, while local `main` and `origin/main` both currently advertise P166 at `740b47b`; this change was made against the actual active tree rather than relying on that objective-file premise.

## Disagreements

1. The P18 landed premise in the standing objective file does not match the repository state observed at the start of this turn.
