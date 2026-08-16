# P18 Section 10 Presentation

Date: 2026-08-16

Working root and host:

```text
PRAWN-E14
C:\sgSHIOK2026
```

Scope:

```text
Implemented Section 10 presentation in web/ only.
No scoring, export, rescore, subset run, ingest, or network build was run.
pipeline/config/weights.yaml was not modified.
```

Changed presentation:

```text
The score card now leads with "Where the walk is exposed".
The lead block shows covered-walkway ratio for the selected walk.
The exposed-gaps list now shows per-gap length and coordinates when the record supplies them.
The old five-row visible breakdown is replaced by four display rows:
Shelter exposure
Walk to transit
Bus service support
Locked SHIOK score
```

Focused web tests:

```text
 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  17 passed (17)
   Start at  09:22:07
   Duration  2.99s (transform 1.51s, setup 0ms, import 1.95s, tests 361ms, environment 2ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts --testTimeout=30000
```

Full web suite:

```text
 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  21 passed (21)
      Tests  105 passed (105)
   Start at  09:22:22
   Duration  12.93s (transform 5.68s, setup 0ms, import 12.56s, tests 15.60s, environment 13ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --testTimeout=30000
```

Repository integrity:

```text
repo_integrity=ok
exit_code=0
```

Weights guard:

```text
git diff --name-only -- C:\sgSHIOK2026\pipeline\config\weights.yaml
```

```text
```

FINDINGS

1. The user-visible Section 10 panel can lead with route evidence without touching the scoring pipeline: all required data was already present in `ScoreCard`.
2. The visible breakdown is now four display rows rather than five; the rank dropdown still exposes individual locked subscores for ranking, which is separate from the presentation panel.
3. The web test count moved from 103 to 105 because P18 adds render coverage for exposure-gap coordinates and null-score rows staying "Not scored".

DISAGREEMENTS

1. None.
