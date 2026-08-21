# P462 Walk Heat Evidence Copy

Root and host:

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
```

Scope:

```text
Updated browser first-view copy and source-copy test only.
No scoring, export, rescore, subset run, ingest, network build, API call, deployment, public data write, or locked-weights change.
```

Finding scan:

```text
web\app\page.tsx:112:  "NParks Leaf Area Index is a freshness-only reference table here; route heat evidence uses shelter plus sparse walk-adjacent greenery geometry, not LAI or measured temperature.";
web\lib\__tests__\score-card-copy.test.ts:243:      "NParks Leaf Area Index is a freshness-only reference table here; route heat evidence uses shelter plus sparse walk-adjacent greenery geometry, not LAI or measured temperature."
web\lib\__tests__\score-card-copy.test.ts:245:    expect(source).not.toContain("Leaf Area Index is route heat evidence");
```

Focused test:

```text
npm --prefix C:\sgSHIOK2026\web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  23:24:47
   Duration  1.39s (transform 222ms, setup 0ms, import 274ms, tests 116ms, environment 0ms)
```

Evidence path ignore check:

```text
git check-ignore -v -- C:\sgSHIOK2026\qa\verification\P462-walk-heat-evidence-copy.md
EXIT=1
```

Repository integrity:

```text
python C:\sgSHIOK2026\scripts\check_repo_integrity.py
repo_integrity=ok
EXIT=0
```

Protected path diff check:

```text
git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11 C:\sgSHIOK2026\qa\releases
EXIT=0
```

FINDINGS:

1. The first-view Leaf Area Index caveat still said `route heat evidence`, even though the product frame is walk/shelter-map evidence.
2. The browser now says `walk heat evidence uses shelter plus sparse walk-adjacent greenery geometry`, preserving the LAI freshness-only and not-measured-temperature caveats.
3. The source-copy test now rejects the stale `route heat evidence uses shelter` phrase.

DISAGREEMENTS:

1. None.
