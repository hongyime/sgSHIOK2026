# P992 Shelter Exposure Copy

## Working Root

```text
Prawn-E14
C:\sgSHIOK2026
```

## Scope

```text
User-visible copy alignment for the shelter-first score panel.
No scoring, export, rescore, subset run, ingest, network build, deployment, dependency install, protected payload mutation, or weights.yaml change was performed.
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy accessibility-render

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  22:29:19
   Duration  5.53s (transform 1.62s, setup 0ms, import 2.67s, tests 1.28s, environment 1ms)
```

```text
repo_integrity=ok
```

```text
git diff -- pipeline/config/weights.yaml
```

## FINDINGS

1. The four-row UI already labels the main row as `Shelter exposure`, but reason-chip/detail copy still said `rain shelter` in user-facing places. That kept an old five-term framing visible after the shelter-first presentation had landed.
2. The app and section 10 reference now use covered-walkway/shelter-exposure language for those strings while preserving the locked score, subscore keys, ranking metrics, and weights.
3. The old `rain shelter` wording remains only as negative test guards.

## DISAGREEMENTS

1. I did not rename internal subscore keys such as `rain`; that would be a schema/provenance change, not a copy cleanup.
2. I did not run a build or any pipeline task because this change is browser copy and source-level tests cover the edited surface.
