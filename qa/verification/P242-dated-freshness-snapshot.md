# P242 dated freshness snapshot

## Root and host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Scope

P242 changes the first-view freshness sentence from an undated `latest
manifest-only check` snapshot to an explicitly dated `21 Aug 2026
manifest-only check` snapshot.

No scoring, export, rescore, subset run, ingest, network build, deployment,
public-data mutation, source fetch, or locked-weight change was run.

## Focused web copy test

```text
npm --prefix C:\sgSHIOK2026\web test -- score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  06:42:15
   Duration  3.60s (transform 250ms, setup 0ms, import 299ms, tests 111ms, environment 1ms)
```

## Repository integrity

```text
repo_integrity=ok
exit=0
```

## FINDINGS

1. The browser freshness sentence was already a fixed historical snapshot, but the phrase `latest manifest-only check` did not tell users when the snapshot was taken.
2. P242 keeps the same measured counts and oldest-current age, but makes the timestamp explicit as `21 Aug 2026`.

## DISAGREEMENTS

1. None.
