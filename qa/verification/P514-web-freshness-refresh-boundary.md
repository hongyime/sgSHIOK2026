# P514 web freshness refresh boundary

Working root: C:\sgSHIOK2026
Host: Prawn-E14
Date: 2026-08-22

## Guard

```text
C:\sgSHIOK2026
Prawn-E14
2b0e3d2b58762156983846e7d35aee6d6da899f7
2b0e3d2b58762156983846e7d35aee6d6da899f7	refs/heads/main
```

```text
check_ignore_exit=1
```

## Focused web test

Command:

```text
npm --prefix web test -- score-card-copy
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  03:40:18
   Duration  2.60s (transform 458ms, setup 0ms, import 551ms, tests 331ms, environment 1ms)
```

## FINDINGS

1. The first-view browser freshness line named the six stale sources but did not state the same refresh boundary as the CLI, readiness gate, README, and agent docs.
2. The browser now says stale-source refreshes require a new numbered input version, not an in-place frozen-v1 mutation.

## DISAGREEMENTS

1. None.
