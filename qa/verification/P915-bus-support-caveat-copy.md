# P915 Bus Support Caveat Copy

## Scope

Change bus-support caveats from `could not prove` / `could not be connected` wording to current published-evidence wording.

## Commands

### Root and remote before edit

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
5c2b3e665855f08fe9d63c58060a5cdcbd873a73
5c2b3e665855f08fe9d63c58060a5cdcbd873a73	refs/heads/main
```

### Copy context before edit

```text
C:\sgSHIOK2026\web\app\page.tsx:631:    return "Locked score caveat: the locked bus score remains 0 because nearby direct bus service evidence could not be connected to a verified shelter-map walk.";
C:\sgSHIOK2026\web\app\page.tsx:1475:            "A low value can mean weak service evidence, or that the published shelter-map walk could not prove access to an official LTA bus stop.",
C:\sgSHIOK2026\web\section10-presentation-proposal.md:45:could not prove access to an official LTA bus stop. Treat it as a service-support
```

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  16:06:40
   Duration  11.78s (transform 3.39s, setup 0ms, import 4.41s, tests 3.09s, environment 2ms)
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

1. Bus-support caveats still described a proof/connect failure instead of the published evidence state: the walk does not show official LTA bus-stop access, and the direct-bus fallback is not connected to a verified shelter-map walk.

## DISAGREEMENTS

1. None.
